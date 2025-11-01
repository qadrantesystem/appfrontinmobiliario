# 🔍 Tab de Búsquedas - Sistema Completo

## ✅ Implementación Completada

El sistema de búsquedas ha sido completamente integrado como un **TAB del dashboard** (no como página separada).

---

## 📁 Archivos Creados/Modificados

### Nuevos Archivos:

1. **`js/pages/dashboard/tabs/busquedas/busquedas.js`** (1,100+ líneas)
   - Clase `BusquedasTab` con toda la lógica del tab
   - Modal de búsqueda con SweetAlert2
   - Generación de PDFs profesionales
   - Compartir por correo y WhatsApp
   - Gestión de favoritos
   - Paginación y carrusel
   - Integración con mapa Leaflet

2. **`css/pages/dashboard-busquedas.css`** (500+ líneas)
   - Estilos completos para el tab
   - Responsive design (desktop, tablet, móvil)
   - Cards de propiedades
   - Carrusel de imágenes
   - Paginación
   - Dropdown de compartir
   - Estados de loading/empty

### Archivos Modificados:

3. **`dashboard.html`**
   - Agregado CSS: `dashboard-busquedas.css` (línea 23)
   - Agregado script: `busquedas.js` (línea 202)

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ Modal de Búsqueda Inicial

**Trigger:** Botón "🔍 Nueva Búsqueda"

**Filtros incluidos:**
- ✅ Tipo de Inmueble (select simple - **REQUERIDO**)
- ✅ Distrito (select simple)
- ✅ Operación (radio: Compra / Alquiler)
- ✅ Metraje (rango: min-max en m²)
- ✅ Precio (rango: min-max, cambia label según operación)

**Tecnología:** SweetAlert2 (no requiere componente separado)

### 2️⃣ Resultados con Cards de Propiedades

**Características de cada card:**
- ✅ Checkbox para selección
- ✅ Código de propiedad
- ✅ **Botón de favoritos** (integrado con `window.favoritesHandler`)
- ✅ **Carrusel de imágenes** con navegación (← →)
- ✅ **Doble click en imagen** → Abre visor grande (si existe `window.imageViewer`)
- ✅ Info: título, descripción, distrito, área, precio, estado

### 3️⃣ Mapa Interactivo

**Características:**
- ✅ Leaflet map (sticky column)
- ✅ Marcadores automáticos por coordenadas
- ✅ Popups con info de propiedad
- ✅ Auto-ajuste de zoom/bounds

### 4️⃣ Botones de Acción

#### 💾 Guardar Búsqueda
- Prompt para nombre
- Guarda criterios de búsqueda
- API: `POST /busquedas/`
- Body:
  ```json
  {
    "nombre": "Oficinas en Surco",
    "filtros": { tipo_inmueble_id: 1, ... },
    "cantidad_resultados": 25
  }
  ```

#### 📤 Compartir (Dropdown)

**Opción 1: 📧 Por Correo**
- Formulario con:
  - Correo destinatario (validado)
  - Asunto
  - Mensaje personalizado
  - Checkbox "Enviarme copia"
- **Genera PDFs A4 profesionales** de propiedades seleccionadas
- API: `POST /send-email/`
- Body:
  ```json
  {
    "to": "cliente@email.com",
    "subject": "Propiedades Quadrante",
    "message": "Mensaje personalizado",
    "attachments": [
      {
        "filename": "Propiedad_Q001.pdf",
        "content": "base64...",
        "encoding": "base64"
      }
    ],
    "sendCopy": true
  }
  ```

**Opción 2: 💬 WhatsApp**
- Construye mensaje con propiedades seleccionadas
- Abre WhatsApp Web: `https://wa.me/?text=...`
- No requiere backend

### 5️⃣ Fichas PDF Profesionales (A4)

**Contenido de cada ficha:**
- ✅ Logo Quadrante (header)
- ✅ Código y fecha
- ✅ Título y ubicación
- ✅ **Grid de 4 imágenes** (2x2)
- ✅ Descripción destacada
- ✅ **Grilla de características**:
  - Área, Precio, Dormitorios, Baños
  - Parqueos, Estado, Antigüedad, Altura
- ✅ Servicios y equipamiento (si existen)
- ✅ Footer corporativo

**Tecnología:**
- jsPDF (convertir a PDF)
- html2canvas (renderizar HTML → imagen)
- Conversión a Base64 para adjuntar en email

### 6️⃣ Paginación

