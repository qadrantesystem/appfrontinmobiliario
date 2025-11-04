const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0'; // ✅ Railway necesita esto

// ✅ Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Match Property');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ✅ Logging middleware para debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ✅ Health check endpoint para Railway
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Middleware para remover .html de las URLs (redirección 301)
app.use((req, res, next) => {
  if (req.path.endsWith('.html')) {
    const newPath = req.path.slice(0, -5);
    return res.redirect(301, newPath);
  }
  next();
});

// Rutas limpias - servir archivos HTML sin extensión (ANTES de archivos estáticos)
const routes = ['index', 'busqueda', 'resultados', 'login', 'registro', 'recuperar', 'dashboard', 'verificar'];

routes.forEach(route => {
  app.get(`/${route === 'index' ? '' : route}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', `${route}.html`));
  });
});

// ✅ Ruta para sobre-nosotros (redirige a index con anchor)
app.get('/sobre-nosotros', (req, res) => {
  res.redirect('/#sobre-nosotros');
});

// ✅ Servir JS con cache para mejorar rendimiento en móvil
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js'), {
  maxAge: '1h', // 1 hora de cache (buen balance para desarrollo)
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Solo desactivar cache para archivos que estamos modificando activamente
    if (filePath.includes('profile-modal.js') || filePath.includes('dashboard-app.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hora
    }
  }
}));

// Servir otros archivos estáticos (CSS, imágenes) con cache
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Fallback para rutas no encontradas (404)
app.get('*', (req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`🏢 Match Property Server Started!`);
  console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   - Host: ${HOST}`);
  console.log(`   - Port: ${PORT}`);
  console.log(`   - URL: http://localhost:${PORT}`);
  console.log(`✅ Server ready and listening...`);
});
