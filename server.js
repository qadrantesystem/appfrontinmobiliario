const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;

// Middleware para remover .html de las URLs (redirección 301)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const newPath = req.path.slice(0, -5);
    return res.redirect(301, newPath);
  }
  next();
});

// Rutas limpias - servir archivos HTML sin extensión (ANTES de archivos estáticos)
const routes = ['index', 'busqueda', 'resultados', 'login', 'registro', 'recuperar'];

routes.forEach(route => {
  app.get(`/${route === 'index' ? '' : route}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', `${route}.html`));
  });
});

// Servir archivos estáticos (CSS, JS, imágenes) DESPUÉS de las rutas HTML
app.use(express.static(path.join(__dirname, 'frontend')));

// Fallback para rutas no encontradas (404)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🏢 Match Property running on http://localhost:${PORT}`);
});
