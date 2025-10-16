# Modelo de Datos - Sistema Inmobiliario

## 📋 Resumen
Modelo de base de datos simplificado para la plataforma inmobiliaria, alineado con el frontend HTML existente.

---

## 🔐 1. TABLA: usuarios

Tabla principal de usuarios del sistema.

```sql
CREATE TABLE usuarios (
    -- Identificación
    usuario_id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Datos personales
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    
    -- Perfil y estado
    perfil_id INTEGER NOT NULL REFERENCES perfiles(perfil_id),
    estado VARCHAR(20) DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'suspendido')),
    
    -- Suscripción
    plan_id INTEGER REFERENCES planes_mae(plan_id),
    fecha_inicio_suscripcion TIMESTAMP,
    fecha_fin_suscripcion TIMESTAMP,
    
    -- Auditoría
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_sesion TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_perfil ON usuarios(perfil_id);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
```

**Campos alineados con HTML:**
- `email`: Campo de login en `login.html`
- `password_hash`: Campo de contraseña en `login.html`
- `nombre`, `apellido`: Datos del perfil de usuario
- `perfil_id`: Determina permisos (arrendatario/propietario/admin)

---

## 👤 2. TABLA: perfiles

Define los tipos de usuario y sus permisos.

```sql
CREATE TABLE perfiles (
    perfil_id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    descripcion TEXT,
    permisos JSONB, -- Permisos específicos del perfil
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales
INSERT INTO perfiles (perfil_id, nombre, descripcion, permisos) VALUES
(1, 'arrendatario', 'Usuario que busca inmuebles para alquilar o comprar', 
 '{"buscar": true, "guardar_favoritos": true, "contactar": true}'),
(2, 'propietario', 'Usuario que publica inmuebles', 
 '{"buscar": true, "publicar": true, "gestionar_propiedades": true}'),
(3, 'admin', 'Administrador del sistema', 
 '{"all": true}');
```

**Perfiles del sistema:**
- **arrendatario**: Busca y filtra propiedades
- **propietario**: Publica y gestiona propiedades
- **admin**: Control total del sistema

---

## 🏢 3. TABLA: tipo_inmueble_mae

Catálogo maestro de tipos de inmuebles.

```sql
CREATE TABLE tipo_inmueble_mae (
    tipo_inmueble_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50), -- Clase de Font Awesome
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales (alineados con caracteristicas_x_filtro.json)
INSERT INTO tipo_inmueble_mae (tipo_inmueble_id, nombre, icono, orden) VALUES
(1, 'Oficina en Edificio', 'fa-building', 1),
(2, 'Casa', 'fa-home', 2),
(3, 'Departamento', 'fa-door-closed', 3),
(4, 'Local Comercial', 'fa-store', 4),
(5, 'Terreno', 'fa-map', 5),
(6, 'Almacén', 'fa-warehouse', 6);

CREATE INDEX idx_tipo_inmueble_activo ON tipo_inmueble_mae(activo);
```

**Alineado con:**
- `data/tipos_inmuebles.json`
- Selector de tipo en `index.html`

---

## 🏷️ 4. TABLA: caracteristicas_mae

Catálogo maestro de características de inmuebles.

