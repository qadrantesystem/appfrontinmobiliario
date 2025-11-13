# 🧪 TESTING - FORMULARIO DE PROPIEDADES
## Generación Masiva de Oficinas - 3 Flujos

---

## 📋 PREPARACIÓN ANTES DE PROBAR

### Datos de prueba necesarios:
- **DNI existente en BD**: `12345678` (o cualquier DNI que ya exista)
- **DNI nuevo**: `87654321` (que NO exista en BD)
- **Usuario de prueba**: alancairampoma@gmail.com / Matias123 (perfil admin)

### Abrir herramientas:
1. **Consola del navegador**: F12 → Tab "Console"
2. **Network**: F12 → Tab "Network" (para ver llamadas API)
3. **Railway Backend**: https://appbackimmobiliaria-production.up.railway.app/docs

---

## 🏢 FLUJO 1: SOLO EDIFICIO (Sin generación masiva)

### Objetivo:
Crear un edificio normal sin generar oficinas masivas.

### ✅ PASO 1 - Propietario (Pestaña 1/5)

**Verificar orden de campos:**
- [ ] **DNI está PRIMERO** (antes de nombre)
- [ ] Nombre está segundo
- [ ] Teléfono está tercero
- [ ] Email está cuarto

**Probar Auto-fill con DNI existente:**
1. Ingresar DNI: `12345678`
2. Hacer clic fuera del campo (blur)
3. **Esperar 1 segundo**
4. Verificar en consola: `✅ Propietario encontrado`
5. Verificar campos auto-completados:
   - [ ] Nombre se llenó automáticamente
   - [ ] Teléfono se llenó automáticamente
   - [ ] Email se llenó automáticamente
   - [ ] Campos están **deshabilitados** (readonly)

**Probar con DNI nuevo (no existe):**
1. Borrar el DNI anterior
2. Ingresar DNI nuevo: `87654321`
3. Hacer clic fuera del campo (blur)
4. Verificar en consola: `⚠️ Propietario no encontrado`
5. Verificar campos habilitados:
   - [ ] Nombre está **habilitado** para escribir
   - [ ] Teléfono está **habilitado** para escribir
   - [ ] Email está **habilitado** para escribir
6. Llenar manualmente:
   - Nombre: `Juan Pérez Test`
   - Teléfono: `999888777`
   - Email: `juan.test@gmail.com`

**Errores a vigilar:**
- ❌ Error: `AutoFillDNI is not defined` → Los scripts no cargaron
- ❌ Error: `propietarioService is not defined` → Falta cargar propietario.service.js
- ❌ Campos no se auto-completan → Revisar red (Network) si llamó a `/api/v1/propietarios/{dni}`

**Clic en "Siguiente"**

---

### ✅ PASO 2 - Información Básica (Pestaña 2/5)

**Seleccionar tipo de inmueble:**
1. En el combo "Tipo de Inmueble" seleccionar: **Edificio**
2. Verificar:
   - [ ] NO aparece selector de "Edificio Padre" (solo aparece si es Oficina)
   - [ ] Consola muestra: `Cargando características...`

**Llenar campos:**
- Distrito: `San Isidro`
- Nombre: `Edificio Torre Azul`
- Dirección: `Av. Conquistadores 456`
- Latitud: `-12.0975` (opcional)
- Longitud: `-77.0305` (opcional)

**Errores a vigilar:**
- ❌ Error: `edificio-padre-container` visible → Solo debe aparecer si tipo = Oficina
- ❌ Error al cargar características → Verificar endpoint `/tipos-inmueble/{id}/caracteristicas`

**Clic en "Siguiente"**

---

### ✅ PASO 3 - Características (Pestaña 3/5)

**Verificar campos básicos:**
- [ ] Solo aparece **Área** y **Antigüedad**
- [ ] **NO aparece** Habitaciones (removido)
- [ ] **NO aparece** Baños (removido)
- [ ] **NO aparece** Parqueos (removido)
- [ ] Mensaje informativo: "Habitaciones, baños y parqueos se agregan en Características Adicionales"

