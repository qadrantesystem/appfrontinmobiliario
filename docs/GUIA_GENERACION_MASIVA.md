# 🏢 Guía de Generación Masiva de Oficinas

## 📋 Descripción

Sistema modular para generación masiva de oficinas con **separación de responsabilidades** y **componentes reutilizables**.

---

## 🗂️ Arquitectura de Archivos

```
frontend/js/
├── services/                           # 🔧 Servicios (API calls)
│   ├── propietario.service.js          # GET /propietarios/{dni}
│   ├── edificio.service.js             # GET /edificios-disponibles
│   └── oficina.service.js              # POST /generar-oficinas-masivo
│
├── components/                         # 🧩 Componentes UI
│   ├── propietario/
│   │   └── auto-fill-dni.js            # Auto-completar por DNI
│   └── edificio/
│       ├── selector-edificio.js        # Selector edificio padre
│       └── modal-masivo.js             # Modal generación masiva
│
└── pages/dashboard/
    └── property-form.js                # Integración principal
```

---

## 📦 Instalación

### 1. Cargar Scripts en HTML

Agregar al final de `dashboard.html` o tu página principal:

```html
<!-- =============================================
     🔧 SERVICIOS (API Layer)
     ============================================= -->
<script src="/js/services/propietario.service.js"></script>
<script src="/js/services/edificio.service.js"></script>
<script src="/js/services/oficina.service.js"></script>

<!-- =============================================
     🧩 COMPONENTES (UI Layer)
     ============================================= -->
<script src="/js/components/propietario/auto-fill-dni.js"></script>
<script src="/js/components/edificio/selector-edificio.js"></script>
<script src="/js/components/edificio/modal-masivo.js"></script>

<!-- =============================================
     📄 PÁGINAS (Application Layer)
     ============================================= -->
<script src="/js/pages/dashboard/property-form.js"></script>
```

---

## 🚀 Uso de Componentes

### 1️⃣ Auto-Fill DNI Propietario

**HTML Requerido:**
```html
<div class="row">
  <div class="col-md-3">
    <label>DNI</label>
    <input type="text" id="input-dni" class="form-control" maxlength="8">
  </div>
  <div class="col-md-3">
    <label>Nombre</label>
    <input type="text" id="input-nombre" class="form-control">
  </div>
  <div class="col-md-3">
    <label>Teléfono</label>
    <input type="text" id="input-telefono" class="form-control">
  </div>
  <div class="col-md-3">
    <label>Email</label>
    <input type="email" id="input-email" class="form-control">
  </div>
  <input type="hidden" id="propietario-id">
</div>
```

**JavaScript:**
```javascript
// Inicializar componente
const autoFillDNI = new AutoFillDNI(
  '#input-dni',
  '#input-nombre',
  '#input-telefono',
  '#input-email',
  '#propietario-id'
);
autoFillDNI.init();

// Obtener datos
const propietarioData = autoFillDNI.getFormData();
console.log(propietarioData);
// {
//   dni: "12345678",
//   nombre: "Juan Pérez",
//   telefono: "987654321",
//   email: "juan@example.com",
//   propietario_id: 5  // null si es nuevo
// }
```

**Comportamiento:**
- `onBlur` del input DNI → busca en API
- ✅ **Encontrado**: Auto-completa y deshabilita campos
- ❌ **No encontrado**: Habilita campos para crear nuevo
- ⚠️ **DNI inválido**: Muestra error y limpia campos

---

### 2️⃣ Selector Edificio Padre

**HTML Requerido:**
```html
<div class="row">
  <div class="col-md-6">
    <label>Edificio Padre</label>
    <select id="select-edificio" class="form-select">
      <option value="">Cargando...</option>
    </select>
  </div>
</div>

<div id="container-caracteristicas" class="mt-3">
  <!-- Características del edificio se muestran aquí -->
</div>
```

**JavaScript:**
```javascript
// Inicializar componente
const selectorEdificio = new SelectorEdificio(
  '#select-edificio',
  '#container-caracteristicas'
);
await selectorEdificio.init();

// Obtener edificio seleccionado
const edificioId = selectorEdificio.getEdificioId();
const edificio = selectorEdificio.getEdificioSeleccionado();
console.log(edificio);
// {
//   registro_cab_id: 123,
//   nombre_inmueble: "Torre Lima",
//   direccion: "Av. Principal 456",
//   cantidad_pisos: "18"
// }
```

**Comportamiento:**
- Carga edificios disponibles desde API
- `onChange` → carga características del edificio
- Muestra características agrupadas por categoría en accordion

---

### 3️⃣ Modal Generación Masiva

**HTML Requerido:**
```html
<!-- El modal se crea automáticamente en el DOM -->
```