```sql
CREATE TABLE caracteristicas_mae (
    caracteristica_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Tipo de input para el filtro
    tipo_input VARCHAR(20) NOT NULL CHECK (tipo_input IN ('checkbox', 'number', 'select', 'range')),
    unidad VARCHAR(20), -- m², unid, años, etc.
    
    -- Categorización
    categoria VARCHAR(100), -- AREAS_COMUNES_EDIFICIO, ASCENSORES, etc.
    
    -- Configuración
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ejemplos de características
INSERT INTO caracteristicas_mae (caracteristica_id, nombre, tipo_input, categoria, orden) VALUES
(1, 'Parqueos Simples', 'number', 'AREAS_COMUNES_EDIFICIO', 1),
(2, 'Parqueos Dobles', 'number', 'AREAS_COMUNES_EDIFICIO', 2),
(3, 'Depósito metraje', 'number', 'AREAS_COMUNES_EDIFICIO', 3),
(4, 'Parqueos para Bicicletas', 'checkbox', 'AREAS_COMUNES_EDIFICIO', 4),
(5, 'Cafetería', 'checkbox', 'AREAS_COMUNES_EDIFICIO', 5),
(6, 'GYM', 'checkbox', 'AREAS_COMUNES_EDIFICIO', 6),
(19, 'Montacarga', 'checkbox', 'ASCENSORES', 1),
(20, 'De Sótano directo a Oficina', 'checkbox', 'ASCENSORES', 2);

CREATE INDEX idx_caracteristicas_categoria ON caracteristicas_mae(categoria);
CREATE INDEX idx_caracteristicas_activo ON caracteristicas_mae(activo);
```

**Alineado con:**
- `data/caracteristicas.json`
- Filtros avanzados en `resultados.html`

---

## 🔗 5. TABLA: caracteristicas_x_inmueble_mae

Relación entre tipos de inmuebles y sus características aplicables.

```sql
CREATE TABLE caracteristicas_x_inmueble_mae (
    id SERIAL PRIMARY KEY,
    tipo_inmueble_id INTEGER NOT NULL REFERENCES tipo_inmueble_mae(tipo_inmueble_id),
    caracteristica_id INTEGER NOT NULL REFERENCES caracteristicas_mae(caracteristica_id),
    
    -- Configuración específica
    requerido BOOLEAN DEFAULT false,
    visible_en_filtro BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tipo_inmueble_id, caracteristica_id)
);

-- Ejemplo: Oficina en Edificio tiene estas características
INSERT INTO caracteristicas_x_inmueble_mae (tipo_inmueble_id, caracteristica_id, orden) VALUES
(1, 1, 1),  -- Parqueos Simples
(1, 2, 2),  -- Parqueos Dobles
(1, 4, 3),  -- Parqueos para Bicicletas
(1, 5, 4),  -- Cafetería
(1, 6, 5);  -- GYM

CREATE INDEX idx_carac_x_inmueble_tipo ON caracteristicas_x_inmueble_mae(tipo_inmueble_id);
CREATE INDEX idx_carac_x_inmueble_carac ON caracteristicas_x_inmueble_mae(caracteristica_id);
```

**Alineado con:**
- `data/caracteristicas_x_filtro.json`
- Estructura de filtros avanzados dinámicos

---

## 🏠 6. TABLA: propiedades

Tabla principal de inmuebles registrados.

```sql
CREATE TABLE propiedades (
    propiedad_id SERIAL PRIMARY KEY,
    
    -- Relaciones
    propietario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id),
    tipo_inmueble_id INTEGER NOT NULL REFERENCES tipo_inmueble_mae(tipo_inmueble_id),
    
    -- Ubicación
    distrito_id INTEGER NOT NULL REFERENCES distritos_mae(distrito_id),
    direccion TEXT,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Características básicas
    area DECIMAL(10, 2) NOT NULL, -- m²
    parqueos INTEGER DEFAULT 0,
    antiguedad INTEGER, -- años
    implementacion VARCHAR(50), -- Amoblado FULL, Implementada, etc.
    
    -- Precios
    precio_venta DECIMAL(12, 2),
    precio_alquiler DECIMAL(10, 2),
    moneda VARCHAR(3) DEFAULT 'USD',
    
    -- Descripción
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    
    -- Multimedia
    imagen_principal VARCHAR(500),
    imagenes JSONB, -- Array de URLs de imágenes
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'disponible' CHECK (estado IN ('disponible', 'alquilado', 'vendido', 'inactivo')),
    destacado BOOLEAN DEFAULT false,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    publicado_at TIMESTAMP
);

CREATE INDEX idx_propiedades_tipo ON propiedades(tipo_inmueble_id);
CREATE INDEX idx_propiedades_distrito ON propiedades(distrito_id);
CREATE INDEX idx_propiedades_estado ON propiedades(estado);
CREATE INDEX idx_propiedades_propietario ON propiedades(propietario_id);
CREATE INDEX idx_propiedades_precio_venta ON propiedades(precio_venta);
CREATE INDEX idx_propiedades_precio_alquiler ON propiedades(precio_alquiler);
CREATE INDEX idx_propiedades_area ON propiedades(area);
```