**Llenar datos básicos:**
- Área: `500` m²
- Antigüedad: `5` años

**Seleccionar características adicionales:**
- Expandir acordeón de categorías
- Marcar checkboxes según corresponda:
  - [ ] Ascensor (checkbox)
  - [ ] Estacionamiento (número: `10`)
  - [ ] Piscina (checkbox)
  - [ ] Gimnasio (checkbox)

**Errores a vigilar:**
- ❌ Campos Habitaciones/Baños/Parqueos hardcodeados → No deben existir
- ❌ Características no agrupadas por categoría → Revisar acordeón

**Clic en "Siguiente"**

---

### ✅ PASO 4 - Transacción y Precio (Pestaña 4/5)

**Seleccionar transacción:**
1. Hacer clic en la tarjeta **Alquiler**
2. Verificar:
   - [ ] Campo "Precio Venta" se oculta
   - [ ] Campo "Precio Alquiler" se muestra

**Llenar precio:**
- Precio Alquiler: `5000`
- Moneda: `PEN` (Soles)

**Llenar descripción:**
- Título: `Edificio moderno en San Isidro`
- Descripción: `Edificio de oficinas con acabados de primera, ubicado en zona comercial.`

**Clic en "Siguiente"**

---

### ✅ PASO 5 - Imágenes (Pestaña 5/5)

**Subir imagen principal:**
1. Hacer clic en el área de drop "Imagen Principal"
2. Seleccionar una imagen JPG/PNG
3. Verificar preview de la imagen

**Subir galería (opcional):**
1. Hacer clic en "Galería de Imágenes"
2. Seleccionar 2-3 imágenes
3. Verificar previews

**Clic en "Publicar Propiedad"**

---

### ✅ VERIFICACIÓN FINAL - Flujo 1

**Esperar respuestas:**
1. Consola muestra: `📤 Publicando propiedad...`
2. Si DNI era nuevo, ver: `🆕 Creando nuevo propietario...` → `✅ Propietario creado`
3. Ver: `📤 DATOS A ENVIAR AL BACKEND`
4. Verificar JSON enviado:
   ```json
   {
     "propietario_id": 123,  // ← Debe tener ID, no propietario_real_*
     "padre_registro_cab_id": null,  // ← null porque es edificio raíz
     "tipo_inmueble_id": 1,
     "area": 500,
     // NO debe tener: habitaciones, banos, parqueos
   }
   ```

**Modal de confirmación:**
- [ ] Aparece SweetAlert: "🏢 Edificio Creado"
- [ ] Pregunta: "¿Deseas generar oficinas masivamente?"
- [ ] **Hacer clic en "No, ahora no"**

**Redirección:**
- [ ] Vuelve a lista de propiedades
- [ ] Aparece el nuevo edificio en la lista

**Errores a vigilar:**
- ❌ Error: `propietario_id is required` → No creó el propietario
- ❌ Error: Envía `propietario_real_nombre` → formData mal actualizado
- ❌ No aparece modal de generación masiva → No está inicializado

---

## 🏢➕🏠 FLUJO 2: EDIFICIO + GENERACIÓN MASIVA

### Objetivo:
Crear edificio y generar oficinas masivamente.

### Pasos 1-5: **IGUALES AL FLUJO 1**
Seguir todos los pasos del Flujo 1 hasta llegar al modal de confirmación.

---

### ✅ PASO EXTRA - Modal Generación Masiva

**Confirmación inicial:**
1. Aparece SweetAlert: "🏢 Edificio Creado"
2. Pregunta: "¿Deseas generar oficinas masivamente?"
3. **Hacer clic en "Sí, generar oficinas"**

