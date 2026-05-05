require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./javascript/databasepg');
const { protectPages, serveProtectedPage } = require('./javascript/auth-middleware');
const fileUpload = require('express-fileupload');
const { router: authRouter } = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const productosRouter = require('./routes/productos');
const inventarioRouter = require('./routes/inventario');
const auditoriaRouter = require('./routes/auditoria');
const pedidosRouter = require('./routes/pedidos');
const clientesRouter = require('./routes/clientes');
const sedesRouter = require('./routes/sedes');
const estadisticasRouter = require('./routes/estadisticas');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para subir archivos
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 }, // 50KB
  abortOnLimit: true,
  responseOnLimit: 'Archivo demasiado grande'
}));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// --- API endpoints defined below ---
// (Static files are served after so that POST/PUT/etc. don't trigger 405 responses)

// --- API Routes ---
// Usar rutas modularizadas
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/inventario', inventarioRouter);
app.use('/api', productosRouter);
app.use('/api/auditoria', auditoriaRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/sedes', sedesRouter);
app.use('/api/estadisticas', estadisticasRouter);

// Inicializar base de datos al iniciar el servidor
const initializeServer = async () => {
  try {
    console.log(' Inicializando servidor con PostgreSQL...');
    
    // Usar la inicialización unificada de databasepg.js
    await db.initializeServer();
    
    console.log(' Servidor inicializado correctamente');
  } catch (error) {
    console.error(' Error al inicializar el servidor:', error);
    process.exit(1);
  }
};


// Servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Servir páginas HTML desde carpeta pages
app.use(express.static(path.join(__dirname, 'pages')));

// Servir página principal (login) - sin protección
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'iniciar-sesion.html'));
});

// También permitir acceso directo a iniciar-sesion.html - sin protección
app.get('/iniciar-sesion.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'iniciar-sesion.html'));
});


// Servir páginas HTML protegidas (nota: inicio.html se sirve sin protección del servidor
// porque la protección la maneja el frontend con AuthService/localStorage)
app.get(['/perfil.html', '/productos.html', '/gestion-inventario.html', '/reporte-inventario.html', '/servicio.html', '/test-sesion-timeout.html'], protectPages, serveProtectedPage);

// Páginas que manejan su propia autenticación en el frontend
app.get('/inicio.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages', 'inicio.html'));
});


// Iniciar servidor
initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(` Server running on port ${PORT}`);
    console.log(` Open http://localhost:${PORT} in your browser`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(5);
});
