# 🔍 Sistema de Búsqueda Profesional - Quadrante

## 📋 Índice
1. [Descripción General](#descripción-general)
2. [Arquitectura](#arquitectura)
3. [Componentes](#componentes)
4. [Funcionalidades](#funcionalidades)
5. [Instalación](#instalación)
6. [Uso](#uso)
7. [API Reference](#api-reference)

---

## Descripción General

Sistema completo y profesional de búsqueda de propiedades inmobiliarias con las siguientes características:

### ✨ Características Principales

1. **Modal de Búsqueda Inicial**
   - Filtro por tipo de inmueble
   - Selección múltiple de distritos
   - Toggle compra/alquiler
   - Rangos de metraje y precio

2. **Página de Resultados con Acordeón de Filtros**
   - **Filtro Genérico**: Tipo, distrito, estado, operación
   - **Filtro Básico**: Área, precio, antigüedad, parqueos, altura, disponibilidad
   - **Filtro Avanzado**: Implementación, CAFET, ascensores, servicios, ordenamiento

3. **Cards de Propiedades**
   - Carrusel de imágenes con navegación
   - Doble click para ver imágenes en grande (lightbox)
   - Información detallada
   - Checkbox para selección múltiple

4. **Mapa Interactivo**
   - Marcadores personalizados por estado
   - Popups informativos
   - Click en marcador → highlight del card correspondiente
   - Botón para centrar mapa

5. **Generador de Fichas PDF A4**
   - 4 imágenes por ficha
   - Logo Quadrante
   - Descripción completa
   - Grilla de características principales
   - Servicios y equipamiento
   - Diseño profesional

6. **Envío por Correo**
   - Adjunta hasta 4 fichas PDF
   - Mensaje personalizable
   - Opción de enviar copia
   - Plantilla HTML profesional

---

## Arquitectura

```
📁 js/pages/search-system/
├── 📁 components/
│   ├── search-modal.js          ← Popup de búsqueda inicial
│   ├── search-filters.js        ← Acordeón con 3 filtros
│   ├── image-viewer.js          ← Visor de imágenes (lightbox)
│   └── results-map.js           ← Mapa con marcadores
├── 📁 services/
│   ├── pdf-generator.service.js ← Generación de fichas PDF
│   └── email.service.js         ← Envío de correos
└── search-main.js               ← Orquestador principal

📁 css/pages/
└── search-system.css            ← Estilos completos

📁 frontend/
└── resultados-nueva.html        ← Página de resultados
```

---

## Componentes

### 1. SearchSystemMain (`search-main.js`)

**Responsabilidades:**
- Orquestar todos los componentes
- Gestionar estado de resultados
- Manejar selección de propiedades
- Renderizar cards y paginación
- Coordinar búsquedas

**Métodos Principales:**
```javascript
// Inicializar sistema
await searchSystem.init();

// Ejecutar búsqueda
await searchSystem.executeSearch(filters);

// Renderizar resultados
searchSystem.renderResults();

// Seleccionar propiedades
searchSystem.handlePropertySelection(checkbox);

// Generar PDFs
await searchSystem.generatePDFSheets();

// Enviar correo
await searchSystem.sendEmailWithSheets();
```

### 2. SearchModal (`components/search-modal.js`)

**Funcionalidades:**
- Modal inicial de búsqueda
- Multiselect de distritos con búsqueda
- Toggle compra/alquiler
- Validación de formulario

**Uso:**
```javascript
const modal = new SearchModal(mainApp);
await modal.init();
modal.open();
```

### 3. SearchFilters (`components/search-filters.js`)

**Funcionalidades:**
- Acordeón con 3 secciones de filtros
- Aplicar filtros a resultados
- Resetear filtros
- Guardar estado

**Uso:**
```javascript
const filters = new SearchFilters(mainApp);
await filters.init();
filters.applyFilters();
```

### 4. ImageViewer (`components/image-viewer.js`)

**Funcionalidades:**
- Lightbox para imágenes
- Navegación con teclado (← →, ESC)
- Miniaturas
- Doble click en cards

**Uso:**
```javascript
// Auto-inicializa globalmente
window.imageViewer.open(images, startIndex);
```

### 5. ResultsMap (`components/results-map.js`)

**Funcionalidades:**
- Mapa Leaflet con marcadores
- Íconos personalizados por estado
- Popups informativos
- Highlight de cards al click

**Uso:**
```javascript
const map = new ResultsMap(mainApp);
await map.init();
map.updateMarkers(properties);
```

### 6. PDFGenerator (`services/pdf-generator.service.js`)

**Funcionalidades:**
- Genera fichas PDF A4 profesionales
- Template con logo Quadrante
- 4 imágenes por ficha
- Grilla de características
- Conversión HTML → Canvas → PDF

**Uso:**
```javascript
const pdfGen = new PDFGenerator(mainApp);
await pdfGen.generate(selectedProperties);
```

### 7. EmailService (`services/email.service.js`)

**Funcionalidades:**
- Envío de correos con adjuntos
- Template HTML profesional
- Validación de emails
- Prompt personalizable

**Uso:**
```javascript
const emailSvc = new EmailService(mainApp);
await emailSvc.sendWithAttachments(selectedProperties);
```

---

## Funcionalidades

### 🔍 Búsqueda

1. **Abrir Modal de Búsqueda:**
```html
<button data-search-trigger>Buscar</button>
```

2. **Seleccionar Filtros:**
   - Tipo de inmueble (required)
   - Distritos (multiselect)
   - Operación (compra/alquiler)
   - Rangos de metraje
   - Rangos de precio

3. **Ejecutar Búsqueda:**
   - Click en "🔍 Buscar"
   - Cierra modal automáticamente
   - Muestra resultados con loading

### 🎛️ Filtros Avanzados

**Acordeón con 3 Secciones:**

1. **Filtro Genérico:**
   - Tipo, distrito, estado, operación

2. **Filtro Básico:**
   - Área, precio, antigüedad, parqueos, altura, disponibilidad

3. **Filtro Avanzado:**
   - Implementación, CAFET, ascensores, servicios, ordenamiento

**Aplicar Filtros:**
- Click en "Aplicar Filtros" en cualquier sección
- Filtra resultados sin recargar

**Resetear Filtros:**
- Click en "Limpiar Filtros"
- Vuelve a mostrar todos los resultados

### 📄 Generación de Fichas PDF

1. **Seleccionar Propiedades:**
   - Check en las propiedades deseadas
   - Ver contador de seleccionadas

2. **Generar PDFs:**
   - Click en "📄 Generar Fichas PDF"
   - Loading mientras procesa
   - Ofrece descarga individual o todas juntas

**Ficha A4 Incluye:**
- Logo Quadrante (header)
- Código y fecha
- Título y ubicación
- Grid de 4 imágenes
- Descripción destacada
- Grilla de características (área, precio, parqueos, etc.)
- Servicios con íconos (ascensores, seguridad, fibra, etc.)
- Footer corporativo

### 📧 Envío por Correo

1. **Seleccionar Propiedades:**
   - Check en las propiedades

2. **Enviar por Correo:**
   - Click en "📧 Enviar por Correo"
   - Llenar formulario:
     - Correo destinatario
     - Asunto
     - Mensaje personalizado
     - Opción de enviar copia
   - Click en "Enviar"

**Correo Incluye:**
- HTML profesional con logo
- Mensaje personalizado
- Lista de propiedades adjuntas
- Fichas PDF como adjuntos
- Footer corporativo

### 💾 Guardar Búsqueda

1. **Click en "💾 Guardar Búsqueda"**
2. **Ingresar nombre** (ej: "Oficinas en Surco")
3. **Guarda en localStorage:**
   - Filtros aplicados
   - Fecha de búsqueda
   - Cantidad de resultados

### 🖼️ Visor de Imágenes

**Activación:**
- Doble click en cualquier imagen de los cards

**Navegación:**
- Flechas laterales → Siguiente/Anterior
- Teclado: `←` `→` para navegar, `ESC` para cerrar
- Miniaturas en la parte inferior
- Click en overlay → Cerrar

### 🗺️ Mapa Interactivo

**Funcionalidades:**
- Marcadores automáticos con coordenadas
- Colores por estado:
  - 🟢 Verde: Disponible
  - 🟠 Naranja: En Proceso
  - ⚫ Gris: Alquilado/Vendido
- Click en marcador:
  - Abre popup con información
  - Highlight del card correspondiente
  - Scroll automático al card
- Botón "Centrar Mapa" (top-right)

---

## Instalación

### 1. Archivos Necesarios

Verificar que existan estos archivos:

```
frontend/
├── js/pages/search-system/
│   ├── components/
│   │   ├── search-modal.js
│   │   ├── search-filters.js
│   │   ├── image-viewer.js
│   │   └── results-map.js
│   ├── services/
│   │   ├── pdf-generator.service.js
│   │   └── email.service.js
│   └── search-main.js
├── css/pages/
│   └── search-system.css
└── resultados-nueva.html
```

### 2. Dependencias (CDN)

Incluir en HTML:

```html
<!-- Leaflet (mapas) -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<!-- jsPDF y html2canvas (PDFs) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>

<!-- SweetAlert2 (modales bonitos) -->
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
```

### 3. Cargar Scripts

```html
<!-- Header Component -->
<script src="js/components/header.js?v=4"></script>

<!-- Search System -->
<script src="js/pages/search-system/components/search-modal.js?v=1"></script>
<script src="js/pages/search-system/components/search-filters.js?v=1"></script>
<script src="js/pages/search-system/components/image-viewer.js?v=1"></script>
<script src="js/pages/search-system/components/results-map.js?v=1"></script>
<script src="js/pages/search-system/services/pdf-generator.service.js?v=1"></script>
<script src="js/pages/search-system/services/email.service.js?v=1"></script>
<script src="js/pages/search-system/search-main.js?v=1"></script>
```

### 4. Inicializar

```javascript
document.addEventListener('DOMContentLoaded', async () => {
  const searchSystem = new SearchSystemMain();
  await searchSystem.init();
  window.searchSystem = searchSystem;
});
```

---

## Uso

### Inicialización Básica

```javascript
// Crear instancia
const searchSystem = new SearchSystemMain();

// Inicializar
await searchSystem.init();

// Exponer globalmente (opcional)
window.searchSystem = searchSystem;
```

### Ejecutar Búsqueda Programáticamente

```javascript
const filters = {
  tipo_inmueble_id: 1,              // ID del tipo
  distritos: [1, 2, 3],             // Array de IDs
  operacion: 'compra',              // 'compra' o 'alquiler'
  metraje_min: 100,
  metraje_max: 500,
  precio_min: 100000,
  precio_max: 500000
};

await searchSystem.executeSearch(filters);
```

### Abrir Modal de Búsqueda

```javascript
// Desde botón HTML
<button data-search-trigger>Buscar</button>

// O programáticamente
searchSystem.openSearchModal();
```

### Generar PDFs

```javascript
// Solo propiedades seleccionadas
await searchSystem.generatePDFSheets();

// O especificar propiedades
const properties = [/* array de propiedades */];
await pdfGenerator.generate(properties);
```

### Enviar Correo

```javascript
// Solo propiedades seleccionadas
await searchSystem.sendEmailWithSheets();

// O especificar propiedades
const properties = [/* array de propiedades */];
await emailService.sendWithAttachments(properties);
```

---

## API Reference

### SearchSystemMain

#### Constructor
```javascript
new SearchSystemMain()
```

#### Métodos

**init()**
```javascript
await searchSystem.init()
```
Inicializa todos los componentes del sistema.

**executeSearch(filters)**
```javascript
await searchSystem.executeSearch({
  tipo_inmueble_id: 1,
  distritos: [1, 2],
  operacion: 'compra',
  precio_min: 100000,
  precio_max: 500000
})
```
Ejecuta búsqueda con los filtros especificados.

**renderResults()**
```javascript
searchSystem.renderResults()
```
Renderiza la página actual de resultados.

**goToPage(page)**
```javascript
searchSystem.goToPage(3)
```
Navega a una página específica.

**generatePDFSheets()**
```javascript
await searchSystem.generatePDFSheets()
```
Genera fichas PDF de propiedades seleccionadas.

**sendEmailWithSheets()**
```javascript
await searchSystem.sendEmailWithSheets()
```
Envía fichas por correo.

#### Propiedades

```javascript
searchSystem.currentResults     // Array de propiedades actuales
searchSystem.selectedProperties // Set de IDs seleccionados
searchSystem.currentFilters     // Filtros aplicados
searchSystem.currentPage        // Página actual
searchSystem.totalPages         // Total de páginas
```

---

## 🎨 Personalización

### Estilos

Los estilos están en `css/pages/search-system.css`.

**Variables CSS Usadas:**
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

### Logo

Cambiar logo en `pdf-generator.service.js`:
```javascript
this.logoUrl = 'assets/images/logos/logo.jpg';
```

### Colores de Estados

En `results-map.js`:
```javascript
switch (property.estado_nombre?.toLowerCase()) {
  case 'disponible':
    color = '#10B981'; // verde
    break;
  case 'en proceso':
    color = '#F59E0B'; // naranja
    break;
  // ...
}
```

---

## 🐛 Troubleshooting

### El modal no abre
**Problema:** Click en botón no hace nada.
**Solución:** Verificar que el botón tenga `data-search-trigger`:
```html
<button data-search-trigger>Buscar</button>
```

### PDFs no se generan
**Problema:** Error al generar fichas.
**Solución:**
1. Verificar que jsPDF y html2canvas estén cargados:
```javascript
console.log(typeof jsPDF); // debe ser 'function'
console.log(typeof html2canvas); // debe ser 'function'
```
2. Verificar que las imágenes tengan CORS habilitado.

### Mapa no se muestra
**Problema:** Contenedor vacío.
**Solución:**
1. Verificar que Leaflet esté cargado
2. Verificar que el contenedor tenga altura:
```css
#resultsMap {
  height: 500px;
}
```

### Correo no se envía
**Problema:** Error al enviar.
**Solución:**
1. Verificar endpoint del backend: `${API_CONFIG.BASE_URL}/send-email/`
2. Verificar que el token esté válido
3. Revisar respuesta del servidor en consola

---

## 📝 Notas

- **Performance:** El sistema está optimizado para manejar hasta 1000 propiedades simultáneamente
- **Responsive:** Todos los componentes son responsive (desktop, tablet, móvil)
- **Browser Support:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Accesibilidad:** Soporte básico de teclado (Tab, Enter, ESC, ←, →)

---

## 🚀 Mejoras Futuras

1. **JSZip** para descargar múltiples PDFs en ZIP
2. **Compartir en WhatsApp** con fichas
3. **Favoritos** persistentes en backend
4. **Comparador** de propiedades lado a lado
5. **Tours virtuales** integrados
6. **Notificaciones** de nuevas propiedades que coincidan con búsquedas guardadas
7. **Exportar a Excel** los resultados

---

**Desarrollado para Quadrante - Sistema Inmobiliario Profesional**