**Verificar apertura del modal:**
- [ ] Se abre Bootstrap Modal grande
- [ ] Título: "Generación Masiva de Oficinas - Torre Azul"
- [ ] Muestra información del edificio recién creado

**Configurar pisos:**
- Piso desde: `1`
- Piso hasta: `10`

**Configurar plantilla de oficinas:**

**Oficina Tipo 1:**
- Sufijo: `A`
- Área: `50` m²
- Características:
  - [ ] Baños: `1`
  - [ ] Estacionamiento: `1`
  - [ ] Amoblado: `Sí`

**Oficina Tipo 2 (opcional):**
- Clic en "+ Agregar Tipo de Oficina"
- Sufijo: `B`
- Área: `80` m²
- Características:
  - [ ] Baños: `2`
  - [ ] Estacionamiento: `2`

**Vista previa:**
- [ ] Muestra cantidad total: "Se crearán 20 oficinas" (10 pisos × 2 tipos)
- [ ] Lista ejemplo:
  ```
  Piso 1: OF-1A (50m²), OF-1B (80m²)
  Piso 2: OF-2A (50m²), OF-2B (80m²)
  ...
  Piso 10: OF-10A (50m²), OF-10B (80m²)
  ```

**Clic en "Generar Oficinas"**

---

### ✅ VERIFICACIÓN FINAL - Flujo 2

**Validaciones automáticas:**
1. Modal muestra errores si:
   - [ ] Piso desde > Piso hasta → "El piso inicial debe ser menor"
   - [ ] Sin plantillas → "Debes agregar al menos un tipo de oficina"
   - [ ] Sufijos duplicados → "Los sufijos deben ser únicos"

**Llamada API:**
1. Consola muestra: `📤 Generando oficinas masivas...`
2. Endpoint llamado: `POST /api/v1/propiedades/generar-oficinas-masivo`
3. Payload enviado:
   ```json
   {
     "edificio_id": 123,
     "piso_desde": 1,
     "piso_hasta": 10,
     "plantilla_oficinas": [
       {"sufijo": "A", "area": 50, "caracteristicas": [...]},
       {"sufijo": "B", "area": 80, "caracteristicas": [...]}
     ],
     "propietario_id": 123,
     "distrito_id": 5,
     "precio_alquiler_base": 1500,
     "moneda": "PEN",
     "transaccion": "alquiler"
   }
   ```

**Respuesta exitosa:**
- [ ] Modal muestra: "✅ 20 oficinas creadas exitosamente"
- [ ] Detalle por piso:
  ```
  Piso 1: 2 oficinas
  Piso 2: 2 oficinas
  ...
  ```
- [ ] Botón "Cerrar" para volver

**Redirección:**
- [ ] Vuelve a lista de propiedades
- [ ] Aparece el edificio + las 20 oficinas nuevas

**Errores a vigilar:**
- ❌ Modal no se abre → `ModalGeneracionMasiva is not defined`
- ❌ Error: `oficinaService is not defined` → Falta oficina.service.js
- ❌ Error 500 en backend → Verificar logs de Railway

---

## 🏠 FLUJO 3: OFICINA INDEPENDIENTE (Con edificio padre)

### Objetivo:
Crear una oficina individual vinculada a un edificio existente.

---

### ✅ PASO 1 - Propietario (Pestaña 1/5)

**Igual que Flujo 1**, puede ser:
- Propietario existente (auto-fill)
- Propietario nuevo (crear)

**Clic en "Siguiente"**

---

### ✅ PASO 2 - Información Básica (Pestaña 2/5)

**Seleccionar tipo:**
1. En "Tipo de Inmueble" seleccionar: **Oficina**
2. **IMPORTANTE**: Verificar que aparece:
   - [ ] Nuevo campo: "🏢 Edificio Padre" (combo select)
   - [ ] Contenedor: `#edificio-caracteristicas-container`

