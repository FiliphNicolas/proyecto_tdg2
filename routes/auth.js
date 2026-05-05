const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../javascript/databasepg');

const router = express.Router();

// Validación estricta de JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error('ERROR CRÍTICO: JWT_SECRET no configurado o muy corto (mínimo 32 caracteres)');
  process.exit(1);
}

const REFRESH_SECRET = process.env.REFRESH_SECRET;
if (!REFRESH_SECRET || REFRESH_SECRET.length < 32) {
  console.error('ERROR CRÍTICO: REFRESH_SECRET no configurado o muy corto (mínimo 32 caracteres)');
  process.exit(1);
}

// Configuración de sesiones
const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutos de inactividad
const MAX_CONCURRENT_SESSIONS = 1;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
const ACCESS_TOKEN_EXPIRY = '15m'; // Access token corto
const REFRESH_TOKEN_EXPIRY = '7d'; // Refresh token largo

// Almacén temporal para rate limiting (en producción usar Redis)
const loginAttempts = new Map();
const failedAttempts = new Map();

// Función para crear hash de token
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Middleware de rate limiting para login
async function loginRateLimiter(req, res, next) {
  const identifier = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Limpiar intentos antiguos
  for (const [key, data] of loginAttempts.entries()) {
    if (now - data.timestamp > 60000) { // 1 minuto
      loginAttempts.delete(key);
    }
  }
  
  const attempts = loginAttempts.get(identifier);
  if (attempts && attempts.count >= 10 && now - attempts.timestamp < 60000) {
    return res.status(429).json({ 
      error: 'Demasiados intentos. Espera 1 minuto.',
      code: 'RATE_LIMITED'
    });
  }
  
  next();
}

// Verificar si cuenta está bloqueada
async function isAccountLocked(email) {
  const failed = failedAttempts.get(email);
  if (failed && failed.count >= MAX_LOGIN_ATTEMPTS) {
    if (Date.now() - failed.lastAttempt < LOCKOUT_DURATION) {
      const remaining = Math.ceil((LOCKOUT_DURATION - (Date.now() - failed.lastAttempt)) / 60000);
      return { locked: true, remainingMinutes: remaining };
    }
    // Reset después del período de bloqueo
    failedAttempts.delete(email);
  }
  return { locked: false };
}

// Registrar intento fallido
async function recordFailedAttempt(email) {
  const existing = failedAttempts.get(email) || { count: 0, lastAttempt: 0 };
  failedAttempts.set(email, {
    count: existing.count + 1,
    lastAttempt: Date.now()
  });
}

// Resetear intentos fallidos
async function resetFailedAttempts(email) {
  failedAttempts.delete(email);
}

// Generar tokens JWT
function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

// Función para limpiar sesiones expiradas
async function cleanupExpiredSessions() {
  try {
    await db.query('DELETE FROM user_sessions WHERE expires_at < NOW() OR (is_active = false AND created_at < NOW() - INTERVAL \'7 days\')');
  } catch (err) {
    console.error('Error limpiando sesiones expiradas:', err);
  }
}

