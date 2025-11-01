# 🔧 PLAN DE REFACTORIZACIÓN Y ESTABILIZACIÓN

## 📋 RESUMEN EJECUTIVO

**Fecha**: 31 de Octubre 2025
**Prioridad**: 🔴 **URGENTE**
**Estado**: En progreso

---

## 🎯 OBJETIVOS

### 1. **URGENTE**: Reparar pestaña Mantenimientos
- **Problema**: Mantenimientos funcionaba bien en commit anterior pero algo se rompió
- **Impacto**: El usuario necesita configurar características
- **Acción**: Identificar y revertir cambios que afectaron Mantenimientos

### 2. Arreglar conflicto CSS entre tabs
- **Problema**: Los estilos de `busquedas.css` están afectando el tab de Propiedades
- **Causa**: CSS global compartido (`.property-card`, `.property-info`, etc.)
- **Acción**: Aislar CSS por tab usando prefijos

---

## 🔄 FLUJOS DE USUARIOS Y TABS

### Flujo 1: Usuario Demandante (perfil_id: 1)
```
📱 Tabs disponibles:
  └─ Dashboard
  └─ Búsquedas
  └─ Favoritos
  └─ Subscripciones
```

### Flujo 2: Usuario Ofertante (perfil_id: 2)
```
📱 Tabs disponibles:
  └─ Dashboard
  └─ Propiedades
  └─ Búsquedas
  └─ Favoritos
  └─ Subscripciones
```

### Flujo 3: Usuario Corredor (perfil_id: 3)
```
📱 Tabs disponibles:
  └─ Dashboard
  └─ Propiedades
  └─ Búsquedas
  └─ Favoritos
  └─ Subscripciones
```

### Flujo 4: Usuario Administrador (perfil_id: 4)
```
📱 Tabs disponibles:
  └─ Dashboard
  └─ Propiedades
  └─ Búsquedas
  └─ Favoritos
  └─ Aprobaciones (subscripciones)
  └─ Mantenimientos ⚠️ **PRIORIDAD 1**
  └─ Usuarios
  └─ Reportes
```

---

## 🐛 PROBLEMA IDENTIFICADO: CSS COMPARTIDO

### Archivos CSS cargados en dashboard.html:
```html
<link rel="stylesheet" href="css/pages/dashboard.css?v=16">
<link rel="stylesheet" href="css/pages/dashboard-search.css?v=2">
<link rel="stylesheet" href="css/pages/dashboard-admin.css?v=1">
<link rel="stylesheet" href="css/pages/resultados.css">
<link rel="stylesheet" href="css/components/modal-busqueda.css?v=12">
<link rel="stylesheet" href="css/pages/busqueda.css?v=12">
<link rel="stylesheet" href="css/components/property-form.css?v=1">
<link rel="stylesheet" href="css/pages/dashboard-maintenance.css?v=5">
<link rel="stylesheet" href="css/pages/dashboard/busquedas.css?v=1"> ⚠️ CONFLICTO
```

### Clases CSS que causan conflicto:
El archivo `css/pages/dashboard/busquedas.css` define estilos globales que afectan a TODOS los tabs:

```css
/* ❌ Estas clases se usan en múltiples tabs */
.property-card
.property-info
.property-image-carousel
.carousel-image
.carousel-prev
.carousel-next
.carousel-indicators
.property-title
.property-location
.property-price
.property-features
.property-description
.property-contact
```

### Solución:
1. **Opción A (Rápida)**: Agregar prefijo `.busquedas-tab` a todos los estilos de búsquedas
2. **Opción B (Correcta)**: Crear CSS compartido para property-card y estilos específicos por tab

---

## 📁 ESTRUCTURA DE ARCHIVOS ACTUAL

### JavaScript Modular (Nueva Arquitectura):
```
js/pages/dashboard/
├── config/
│   └── tabs-config.js           # Configuración de tabs por perfil
├── core/
│   ├── dashboard-router.js      # Orquestación y routing
│   └── dashboard-app.js         # Aplicación principal
├── tabs/
│   ├── dashboard-home/
│   │   └── dashboard-home.js
│   ├── propiedades/
│   │   └── propiedades.js       # ⚠️ Afectado por CSS de búsquedas
│   ├── favoritos/
│   │   └── favoritos.js
│   ├── subscripciones/
│   │   └── subscripciones.js
│   ├── busquedas/
│   │   ├── busquedas-form.js
│   │   ├── busquedas-cards.js
│   │   ├── busquedas-map.js
│   │   ├── busquedas-actions.js
│   │   ├── busquedas-lista.js
│   │   └── busquedas.NEW.js
│   ├── aprobaciones/
│   │   └── aprobaciones.js
│   ├── usuarios/
│   │   └── usuarios.js
│   └── reportes/
│       └── reportes.js
└── maintenance/                  # ⚠️ PRIORIDAD 1 - REPARAR
    ├── maintenance-main.js
    ├── property-types.js
    ├── districts.js
    ├── characteristics.js
    ├── characteristics-by-type.js
    ├── profiles.js
    └── plans.js
```