**JavaScript:**
```javascript
// Crear modal con configuración
const modal = new ModalGeneracionMasiva(
  '#modal-generacion-masiva',
  edificioId,          // ID del edificio padre
  'Torre Lima',        // Nombre del edificio
  propietarioId,       // ID del propietario
  distritoId          // ID del distrito
);

// Mostrar modal
modal.show();
```

**Configuración del Modal:**
1. **Rango de Pisos**: Desde/Hasta (ej: 2-19)
2. **Precios Base**: Alquiler/Venta según transacción
3. **Plantilla de Oficinas**:
   - Sufijo (01, 02, 03, A, B, etc.)
   - Área en m²
   - Parqueos (opcional)
4. **Preview**: Total de oficinas a generar

**Ejemplo:**
- Pisos: 2 al 19 = **18 pisos**
- Oficinas por piso: **3** (01, 02, 03)
- **Total**: 18 × 3 = **54 oficinas**

**Flujo:**
1. Usuario configura parámetros
2. Click en "Generar Oficinas"
3. Validación de datos
4. Confirmación con SweetAlert2
5. POST a `/api/v1/propiedades/generar-oficinas-masivo`
6. Mensaje de éxito con total generado
7. Recarga lista de propiedades

---

## 🔗 Integración en PropertyForm

### Paso 1: Modificar HTML del Formulario

```html
<!-- PASO 1: Propietario con Auto-Fill -->
<div class="card mb-3">
  <div class="card-header">👤 Datos del Propietario</div>
  <div class="card-body">
    <div class="row">
      <div class="col-md-3">
        <label>DNI *</label>
        <input type="text" id="propietario-dni" class="form-control">
      </div>
      <div class="col-md-3">
        <label>Nombre *</label>
        <input type="text" id="propietario-nombre" class="form-control">
      </div>
      <div class="col-md-3">
        <label>Teléfono *</label>
        <input type="text" id="propietario-telefono" class="form-control">
      </div>
      <div class="col-md-3">
        <label>Email</label>
        <input type="email" id="propietario-email" class="form-control">
      </div>
      <input type="hidden" id="propietario-id">
    </div>
  </div>
</div>
```

### Paso 2: Inicializar Componentes en PropertyForm

```javascript
class PropertyForm {
  constructor() {
    // ... código existente ...

    // Componentes nuevos
    this.autoFillDNI = null;
    this.selectorEdificio = null;
  }

  async init() {
    // ... código existente ...

    // Inicializar auto-fill DNI
    this.autoFillDNI = new AutoFillDNI(
      '#propietario-dni',
      '#propietario-nombre',
      '#propietario-telefono',
      '#propietario-email',
      '#propietario-id'
    );
    this.autoFillDNI.init();

    // Inicializar selector edificio (solo si tipo = Oficina)
    if (this.esTipoOficina()) {
      this.selectorEdificio = new SelectorEdificio(
        '#edificio-padre-select',
        '#edificio-caracteristicas-container'
      );
      await this.selectorEdificio.init();
    }
  }

  async handleSubmit() {
    // ... código existente ...

    // Obtener datos del propietario
    const propietarioData = this.autoFillDNI.getFormData();

    // Si es nuevo propietario (propietario_id es null), crear primero
    let propietarioId = propietarioData.propietario_id;

    if (!propietarioId) {
      const nuevoPropietario = await propietarioService.crear({
        dni: propietarioData.dni,
        nombre: propietarioData.nombre,
        telefono: propietarioData.telefono,
        email: propietarioData.email
      });
      propietarioId = nuevoPropietario.propietario_id;
    }

    // Continuar con creación de propiedad...
  }

  async mostrarModalMasivo(edificioId, edificioNombre, propietarioId, distritoId) {
    const modal = new ModalGeneracionMasiva(
      '#modal-generacion-masiva',
      edificioId,
      edificioNombre,
      propietarioId,
      distritoId
    );
    modal.show();
  }
}
```

---

## 🎯 Tres Flujos de Registro

### Flow 1: Solo Edificio
```javascript
// Crear edificio normalmente
await fetch('/api/v1/propiedades', {
  method: 'POST',
  body: JSON.stringify({
    tipo_inmueble_id: 1, // Edificio
    padre_registro_cab_id: null, // Sin padre
    // ... otros campos ...
  })
});
```

### Flow 2: Edificio + Oficinas Masivo
```javascript
// 1. Crear edificio
const edificio = await crearEdificio();

// 2. Mostrar modal masivo
this.mostrarModalMasivo(
  edificio.registro_cab_id,
  edificio.nombre_inmueble,
  propietarioId,
  distritoId
);
```