// Función para registrar nueva sesión (ahora para refresh tokens)
async function createSession(userId, token, req, isRefreshToken = false) {
  try {
    const tokenHash = hashToken(token);
    const expiresAt = isRefreshToken 
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días para refresh
      : new Date(Date.now() + 15 * 60 * 1000); // 15 minutos para access
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const tokenType = isRefreshToken ? 'refresh' : 'access';

    const text = `
      INSERT INTO user_sessions (id_usuario, token_hash, ip_address, user_agent, expires_at, token_type)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;
    const values = [userId, tokenHash, ipAddress, userAgent, expiresAt, tokenType];
    
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

// Función para cerrar la sesión más antigua del usuario
async function closeOldestSession(userId) {
  try {
    await db.query(
      `UPDATE user_sessions 
       SET is_active = false 
       WHERE id IN (
         SELECT id FROM user_sessions 
         WHERE id_usuario = $1 AND is_active = true 
         ORDER BY created_at ASC 
         LIMIT 1
       )`,
      [userId]
    );
  } catch (err) {
    console.error('Error cerrando sesión más antigua:', err);
  }
}

// Middleware para proteger rutas (valida access tokens)
async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado', code: 'NO_TOKEN' });
  
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido. Usa: Bearer <token>', code: 'INVALID_FORMAT' });
  }
  
  const token = parts[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Verificar que sea un access token
    if (payload.type !== 'access') {
      return res.status(401).json({ 
        error: 'Tipo de token incorrecto. Usa un access token.',
        code: 'WRONG_TOKEN_TYPE'
      });
    }
    
    // Verificar que el usuario sigue activo
    const userCheck = await db.query('SELECT activo FROM "usuario" WHERE id_usuario = $1', [payload.id_usuario]);
    if (userCheck.rows.length === 0 || !userCheck.rows[0].activo) {
      return res.status(403).json({ 
        error: 'Cuenta desactivada o eliminada',
        code: 'ACCOUNT_DISABLED'
      });
    }
    
    req.user = payload;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado. Renueva tu sesión.',
        code: 'TOKEN_EXPIRED'
      });
    }
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
    }
    return res.status(401).json({ error: 'Error de autenticación', code: 'AUTH_ERROR' });
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

// Validación de fortaleza de contraseña
function validatePasswordStrength(password) {
  const errors = [];
  if (password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[a-z]/.test(password)) errors.push('Al menos una minúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos un número');
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Al menos un carácter especial');
  
  return {
    valid: errors.length === 0,
    errors,
    strength: password.length >= 12 && errors.length === 0 ? 'strong' : 
              password.length >= 8 && errors.length === 0 ? 'medium' : 'weak'
  };
}

// Registro de usuario
router.post('/register', loginRateLimiter, async (req, res) => {
  try {
    const { nombre, correo, contrasena, direccion, numero_cel, ciudad, rol, id_sede } = req.body;
    
    // Validación exhaustiva de campos
    const camposRequeridos = [];
    if (!nombre || nombre.trim().length < 2) camposRequeridos.push('nombre (mínimo 2 caracteres)');
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) camposRequeridos.push('correo válido');
    if (!contrasena) camposRequeridos.push('contraseña');
    
    if (camposRequeridos.length > 0) {
      return res.status(400).json({ 
        error: `Campos requeridos: ${camposRequeridos.join(', ')}`,
        code: 'MISSING_FIELDS'
      });
    }

    // Validar fortaleza de contraseña
    const passwordCheck = validatePasswordStrength(contrasena);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'La contraseña no cumple con los requisitos de seguridad',
        details: passwordCheck.errors,
        code: 'WEAK_PASSWORD'
      });
    }

    // Validar rol
    const rolesValidos = ['empleado', 'vendedor', 'gerente', 'administrador'];
    const rolFinal = rolesValidos.includes(rol) ? rol : 'empleado';

    // Validar sede si se proporciona
    let sedeValida = null;
    if (id_sede) {
      const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
      if (sedeCheck.rows.length === 0) {
        return res.status(400).json({ error: 'La sede especificada no existe', code: 'INVALID_SEDE' });
      }
      sedeValida = id_sede;
    } else {
      const defaultSede = await db.query('SELECT id_sede FROM sede LIMIT 1');
      if (defaultSede.rows.length > 0) {
        sedeValida = defaultSede.rows[0].id_sede;
      }
    }

    const hashed = await bcrypt.hash(contrasena, 12); // Cost factor aumentado a 12

    // Obtener el siguiente ID disponible
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id_usuario), 0) + 1 as next_id FROM "usuario"');
    const nextId = maxIdResult.rows[0].next_id;

    const text = 'INSERT INTO "usuario" (id_usuario, id_sede, nombre_usuario, contrasena, email, rol, activo, direccion, numero_cel, ciudad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id_usuario, nombre_usuario, email, rol, id_sede';
    const values = [nextId, sedeValida, nombre.trim(), hashed, correo.toLowerCase().trim(), rolFinal, true, direccion || null, numero_cel || null, ciudad || null];

    const result = await db.query(text, values);
    const user = result.rows[0];

    // Generar tokens
    const accessToken = generateAccessToken({ 
      id_usuario: user.id_usuario, 
      nombre_usuario: user.nombre_usuario, 
      rol: user.rol, 
      id_sede: user.id_sede,
      type: 'access'
    });
    
    const refreshToken = generateRefreshToken({
      id_usuario: user.id_usuario,
      type: 'refresh'
    });

    // Almacenar refresh token
    await createSession(user.id_usuario, refreshToken, req, true);

    res.status(201).json({ 
      ok: true, 
      user: {
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        rol: user.rol,
        id_sede: user.id_sede
      }, 
      accessToken,
      refreshToken,
      expiresIn: 900 // 15 minutos en segundos
    });
  } catch (err) {
    console.error('Error /api/register', err);
    if (err.code === '23505') {
      return res.status(409).json({ 
        error: 'El correo ya está registrado',
        code: 'EMAIL_EXISTS'
      });
    }
    res.status(500).json({ error: 'Error al registrar. Intenta nuevamente.', code: 'SERVER_ERROR' });
  }
});

// Login con medidas de seguridad profesionales
router.post('/login', loginRateLimiter, async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    
    if (!correo || !contrasena) {
      return res.status(400).json({ 
        error: 'Correo y contraseña son requeridos',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Verificar rate limiting por email
    const lockoutCheck = await isAccountLocked(correo.toLowerCase());
    if (lockoutCheck.locked) {
      return res.status(429).json({
        error: `Cuenta temporalmente bloqueada. Intenta en ${lockoutCheck.remainingMinutes} minutos.`,
        code: 'ACCOUNT_LOCKED',
        remainingMinutes: lockoutCheck.remainingMinutes
      });
    }

    // Limpiar sesiones expiradas
    await cleanupExpiredSessions();

    // Buscar usuario (sin revelar si existe o no)
    const text = 'SELECT id_usuario, nombre_usuario, contrasena, email, rol, activo FROM "usuario" WHERE email = $1 LIMIT 1';
    const result = await db.query(text, [correo.toLowerCase().trim()]);
    
    // Mensaje genérico para no revelar qué campo es incorrecto (prevención de enumeración)
    const genericError = 'Credenciales incorrectas. Verifica tu correo y contraseña.';
    
    if (result.rowCount === 0) {
      // Registrar intento fallido incluso si el usuario no existe
      await recordFailedAttempt(correo.toLowerCase());
      return res.status(401).json({ error: genericError, code: 'INVALID_CREDENTIALS' });
    }

    const user = result.rows[0];
    
    // Verificar si el usuario está activo
    if (!user.activo) {
      return res.status(403).json({
        error: 'Cuenta desactivada. Contacta al administrador.',
        code: 'ACCOUNT_DISABLED'
      });
    }

    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) {
      await recordFailedAttempt(correo.toLowerCase());
      const failed = failedAttempts.get(correo.toLowerCase());
      const remainingAttempts = MAX_LOGIN_ATTEMPTS - failed.count;
      
      return res.status(401).json({ 
        error: genericError, 
        code: 'INVALID_CREDENTIALS',
        warning: remainingAttempts <= 2 ? `${remainingAttempts} intentos restantes antes del bloqueo.` : null
      });
    }

    // Resetear intentos fallidos al lograr login exitoso
    await resetFailedAttempts(correo.toLowerCase());

    // Verificar sesiones activas
    const activeSessionsQuery = `
      SELECT COUNT(*) as active_count 
      FROM user_sessions 
      WHERE id_usuario = $1 AND is_active = true AND expires_at > NOW()
    `;
    const activeSessionsResult = await db.query(activeSessionsQuery, [user.id_usuario]);
    const activeCount = parseInt(activeSessionsResult.rows[0].active_count);

    // Generar tokens
    const accessToken = generateAccessToken({ 
      id_usuario: user.id_usuario, 
      nombre_usuario: user.nombre_usuario,
      rol: user.rol,
      id_sede: user.id_sede,
      type: 'access'
    });
    
    const refreshToken = generateRefreshToken({
      id_usuario: user.id_usuario,
      type: 'refresh'
    });

    // Almacenar refresh token
    await createSession(user.id_usuario, refreshToken, req, true);

    let message = '';
    if (activeCount >= MAX_CONCURRENT_SESSIONS) {
      await closeOldestSession(user.id_usuario);
      message = `Se ha cerrado tu sesión anterior. Solo se permite ${MAX_CONCURRENT_SESSIONS} sesión activa.`;
    }

    res.json({ 
      ok: true, 
      user: { 
        id_usuario: user.id_usuario, 
        nombre_usuario: user.nombre_usuario,
        email: user.email,
        rol: user.rol
      }, 
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos
      message,
      activeSessions: Math.min(activeCount + 1, MAX_CONCURRENT_SESSIONS)
    });
  } catch (err) {
    console.error('Error /api/login', err);
    res.status(500).json({ error: 'Error del servidor. Intenta nuevamente.', code: 'SERVER_ERROR' });
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

// Refresh token endpoint - renovar access token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido', code: 'MISSING_REFRESH_TOKEN' });
    }
    
    try {
      // Verificar el refresh token
      const payload = jwt.verify(refreshToken, REFRESH_SECRET);
      
      if (payload.type !== 'refresh') {
        return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN_TYPE' });
      }
      
      // Verificar que el refresh token existe en la base de datos
      const tokenHash = hashToken(refreshToken);
      const sessionCheck = await db.query(
        'SELECT id, id_usuario FROM user_sessions WHERE token_hash = $1 AND is_active = true AND expires_at > NOW()',
        [tokenHash]
      );
      
      if (sessionCheck.rows.length === 0) {
        return res.status(401).json({ 
          error: 'Sesión inválida o expirada. Inicia sesión nuevamente.',
          code: 'INVALID_SESSION'
        });
      }
      
      const userId = payload.id_usuario;
      
      // Obtener datos actualizados del usuario
      const userResult = await db.query(
        'SELECT id_usuario, nombre_usuario, email, rol, id_sede, activo FROM "usuario" WHERE id_usuario = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0 || !userResult.rows[0].activo) {
        return res.status(403).json({ error: 'Cuenta desactivada', code: 'ACCOUNT_DISABLED' });
      }
      
      const user = userResult.rows[0];
      
      // Generar nuevo access token
      const newAccessToken = generateAccessToken({
        id_usuario: user.id_usuario,
        nombre_usuario: user.nombre_usuario,
        rol: user.rol,
        id_sede: user.id_sede,
        type: 'access'
      });
      
      res.json({
        ok: true,
        accessToken: newAccessToken,
        expiresIn: 900, // 15 minutos
        user: {
          id_usuario: user.id_usuario,
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          rol: user.rol
        }
      });
      
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Sesión expirada. Inicia sesión nuevamente.',
          code: 'REFRESH_TOKEN_EXPIRED'
        });
      }
      return res.status(401).json({ error: 'Token inválido', code: 'INVALID_REFRESH_TOKEN' });
    }
  } catch (err) {
    console.error('Error /api/auth/refresh', err);
    res.status(500).json({ error: 'Error del servidor', code: 'SERVER_ERROR' });
  }
});

// Cambiar contraseña (requiere autenticación)
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id_usuario;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        error: 'Contraseña actual y nueva son requeridas',
        code: 'MISSING_PASSWORDS'
      });
    }
    
    // Validar fortaleza de nueva contraseña
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'La nueva contraseña no cumple los requisitos',
        details: passwordCheck.errors,
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Verificar contraseña actual
    const userResult = await db.query(
      'SELECT contrasena FROM "usuario" WHERE id_usuario = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado', code: 'USER_NOT_FOUND' });
    }
    
    const match = await bcrypt.compare(currentPassword, userResult.rows[0].contrasena);
    if (!match) {
      return res.status(401).json({ 
        error: 'Contraseña actual incorrecta',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }
    
    // Verificar que la nueva contraseña sea diferente
    const samePassword = await bcrypt.compare(newPassword, userResult.rows[0].contrasena);
    if (samePassword) {
      return res.status(400).json({
        error: 'La nueva contraseña debe ser diferente a la actual',
        code: 'SAME_PASSWORD'
      });
    }
    
    // Actualizar contraseña
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE "usuario" SET contrasena = $1 WHERE id_usuario = $2',
      [hashedNewPassword, userId]
    );
    
    // Cerrar todas las sesiones excepto la actual por seguridad
    const tokenHash = hashToken(req.token);
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE id_usuario = $1 AND token_hash != $2',
      [userId, tokenHash]
    );
    
    res.json({
      ok: true,
      message: 'Contraseña actualizada exitosamente. Otras sesiones han sido cerradas por seguridad.'
    });
    
  } catch (err) {
    console.error('Error /api/auth/change-password', err);
    res.status(500).json({ error: 'Error al cambiar contraseña', code: 'SERVER_ERROR' });
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

// ==================== RECUPERACIÓN DE CONTRASEÑA ====================

// Solicitar recuperación de contraseña
router.post('/forgot-password', loginRateLimiter, async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({ 
        error: 'Correo electrónico válido requerido',
        code: 'INVALID_EMAIL'
      });
    }
    
    // Buscar usuario
    const userResult = await db.query(
      'SELECT id_usuario, nombre_usuario, email FROM "usuario" WHERE email = $1 AND activo = true',
      [correo.toLowerCase().trim()]
    );
    
    // Mensaje genérico para no revelar si el correo existe
    const genericMessage = 'Si el correo existe en nuestra base de datos, recibirás instrucciones para recuperar tu contraseña.';
    
    if (userResult.rows.length === 0) {
      return res.json({ 
        ok: true, 
        message: genericMessage 
      });
    }
    
    const user = userResult.rows[0];
    
    // Generar token único para reset (válido por 1 hora)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
    
    // Guardar token en base de datos
    await db.query(
      `INSERT INTO password_reset_tokens (id_usuario, token_hash, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (id_usuario) 
       DO UPDATE SET token_hash = $2, expires_at = $3, created_at = NOW()`,
      [user.id_usuario, resetTokenHash, expiresAt]
    );
    
    // Construir link de reset
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pages/reset-password.html?token=${resetToken}`;
    
    // Para desarrollo: mostrar en consola
    console.log('\n========================================');
    console.log('RECUPERACIÓN DE CONTRASEÑA');
    console.log('========================================');
    console.log(`Usuario: ${user.nombre_usuario}`);
    console.log(`Email: ${user.email}`);
    console.log(`Link: ${resetLink}`);
    console.log('========================================\n');
    
    res.json({ 
      ok: true, 
      message: genericMessage,
      // Solo en desarrollo:
      devInfo: process.env.NODE_ENV === 'development' ? {
        resetLink,
        expiresIn: '1 hora'
      } : undefined
    });
    
  } catch (err) {
    console.error('Error /api/auth/forgot-password:', err);
    res.status(500).json({ 
      error: 'Error al procesar la solicitud. Intenta nuevamente.',
      code: 'SERVER_ERROR'
    });
  }
});