- ✅ Botones Anterior/Siguiente
- ✅ Números de página
- ✅ Ellipsis (...) para muchas páginas
- ✅ Scroll suave al cambiar página
- ✅ 10 items por página (configurable)

### 7️⃣ Integración con Favoritos

- ✅ Usa `window.favoritesHandler` existente
- ✅ Botón de corazón en cada card
- ✅ Atributo `data-favorite-property="${prop.id}"`
- ✅ Auto-refresh de estado al renderizar

---

## 🔌 APIs Necesarias (VALIDAR EN BACKEND)

### ⚠️ CRÍTICO: Verificar que existan estos endpoints

#### 1. Buscar Propiedades
```
POST /propiedades/buscar/
```
**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "tipo_inmueble_id": 1,
  "distrito_id": 5,
  "operacion": "compra",
  "metraje_min": 100,
  "metraje_max": 500,
  "precio_min": 100000,
  "precio_max": 500000
}
```

**Response esperada:**
```json
[
  {
    "id": 1,
    "codigo": "Q001",
    "titulo": "Oficina en Surco",
    "descripcion": "...",
    "distrito": "Surco",
    "direccion": "Av. Primavera 123",
    "area": 150,
    "precio": 250000,
    "estado_nombre": "Disponible",
    "latitud": -12.123456,
    "longitud": -77.123456,
    "dormitorios": 2,
    "banos": 2,
    "parqueos": 1,
    "antiguedad": 5,
    "altura": 3,
    "imagenes": [
      { "url": "https://...", "descripcion": "..." }
    ],
    "servicios": ["Ascensor", "Seguridad 24/7"]
  }
]
```

#### 2. Guardar Búsqueda
```
POST /busquedas/
```
**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "nombre": "Oficinas en Surco",
  "filtros": {
    "tipo_inmueble_id": 1,
    "distrito_id": 5,
    "operacion": "compra"
  },
  "cantidad_resultados": 15
}
```

**Response esperada:**
```json
{
  "id": 123,
  "nombre": "Oficinas en Surco",
  "filtros": { ... },
  "fecha_creacion": "2025-01-23T10:00:00Z"
}
```

#### 3. Enviar Correo con Adjuntos
```
POST /send-email/
```
**Headers:**
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

**Body:**
```json
{
  "to": "cliente@email.com",
  "subject": "Propiedades Quadrante",
  "message": "Mensaje personalizado",
  "attachments": [
    {
      "filename": "Propiedad_Q001.pdf",
      "content": "JVBERi0xLjQKJeLjz9MK...",
      "encoding": "base64"
    }
  ],
  "sendCopy": false
}
```

**Response esperada:**
```json
{
  "success": true,
  "message": "Correo enviado exitosamente"
}
```

#### 4. Obtener Tipos de Propiedad
```
GET /tipos-propiedad/
```
**Response esperada:**
```json
[
  { "tipo_id": 1, "nombre": "Oficina" },
  { "tipo_id": 2, "nombre": "Casa" },
  { "tipo_id": 3, "nombre": "Departamento" }
]
```

#### 5. Obtener Distritos
```
GET /distritos/
```
**Response esperada:**
```json
[
  { "distrito_id": 1, "nombre": "Miraflores" },
  { "distrito_id": 2, "nombre": "San Isidro" },
  { "distrito_id": 3, "nombre": "Surco" }
]
```

---

## 🎨 Variables CSS Usadas

El tab utiliza las variables CSS globales definidas en `css/variables.css`:

```css
--azul-corporativo: #2C5282
--gris-oscuro: #1F2937
--gris-medio: #6B7280
--gris-claro: #F3F4F6
--borde: #E5E7EB
--radius-md: 8px
--radius-lg: 12px
--transition-fast: 0.2s
--transition-normal: 0.3s
```

---

## 📱 Responsive Design

El tab es completamente responsive:

- **Desktop (>1024px):** Grid 2 columnas (resultados + mapa)
- **Tablet (768px-1024px):** Columnas apiladas
- **Móvil (<768px):** Columnas apiladas + botones full-width
- **Móvil pequeño (<480px):** Ajustes de tamaño de fuente y espaciado

---

## 🔗 Dependencias Externas (Ya incluidas en dashboard.html)

✅ Leaflet (mapas)
✅ jsPDF (generación de PDFs)
✅ html2canvas (renderizado HTML → canvas)
✅ SweetAlert2 (modales)
✅ Font Awesome (iconos)

