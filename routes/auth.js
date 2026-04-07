const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../javascript/databasepg');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'systemsware_secret_change_this';
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos

// Middleware para proteger rutas
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Formato de token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Verificar timeout de sesión (10 minutos)
    const currentTime = Date.now();
    const lastActivity = payload.lastActivity || payload.iat * 1000;
    
    if (currentTime - lastActivity > SESSION_TIMEOUT) {
      return res.status(401).json({ 
        error: 'Sesión expirada por inactividad',
        code: 'SESSION_TIMEOUT'
      });
    }
    
    // Actualizar última actividad
    payload.lastActivity = currentTime;
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// Endpoint para crear usuario de prueba (solo para desarrollo) - SIN PROTECCIÓN
router.post('/create-test-user', async (req, res) => {
  try {
    // Verificar si ya existe el usuario
    const existingUser = await db.query('SELECT id_usuario FROM "usuario" WHERE email = $1', ['test@systemsware.com']);
    
    if (existingUser.rowCount > 0) {
      return res.json({ ok: true, message: 'Usuario de prueba ya existe', credentials: { email: 'test@systemsware.com', password: '123456' } });
    }

    // Crear usuario de prueba
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    const text = 'INSERT INTO "usuario" (nombre_usuario, contrasena, email, rol, activo, direccion, numero_cel, ciudad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_usuario, nombre_usuario, email';
    const values = ['admin', hashedPassword, 'test@systemsware.com', 'administrador', true, 'Calle Principal #123', '+1 (555) 123-4567', 'Ciudad Principal'];
    
    const result = await db.query(text, values);

    res.json({ 
      ok: true, 
      message: 'Usuario de prueba creado exitosamente',
      credentials: { email: 'test@systemsware.com', password: '123456' },
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Error /api/create-test-user', err);
    res.status(500).json({ error: 'Error al crear usuario de prueba: ' + err.message });
  }
});

// Registro de usuario
router.post('/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena, direccion, numero_cel, ciudad } = req.body;
    if (!nombre || !correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const hashed = await bcrypt.hash(contrasena, 10);

    // Obtener el siguiente ID disponible
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id_usuario), 0) + 1 as next_id FROM "usuario"');
    const nextId = maxIdResult.rows[0].next_id;

    const text = 'INSERT INTO "usuario" (id_usuario, nombre_usuario, contrasena, email, rol, activo, direccion, numero_cel, ciudad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id_usuario, nombre_usuario, email';
    const values = [nextId, nombre, hashed, correo, 'empleado', true, direccion || null, numero_cel || null, ciudad || null];

    const result = await db.query(text, values);
    const user = result.rows[0];

    const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ ok: true, user, token });
  } catch (err) {
    console.error('Error /api/register', err);
    if (err.code === '23505') return res.status(409).json({ error: 'El usuario o correo ya existe' });
    res.status(500).json({ error: 'Error al registrar: ' + err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const text = 'SELECT id_usuario, nombre_usuario, contrasena FROM "usuario" WHERE email = $1 LIMIT 1';
    const values = [correo];
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(401).json({ error: ' Correo electrónico no registrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ error: ' Contraseña incorrecta' });

    const token = jwt.sign({ 
      id_usuario: user.id_usuario, 
      nombre_usuario: user.nombre_usuario,
      lastActivity: Date.now()
    }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ ok: true, user: { id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, token });
  } catch (err) {
    console.error('Error /api/login', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Obtener datos del usuario autenticado - MOVIDO A routes/usuarios.js

// Endpoint para probar conexión
router.get('/test-connection', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as current_time, version() as db_version');
    res.json({ 
      ok: true, 
      connected: true,
      timestamp: result.rows[0].current_time,
      version: result.rows[0].db_version
    });
  } catch (err) {
    console.error('Error /api/test-connection', err);
    res.status(500).json({ 
      ok: false, 
      connected: false,
      error: err.message 
    });
  }
});

module.exports = { router, authMiddleware };
