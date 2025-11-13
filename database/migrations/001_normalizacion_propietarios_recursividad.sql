-- =====================================================
-- MIGRACIÓN: Normalización de Propietarios y Recursividad
-- Fecha: 2025-01-07
-- Descripción:
--   1. Crear tabla propietarios (normalización)
--   2. Agregar padre_id a tipo_inmueble_mae (jerarquía de tipos)
--   3. Agregar padre_registro_cab_id a cab (jerarquía de instancias)
--   4. Crear tipo_inmueble_x_caracteristica (configuración dinámica)
--   5. Migrar campos específicos (habitaciones, baños, parqueos) a det
--   6. Migrar datos de propietarios
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Crear tabla PROPIETARIOS
-- =====================================================
CREATE TABLE IF NOT EXISTS propietarios (
    propietario_id SERIAL PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT
);

-- Índices para búsquedas rápidas
CREATE INDEX idx_propietarios_dni ON propietarios(dni);
CREATE INDEX idx_propietarios_nombre ON propietarios(nombre);
CREATE INDEX idx_propietarios_activo ON propietarios(activo);

COMMENT ON TABLE propietarios IS 'Tabla normalizada de propietarios. Un propietario puede tener múltiples inmuebles.';
COMMENT ON COLUMN propietarios.dni IS 'DNI único del propietario (key de búsqueda para auto-fill)';

-- =====================================================
-- PASO 2: Agregar padre_id a tipo_inmueble_mae
-- Jerarquía de TIPOS (Edificio → Oficina, Casa → Casa Oficina)
-- =====================================================
ALTER TABLE tipo_inmueble_mae
ADD COLUMN IF NOT EXISTS padre_id INT NULL;

ALTER TABLE tipo_inmueble_mae
ADD CONSTRAINT fk_tipo_inmueble_padre
FOREIGN KEY (padre_id)
REFERENCES tipo_inmueble_mae(tipo_inmueble_id)
ON DELETE SET NULL;

CREATE INDEX idx_tipo_inmueble_padre ON tipo_inmueble_mae(padre_id);

COMMENT ON COLUMN tipo_inmueble_mae.padre_id IS 'Jerarquía de tipos: Edificio Completo → Oficina en Edificio';

-- =====================================================
-- PASO 3: Agregar campos a registro_x_inmueble_cab
-- =====================================================

-- 3.1: Agregar propietario_id (FK a tabla propietarios)
ALTER TABLE registro_x_inmueble_cab
ADD COLUMN IF NOT EXISTS propietario_id INT NULL;

-- 3.2: Agregar padre_registro_cab_id (recursividad de instancias)
ALTER TABLE registro_x_inmueble_cab
ADD COLUMN IF NOT EXISTS padre_registro_cab_id INT NULL;

-- Constraints
ALTER TABLE registro_x_inmueble_cab
ADD CONSTRAINT fk_cab_propietario
FOREIGN KEY (propietario_id)
REFERENCES propietarios(propietario_id)
ON DELETE SET NULL;

ALTER TABLE registro_x_inmueble_cab
ADD CONSTRAINT fk_cab_padre_registro
FOREIGN KEY (padre_registro_cab_id)
REFERENCES registro_x_inmueble_cab(registro_cab_id)
ON DELETE SET NULL;

-- Índices
CREATE INDEX idx_cab_propietario ON registro_x_inmueble_cab(propietario_id);
CREATE INDEX idx_cab_padre_registro ON registro_x_inmueble_cab(padre_registro_cab_id);

COMMENT ON COLUMN registro_x_inmueble_cab.propietario_id IS 'FK a propietarios (normalización)';
COMMENT ON COLUMN registro_x_inmueble_cab.padre_registro_cab_id IS 'Jerarquía de registros: Edificio Torre Central → Oficina 301';

-- =====================================================
-- PASO 4: Migración de datos - Extraer propietarios únicos
-- =====================================================
INSERT INTO propietarios (dni, nombre, telefono, email, created_at)
SELECT DISTINCT ON (propietario_real_dni)
    propietario_real_dni as dni,
    propietario_real_nombre as nombre,
    propietario_real_telefono as telefono,
    propietario_real_email as email,
    NOW() as created_at
FROM registro_x_inmueble_cab
WHERE propietario_real_dni IS NOT NULL
  AND propietario_real_dni != ''
ON CONFLICT (dni) DO NOTHING;

-- =====================================================
-- PASO 5: Actualizar FK propietario_id en cab
-- =====================================================
UPDATE registro_x_inmueble_cab cab
SET propietario_id = p.propietario_id
FROM propietarios p
WHERE cab.propietario_real_dni = p.dni;

-- =====================================================
-- PASO 6: Verificación de datos
-- =====================================================
DO $$
DECLARE
    total_cab INT;
    sin_propietario INT;
    propietarios_creados INT;
BEGIN
    SELECT COUNT(*) INTO total_cab FROM registro_x_inmueble_cab;
    SELECT COUNT(*) INTO sin_propietario FROM registro_x_inmueble_cab WHERE propietario_id IS NULL;
    SELECT COUNT(*) INTO propietarios_creados FROM propietarios;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total registros en cab: %', total_cab;
    RAISE NOTICE 'Propietarios creados: %', propietarios_creados;
    RAISE NOTICE 'Registros sin propietario_id: %', sin_propietario;
    RAISE NOTICE '========================================';

    IF sin_propietario > 0 THEN
        RAISE WARNING '⚠️ Hay % registros sin propietario_id. Verificar datos.', sin_propietario;
    ELSE
        RAISE NOTICE '✅ Todos los registros tienen propietario_id';
    END IF;
END $$;

-- =====================================================
-- PASO 7: Crear trigger para updated_at en propietarios
-- =====================================================
CREATE OR REPLACE FUNCTION update_propietarios_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_propietarios_updated_at
BEFORE UPDATE ON propietarios
FOR EACH ROW
EXECUTE FUNCTION update_propietarios_timestamp();

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. NO eliminamos las columnas propietario_real_* todavía
--    Esperar validación antes de hacer DROP COLUMN
--
-- 2. Para hacer padre_registro_cab_id NOT NULL en el futuro:
--    ALTER TABLE registro_x_inmueble_cab ALTER COLUMN padre_registro_cab_id SET NOT NULL;
--
-- 3. Para eliminar columnas viejas (después de validar):
--    ALTER TABLE registro_x_inmueble_cab DROP COLUMN propietario_real_nombre;
--    ALTER TABLE registro_x_inmueble_cab DROP COLUMN propietario_real_dni;
--    ALTER TABLE registro_x_inmueble_cab DROP COLUMN propietario_real_telefono;
--    ALTER TABLE registro_x_inmueble_cab DROP COLUMN propietario_real_email;
-- =====================================================