**Alineado con:**
- `data/propiedades.json`
- Cards de resultados en `resultados.html`
- Formulario de búsqueda en `index.html`

---

## 🔍 7. TABLA: busqueda_x_inmueble_mov

Registro de búsquedas realizadas por usuarios (movimientos).

```sql
CREATE TABLE busqueda_x_inmueble_mov (
    busqueda_id SERIAL PRIMARY KEY,
    
    -- Usuario
    usuario_id INTEGER REFERENCES usuarios(usuario_id),
    sesion_id VARCHAR(100), -- Para usuarios no logueados
    
    -- Criterios de búsqueda
    tipo_inmueble_id INTEGER REFERENCES tipo_inmueble_mae(tipo_inmueble_id),
    distritos_ids INTEGER[], -- Array de IDs de distritos
    transaccion VARCHAR(20), -- 'compra' o 'alquiler'
    
    -- Filtros básicos
    precio_max DECIMAL(12, 2),
    area_min DECIMAL(10, 2),
    area_max DECIMAL(10, 2),
    parqueos_min INTEGER,
    antiguedad_max INTEGER,
    implementacion VARCHAR(50),
    
    -- Filtros avanzados (JSON)
    filtros_avanzados JSONB,
    
    -- Resultados
    cantidad_resultados INTEGER,
    
    -- Auditoría
    fecha_busqueda TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_busqueda_usuario ON busqueda_x_inmueble_mov(usuario_id);
CREATE INDEX idx_busqueda_fecha ON busqueda_x_inmueble_mov(fecha_busqueda);
CREATE INDEX idx_busqueda_tipo ON busqueda_x_inmueble_mov(tipo_inmueble_id);
```

**Propósito:**
- Analytics de búsquedas
- Recomendaciones personalizadas
- Historial de búsquedas del usuario

---

## 📝 8. TABLA: registro_x_inmueble_mov

Registro de interacciones de usuarios con propiedades.

```sql
CREATE TABLE registro_x_inmueble_mov (
    registro_id SERIAL PRIMARY KEY,
    
    -- Relaciones
    usuario_id INTEGER REFERENCES usuarios(usuario_id),
    propiedad_id INTEGER NOT NULL REFERENCES propiedades(propiedad_id),
    
    -- Tipo de interacción
    tipo_interaccion VARCHAR(50) NOT NULL CHECK (tipo_interaccion IN 
        ('vista', 'favorito', 'contacto', 'compartir', 'reporte')),
    
    -- Detalles
    detalles JSONB, -- Información adicional según el tipo
    
    -- Auditoría
    fecha_interaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_registro_usuario ON registro_x_inmueble_mov(usuario_id);
CREATE INDEX idx_registro_propiedad ON registro_x_inmueble_mov(propiedad_id);
CREATE INDEX idx_registro_tipo ON registro_x_inmueble_mov(tipo_interaccion);
CREATE INDEX idx_registro_fecha ON registro_x_inmueble_mov(fecha_interaccion);
```

**Tipos de interacción:**
- **vista**: Usuario vio el detalle de la propiedad
- **favorito**: Usuario guardó la propiedad en favoritos
- **contacto**: Usuario contactó al propietario
- **compartir**: Usuario compartió la propiedad
- **reporte**: Usuario reportó un problema

---

## 💳 9. TABLA: planes_mae

Catálogo de planes de suscripción.