// Confirmar reset de contraseña con token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Token y nueva contraseña son requeridos',
        code: 'MISSING_FIELDS'
      });
    }
    
    // Validar fortaleza de contraseña
    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        error: 'La contraseña no cumple con los requisitos de seguridad',
        details: passwordCheck.errors,
        code: 'WEAK_PASSWORD'
      });
    }
    
    // Buscar token en base de datos
    const tokenHash = hashToken(token);
    const tokenResult = await db.query(
      `SELECT id_usuario FROM password_reset_tokens 
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        error: 'El enlace ha expirado o es inválido. Solicita uno nuevo.',
        code: 'INVALID_TOKEN'
      });
    }
    
    const userId = tokenResult.rows[0].id_usuario;
    
    // Verificar que el usuario existe y está activo
    const userResult = await db.query(
      'SELECT email FROM "usuario" WHERE id_usuario = $1 AND activo = true',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Usuario no encontrado o desactivado',
        code: 'USER_NOT_FOUND'
      });
    }
    
    // Actualizar contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE "usuario" SET contrasena = $1 WHERE id_usuario = $2',
      [hashedPassword, userId]
    );
    
    // Invalidar el token usado
    await db.query(
      'DELETE FROM password_reset_tokens WHERE id_usuario = $1',
      [userId]
    );
    
    // Cerrar todas las sesiones del usuario por seguridad
    await db.query(
      'UPDATE user_sessions SET is_active = false WHERE id_usuario = $1',
      [userId]
    );
    
    res.json({
      ok: true,
      message: 'Contraseña actualizada exitosamente. Inicia sesión con tu nueva contraseña.'
    });
    
  } catch (err) {
    console.error('Error /api/auth/reset-password:', err);
    res.status(500).json({
      error: 'Error al actualizar la contraseña',
      code: 'SERVER_ERROR'
    });
  }
});

// Verificar validez de token de reset (para frontend)
router.get('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({
        valid: false,
        error: 'Token requerido'
      });
    }
    
    const tokenHash = hashToken(token);
    const result = await db.query(
      `SELECT id_usuario FROM password_reset_tokens 
       WHERE token_hash = $1 AND expires_at > NOW()`,
      [tokenHash]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        valid: false,
        error: 'Token inválido o expirado'
      });
    }
    
    res.json({
      valid: true
    });
    
  } catch (err) {
    console.error('Error verify-reset-token:', err);
    res.status(500).json({
      valid: false,
      error: 'Error del servidor'
    });
  }
});

module.exports = { router, authMiddleware };
