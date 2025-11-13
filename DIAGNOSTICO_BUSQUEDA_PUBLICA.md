# 🔍 DIAGNÓSTICO - BÚSQUEDA PÚBLICA NO MUESTRA DATOS

**Fecha:** 13 de Noviembre 2025  
**Estado:** ❌ PROBLEMA IDENTIFICADO

---

## 🐛 PROBLEMA ENCONTRADO

### **Archivo:** `resultados.js` (línea 482)

```javascript
// ❌ PROBLEMA: Endpoint incorrecto
fetch(`${API_BASE}/propiedades?limit=100`)
```

### **¿Por qué falla?**

1. ❌ **Endpoint `/propiedades` requiere autenticación** (token JWT)
2. ❌ **Usuario invitado NO tiene token**
3. ❌ **API devuelve 401 Unauthorized**
4. ❌ **No se muestran resultados**

---

## ✅ SOLUCIÓN

### **Usar endpoint público:** `/propiedades/publicas`

```javascript
// ✅ CORRECTO: Endpoint público (sin auth)
fetch(`${API_BASE}/propiedades/publicas?limit=100`)
```

---

## 📋 ENDPOINTS DISPONIBLES

### **Backend Railway:**

| Endpoint | Auth | Descripción | Uso |
|----------|------|-------------|-----|
| `GET /propiedades` | ✅ Requiere | Todas las propiedades (admin) | Dashboard autenticado |
| `GET /propiedades/mis-propiedades` | ✅ Requiere | Propiedades del usuario | Dashboard autenticado |
| `GET /propiedades/publicas` | ❌ No requiere | Propiedades aprobadas | **Búsqueda pública** |
| `POST /propiedades/buscar-avanzada` | ❌ No requiere | Búsqueda con filtros | **Búsqueda pública** |

---

## 🔧 ARCHIVOS A CORREGIR

### **1. `resultados.js`** (línea 482)

**Antes:**
```javascript
fetch(`${API_BASE}/propiedades?limit=100`)
```

**Después:**
```javascript
fetch(`${API_BASE}/propiedades/publicas?limit=100`)
```

### **2. Verificar otros archivos:**

| Archivo | Línea | Endpoint Actual | Endpoint Correcto |
|---------|-------|-----------------|-------------------|
| `resultados.js` | 482 | `/propiedades` | `/propiedades/publicas` |
| `index.html` (si hace fetch) | ? | Verificar | `/propiedades/publicas` |
| `search-system/search-main.js` | ? | Verificar | `/propiedades/buscar-avanzada` |

---

## 🎯 FLUJO CORRECTO

### **Usuario Invitado (Sin Auth):**

```
1. Usuario entra a index.html
   ↓
2. Hace búsqueda
   ↓
3. Redirige a resultados.html
   ↓
4. resultados.js carga datos:
   ├── GET /propiedades/publicas ✅ (sin token)
   ├── GET /caracteristicas ✅ (público)
   ├── GET /tipos-inmueble ✅ (público)
   └── GET /distritos ✅ (público)
   ↓
5. Muestra resultados con imágenes
   ↓
6. Usuario puede:
   ├── Ver detalles
   ├── Aplicar filtros
   └── Click en favorito → Redirige a login
```

### **Usuario Autenticado:**

```
1. Usuario entra a dashboard
   ↓
2. Va a tab "Búsquedas"
   ↓
3. busquedas.NEW.js hace búsqueda:
   ├── POST /propiedades/buscar-avanzada ✅ (con token)
   └── Incluye favoritos del usuario
   ↓
4. Muestra resultados personalizados
```

---

## 🔍 VERIFICACIÓN DE ENDPOINTS

### **Probar en Postman/Thunder Client:**

#### **1. Endpoint Público (Sin Auth):**
```http
GET https://appbackimmobiliaria-production.up.railway.app/api/v1/propiedades/publicas?limit=10
```

**Respuesta esperada:**
```json
{
  "data": [
    {
      "registro_cab_id": 123,
      "nombre_inmueble": "Oficina en San Isidro",
      "precio_venta": 250000,
      "area": 120,
      "imagen_principal": "https://...",
      "estado": "aprobada"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45
  }
}
```

#### **2. Endpoint con Auth (Con Token):**
```http
GET https://appbackimmobiliaria-production.up.railway.app/api/v1/propiedades/mis-propiedades
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚨 OTROS PROBLEMAS POTENCIALES

### **1. CORS (Cross-Origin)**
```javascript
// ✅ Verificar que el backend tenga CORS habilitado
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

### **2. Estado de Propiedades**
```javascript
// ✅ Solo mostrar propiedades aprobadas
estado: 'aprobada'
```

### **3. Imágenes**
```javascript
// ✅ Verificar que las URLs de imágenes sean accesibles
imagen_principal: "https://railway.app/..."
```

---

## 📝 CHECKLIST DE CORRECCIÓN

- [ ] Cambiar endpoint en `resultados.js` línea 482
- [ ] Verificar endpoint en `index.html` (si hace fetch)
- [ ] Verificar endpoint en `search-main.js`
- [ ] Probar búsqueda pública sin login
- [ ] Verificar que muestre imágenes
- [ ] Verificar que muestre datos correctos
- [ ] Probar filtros
- [ ] Probar paginación
- [ ] Probar en móvil
- [ ] Commit y push

---

## 🎯 PRIORIDAD

### **ALTA - Crítico para MVP**

Sin esto, usuarios invitados NO pueden buscar propiedades, lo cual es el **core del negocio**.

---

## 💡 RECOMENDACIÓN

1. **Corregir endpoint AHORA** (5 minutos)
2. **Probar en local** (5 minutos)
3. **Commit y push** (2 minutos)
4. **Probar en producción** (5 minutos)

**Total: 17 minutos** ⏱️

---

## 🔗 DOCUMENTACIÓN API

**Swagger:** https://appbackimmobiliaria-production.up.railway.app/docs

**Endpoints públicos:**
- `/propiedades/publicas` - Lista de propiedades aprobadas
- `/propiedades/buscar-avanzada` - Búsqueda con filtros
- `/caracteristicas` - Lista de características
- `/tipos-inmueble` - Lista de tipos
- `/distritos` - Lista de distritos

---

**Siguiente paso:** Corregir el endpoint y probar 🚀
