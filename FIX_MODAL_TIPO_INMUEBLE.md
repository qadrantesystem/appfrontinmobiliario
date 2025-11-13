# 🔧 FIX - MODAL NO TRASLADA TIPO DE INMUEBLE

**Problema:** El modal de búsqueda en `index.html` no está trasladando correctamente el `tipo_inmueble_id` a `resultados.html`.

---

## ✅ DIAGNÓSTICO

### **1. Modal SÍ guarda el tipo_inmueble_id**

**Archivo:** `home.js` (líneas 376-389)

```javascript
const filtros = {
  pais: 'PERU',
  departamento: 'LIMA',
  provincia: 'LIMA',
  distritos_ids: distritosSeleccionados,
  tipo_inmueble_id: parseInt(tipo),  // ✅ SÍ se guarda
  transaccion: transaccion,
  area: metraje ? parseInt(metraje) : null,
  presupuesto_compra: transaccion === 'compra' && presupuesto ? parseInt(presupuesto) : null,
  presupuesto_alquiler: transaccion === 'alquiler' && presupuesto ? parseInt(presupuesto) : null
};

localStorage.setItem('filtros_simplificados', JSON.stringify(filtros));  // ✅ SÍ se guarda
window.location.href = 'resultados.html';
```

### **2. resultados.js SÍ lee el localStorage**

**Archivo:** `resultados.js` (líneas 599-606)

```javascript
cargarFiltrosSimplificados() {
  const filtrosStr = localStorage.getItem('filtros_simplificados');
  if (filtrosStr) {
    this.filtrosSimplificados = JSON.parse(filtrosStr);  // ✅ SÍ se carga
    console.log('✅ Filtros cargados desde localStorage:', this.filtrosSimplificados);
  }
}
```

---

## 🐛 PROBLEMA REAL

El problema NO es que no se guarde o no se cargue. El problema es que:

1. ❌ **El endpoint `/propiedades` NO filtra por tipo_inmueble_id**
2. ❌ **Los filtros se cargan PERO no se aplican al API**

---

## 🔧 SOLUCIÓN

### **Opción 1: Filtrar en Frontend (Actual)**

El código actual carga TODAS las propiedades y luego filtra en frontend:

```javascript
// resultados.js línea 484
fetch(`${API_BASE}/propiedades?limit=100`)  // ← Trae TODAS

// Luego filtra en frontend
aplicarFiltrosIniciales() {
  if (!this.filtrosSimplificados) return;
  
  // Filtrar por tipo_inmueble_id
  if (this.filtrosSimplificados.tipo_inmueble_id) {
    this.propiedadesFiltradas = this.propiedades.filter(p => 
      p.tipo_inmueble_id === this.filtrosSimplificados.tipo_inmueble_id
    );
  }
}
```

**Ventaja:** Funciona sin cambios en backend  
**Desventaja:** Carga todas las propiedades (lento si hay muchas)

---

### **Opción 2: Filtrar en Backend (Recomendado)**

Pasar los filtros al endpoint del API:

```javascript
// resultados.js línea 484
const params = new URLSearchParams();
params.append('limit', '100');

if (this.filtrosSimplificados?.tipo_inmueble_id) {
  params.append('tipo_inmueble_id', this.filtrosSimplificados.tipo_inmueble_id);
}
if (this.filtrosSimplificados?.distrito_id) {
  params.append('distrito_id', this.filtrosSimplificados.distrito_id);
}
if (this.filtrosSimplificados?.transaccion) {
  params.append('transaccion', this.filtrosSimplificados.transaccion);
}

fetch(`${API_BASE}/propiedades?${params.toString()}`)
```

**Ventaja:** Más rápido, solo trae lo necesario  
**Desventaja:** Requiere que el backend soporte estos parámetros

---

## 📊 VERIFICACIÓN DEL BACKEND

Según el Swagger, el endpoint `/propiedades` **SÍ soporta filtros**:

