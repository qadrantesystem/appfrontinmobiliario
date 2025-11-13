-- =====================================================
-- SCRIPT: Eliminar Columnas Obsoletas
-- Fecha: 2025-01-07
-- Descripción: DROP de columnas migradas a propietarios y det
-- ⚠️ EJECUTAR SOLO DESPUÉS DE VERIFICAR QUE TODO FUNCIONA
-- =====================================================

BEGIN;

-- =====================================================
-- VERIFICACIÓN PREVIA
-- =====================================================
DO $$
DECLARE
    total_registros INT;
    sin_propietario INT;
    habitaciones_migradas INT;
    banos_migrados INT;
    parqueos_migrados INT;
BEGIN
    -- Verificar propietario_id
    SELECT COUNT(*) INTO total_registros FROM registro_x_inmueble_cab;
    SELECT COUNT(*) INTO sin_propietario
    FROM registro_x_inmueble_cab
    WHERE propietario_id IS NULL;

    IF sin_propietario > 0 THEN
        RAISE EXCEPTION '❌ HAY % REGISTROS SIN propietario_id. ABORTAR DROP.', sin_propietario;
    END IF;

    -- Verificar características migradas
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
    RAISE NOTICE 'VERIFICACIÓN PRE-DROP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total registros: %', total_registros;
    RAISE NOTICE 'Registros sin propietario_id: %', sin_propietario;
    RAISE NOTICE 'Habitaciones migradas: %', habitaciones_migradas;
    RAISE NOTICE 'Baños migrados: %', banos_migrados;
    RAISE NOTICE 'Parqueos migrados: %', parqueos_migrados;
    RAISE NOTICE '========================================';

    IF sin_propietario = 0 THEN
        RAISE NOTICE '✅ SEGURO PARA PROCEDER CON DROP';
    END IF;
END $$;

-- =====================================================
-- DROP DE COLUMNAS DE PROPIETARIO
-- =====================================================
DO $$
BEGIN
    ALTER TABLE registro_x_inmueble_cab
    DROP COLUMN IF EXISTS propietario_real_nombre,
    DROP COLUMN IF EXISTS propietario_real_dni,
    DROP COLUMN IF EXISTS propietario_real_telefono,
    DROP COLUMN IF EXISTS propietario_real_email;

    RAISE NOTICE '✅ Columnas de propietario eliminadas';
END $$;

-- =====================================================
-- DROP DE COLUMNAS MIGRADAS A DET
-- =====================================================
DO $$
BEGIN
    ALTER TABLE registro_x_inmueble_cab
    DROP COLUMN IF EXISTS habitaciones,
    DROP COLUMN IF EXISTS banos,
    DROP COLUMN IF EXISTS parqueos;

    RAISE NOTICE '✅ Columnas de características eliminadas';
END $$;

-- =====================================================
-- VERIFICACIÓN POST-DROP
-- =====================================================
DO $$
DECLARE
    columnas_restantes TEXT[];
BEGIN
    SELECT ARRAY_AGG(column_name) INTO columnas_restantes
    FROM information_schema.columns
    WHERE table_name = 'registro_x_inmueble_cab'
      AND column_name IN (
          'propietario_real_nombre',
          'propietario_real_dni',
          'propietario_real_telefono',
          'propietario_real_email',
          'habitaciones',
          'banos',
          'parqueos'
      );

    IF columnas_restantes IS NOT NULL THEN
        RAISE WARNING '⚠️ Columnas que aún existen: %', columnas_restantes;
    ELSE
        RAISE NOTICE '✅ Todas las columnas obsoletas eliminadas correctamente';
    END IF;
END $$;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
DO $$
DECLARE
    total_columnas INT;
BEGIN
    SELECT COUNT(*) INTO total_columnas
    FROM information_schema.columns
    WHERE table_name = 'registro_x_inmueble_cab';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN POST-DROP';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Columnas restantes en registro_x_inmueble_cab: %', total_columnas;
    RAISE NOTICE '✅ Normalización completada';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- ROLLBACK (si algo sale mal)
-- =====================================================
-- Para revertir (NO ejecutar a menos que haya problemas):
-- ROLLBACK;
-- =====================================================
