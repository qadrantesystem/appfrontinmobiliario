const express = require('express');
const path = require('path');
const compression = require('compression');
const app = express();
const PORT = process.env.PORT || 3002;
const HOST = '0.0.0.0'; // ✅ Railway necesita esto

// ✅ Compresión GZIP para móvil (muy importante)
app.use(compression());

// ✅ Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Powered-By', 'Match Property');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// ✅ Logging SOLO en desarrollo (desactivado para producción)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });
}

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

// ✅ Servir JS con cache agresiva para móvil
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js'), {
  maxAge: '1d', // 1 día para mejor rendimiento móvil
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    // Solo desactivar cache para archivos que estamos modificando activamente
    if (filePath.includes('profile-modal.js') || filePath.includes('dashboard-app.js')) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día
    }
  }
}));

// Servir CSS con cache agresiva
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css'), {
  maxAge: '7d', // 7 días para CSS
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=604800'); // 7 días
  }
}));

// Servir imágenes con cache muy agresiva
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '30d', // 30 días para imágenes estáticas
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30 días
    } else {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día para otros
    }
  }
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