---

## 🔗 MAPEO DE APIs POR FLUJO

### APIs Comunes (Todos los perfiles):
```
GET  /propiedades/buscar              # Búsquedas
GET  /propiedades/{id}                # Detalle
POST /favoritos                       # Agregar favorito
DELETE /favoritos/{id}                # Quitar favorito
GET  /favoritos                       # Listar favoritos
```

### APIs - Perfil Demandante (perfil_id: 1):
```
GET  /subscripciones                  # Mis subscripciones
POST /subscripciones                  # Crear subscripción
```

### APIs - Perfil Ofertante (perfil_id: 2):
```
GET  /propiedades/mis-propiedades     # Mis propiedades publicadas
POST /propiedades                     # Crear propiedad
PATCH /propiedades/{id}               # Actualizar propiedad
DELETE /propiedades/{id}              # Eliminar propiedad
```

### APIs - Perfil Corredor (perfil_id: 3):
```
GET  /propiedades/asignadas           # Propiedades asignadas
PATCH /propiedades/{id}/asignar-corredor  # Asignar a otro corredor
PATCH /propiedades/{id}/estado-crm    # Actualizar estado CRM
```

### APIs - Perfil Administrador (perfil_id: 4):
```
# Propiedades
GET  /propiedades                     # Todas las propiedades
PATCH /propiedades/{id}/asignar-corredor  # Asignar corredor

# Usuarios
GET  /usuarios                        # Listar usuarios
POST /usuarios                        # Crear usuario
PATCH /usuarios/{id}                  # Actualizar usuario
DELETE /usuarios/{id}                 # Eliminar usuario

# Mantenimientos (⚠️ PRIORIDAD)
GET  /mantenimiento/tipos-inmueble    # Tipos de propiedad
POST /mantenimiento/tipos-inmueble
PATCH /mantenimiento/tipos-inmueble/{id}
DELETE /mantenimiento/tipos-inmueble/{id}

GET  /mantenimiento/distritos         # Distritos
POST /mantenimiento/distritos
PATCH /mantenimiento/distritos/{id}
DELETE /mantenimiento/distritos/{id}

GET  /mantenimiento/caracteristicas   # Características
POST /mantenimiento/caracteristicas
PATCH /mantenimiento/caracteristicas/{id}
DELETE /mantenimiento/caracteristicas/{id}

GET  /mantenimiento/caracteristicas-por-tipo  # Relación carac-tipo
POST /mantenimiento/caracteristicas-por-tipo
DELETE /mantenimiento/caracteristicas-por-tipo/{id}

GET  /mantenimiento/perfiles          # Perfiles de usuario
POST /mantenimiento/perfiles
PATCH /mantenimiento/perfiles/{id}

GET  /mantenimiento/planes            # Planes de subscripción
POST /mantenimiento/planes
PATCH /mantenimiento/planes/{id}
DELETE /mantenimiento/planes/{id}

# Aprobaciones
GET  /subscripciones/pendientes       # Subscripciones pendientes
PATCH /subscripciones/{id}/aprobar    # Aprobar subscripción
PATCH /subscripciones/{id}/rechazar   # Rechazar subscripción

# Reportes
GET  /reportes/propiedades            # Reporte de propiedades
GET  /reportes/usuarios               # Reporte de usuarios
GET  /reportes/subscripciones         # Reporte de subscripciones
```

---

## 🔥 ANÁLISIS DE CAMBIOS RECIENTES

### Último commit: `b7bc394 feat:feature menu cerra sesion`
```
Archivos modificados (no comiteados):
  - dashboard.html
  - js/pages/dashboard.js
  - js/pages/dashboard/core/dashboard-router.js
  - js/pages/dashboard/search-admin.js

Archivos nuevos (no rastreados):
  - css/pages/dashboard/busquedas.css  ⚠️ CAUSA DEL CONFLICTO
  - css/pages/dashboard-busquedas.css
  - js/pages/dashboard/tabs/busquedas/
```

### Commit anterior: `49add86 feat:fix menu flotante`

### Commit con Mantenimientos funcionando: `8b49a73 feat:fature 143 tab de mantenimientos`
✅ **Este es el punto de referencia para Mantenimientos**

---

