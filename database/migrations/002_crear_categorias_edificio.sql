-- =====================================================
-- SCRIPT: Crear Categorías y Características para Edificio
-- Fecha: 2025-01-07
-- Descripción: Categorías específicas para edificios y oficinas
-- =====================================================

BEGIN;

-- =====================================================
-- PASO 1: Crear categoría "Edificio"
-- =====================================================
INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
VALUES ('Edificio', 'Características generales del edificio', 1, TRUE)
ON CONFLICT DO NOTHING
RETURNING categoria_id;

-- Obtener el ID (ajustar manualmente si ya existe)
-- Ejemplo: SELECT categoria_id FROM categorias_mae WHERE nombre = 'Edificio';

-- =====================================================
-- PASO 2: Insertar características de edificio
-- NOTA: Reemplazar 10 con el categoria_id real de "Edificio"
-- =====================================================

DO $$
DECLARE
    cat_edificio_id INT;
BEGIN
    -- Obtener ID de categoría Edificio
    SELECT categoria_id INTO cat_edificio_id
    FROM categorias_mae
    WHERE nombre = 'Edificio'
    LIMIT 1;

    IF cat_edificio_id IS NULL THEN
        RAISE EXCEPTION 'Categoría Edificio no encontrada';
    END IF;

    RAISE NOTICE 'Categoría Edificio ID: %', cat_edificio_id;

    -- Insertar características
    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        -- DATOS BÁSICOS DEL EDIFICIO
        ('Nombre del Edificio', 'text', cat_edificio_id, 1, TRUE),
        ('Año de Construcción', 'number', cat_edificio_id, 2, TRUE),
        ('Cantidad Pisos Edificio', 'number', cat_edificio_id, 3, TRUE),
        ('Cantidad de Sótanos', 'number', cat_edificio_id, 4, TRUE),

        -- LOCALES COMERCIALES
        ('Local Comercial 01 (m²)', 'number', cat_edificio_id, 5, TRUE),
        ('Local Comercial 02 (m²)', 'number', cat_edificio_id, 6, TRUE),
        ('Local Comercial 03 (m²)', 'number', cat_edificio_id, 7, TRUE),

        -- AMENIDADES
        ('Cafetería', 'checkbox', cat_edificio_id, 8, TRUE),
        ('GYM', 'checkbox', cat_edificio_id, 9, TRUE),
        ('Ofic Trámite Docum', 'checkbox', cat_edificio_id, 10, TRUE),
        ('Salas de Reuniones', 'checkbox', cat_edificio_id, 11, TRUE),
        ('SUM', 'checkbox', cat_edificio_id, 12, TRUE),
        ('Comedor', 'checkbox', cat_edificio_id, 13, TRUE),
        ('Depósitos (m²)', 'number', cat_edificio_id, 14, TRUE),
        ('Rooftop', 'checkbox', cat_edificio_id, 15, TRUE),
        ('Área para Arther Office', 'checkbox', cat_edificio_id, 16, TRUE),
        ('Duchas/Vestuario', 'checkbox', cat_edificio_id, 17, TRUE),
        ('Helipuerto', 'checkbox', cat_edificio_id, 18, TRUE),

        -- ASCENSORES Y MONTACARGAS
        ('Ascensores (Cantidad Total)', 'number', cat_edificio_id, 19, TRUE),
        ('Montacarga', 'number', cat_edificio_id, 20, TRUE),
        ('Ascensor de Sótano a Piso 1', 'number', cat_edificio_id, 21, TRUE),
        ('Asc. Directo Sótano a Ofic con bloqueo', 'number', cat_edificio_id, 22, TRUE),

        -- PARQUEOS
        ('Parqueos de Bicicletas', 'number', cat_edificio_id, 23, TRUE),
        ('Zona de Carga Bat Eléctricas', 'checkbox', cat_edificio_id, 24, TRUE),

        -- SOPORTE DEL EDIFICIO
        ('Grupo Electrógeno', 'checkbox', cat_edificio_id, 25, TRUE),
        ('G.E de Encendido Manual', 'checkbox', cat_edificio_id, 26, TRUE),
        ('G.E. de Encendido Automático', 'checkbox', cat_edificio_id, 27, TRUE),
        ('Chiller para AACC', 'checkbox', cat_edificio_id, 28, TRUE),
        ('Ctos Técnicos / Condensadores', 'checkbox', cat_edificio_id, 29, TRUE),
        ('Fibra Óptica', 'checkbox', cat_edificio_id, 30, TRUE),
        ('Recepción / Seguridad', 'checkbox', cat_edificio_id, 31, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Características de Edificio insertadas';
END $$;

-- =====================================================
-- PASO 3: Crear categoría "Oficina"
-- =====================================================
INSERT INTO categorias_mae (nombre, descripcion, orden, activo)
VALUES ('Oficina', 'Características específicas de oficina en edificio', 2, TRUE)
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    cat_oficina_id INT;
BEGIN
    -- Obtener ID de categoría Oficina
    SELECT categoria_id INTO cat_oficina_id
    FROM categorias_mae
    WHERE nombre = 'Oficina'
    LIMIT 1;

    IF cat_oficina_id IS NULL THEN
        RAISE EXCEPTION 'Categoría Oficina no encontrada';
    END IF;

    RAISE NOTICE 'Categoría Oficina ID: %', cat_oficina_id;

    -- Insertar características de oficina
    INSERT INTO caracteristicas_mae (nombre, tipo_input, categoria_id, orden, activo)
    VALUES
        ('Piso', 'number', cat_oficina_id, 1, TRUE),
        ('Número de Oficina', 'text', cat_oficina_id, 2, TRUE),
        ('Baños', 'number', cat_oficina_id, 3, TRUE),
        ('Parqueos', 'number', cat_oficina_id, 4, TRUE),
        ('Aire Acondicionado', 'checkbox', cat_oficina_id, 5, TRUE),
        ('Amoblado', 'checkbox', cat_oficina_id, 6, TRUE),
        ('Vista Exterior', 'checkbox', cat_oficina_id, 7, TRUE)
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Características de Oficina insertadas';
END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================
DO $$
DECLARE
    total_edificio INT;
    total_oficina INT;
BEGIN
    SELECT COUNT(*) INTO total_edificio
    FROM caracteristicas_mae c
    JOIN categorias_mae cat ON c.categoria_id = cat.categoria_id
    WHERE cat.nombre = 'Edificio';

    SELECT COUNT(*) INTO total_oficina
    FROM caracteristicas_mae c
    JOIN categorias_mae cat ON c.categoria_id = cat.categoria_id
    WHERE cat.nombre = 'Oficina';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESUMEN DE CATEGORÍAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Características Edificio: %', total_edificio;
    RAISE NOTICE 'Características Oficina: %', total_oficina;
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- =====================================================
-- NOTAS:
-- =====================================================
-- 1. Tipos de input usados:
--    - 'text': Campos de texto
--    - 'number': Números
--    - 'checkbox': Sí/No (boolean)
--
-- 2. Para asignar a tipo_inmueble específico, crear endpoint
--    que mapee tipo_inmueble_id → categoria_id
-- =====================================================
