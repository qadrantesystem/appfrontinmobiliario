-- =====================================================
-- MIGRACIÓN: Normalización de Propietarios y Recursividad
-- Fecha: 2025-01-07
-- Descripción:
--   1. Crear tabla propietarios (normalización)
--   2. Agregar padre_registro_cab_id a cab (recursividad)
--   3. Migrar habitaciones/baños/parqueos de cab → det
--   4. Migrar datos de propietarios
--
-- NOTA: Usa sistema EXISTENTE de caracteristicas_mae
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

CREATE INDEX idx_propietarios_dni ON propietarios(dni);
CREATE INDEX idx_propietarios_nombre ON propietarios(nombre);
CREATE INDEX idx_propietarios_activo ON propietarios(activo);

COMMENT ON TABLE propietarios IS 'Propietarios normalizados. Un propietario → muchos inmuebles';
COMMENT ON COLUMN propietarios.dni IS 'DNI único para auto-fill en formulario';

-- =====================================================
-- PASO 2: Agregar campos a registro_x_inmueble_cab
-- =====================================================

-- 2.1: FK a propietarios
ALTER TABLE registro_x_inmueble_cab
ADD COLUMN IF NOT EXISTS propietario_id INT NULL;

-- 2.2: Recursividad (edificio → oficinas)
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
COMMENT ON COLUMN registro_x_inmueble_cab.padre_registro_cab_id IS 'Recursividad: Edificio (padre) → Oficinas (hijos)';

-- =====================================================
-- PASO 3: Migración de propietarios
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

-- Actualizar FK en cab
UPDATE registro_x_inmueble_cab cab
SET propietario_id = p.propietario_id
FROM propietarios p
WHERE cab.propietario_real_dni = p.dni;

-- =====================================================
-- PASO 4: Migrar habitaciones/baños/parqueos a DET
-- Usa caracteristicas_mae EXISTENTES
-- =====================================================

-- 4.1: Verificar IDs de características
DO $$
DECLARE
    id_habitaciones INT;
    id_banos INT;
    id_parqueos INT;
BEGIN
    -- Buscar o crear "Habitaciones"
    SELECT caracteristica_id INTO id_habitaciones
    FROM caracteristicas_mae
    WHERE LOWER(nombre) = 'habitaciones' LIMIT 1;

    IF id_habitaciones IS NULL THEN
        INSERT INTO caracteristicas_mae (nombre, tipo_input, activo)
        VALUES ('Habitaciones', 'number', TRUE)
        RETURNING caracteristica_id INTO id_habitaciones;
    END IF;

    -- Buscar o crear "Baños"
    SELECT caracteristica_id INTO id_banos
    FROM caracteristicas_mae
    WHERE LOWER(nombre) IN ('baños', 'banos') LIMIT 1;

    IF id_banos IS NULL THEN
        INSERT INTO caracteristicas_mae (nombre, tipo_input, activo)
        VALUES ('Baños', 'number', TRUE)
        RETURNING caracteristica_id INTO id_banos;
    END IF;

    -- Buscar o crear "Parqueos"
    SELECT caracteristica_id INTO id_parqueos
    FROM caracteristicas_mae
    WHERE LOWER(nombre) IN ('parqueos', 'estacionamientos') LIMIT 1;

    IF id_parqueos IS NULL THEN
        INSERT INTO caracteristicas_mae (nombre, tipo_input, activo)
        VALUES ('Parqueos', 'number', TRUE)
        RETURNING caracteristica_id INTO id_parqueos;
    END IF;

    RAISE NOTICE 'IDs de características:';
    RAISE NOTICE '  Habitaciones: %', id_habitaciones;
    RAISE NOTICE '  Baños: %', id_banos;
    RAISE NOTICE '  Parqueos: %', id_parqueos;

    -- 4.2: Migrar habitaciones
    INSERT INTO registro_x_inmueble_det (registro_cab_id, caracteristica_id, valor)
    SELECT
        registro_cab_id,
        id_habitaciones,
        habitaciones::TEXT
    FROM registro_x_inmueble_cab
    WHERE habitaciones IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM registro_x_inmueble_det
          WHERE registro_cab_id = registro_x_inmueble_cab.registro_cab_id
            AND caracteristica_id = id_habitaciones
      );

    -- 4.3: Migrar baños
    INSERT INTO registro_x_inmueble_det (registro_cab_id, caracteristica_id, valor)
    SELECT
        registro_cab_id,
        id_banos,
        banos::TEXT
    FROM registro_x_inmueble_cab
    WHERE banos IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM registro_x_inmueble_det
          WHERE registro_cab_id = registro_x_inmueble_cab.registro_cab_id
            AND caracteristica_id = id_banos
      );

    -- 4.4: Migrar parqueos
    INSERT INTO registro_x_inmueble_det (registro_cab_id, caracteristica_id, valor)
    SELECT
        registro_cab_id,
        id_parqueos,
        parqueos::TEXT
    FROM registro_x_inmueble_cab
    WHERE parqueos IS NOT NULL
      AND NOT EXISTS (
          SELECT 1 FROM registro_x_inmueble_det
          WHERE registro_cab_id = registro_x_inmueble_cab.registro_cab_id
            AND caracteristica_id = id_parqueos
      );

    RAISE NOTICE '✅ Campos migrados a registro_x_inmueble_det';