### Flow 3: Oficina Independiente
```javascript
// 1. Seleccionar edificio padre con selector
const edificioId = selectorEdificio.getEdificioId();

// 2. Crear oficina individual
await fetch('/api/v1/propiedades', {
  method: 'POST',
  body: JSON.stringify({
    tipo_inmueble_id: 2, // Oficina
    padre_registro_cab_id: edificioId, // Con padre
    // ... otros campos ...
  })
});
```

---

## ✅ Validaciones

### AutoFillDNI
- ✅ DNI: 8 dígitos numéricos
- ✅ Nombre: mínimo 3 caracteres
- ✅ Teléfono: mínimo 9 caracteres
- ✅ Email: formato válido (opcional)

### ModalGeneracionMasiva
- ✅ Edificio padre existe
- ✅ Propietario existe
- ✅ Distrito válido
- ✅ Piso desde ≤ Piso hasta
- ✅ Piso entre 1-100
- ✅ Plantilla: al menos 1 oficina
- ✅ Sufijo: mínimo 2 caracteres
- ✅ Área: mayor a 0
- ✅ Precios según tipo transacción

---

## 🐛 Debugging

### Habilitar logs detallados:
```javascript
// En la consola del navegador
localStorage.setItem('DEBUG_GENERACION_MASIVA', 'true');
```

### Verificar servicios cargados:
```javascript
console.log('PropietarioService:', typeof propietarioService);
console.log('EdificioService:', typeof edificioService);
console.log('OficinaService:', typeof oficinaService);
```

### Probar componentes:
```javascript
// Test auto-fill
const autoFill = new AutoFillDNI('#dni', '#nombre', '#telefono', '#email');
autoFill.init();

// Test selector
const selector = new SelectorEdificio('#select', '#container');
await selector.init();
```

---

## 📚 API Endpoints Utilizados

| Endpoint | Método | Servicio | Descripción |
|----------|--------|----------|-------------|
| `/propietarios/{dni}` | GET | `propietarioService` | Buscar por DNI |
| `/propietarios` | POST | `propietarioService` | Crear nuevo |
| `/propiedades/edificios-disponibles` | GET | `edificioService` | Listar edificios |
| `/propiedades/{id}/caracteristicas` | GET | `edificioService` | Características |
| `/propiedades/generar-oficinas-masivo` | POST | `oficinaService` | Generar oficinas |

---

## 🎨 Estilos Recomendados

```css
/* Loading state para input DNI */
.loading {
  background: url('loading-spinner.gif') no-repeat right center;
  background-size: 20px;
  padding-right: 30px;
}

/* Campos deshabilitados (auto-fill) */
.bg-light {
  background-color: #f8f9fa !important;
}
```

---

## 🚨 Manejo de Errores

Todos los componentes usan SweetAlert2 para notificaciones:

- ✅ **Success**: Toast verde (top-right, 3s)
- ℹ️ **Info**: Toast azul (top-right, 3s)
- ❌ **Error**: Modal rojo (center)

---

## 📝 Notas Importantes

1. **Singleton Services**: Todos los servicios son singleton (`propietarioService`, `edificioService`, `oficinaService`)
2. **Estado Borrador**: Las oficinas generadas siempre se crean en estado `borrador`
3. **Token Requerido**: Todos los endpoints requieren `Authorization: Bearer {token}`
4. **Bootstrap 5**: Los componentes usan Bootstrap 5 para modals y accordions
5. **SweetAlert2**: Requerido para notificaciones y confirmaciones

---

## 🔧 Mantenimiento

### Agregar nueva característica a plantilla:
```javascript
// En modal-masivo.js, método agregarPlantilla()
// Agregar input:
<input type="text" class="plantilla-nueva-caract" data-index="${index}">

// Agregar al array caracteristicas:
container.querySelector(`.plantilla-nueva-caract[data-index="${index}"]`)
  ?.addEventListener('input', (e) => {
    this.plantillaOficinas[index].caracteristicas.push({
      caracteristica_id: CARACTERISTICA_ID,
      valor: e.target.value
    });
  });
```

---

## ✅ Checklist de Integración

- [ ] Scripts cargados en HTML
- [ ] API_CONFIG.BASE_URL configurado
- [ ] Token de autenticación en localStorage
- [ ] Inputs con IDs correctos en formulario
- [ ] Componentes inicializados en PropertyForm
- [ ] Tipos de inmueble configurados en BD
- [ ] Características creadas en BD
- [ ] SweetAlert2 incluido en proyecto
- [ ] Bootstrap 5 incluido en proyecto
- [ ] Probado en diferentes navegadores

---

**¿Necesitas ayuda?** Revisa los logs en consola o contacta al equipo de desarrollo.