```sql
CREATE TABLE planes_mae (
    plan_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    
    -- Precios
    precio_mensual DECIMAL(10, 2),
    precio_anual DECIMAL(10, 2),
    moneda VARCHAR(3) DEFAULT 'USD',
    
    -- Límites
    max_propiedades INTEGER, -- NULL = ilimitado
    max_imagenes_por_propiedad INTEGER,
    destacar_propiedades BOOLEAN DEFAULT false,
    soporte_prioritario BOOLEAN DEFAULT false,
    
    -- Características (JSON)
    caracteristicas JSONB,
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Planes iniciales
INSERT INTO planes_mae (plan_id, nombre, precio_mensual, precio_anual, max_propiedades, caracteristicas) VALUES
(1, 'Gratuito', 0, 0, 3, 
 '{"max_imagenes": 5, "destacar": false, "soporte": "email"}'),
(2, 'Básico', 29.99, 299.99, 10, 
 '{"max_imagenes": 15, "destacar": false, "soporte": "email"}'),
(3, 'Profesional', 79.99, 799.99, 50, 
 '{"max_imagenes": 30, "destacar": true, "soporte": "prioritario"}'),
(4, 'Empresarial', 199.99, 1999.99, NULL, 
 '{"max_imagenes": 100, "destacar": true, "soporte": "dedicado"}');
```

---

## 📅 10. TABLA: suscripciones

Registro de suscripciones de usuarios.

```sql
CREATE TABLE suscripciones (
    suscripcion_id SERIAL PRIMARY KEY,
    
    -- Relaciones
    usuario_id INTEGER NOT NULL REFERENCES usuarios(usuario_id),
    plan_id INTEGER NOT NULL REFERENCES planes_mae(plan_id),
    
    -- Periodo
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    
    -- Pago
    monto_pagado DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50),
    transaccion_id VARCHAR(255),
    
    -- Estado
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN 
        ('activa', 'cancelada', 'expirada', 'suspendida')),
    auto_renovar BOOLEAN DEFAULT true,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelada_at TIMESTAMP
);

CREATE INDEX idx_suscripciones_usuario ON suscripciones(usuario_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_suscripciones_fecha_fin ON suscripciones(fecha_fin);
```

---

## 📍 11. TABLA: distritos_mae

Catálogo de distritos/zonas.

```sql
CREATE TABLE distritos_mae (
    distrito_id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    
    -- Coordenadas del centro
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    
    -- Estado
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales (alineados con distritos.json)
INSERT INTO distritos_mae (distrito_id, nombre, ciudad) VALUES
(1, 'San Isidro', 'Lima'),
(2, 'Miraflores', 'Lima'),
(3, 'San Borja', 'Lima'),
(4, 'Surco', 'Lima'),
(5, 'La Molina', 'Lima'),
(6, 'Barranco', 'Lima'),
(7, 'Jesús María', 'Lima'),
(8, 'Lince', 'Lima'),
(9, 'Magdalena', 'Lima'),
(10, 'Pueblo Libre', 'Lima');

CREATE INDEX idx_distritos_activo ON distritos_mae(activo);
```

**Alineado con:**
- `data/distritos.json`
- Selector de distritos en `index.html`

---

## 🔗 12. TABLA: propiedad_caracteristicas

Valores de características específicas de cada propiedad.

```sql
CREATE TABLE propiedad_caracteristicas (
    id SERIAL PRIMARY KEY,
    propiedad_id INTEGER NOT NULL REFERENCES propiedades(propiedad_id) ON DELETE CASCADE,
    caracteristica_id INTEGER NOT NULL REFERENCES caracteristicas_mae(caracteristica_id),
    
    -- Valor (según tipo_input)
    valor_boolean BOOLEAN,
    valor_numerico DECIMAL(10, 2),
    valor_texto VARCHAR(255),
    
    -- Auditoría
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(propiedad_id, caracteristica_id)
);

CREATE INDEX idx_prop_carac_propiedad ON propiedad_caracteristicas(propiedad_id);
CREATE INDEX idx_prop_carac_caracteristica ON propiedad_caracteristicas(caracteristica_id);
```