END $$;

-- =====================================================
-- PASO 5: Verificación
-- =====================================================
DO $$
DECLARE
    total_cab INT;
    sin_propietario INT;
    propietarios_creados INT;
    habitaciones_migradas INT;
    banos_migrados INT;
    parqueos_migrados INT;
BEGIN
    SELECT COUNT(*) INTO total_cab FROM registro_x_inmueble_cab;
    SELECT COUNT(*) INTO sin_propietario FROM registro_x_inmueble_cab WHERE propietario_id IS NULL;
    SELECT COUNT(*) INTO propietarios_creados FROM propietarios;

    SELECT COUNT(*) INTO habitaciones_migradas
    FROM registro_x_inmueble_det d
    JOIN caracteristicas_mae c ON d.caracteristica_id = c.caracteristica_id
    WHERE LOWER(c.nombre) = 'habitaciones';

    SELECT COUNT(*) INTO banos_migrados
    FROM registro_x_inmueble_det d
    JOIN caracteristicas_mae c ON d.caracteristica_id = c.caracteristica_id
    WHERE LOWER(c.nombre) IN ('baños', 'banos');

    SELECT COUNT(*) INTO parqueos_migrados
    FROM registro_x_inmueble_det d
    JOIN caracteristicas_mae c ON d.caracteristica_id = c.caracteristica_id
    WHERE LOWER(c.nombre) = 'parqueos';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE MIGRACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total registros en cab: %', total_cab;
    RAISE NOTICE 'Propietarios creados: %', propietarios_creados;
    RAISE NOTICE 'Registros sin propietario_id: %', sin_propietario;
    RAISE NOTICE 'Habitaciones migradas: %', habitaciones_migradas;
    RAISE NOTICE 'Baños migrados: %', banos_migrados;
    RAISE NOTICE 'Parqueos migrados: %', parqueos_migrados;
    RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- PASO 6: Trigger para updated_at en propietarios
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
-- NOTAS POST-MIGRACIÓN:
-- =====================================================
-- 1. ❌ NO eliminar columnas todavía, validar primero:
--    - propietario_real_nombre
--    - propietario_real_dni
--    - propietario_real_telefono
--    - propietario_real_email
--    - habitaciones
--    - banos
--    - parqueos
--
-- 2. ✅ Para eliminar después de validar:
--    ALTER TABLE registro_x_inmueble_cab
--    DROP COLUMN propietario_real_nombre,
--    DROP COLUMN propietario_real_dni,
--    DROP COLUMN propietario_real_telefono,
--    DROP COLUMN propietario_real_email,
--    DROP COLUMN habitaciones,
--    DROP COLUMN banos,
--    DROP COLUMN parqueos;
-- =====================================================
