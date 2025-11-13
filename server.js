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
const routes = ['index', 'busqueda', 'resultados', 'resultados-nueva', 'login', 'registro', 'recuperar', 'dashboard', 'verificar'];

routes.forEach(route => {
  app.get(`/${route === 'index' ? '' : route}`, (req, res) => {
    console.log(`🔄 Ruta solicitada: ${req.path} → Sirviendo: ${route}.html`);
    res.sendFile(path.join(__dirname, 'frontend', `${route}.html`));
  });
});

// ✅ Ruta para sobre-nosotros (redirige a index con anchor)
app.get('/sobre-nosotros', (req, res) => {
  res.redirect('/#sobre-nosotros');
});

// ✅ Ruta explícita para resultados-nueva
app.get('/resultados-nueva', (req, res) => {
  console.log('🎯 Sirviendo resultados-nueva.html');
  res.sendFile(path.join(__dirname, 'frontend', 'resultados-nueva.html'));
});

// ✅ Servir JS con cache moderada (5 minutos para permitir actualizaciones)
app.use('/js', express.static(path.join(__dirname, 'frontend', 'js'), {
  maxAge: '5m', // 5 minutos - balance entre performance y actualización
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos
  }
}));

// Servir CSS con cache moderada
app.use('/css', express.static(path.join(__dirname, 'frontend', 'css'), {
  maxAge: '1h', // 1 hora para CSS - permite ver cambios más rápido
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'public, max-age=3600'); // 1 hora
  }
}));

// Servir archivos estáticos (imágenes, otros archivos)
app.use(express.static(path.join(__dirname, 'frontend'), {
  maxAge: '1d', // 1 día para imágenes
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 día para imágenes
    } else {
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutos para otros
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
