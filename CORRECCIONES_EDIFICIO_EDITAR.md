# 🔧 CORRECCIONES APLICADAS Y PENDIENTES - EDIFICIO COMPLETO

## ✅ **CORRECCIONES YA APLICADAS**

### **1. Detección de Edificio Completo Más Precisa**
```javascript
// ❌ ANTES
const esEdificio = nombreTipo.includes('edificio');
// Problema: "Oficina en Edificio" también incluye "edificio"

// ✅ AHORA
const esEdificioCompleto = nombreTipo === 'edificio completo';
// Solo detecta exactamente "Edificio Completo"
```

**Impacto**: 
- ✅ Step 4 NO aparecerá al editar "Oficina en Edificio"
- ✅ Step 4 SÍ aparecerá al crear/editar "Edificio Completo"

---

## ⚠️ **CORRECCIONES PENDIENTES**

### **2. Oficinas No Deben Tener Imagen**

**Problema Actual**: El backend copia la imagen del edificio padre a todas las oficinas

**Estado BD Actual**:
```sql
-- Edificio (registro_cab_id = 30)
imagen_principal = "https://ik.imagekit.io/.../edificio_20_TORRE_BAEZ_principal_rN657ZtKRV"

-- Oficinas (hijas del edificio)
registro_cab_id  | imagen_principal
31              | "https://ik.imagekit.io/.../edificio_20_TORRE_BAEZ_principal_rN657ZtKRV" ❌
32              | "https://ik.imagekit.io/.../edificio_20_TORRE_BAEZ_principal_rN657ZtKRV" ❌
...
```

**Solución Requerida**: 
- Backend debe crear oficinas con `imagen_principal = NULL`
- Frontend ya NO envía imágenes para oficinas ✅

---

### **3. EDITAR Edificio Completo - Cargar Configuración de Oficinas**

**Problema**: Al editar un Edificio Completo, el Step 4 no muestra:
- Las oficinas ya creadas
- El equipamiento configurado
- Los parqueos de sótanos

**Solución Requerida**:

```javascript
// En loadPropertyData() cuando detecta Edificio Completo
if (esEdificioCompleto) {
  // 1. Cargar oficinas hijas desde API
  const oficinasResponse = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${this.propId}/oficinas`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const oficinas = await oficinasResponse.json();
  
  // 2. Mapear a edificioConfig
  this.formData.edificioConfig = {
    pisos: cantidadPisos,
    oficinas_por_piso: oficinasPorPiso,
    sotanos: cantidadSotanos,
    oficinas: oficinas.map(ofi => ({
      oficina_numero: ofi.numero_oficina,
      piso: ofi.piso,
      area: ofi.area,
      nombre: ofi.nombre
    })),
    sotanos_config: [...], // Cargar parqueos
    equipamiento: {...}    // Cargar equipamiento de oficinas
  };
}
```

**API Requerida en Backend**:
```python
@router.get("/propiedades/{propiedad_id}/oficinas")
async def get_oficinas_edificio():
    # Retornar oficinas hijas con sus características
    pass
```

---

### **4. EDITAR Oficina Individual - Mostrar Edificio Padre**

**Problema**: Al editar una "Oficina en Edificio" con `padre_registro_cab_id = 30`, el selector de edificio padre no se pre-llena

**Ejemplo en BD**:
```sql
-- Oficina 901
registro_cab_id = 31
padre_registro_cab_id = 30  -- ID del edificio padre
nombre_inmueble = "Oficina 901"
```

**Solución Requerida**:

```javascript
// En loadPropertyData() detectar si tiene padre
if (prop.padre_registro_cab_id) {
  // Cargar info del edificio padre
  const padreResponse = await fetch(`${API_CONFIG.BASE_URL}/propiedades/${prop.padre_registro_cab_id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const edificioPadre = await padreResponse.json();
  
  // Guardar para pre-llenar selector
  this.formData.padre_registro_cab_id = prop.padre_registro_cab_id;
  this.formData.edificio_padre_nombre = edificioPadre.data.nombre_inmueble;
}

// En Step 2, pre-seleccionar el edificio padre si existe
if (this.formData.padre_registro_cab_id) {
  // Pre-seleccionar en el SelectorEdificio
  this.selectorEdificio.setEdificioId(this.formData.padre_registro_cab_id);
}
```

---

### **5. API para Actualizar Edificio Completo**

**Problema**: No existe una API para actualizar un Edificio Completo con todas sus oficinas

**Solución Requerida en Backend**:
```python
@router.put("/propiedades/edificio-completo/{edificio_id}")
async def actualizar_edificio_completo(
    edificio_id: int,
    edificio_json: str = Form(...),
    imagen_principal: UploadFile = None,
    imagenes_galeria: List[UploadFile] = []
):
    """
    Actualizar edificio completo:
    1. Actualizar datos del edificio padre
    2. Actualizar oficinas existentes
    3. Crear nuevas oficinas si se agregaron
    4. Eliminar oficinas si se quitaron
    5. Actualizar características y equipamiento
    """
    pass
```

---

## 📊 **RESUMEN EJECUTIVO**

| Tarea | Estado | Prioridad | Dónde Corregir |
|-------|--------|-----------|----------------|
| ✅ Detección precisa de Edificio Completo | COMPLETADO | Alta | Frontend ✅ |
| ⚠️ Oficinas sin imagen | PENDIENTE | Media | Backend |
| ⚠️ Cargar config de oficinas al editar | PENDIENTE | Alta | Frontend + Backend |
| ⚠️ Mostrar edificio padre en oficina | PENDIENTE | Media | Frontend |
| ⚠️ API actualizar edificio completo | PENDIENTE | Alta | Backend |

---

## 🎯 **PRÓXIMOS PASOS RECOMENDADOS**

### **Inmediato (Frontend)**
1. Implementar carga de `padre_registro_cab_id` en modo editar oficina
2. Pre-seleccionar edificio padre en SelectorEdificio

### **Medio Plazo (Backend)**
1. Crear endpoint `GET /propiedades/{id}/oficinas` para cargar oficinas hijas
2. Modificar endpoint `/edificio-completo` para NO asignar imagen a oficinas
3. Crear endpoint `PUT /propiedades/edificio-completo/{id}` para actualizaciones

### **Testing**
1. Probar crear Edificio Completo ✅
2. Probar editar Edificio Completo ⏸️
3. Probar editar Oficina Individual ⏸️
4. Verificar que oficinas NO tengan imagen ⏸️
