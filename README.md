# 🏢 MATCH PROPERTY - Plataforma Inmobiliaria

Plataforma web especializada para búsqueda inteligente de inmuebles con filtros avanzados y visualización en mapa interactivo.

## ✨ Características Principales

- 🎠 **Home con Carrusel**: Imágenes futuristas y empresariales rotativas
- 🔍 **Búsqueda Inteligente**: Filtros básicos y avanzados por tipo de inmueble
- 🗺️ **Mapa Interactivo**: Resultados con pins enumerados usando Leaflet.js
- 🏢 **11 Tipos de Inmuebles**: Oficinas, Casas, Departamentos, Locales, Terrenos, etc.
- 📊 **Características Dinámicas**: Sistema en FILAS para fácil expansión
- 🔐 **Sistema de Login**: Admin (admin/1234) con control de acceso

## 🚀 Despliegue

### Railway
```bash
npm install
npm start
```

### Local
```bash
# Con Node.js
npm install
npm start

# O con Python
cd frontend
python -m http.server 3000
```

## 🔧 Tecnologías

- **Frontend**: HTML5, CSS3 (Variables CSS), JavaScript ES6+ (Vanilla)
- **Mapa**: Leaflet.js
- **Data**: JSON (mock)
- **Backend**: Express.js (para deploy)
- **Sin dependencias frontend**: No requiere npm para desarrollo

## 📝 Estructura

```
frontend/
├── index.html              # Home con carrusel
├── busqueda.html           # Filtros de búsqueda
├── resultados.html         # Resultados + Mapa
├── css/                    # Estilos organizados
├── js/                     # JavaScript modular
└── data/                   # JSON mock data
```

## 📞 Contacto

- **Email**: info@match.pe
- **Teléfono**: +51 999457538
- **GitHub**: https://github.com/acairampoma/appinmobilario

## 📄 Licencia

© 2025 Match Property. Todos los derechos reservados.