**Seleccionar edificio padre:**
1. En combo "Edificio Padre" seleccionar: **Torre Azul** (creado en Flujo 1)
2. Esperar carga (1 segundo)
3. Verificar en consola:
   ```
   🔧 Inicializando SelectorEdificio...
   ✅ SelectorEdificio inicializado
   📦 Cargando edificios disponibles...
   ✅ 5 edificios cargados
   ```

**Verificar características heredadas:**
- [ ] Aparece acordeón con características del edificio:
  ```
  📐 Características del Edificio: Torre Azul

  ✨ Comodidades:
    - Ascensor
    - Gimnasio

  🚗 Estacionamiento:
    - 10 espacios

  🏊 Amenidades:
    - Piscina
  ```

**Llenar datos de la oficina:**
- Distrito: (heredado del edificio, puede cambiar si quieres)
- Nombre: `Oficina 301`
- Dirección: `Av. Conquistadores 456 - Piso 3`

**Errores a vigilar:**
- ❌ Selector de edificio NO aparece → Tipo no es "Oficina"
- ❌ Error: `SelectorEdificio is not defined` → Falta selector-edificio.js
- ❌ Error: `edificioService is not defined` → Falta edificio.service.js
- ❌ Características no se muestran → Revisar `/edificios/{id}/caracteristicas`

**Clic en "Siguiente"**

---

### ✅ PASO 3 - Características (Pestaña 3/5)

**Datos básicos:**
- Área: `120` m²
- Antigüedad: `5` años (heredado del edificio)

**Características propias de la oficina:**
- [ ] Baños: `2` (específico de esta oficina)
- [ ] Estacionamientos asignados: `2`
- [ ] Amoblado: `Sí`
- [ ] Vista al mar: `No`

**Nota importante:**
- Las características del **edificio padre** ya están guardadas en el edificio
- Aquí solo marcas características **específicas de esta oficina**

**Clic en "Siguiente"**

---

### ✅ PASO 4 - Transacción y Precio (Pestaña 4/5)

**Configurar alquiler:**
- Transacción: **Alquiler**
- Precio: `1800` soles/mes
- Moneda: `PEN`

**Descripción:**
- Título: `Oficina moderna en Torre Azul - Piso 3`
- Descripción: `Oficina amoblada con vista panorámica, incluye 2 estacionamientos.`

**Clic en "Siguiente"**

---

### ✅ PASO 5 - Imágenes (Pestaña 5/5)

**Subir fotos de la oficina:**
- Imagen principal: Interior de la oficina
- Galería: 2-3 fotos más

**Clic en "Publicar Propiedad"**

---

### ✅ VERIFICACIÓN FINAL - Flujo 3

**JSON enviado debe tener:**
```json
{
  "propietario_id": 123,
  "padre_registro_cab_id": 456,  // ← ID del edificio Torre Azul
  "tipo_inmueble_id": 2,  // Oficina
  "nombre_inmueble": "Oficina 301",
  "area": 120,
  "caracteristicas": [
    // Solo características propias de la oficina
  ]
}
```

**Verificaciones:**
- [ ] `padre_registro_cab_id` tiene el ID del edificio seleccionado
- [ ] NO aparece modal de generación masiva (solo para edificios)
- [ ] Vuelve a lista de propiedades
- [ ] La oficina aparece vinculada al edificio padre

**Consulta manual en BD:**
```sql
SELECT
  rc.nombre_inmueble,
  rc.padre_registro_cab_id,
  padre.nombre_inmueble AS edificio_padre
FROM registro_cab rc
LEFT JOIN registro_cab padre ON rc.padre_registro_cab_id = padre.registro_cab_id
WHERE rc.registro_cab_id = 789;
```

Debería mostrar:
```
nombre_inmueble  | padre_registro_cab_id | edificio_padre
Oficina 301      | 456                   | Torre Azul
```

**Errores a vigilar:**
- ❌ `padre_registro_cab_id` es null → No guardó el edificio padre
- ❌ Error: `getEdificioId is not defined` → SelectorEdificio no inicializado
- ❌ Aparece modal de generación → Solo debe aparecer para edificios

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

