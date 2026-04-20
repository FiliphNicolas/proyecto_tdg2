const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../javascript/databasepg');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'systemsware_secret_change_this';
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos en milisegundos
const MAX_CONCURRENT_SESSIONS = 3; // Máximo de sesiones simultáneas por usuario

// Función para crear hash de token
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Función para limpiar sesiones expiradas
async function cleanupExpiredSessions() {
  try {
    await db.query('DELETE FROM user_sessions WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL \'7 days\')');
  } catch (err) {
    console.error('Error limpiando sesiones expiradas:', err);
  }
}

// Función para registrar nueva sesión
async function createSession(userId, token, req) {
  try {
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 horas
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';

    const text = `
      INSERT INTO user_sessions (id_usuario, token_hash, ip_address, user_agent, expires_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    const values = [userId, tokenHash, ipAddress, userAgent, expiresAt];
    
    await db.query(text, values);
  } catch (err) {
    console.error('Error creando sesión:', err);
  }
}

// Función para verificar sesión activa
async function validateSession(userId, token) {
  try {
    const tokenHash = hashToken(token);
    const text = `
      SELECT id FROM user_sessions 
      WHERE id_usuario = $1 AND token_hash = $2 
      AND is_active = true AND expires_at > NOW()
      LIMIT 1
    `;
    const result = await db.query(text, [userId, tokenHash]);
    return result.rows.length > 0;
  } catch (err) {
    console.error('Error validando sesión:', err);
    return false;
  }
}

// Función para desactivar sesión
async function deactivateSession(userId, token) {
  try {
    const tokenHash = hashToken(token);
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE id_usuario = $1 AND token_hash = $2',
      [userId, tokenHash]
    );
  } catch (err) {
    console.error('Error desactivando sesión:', err);
  }
}

// Middleware para proteger rutas
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Formato de token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Validar sesión activa en base de datos
    const isValidSession = await validateSession(payload.id_usuario, token);
    if (!isValidSession) {
      return res.status(401).json({ 
        error: 'Sesión no válida o expirada',
        code: 'INVALID_SESSION'
      });
    }
    
    // Verificar timeout de sesión (10 minutos)
    const currentTime = Date.now();
    const lastActivity = payload.lastActivity || payload.iat * 1000;
    
    if (currentTime - lastActivity > SESSION_TIMEOUT) {
      // Desactivar sesión por timeout
      await deactivateSession(payload.id_usuario, token);
      return res.status(401).json({ 
        error: 'Sesión expirada por inactividad',
        code: 'SESSION_TIMEOUT'
      });
    }
    
    // Actualizar última actividad
    payload.lastActivity = currentTime;
    req.user = payload;
    req.token = token;
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
    const { nombre, correo, contrasena, direccion, numero_cel, ciudad, rol, id_sede } = req.body;
    if (!nombre || !correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    // Validar rol
    const rolesValidos = ['empleado', 'vendedor', 'gerente', 'administrador'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'empleado';

    // Validar sede si se proporciona
    let sedeValida = null;
    if (id_sede) {
      const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
      if (sedeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'La sede especificada no existe' });
      }
      sedeValida = id_sede;
    } else {
      // Si no especifica sede, usar la primera disponible
      const defaultSede = await db.query('SELECT id_sede FROM sede LIMIT 1');
      if (defaultSede.rows.length > 0) {
        sedeValida = defaultSede.rows[0].id_sede;
      }
    }

    const hashed = await bcrypt.hash(contrasena, 10);

    // Obtener el siguiente ID disponible
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id_usuario), 0) + 1 as next_id FROM "usuario"');
    const nextId = maxIdResult.rows[0].next_id;

    const text = 'INSERT INTO "usuario" (id_usuario, id_sede, nombre_usuario, contrasena, email, rol, activo, direccion, numero_cel, ciudad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id_usuario, nombre_usuario, email, rol, id_sede';
    const values = [nextId, sedeValida, nombre, hashed, correo, rolFinal, true, direccion || null, numero_cel || null, ciudad || null];

    const result = await db.query(text, values);
    const user = result.rows[0];

    const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario, rol: user.rol, id_sede: user.id_sede }, JWT_SECRET, { expiresIn: '8h' });

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

    // Limpiar sesiones expiradas
    await cleanupExpiredSessions();

    const text = 'SELECT id_usuario, nombre_usuario, contrasena FROM "usuario" WHERE email = $1 LIMIT 1';
    const values = [correo];
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(401).json({ error: ' Correo electrónico no registrado' });

    const user = result.rows[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ error: ' Contraseña incorrecta' });

    // Verificar sesiones activas actuales
    const activeSessionsQuery = `
      SELECT COUNT(*) as active_count 
      FROM user_sessions 
      WHERE id_usuario = $1 AND is_active = true AND expires_at > NOW()
    `;
    const activeSessionsResult = await db.query(activeSessionsQuery, [user.id_usuario]);
    const activeCount = parseInt(activeSessionsResult.rows[0].active_count);

    const token = jwt.sign({ 
      id_usuario: user.id_usuario, 
      nombre_usuario: user.nombre_usuario,
      lastActivity: Date.now()
    }, JWT_SECRET, { expiresIn: '8h' });

    // Crear nueva sesión
    await createSession(user.id_usuario, token, req);

    let message = '';
    if (activeCount >= MAX_CONCURRENT_SESSIONS) {
      message = `Se ha alcanzado el límite de ${MAX_CONCURRENT_SESSIONS} sesiones simultáneas. La sesión más antigua ha sido cerrada automáticamente.`;
    }

    res.json({ 
      ok: true, 
      user: { id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, 
      token,
      message,
      activeSessions: Math.min(activeCount + 1, MAX_CONCURRENT_SESSIONS)
    });
  } catch (err) {
    console.error('Error /api/login', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Obtener datos del usuario autenticado - MOVIDO A routes/usuarios.js

// Obtener datos del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    // El middleware authMiddleware ya estableció req.user
    res.json({ 
      ok: true, 
      user: {
        id_usuario: req.user.id_usuario,
        nombre_usuario: req.user.nombre_usuario
      }
    });
  } catch (err) {
    console.error('Error /api/auth/me', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await deactivateSession(req.user.id_usuario, req.token);
    res.json({ ok: true, message: 'Sesión cerrada exitosamente' });
  } catch (err) {
    console.error('Error /api/logout', err);
    res.status(500).json({ error: 'Error al cerrar sesión: ' + err.message });
  }
});

// Logout de todas las sesiones del usuario
router.post('/logout-all', authMiddleware, async (req, res) => {
  try {
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE id_usuario = $1',
      [req.user.id_usuario]
    );
    res.json({ ok: true, message: 'Todas las sesiones han sido cerradas' });
  } catch (err) {
    console.error('Error /api/logout-all', err);
    res.status(500).json({ error: 'Error al cerrar todas las sesiones: ' + err.message });
  }
});

// Ver sesiones activas del usuario
router.get('/sessions', authMiddleware, async (req, res) => {
  try {
    const text = `
      SELECT id, ip_address, user_agent, created_at, last_activity, expires_at
      FROM user_sessions 
      WHERE id_usuario = $1 AND is_active = true AND expires_at > NOW()
      ORDER BY created_at DESC
    `;
    const result = await db.query(text, [req.user.id_usuario]);
    
    res.json({ 
      ok: true, 
      sessions: result.rows,
      activeCount: result.rows.length,
      maxSessions: MAX_CONCURRENT_SESSIONS
    });
  } catch (err) {
    console.error('Error /api/sessions', err);
    res.status(500).json({ error: 'Error al obtener sesiones: ' + err.message });
  }
});

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
