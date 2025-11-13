-- =====================================================
-- SCRIPT: Completar Categorías Faltantes para Edificio
-- Fecha: 2025-01-07
-- Descripción: Agregar solo las categorías que faltan
-- =====================================================

BEGIN;

-- =====================================================
-- CATEGORÍA 1: EDIFICIO - UBICACIÓN (NUEVA)
-- =====================================================
DO $$
DECLARE
    cat_ubicacion_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Ubicación', 'Datos de ubicación detallada del edificio', 7, TRUE)
    RETURNING categoria_id INTO cat_ubicacion_id;

    RAISE NOTICE '📍 Categoría Ubicación ID: %', cat_ubicacion_id;

    -- Características de ubicación
    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Numeración', 'select', cat_ubicacion_id, 1, TRUE),
        ('Urbanización', 'select', cat_ubicacion_id, 2, TRUE),
        ('Departamento', 'select', cat_ubicacion_id, 3, TRUE),
        ('País', 'select', cat_ubicacion_id, 4, TRUE);

    RAISE NOTICE '✅ 4 características de Ubicación creadas';
END $$;

-- =====================================================
-- CATEGORÍA 2: EDIFICIO - ESTRUCTURA (NUEVA)
-- =====================================================
DO $$
DECLARE
    cat_estructura_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Estructura', 'Estructura física del edificio', 8, TRUE)
    RETURNING categoria_id INTO cat_estructura_id;

    RAISE NOTICE '🏗️ Categoría Estructura ID: %', cat_estructura_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Cantidad Pisos Edificio', 'number', cat_estructura_id, 1, TRUE),
        ('Cantidad de Sótanos', 'number', cat_estructura_id, 2, TRUE);

    RAISE NOTICE '✅ 2 características de Estructura creadas';
END $$;

-- =====================================================
-- CATEGORÍA 3: OFICINA (NUEVA)
-- =====================================================
DO $$
DECLARE
    cat_oficina_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Oficina', 'Características específicas de oficina', 9, TRUE)
    RETURNING categoria_id INTO cat_oficina_id;

    RAISE NOTICE '🏢 Categoría Oficina ID: %', cat_oficina_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Piso', 'number', cat_oficina_id, 1, TRUE),
        ('Número de Oficina', 'select', cat_oficina_id, 2, TRUE),
        ('Baños Oficina', 'number', cat_oficina_id, 3, TRUE),
        ('Parqueos Oficina', 'number', cat_oficina_id, 4, TRUE),
        ('Aire Acondicionado', 'checkbox', cat_oficina_id, 5, TRUE),
        ('Amoblado', 'checkbox', cat_oficina_id, 6, TRUE),
        ('Vista Exterior', 'checkbox', cat_oficina_id, 7, TRUE);

    RAISE NOTICE '✅ 7 características de Oficina creadas';
END $$;

-- =====================================================
-- AGREGAR ASCENSORES FALTANTES A CATEGORÍA EXISTENTE
-- =====================================================
DO $$
DECLARE
    cat_ascensores_id INT;
BEGIN
    -- Obtener ID de categoría Ascensores existente
    SELECT categoria_id INTO cat_ascensores_id
    FROM categorias_mae
    WHERE nombre = 'Ascensores'
    LIMIT 1;

    IF cat_ascensores_id IS NOT NULL THEN
        -- Agregar Ascensores Cantidad Total
        INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
        VALUES
            ('Ascensores (Cantidad Total)', 'number', cat_ascensores_id, 1, TRUE);

        RAISE NOTICE '✅ Característica "Ascensores (Cantidad Total)" agregada a categoría existente';
    END IF;
END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
DO $$
DECLARE
    total_categorias INT;
    total_caracteristicas INT;
BEGIN
    SELECT COUNT(*) INTO total_categorias FROM categorias_mae;
    SELECT COUNT(*) INTO total_caracteristicas FROM caracteristicas_mae;

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 RESUMEN DE CREACIÓN';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total categorías en BD: %', total_categorias;
    RAISE NOTICE 'Total características en BD: %', total_caracteristicas;
    RAISE NOTICE '';
    RAISE NOTICE 'Nuevas categorías creadas:';
    RAISE NOTICE '  📂 Edificio - Ubicación: 4 características';
    RAISE NOTICE '  📂 Edificio - Estructura: 2 características';
    RAISE NOTICE '  📂 Oficina: 7 características';
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ CREACIÓN COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '================================================';
END $$;

COMMIT;

-- =====================================================
-- CONSULTA DE VERIFICACIÓN (ejecutar después)
-- =====================================================
-- SELECT
--     cat.nombre as categoria,
--     COUNT(c.caracteristica_id) as total,
--     STRING_AGG(c.nombre, ', ' ORDER BY c.orden) as caracteristicas
-- FROM categorias_mae cat
-- LEFT JOIN caracteristicas_mae c ON cat.categoria_id = c.categoria_id
-- WHERE cat.nombre IN (
--     'Edificio - Ubicación',
--     'Edificio - Estructura',
--     'Oficina',
--     'Ascensores'
-- )
-- GROUP BY cat.nombre
-- ORDER BY cat.nombre;