### Error: Scripts no cargan
**Síntoma:** `AutoFillDNI is not defined`

**Solución:**
1. Abrir dashboard.html
2. Verificar que existen las líneas:
   ```html
   <script src="js/services/propietario.service.js?v=1"></script>
   <script src="js/components/propietario/auto-fill-dni.js?v=1"></script>
   ```
3. Hacer **Ctrl+F5** para limpiar caché

---

### Error: Auto-fill no funciona
**Síntoma:** Al salir del DNI no pasa nada

**Verificar:**
1. Abrir Network (F12)
2. Ingresar DNI y hacer blur
3. Debe aparecer llamada: `GET /api/v1/propietarios/12345678`
4. Si retorna 404 → DNI no existe (correcto, debe habilitar campos)
5. Si retorna 200 → DNI existe (debe auto-completar)

---

### Error: Selector edificio no aparece
**Síntoma:** Al seleccionar "Oficina" no se muestra el combo

**Verificar:**
1. Console debe mostrar: `🔧 Inicializando SelectorEdificio...`
2. Revisar que `tipo_inmueble_id` coincida con tipo "Oficina"
3. Cambiar línea 821 de property-form.js si el nombre es diferente

---

### Error: Modal masivo no se abre
**Síntoma:** Al crear edificio no pregunta por generación masiva

**Verificar:**
1. Console debe mostrar: `🏢 Es un Edificio - preguntar...`
2. Revisar que `tipo_inmueble_id` coincida con tipo "Edificio"
3. Verificar que SweetAlert2 está cargado (`Swal` existe)

---

## ✅ CHECKLIST FINAL

### Archivos que deben existir:
- [ ] `frontend/js/services/propietario.service.js`
- [ ] `frontend/js/services/edificio.service.js`
- [ ] `frontend/js/services/oficina.service.js`
- [ ] `frontend/js/components/propietario/auto-fill-dni.js`
- [ ] `frontend/js/components/edificio/selector-edificio.js`
- [ ] `frontend/js/components/edificio/modal-masivo.js`

### Scripts cargados en dashboard.html:
- [ ] Líneas 159-161: Servicios
- [ ] Líneas 164-166: Componentes
- [ ] ANTES de `property-form.js` (línea 175)

### Cambios en property-form.js:
- [ ] formData usa `propietario_id` (no `propietario_real_*`)
- [ ] formData tiene `padre_registro_cab_id`
- [ ] Step 1: DNI es PRIMERO
- [ ] Step 2: Selector edificio condicional
- [ ] Step 3: Sin habitaciones/baños/parqueos hardcoded
- [ ] submitForm: Crea propietario primero
- [ ] submitForm: Pregunta por modal masivo si es edificio

### Endpoints backend funcionando:
- [ ] `GET /api/v1/propietarios/{dni}`
- [ ] `POST /api/v1/propietarios`
- [ ] `GET /api/v1/propiedades/edificios-disponibles`
- [ ] `GET /api/v1/propiedades/{id}/caracteristicas`
- [ ] `POST /api/v1/propiedades/con-imagenes`
- [ ] `POST /api/v1/propiedades/generar-oficinas-masivo`

---

## 📸 CAPTURAS RECOMENDADAS

Tomar screenshots de:
1. Step 1 con DNI primero
2. Auto-fill funcionando (campos deshabilitados)
3. Step 2 con selector edificio visible (tipo Oficina)
4. Step 3 sin habitaciones/baños/parqueos
5. Modal de generación masiva abierto
6. Resultado: 20 oficinas creadas
7. Lista final con edificio + oficinas

---

**🎯 OBJETIVO:** Los 3 flujos deben funcionar sin errores y crear los registros correctamente en la BD con la estructura normalizada (propietario_id + padre_registro_cab_id).