## ✅ PLAN DE ACCIÓN

### Fase 1: URGENTE - Reparar Mantenimientos (HOY)
- [ ] 1.1. Verificar estado de archivos de mantenimiento en commit `8b49a73`
- [ ] 1.2. Comparar con archivos actuales
- [ ] 1.3. Identificar cambios que rompieron funcionalidad
- [ ] 1.4. Restaurar archivos de mantenimiento funcionales
- [ ] 1.5. Probar que el tab Mantenimientos carga correctamente
- [ ] 1.6. Verificar que todas las sub-pestañas funcionan:
  - Tipos de Inmueble
  - Distritos
  - Características
  - Características por Tipo
  - Perfiles
  - Planes

### Fase 2: Arreglar conflicto CSS Propiedades/Búsquedas
- [ ] 2.1. Crear `css/components/property-card.css` con estilos compartidos
- [ ] 2.2. Refactorizar `css/pages/dashboard/busquedas.css`:
  - Remover estilos de property-card (usar compartidos)
  - Agregar prefijo `.busquedas-tab` a estilos específicos
- [ ] 2.3. Crear `css/pages/dashboard/propiedades.css` si es necesario
- [ ] 2.4. Actualizar `dashboard.html` para cargar CSS en orden correcto
- [ ] 2.5. Probar que ambos tabs se vean correctamente

### Fase 3: Estabilización general
- [ ] 3.1. Revisar y commitear cambios pendientes de forma organizada
- [ ] 3.2. Crear commits separados por funcionalidad:
  - Mantenimientos (fix)
  - CSS refactoring
  - Búsquedas (feature)
- [ ] 3.3. Actualizar versiones de CSS (?v=X)
- [ ] 3.4. Probar todos los flujos de usuario
- [ ] 3.5. Documentar cambios en CHANGELOG

### Fase 4: Optimización (Próxima sesión)
- [ ] 4.1. Revisar carga de CSS innecesarios por perfil
- [ ] 4.2. Implementar lazy-loading de CSS por tab
- [ ] 4.3. Minificar CSS para producción
- [ ] 4.4. Auditar performance de carga

---

## 🎨 ESTRATEGIA CSS PROPUESTA

### Estructura nueva:
```
css/
├── components/
│   ├── property-card.css          # ✨ NUEVO - Estilos compartidos
│   ├── modal-busqueda.css
│   └── property-form.css
├── pages/
│   ├── dashboard.css              # Estilos base del dashboard
│   └── dashboard/
│       ├── propiedades.css        # ✨ NUEVO - Específico de propiedades
│       ├── busquedas.css          # Refactorizado con prefijos
│       ├── favoritos.css
│       └── mantenimientos.css     # Ya existe
```

### Convención de nombres:
```css
/* ✅ Estilos compartidos (property-card.css) */
.property-card { }
.property-info { }
.property-image-carousel { }

/* ✅ Estilos específicos de búsquedas */
.busquedas-tab .filters-column { }
.busquedas-tab .results-column { }
.busquedas-tab .map-column { }

/* ✅ Estilos específicos de propiedades */
.propiedades-tab .propiedades-header { }
.propiedades-tab .properties-grid { }
```

---

## 📊 TRACKING DE PROGRESO

### Estado actual:
- ✅ Análisis completado
- ✅ Problema CSS identificado
- ⏳ Reparación de Mantenimientos (EN PROGRESO)
- ⏳ Refactoring CSS
- ⏳ Testing completo

### Métricas:
- **Archivos afectados**: ~15
- **CSS conflictivos**: ~50 reglas
- **Tiempo estimado**: 2-3 horas
- **Riesgo**: Medio (cambios en CSS pueden afectar otros tabs)

---

## 🚨 NOTAS IMPORTANTES

1. **NO TOCAR** el commit `8b49a73` - tiene Mantenimientos funcionando
2. **CUIDADO** con cache de CSS - usar ?v= incrementado
3. **PROBAR** en todos los perfiles antes de commitear
4. **DOCUMENTAR** cada cambio importante
5. **CREAR** backup antes de cambios grandes

---

## 📝 CHECKLIST FINAL

Antes de dar por terminado:
- [ ] Mantenimientos funciona al 100%
- [ ] Propiedades se ve correctamente
- [ ] Búsquedas se ve correctamente
- [ ] No hay errores en consola
- [ ] CSS organizado y documentado
- [ ] Commits limpios y descriptivos
- [ ] README actualizado si es necesario
- [ ] Push a Railway exitoso
- [ ] Pruebas en producción

---

**Última actualización**: 2025-10-31
**Responsable**: Claude Code & acairamp
**Estado**: 🔄 En progreso
