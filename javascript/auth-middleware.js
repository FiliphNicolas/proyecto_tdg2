const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET || 'systemsware_secret_change_this';
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos

// Middleware para proteger páginas HTML
function protectPages(req, res, next) {
  const auth = req.headers.authorization || req.headers.cookie?.split('token=')[1]?.split(';')[0];
  if (!auth) {
    return res.redirect('/iniciar-sesion.html');
  }
  const token = auth.startsWith('Bearer ') ? auth.split(' ')[1] : auth;
  try {
    const payload = jwt.verify(token, JWT_SECRET);

    // Verificar timeout de sesión (10 minutos)
    const currentTime = Date.now();
    const lastActivity = payload.lastActivity || payload.iat * 1000;

    if (currentTime - lastActivity > SESSION_TIMEOUT) {
      return res.redirect('/iniciar-sesion.html');
    }

    // Actualizar última actividad
    payload.lastActivity = currentTime;
    req.user = payload;
    next();
  } catch (err) {
    return res.redirect('/iniciar-sesion.html');
  }
}

// Función para servir páginas protegidas
function serveProtectedPage(req, res) {
  const page = req.path;
  const filePath = path.join(__dirname, 'pages', page);
  res.sendFile(filePath);
}

module.exports = { protectPages, serveProtectedPage };