```
GET /api/v1/propiedades
Parameters:
- page (integer)
- limit (integer)
- tipo_inmueble_id (integer) ✅
- distrito_id (string) ✅
- transaccion (string) ✅
- precio_min (number)
- precio_max (number)
- area_min (number)
- area_max (number)
```

**¡El backend SÍ soporta filtros!** 🎉

---

## ✅ IMPLEMENTACIÓN RECOMENDADA

Modificar `resultados.js` para enviar filtros al API:

```javascript
async cargarDatos() {
  try {
    const API_BASE = 'https://appbackimmobiliaria-production.up.railway.app/api/v1';
    
    // ✅ Construir query params con filtros
    const params = new URLSearchParams();
    params.append('limit', '100');
    
    if (this.filtrosSimplificados?.tipo_inmueble_id) {
      params.append('tipo_inmueble_id', this.filtrosSimplificados.tipo_inmueble_id);
      console.log('🔍 Filtrando por tipo_inmueble_id:', this.filtrosSimplificados.tipo_inmueble_id);
    }
    
    if (this.filtrosSimplificados?.distritos_ids?.length > 0) {
      // Backend espera distrito_id (singular), enviar el primero
      params.append('distrito_id', this.filtrosSimplificados.distritos_ids[0]);
      console.log('🔍 Filtrando por distrito_id:', this.filtrosSimplificados.distritos_ids[0]);
    }
    
    if (this.filtrosSimplificados?.transaccion) {
      params.append('transaccion', this.filtrosSimplificados.transaccion);
      console.log('🔍 Filtrando por transacción:', this.filtrosSimplificados.transaccion);
    }
    
    if (this.filtrosSimplificados?.area) {
      const area = parseInt(this.filtrosSimplificados.area);
      const tolerancia = area * 0.15; // ±15%
      params.append('area_min', Math.floor(area - tolerancia));
      params.append('area_max', Math.ceil(area + tolerancia));
      console.log('🔍 Filtrando por área:', area, '±15%');
    }
    
    if (this.filtrosSimplificados?.presupuesto_compra) {
      const presupuesto = parseInt(this.filtrosSimplificados.presupuesto_compra);
      const tolerancia = presupuesto * 0.15; // ±15%
      params.append('precio_min', Math.floor(presupuesto - tolerancia));
      params.append('precio_max', Math.ceil(presupuesto + tolerancia));
      console.log('🔍 Filtrando por precio compra:', presupuesto, '±15%');
    }
    
    if (this.filtrosSimplificados?.presupuesto_alquiler) {
      const presupuesto = parseInt(this.filtrosSimplificados.presupuesto_alquiler);
      const tolerancia = presupuesto * 0.15; // ±15%
      params.append('precio_min', Math.floor(presupuesto - tolerancia));
      params.append('precio_max', Math.ceil(presupuesto + tolerancia));
      console.log('🔍 Filtrando por precio alquiler:', presupuesto, '±15%');
    }
    
    console.log('🌐 URL final:', `${API_BASE}/propiedades?${params.toString()}`);
    
    const [propiedadesRes, caracteristicasRes, tiposRes, distritosRes] = await Promise.all([
      fetch(`${API_BASE}/propiedades?${params.toString()}`),  // ✅ Con filtros
      fetch(`${API_BASE}/caracteristicas`),
      fetch(`${API_BASE}/tipos-inmueble`),
      fetch(`${API_BASE}/distritos`)
    ]);
    
    // ... resto del código
  }
}
```

---

## 🎯 BENEFICIOS

1. ✅ **Más rápido** - Solo trae propiedades que cumplen filtros
2. ✅ **Menos datos** - No carga 100 propiedades para filtrar 5
3. ✅ **Mejor UX** - Resultados instantáneos
4. ✅ **Escalable** - Funciona con miles de propiedades

---

## 📝 CHECKLIST

- [ ] Modificar `cargarDatos()` en `resultados.js`
- [ ] Agregar construcción de query params
- [ ] Agregar logs para debugging
- [ ] Probar con diferentes filtros
- [ ] Verificar que muestra resultados correctos
- [ ] Commit y push

---

**¿Implementamos esta solución cumpa?** 🚀