---

## 🚀 Cómo Usar

### Para el Usuario Final:

1. **Iniciar Búsqueda:**
   - Click en "🔍 Nueva Búsqueda"
   - Llenar filtros (tipo de inmueble es obligatorio)
   - Click en "Buscar"

2. **Ver Resultados:**
   - Cards con carrusel de imágenes
   - Doble click en imagen para ver grande
   - Checkbox para seleccionar propiedades
   - Click en corazón para agregar a favoritos

3. **Guardar Búsqueda:**
   - Seleccionar propiedades
   - Click en "💾 Guardar"
   - Ingresar nombre descriptivo

4. **Compartir Propiedades:**
   - Seleccionar propiedades (checkbox)
   - Click en "📤 Compartir"
   - Elegir: Por Correo o WhatsApp

### Para Desarrolladores:

**Acceso al tab:**
```javascript
window.BusquedasTab // Clase disponible globalmente
```

**Instancia del tab:**
```javascript
// El router de dashboard instancia automáticamente
// cuando el usuario click en el tab "Búsquedas"
```

**Ejecutar búsqueda programáticamente:**
```javascript
const busquedasTab = new BusquedasTab(dashboardApp);
await busquedasTab.executeSearch({
  tipo_inmueble_id: 1,
  distrito_id: 5,
  operacion: 'compra'
});
```

---

## ⚠️ Notas Importantes

### Favoritos
El tab integra con el handler existente:
```javascript
window.favoritesHandler.refreshAllButtons();
```
**Requiere:** Que `favoritesHandler` esté disponible globalmente.

### Visor de Imágenes
El doble click en imágenes usa:
```javascript
window.imageViewer.open(images, startIndex);
```
**Opcional:** Si no existe, el doble click simplemente no hace nada.

### Coordenadas del Mapa
Las propiedades DEBEN tener:
```json
{
  "latitud": -12.123456,
  "longitud": -77.123456
}
```
Si no tienen coordenadas, no aparecerán en el mapa.

### Logo para PDFs
Por defecto usa:
```javascript
logoUrl = 'assets/images/logos/logo.jpg'
```
**Asegurar:** Que el archivo exista en esa ruta.

---

## 🐛 Troubleshooting

### El tab no aparece
**Problema:** No se ve el tab "Búsquedas"
**Solución:** Verificar en `js/pages/dashboard/config/tabs-config.js` que el tab esté configurado para el perfil del usuario.

### Modal de búsqueda no abre
**Problema:** Click en "Nueva Búsqueda" no hace nada
**Solución:**
1. Verificar que SweetAlert2 esté cargado: `console.log(Swal)`
2. Revisar consola por errores

### PDFs no se generan
**Problema:** Error al compartir por correo
**Solución:**
1. Verificar que jsPDF esté cargado: `console.log(window.jspdf)`
2. Verificar que html2canvas esté cargado: `console.log(html2canvas)`
3. Revisar CORS de las imágenes

### Mapa no se muestra
**Problema:** Contenedor del mapa vacío
**Solución:**
1. Verificar que Leaflet esté cargado: `console.log(L)`
2. Verificar que las propiedades tengan `latitud` y `longitud`

### Favoritos no funcionan
**Problema:** Click en corazón no hace nada
**Solución:**
1. Verificar que `window.favoritesHandler` exista
2. Revisar consola por errores del handler

---

## 📊 Estadísticas del Código

- **Líneas de JavaScript:** ~1,100
- **Líneas de CSS:** ~500
- **Componentes:** 1 clase principal (`BusquedasTab`)
- **Métodos principales:** 25+
- **APIs integradas:** 5

---

## ✅ Checklist de Validación

Antes de probar en producción:

- [ ] Verificar API `POST /propiedades/buscar/`
- [ ] Verificar API `POST /busquedas/`
- [ ] Verificar API `POST /send-email/`
- [ ] Verificar API `GET /tipos-propiedad/`
- [ ] Verificar API `GET /distritos/`
- [ ] Validar que propiedades tengan coordenadas
- [ ] Validar que logo exista en `assets/images/logos/logo.jpg`
- [ ] Probar generación de PDFs con imágenes reales
- [ ] Probar envío de correo con adjuntos
- [ ] Verificar que `window.favoritesHandler` esté disponible
- [ ] Probar en móvil (responsive)

---

**Desarrollado para Quadrante - Sistema Inmobiliario Profesional**

Fecha de implementación: Enero 2025
