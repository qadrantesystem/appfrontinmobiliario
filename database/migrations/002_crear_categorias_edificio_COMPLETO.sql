-- =====================================================
-- SCRIPT ÉPICO: Categorías y Características para Edificio
-- Fecha: 2025-01-07
-- Descripción: 6 categorías + 39 características
-- Fuente: Formulario "INGRESO DE DATA DE OFICINA"
-- =====================================================

BEGIN;

DO $$
BEGIN
    RAISE NOTICE '🚀 INICIANDO CREACIÓN DE CATEGORÍAS ÉPICAS...';
END $$;

-- =====================================================
-- CATEGORÍA 1: EDIFICIO - UBICACIÓN
-- =====================================================
DO $$
DECLARE
    cat_ubicacion_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Ubicación', 'Datos de ubicación detallada del edificio', 1, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_ubicacion_id;

    IF cat_ubicacion_id IS NULL THEN
        SELECT categoria_id INTO cat_ubicacion_id
        FROM categorias_mae
        WHERE nombre = 'Edificio - Ubicación'
        LIMIT 1;
    END IF;

    RAISE NOTICE '📍 Categoría Ubicación ID: %', cat_ubicacion_id;

    -- Características de ubicación
    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Numeración', 'select', cat_ubicacion_id, 1, TRUE),
        ('Urbanización', 'select', cat_ubicacion_id, 2, TRUE),
        ('Departamento', 'select', cat_ubicacion_id, 3, TRUE),
        ('País', 'select', cat_ubicacion_id, 4, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 4 características de Ubicación creadas';
END $$;

-- =====================================================
-- CATEGORÍA 2: EDIFICIO - ESTRUCTURA
-- =====================================================
DO $$
DECLARE
    cat_estructura_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Estructura', 'Estructura física del edificio', 2, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_estructura_id;

    IF cat_estructura_id IS NULL THEN
        SELECT categoria_id INTO cat_estructura_id
        FROM categorias_mae
        WHERE nombre = 'Edificio - Estructura'
        LIMIT 1;
    END IF;

    RAISE NOTICE '🏗️ Categoría Estructura ID: %', cat_estructura_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Cantidad Pisos Edificio', 'number', cat_estructura_id, 1, TRUE),
        ('Cantidad de Sótanos', 'number', cat_estructura_id, 2, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 2 características de Estructura creadas';
END $$;

-- =====================================================
-- CATEGORÍA 3: EDIFICIO - AMENIDADES
-- =====================================================
DO $$
DECLARE
    cat_amenidades_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Amenidades', 'Servicios y amenidades del edificio', 3, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_amenidades_id;

    IF cat_amenidades_id IS NULL THEN
        SELECT categoria_id INTO cat_amenidades_id
        FROM categorias_mae
        WHERE nombre = 'Edificio - Amenidades'
        LIMIT 1;
    END IF;

    RAISE NOTICE '🎯 Categoría Amenidades ID: %', cat_amenidades_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Local Comercial 01 (m²)', 'number', cat_amenidades_id, 1, TRUE),
        ('Local Comercial 02 (m²)', 'number', cat_amenidades_id, 2, TRUE),
        ('Local Comercial 03 (m²)', 'number', cat_amenidades_id, 3, TRUE),
        ('Cafetería', 'checkbox', cat_amenidades_id, 4, TRUE),
        ('GYM', 'checkbox', cat_amenidades_id, 5, TRUE),
        ('Ofic Trámite Docum', 'checkbox', cat_amenidades_id, 6, TRUE),
        ('Salas de Reuniones', 'checkbox', cat_amenidades_id, 7, TRUE),
        ('SUM', 'checkbox', cat_amenidades_id, 8, TRUE),
        ('Comedor', 'checkbox', cat_amenidades_id, 9, TRUE),
        ('Depósitos (m²)', 'number', cat_amenidades_id, 10, TRUE),
        ('Rooftop', 'checkbox', cat_amenidades_id, 11, TRUE),
        ('Área para Arther Office', 'checkbox', cat_amenidades_id, 12, TRUE),
        ('Duchas/Vestuario', 'checkbox', cat_amenidades_id, 13, TRUE),
        ('Helipuerto', 'checkbox', cat_amenidades_id, 14, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 14 características de Amenidades creadas';
END $$;

-- =====================================================
-- CATEGORÍA 4: EDIFICIO - TRANSPORTE VERTICAL
-- =====================================================
DO $$
DECLARE
    cat_transporte_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Transporte Vertical', 'Ascensores, montacargas y parqueos', 4, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_transporte_id;

    IF cat_transporte_id IS NULL THEN
        SELECT categoria_id INTO cat_transporte_id
        FROM categorias_mae
        WHERE nombre = 'Edificio - Transporte Vertical'
        LIMIT 1;
    END IF;

    RAISE NOTICE '🛗 Categoría Transporte Vertical ID: %', cat_transporte_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Ascensores (Cantidad Total)', 'number', cat_transporte_id, 1, TRUE),
        ('Montacarga', 'number', cat_transporte_id, 2, TRUE),
        ('Ascensor de Sótano a Piso 1', 'number', cat_transporte_id, 3, TRUE),
        ('Asc. Directo Sótano a Ofic con bloqueo', 'number', cat_transporte_id, 4, TRUE),
        ('Parqueos de Bicicletas', 'number', cat_transporte_id, 5, TRUE),
        ('Zona de Carga Bat Eléctricas', 'checkbox', cat_transporte_id, 6, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 6 características de Transporte Vertical creadas';
END $$;

-- =====================================================
-- CATEGORÍA 5: EDIFICIO - SOPORTE TÉCNICO
-- =====================================================
DO $$
DECLARE
    cat_soporte_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Edificio - Soporte Técnico', 'Infraestructura técnica y servicios', 5, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_soporte_id;

    IF cat_soporte_id IS NULL THEN
        SELECT categoria_id INTO cat_soporte_id
        FROM categorias_mae
        WHERE nombre = 'Edificio - Soporte Técnico'
        LIMIT 1;
    END IF;

    RAISE NOTICE '⚡ Categoría Soporte Técnico ID: %', cat_soporte_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Grupo Electrógeno', 'checkbox', cat_soporte_id, 1, TRUE),
        ('G.E de Encendido Manual', 'checkbox', cat_soporte_id, 2, TRUE),
        ('G.E. de Encendido Automático', 'checkbox', cat_soporte_id, 3, TRUE),
        ('Chiller para AACC', 'checkbox', cat_soporte_id, 4, TRUE),
        ('Ctos Técnicos / Condensadores', 'checkbox', cat_soporte_id, 5, TRUE),
        ('Fibra Óptica', 'checkbox', cat_soporte_id, 6, TRUE),
        ('Recepción / Seguridad', 'checkbox', cat_soporte_id, 7, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 7 características de Soporte Técnico creadas';
END $$;

-- =====================================================
-- CATEGORÍA 6: CERCANÍA ESTRATÉGICA
-- =====================================================
DO $$
DECLARE
    cat_cercania_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Cercanía Estratégica', 'Ubicación estratégica respecto a puntos de interés', 6, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_cercania_id;

    IF cat_cercania_id IS NULL THEN
        SELECT categoria_id INTO cat_cercania_id
        FROM categorias_mae
        WHERE nombre = 'Cercanía Estratégica'
        LIMIT 1;
    END IF;

    RAISE NOTICE '🗺️ Categoría Cercanía Estratégica ID: %', cat_cercania_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Avenidas importantes', 'checkbox', cat_cercania_id, 1, TRUE),
        ('Estaciones Tren Eléctrico', 'checkbox', cat_cercania_id, 2, TRUE),
        ('Bancos y Financieras', 'checkbox', cat_cercania_id, 3, TRUE),
        ('Parqueo Público', 'checkbox', cat_cercania_id, 4, TRUE),
        ('Hoteles', 'checkbox', cat_cercania_id, 5, TRUE),
        ('Restaurantes, Copias y Servicios', 'checkbox', cat_cercania_id, 6, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 6 características de Cercanía Estratégica creadas';
END $$;

-- =====================================================
-- CATEGORÍA 7: OFICINA (Para oficinas en edificio)
-- =====================================================
DO $$
DECLARE
    cat_oficina_id INT;
BEGIN
    INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
    VALUES ('Oficina', 'Características específicas de oficina', 7, TRUE)
    ON CONFLICT DO NOTHING
    RETURNING categoria_id INTO cat_oficina_id;

    IF cat_oficina_id IS NULL THEN
        SELECT categoria_id INTO cat_oficina_id
        FROM categorias_mae
        WHERE nombre = 'Oficina'
        LIMIT 1;
    END IF;

    RAISE NOTICE '🏢 Categoría Oficina ID: %', cat_oficina_id;

    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Piso', 'number', cat_oficina_id, 1, TRUE),
        ('Número de Oficina', 'select', cat_oficina_id, 2, TRUE),
        ('Baños Oficina', 'number', cat_oficina_id, 3, TRUE),
        ('Parqueos Oficina', 'number', cat_oficina_id, 4, TRUE),
        ('Aire Acondicionado', 'checkbox', cat_oficina_id, 5, TRUE),
        ('Amoblado', 'checkbox', cat_oficina_id, 6, TRUE),
        ('Vista Exterior', 'checkbox', cat_oficina_id, 7, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ 7 características de Oficina creadas';
END $$;

-- =====================================================
-- VERIFICACIÓN ÉPICA FINAL
-- =====================================================
DO $$
DECLARE
    total_categorias INT;
    total_caracteristicas INT;
    rec RECORD;
BEGIN
    -- Contar categorías creadas
    SELECT COUNT(*) INTO total_categorias
    FROM categorias_mae
    WHERE nombre IN (
        'Edificio - Ubicación',
        'Edificio - Estructura',
        'Edificio - Amenidades',
        'Edificio - Transporte Vertical',
        'Edificio - Soporte Técnico',
        'Cercanía Estratégica',
        'Oficina'
    );

    RAISE NOTICE '';
    RAISE NOTICE '================================================';
    RAISE NOTICE '🎉 RESUMEN ÉPICO DE CREACIÓN';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Total de categorías creadas: %', total_categorias;
    RAISE NOTICE '';

    -- Detalle por categoría
    FOR rec IN
        SELECT
            cat.nombre as categoria,
            cat.orden as orden,
            COUNT(c.caracteristica_id) as total
        FROM categorias_mae cat
        LEFT JOIN caracteristicas_mae c ON cat.categoria_id = c.categoria_id
        WHERE cat.nombre IN (
            'Edificio - Ubicación',
            'Edificio - Estructura',
            'Edificio - Amenidades',
            'Edificio - Transporte Vertical',
            'Edificio - Soporte Técnico',
            'Cercanía Estratégica',
            'Oficina'
        )
        GROUP BY cat.nombre, cat.orden
        ORDER BY cat.orden
    LOOP
        RAISE NOTICE '  📂 %: % características', rec.categoria, rec.total;
    END LOOP;

    -- Total de características
    SELECT COUNT(*) INTO total_caracteristicas
    FROM caracteristicas_mae c
    JOIN categorias_mae cat ON c.categoria_id = cat.categoria_id
    WHERE cat.nombre IN (
        'Edificio - Ubicación',
        'Edificio - Estructura',
        'Edificio - Amenidades',
        'Edificio - Transporte Vertical',
        'Edificio - Soporte Técnico',
        'Cercanía Estratégica',
        'Oficina'
    );

    RAISE NOTICE '';
    RAISE NOTICE '🔥 Total características creadas: %', total_caracteristicas;
    RAISE NOTICE '================================================';
    RAISE NOTICE '✅ CREACIÓN ÉPICA COMPLETADA EXITOSAMENTE';
    RAISE NOTICE '================================================';
    RAISE NOTICE '';
END $$;

COMMIT;

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Total: 7 categorías + 46 características
-- 2. Categorías aplicables por tipo de inmueble:
--    - Edificio Completo: Categorías 1-6
--    - Oficina en Edificio: Categoría 7 + referencia al padre
-- 3. Los campos transversales permanecen en registro_x_inmueble_cab
-- =====================================================