**Ejemplo de uso:**
```sql
-- Oficina tiene GYM (checkbox)
INSERT INTO propiedad_caracteristicas (propiedad_id, caracteristica_id, valor_boolean) 
VALUES (1, 6, true);

-- Oficina tiene 8 parqueos simples (number)
INSERT INTO propiedad_caracteristicas (propiedad_id, caracteristica_id, valor_numerico) 
VALUES (1, 1, 8);
```

---

## 📊 Diagrama de Relaciones

```
usuarios
├── perfil_id → perfiles
├── plan_id → planes_mae
└── suscripciones (1:N)

propiedades
├── propietario_id → usuarios
├── tipo_inmueble_id → tipo_inmueble_mae
├── distrito_id → distritos_mae
└── propiedad_caracteristicas (1:N)
    └── caracteristica_id → caracteristicas_mae

tipo_inmueble_mae
└── caracteristicas_x_inmueble_mae (1:N)
    └── caracteristica_id → caracteristicas_mae

busqueda_x_inmueble_mov
├── usuario_id → usuarios
└── tipo_inmueble_id → tipo_inmueble_mae

registro_x_inmueble_mov
├── usuario_id → usuarios
└── propiedad_id → propiedades

suscripciones
├── usuario_id → usuarios
└── plan_id → planes_mae
```

---

## 🔍 Consultas SQL Útiles

### 1. Buscar propiedades con filtros básicos

```sql
SELECT p.*, t.nombre as tipo_inmueble, d.nombre as distrito
FROM propiedades p
JOIN tipo_inmueble_mae t ON p.tipo_inmueble_id = t.tipo_inmueble_id
JOIN distritos_mae d ON p.distrito_id = d.distrito_id
WHERE p.estado = 'disponible'
  AND p.tipo_inmueble_id = 1
  AND p.distrito_id = ANY(ARRAY[1, 2, 3])
  AND p.precio_alquiler <= 5000
  AND p.area BETWEEN 400 AND 600
  AND p.parqueos >= 6
ORDER BY p.destacado DESC, p.created_at DESC;
```

### 2. Buscar propiedades con características específicas

```sql
SELECT p.*
FROM propiedades p
WHERE p.tipo_inmueble_id = 1
  AND EXISTS (
    SELECT 1 FROM propiedad_caracteristicas pc
    WHERE pc.propiedad_id = p.propiedad_id
      AND pc.caracteristica_id = 6  -- GYM
      AND pc.valor_boolean = true
  )
  AND EXISTS (
    SELECT 1 FROM propiedad_caracteristicas pc
    WHERE pc.propiedad_id = p.propiedad_id
      AND pc.caracteristica_id = 1  -- Parqueos Simples
      AND pc.valor_numerico >= 8
  );
```

### 3. Obtener características de un tipo de inmueble

```sql
SELECT c.*, cxi.orden, cxi.requerido
FROM caracteristicas_mae c
JOIN caracteristicas_x_inmueble_mae cxi 
  ON c.caracteristica_id = cxi.caracteristica_id
WHERE cxi.tipo_inmueble_id = 1
  AND c.activo = true
  AND cxi.visible_en_filtro = true
ORDER BY c.categoria, cxi.orden;
```

### 4. Historial de búsquedas de un usuario

```sql
SELECT 
  b.busqueda_id,
  b.fecha_busqueda,
  t.nombre as tipo_inmueble,
  b.transaccion,
  b.precio_max,
  b.cantidad_resultados
FROM busqueda_x_inmueble_mov b
LEFT JOIN tipo_inmueble_mae t ON b.tipo_inmueble_id = t.tipo_inmueble_id
WHERE b.usuario_id = 1
ORDER BY b.fecha_busqueda DESC
LIMIT 10;
```

### 5. Propiedades favoritas de un usuario

```sql
SELECT p.*, t.nombre as tipo_inmueble
FROM propiedades p
JOIN tipo_inmueble_mae t ON p.tipo_inmueble_id = t.tipo_inmueble_id
JOIN registro_x_inmueble_mov r ON p.propiedad_id = r.propiedad_id
WHERE r.usuario_id = 1
  AND r.tipo_interaccion = 'favorito'
ORDER BY r.fecha_interaccion DESC;
```

### 6. Estadísticas de propiedades por tipo

```sql
SELECT 
  t.nombre as tipo_inmueble,
  COUNT(*) as total,
  COUNT(CASE WHEN p.estado = 'disponible' THEN 1 END) as disponibles,
  AVG(p.precio_alquiler) as precio_promedio_alquiler,
  AVG(p.area) as area_promedio
FROM propiedades p
JOIN tipo_inmueble_mae t ON p.tipo_inmueble_id = t.tipo_inmueble_id
GROUP BY t.tipo_inmueble_id, t.nombre
ORDER BY total DESC;
```

---

## 🚀 Migraciones y Datos Iniciales

### Script de creación completo

```sql
-- 1. Crear tablas maestras
CREATE TABLE perfiles (...);
CREATE TABLE planes_mae (...);
CREATE TABLE tipo_inmueble_mae (...);
CREATE TABLE caracteristicas_mae (...);
CREATE TABLE distritos_mae (...);

-- 2. Crear tabla de usuarios
CREATE TABLE usuarios (...);

-- 3. Crear tablas de relación
CREATE TABLE caracteristicas_x_inmueble_mae (...);
CREATE TABLE suscripciones (...);

-- 4. Crear tabla de propiedades
CREATE TABLE propiedades (...);
CREATE TABLE propiedad_caracteristicas (...);

-- 5. Crear tablas de movimientos
CREATE TABLE busqueda_x_inmueble_mov (...);
CREATE TABLE registro_x_inmueble_mov (...);

-- 6. Insertar datos iniciales
INSERT INTO perfiles (...);
INSERT INTO planes_mae (...);
INSERT INTO tipo_inmueble_mae (...);
INSERT INTO distritos_mae (...);
INSERT INTO caracteristicas_mae (...);
INSERT INTO caracteristicas_x_inmueble_mae (...);
```

---

## 📝 Notas de Implementación

### Alineación con Frontend

1. **Filtros Dinámicos**: `caracteristicas_x_inmueble_mae` genera el JSON para `caracteristicas_x_filtro.json`
2. **Búsqueda**: Los filtros de `index.html` y `resultados.html` mapean directamente a columnas de `propiedades`
3. **Perfiles**: Los perfiles en la BD determinan qué ve el usuario en el HTML
4. **localStorage**: Los datos de `filtrosSimplificados` se guardan también en `busqueda_x_inmueble_mov`

### Optimizaciones

1. **Índices**: Creados en campos de búsqueda frecuente
2. **JSONB**: Para datos flexibles (filtros avanzados, características de planes)
3. **Arrays**: Para relaciones múltiples (distritos en búsqueda)
4. **Particionamiento**: Considerar para `busqueda_x_inmueble_mov` y `registro_x_inmueble_mov` si crecen mucho

### Seguridad

1. **Password**: Usar bcrypt o argon2 para `password_hash`
2. **Sesiones**: Implementar tabla de sesiones o usar JWT
3. **Permisos**: Validar `perfil_id` en cada operación
4. **Auditoría**: Todos los `created_at` y `updated_at` para trazabilidad

---

## 🔄 Próximos Pasos

1. **Crear script de migración** para PostgreSQL
2. **Implementar API REST** que consuma estas tablas
3. **Sincronizar con archivos JSON** actuales durante transición
4. **Implementar caché** (Redis) para búsquedas frecuentes
5. **Agregar full-text search** en `propiedades.descripcion`

---

**Fecha de creación**: 2025-01-14  
**Versión**: 1.0  
**Autor**: Sistema Inmobiliario
