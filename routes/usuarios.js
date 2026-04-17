const express = require('express');
const db = require('../javascript/databasepg');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Obtener datos del usuario autenticado
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const text = 'SELECT id_usuario, nombre_usuario, email, rol, activo, id_sede, direccion, numero_cel, ciudad, fecha_creacion FROM "usuario" WHERE id_usuario = $1 LIMIT 1';
    const result = await db.query(text, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true, user: result.rows[0] });
  } catch (err) {
    console.error('Error /api/me', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar perfil de usuario
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const { nombre_usuario, email, id_sede, direccion, numero_cel, ciudad } = req.body;
    
    // Validaciones básicas
    if (!nombre_usuario || !email) {
      return res.status(400).json({ error: 'Nombre y email son requeridos' });
    }

    const text = `
      UPDATE "usuario" 
      SET nombre_usuario = $1, email = $2, id_sede = $3, direccion = $4, numero_cel = $5, ciudad = $6, fecha_actualizacion = NOW()
      WHERE id_usuario = $7 
      RETURNING id_usuario, nombre_usuario, email, rol, activo, id_sede, direccion, numero_cel, ciudad, fecha_creacion
    `;
    const values = [nombre_usuario, email, id_sede || 1, direccion || null, numero_cel || null, ciudad || null, id];
    
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json({ 
      ok: true, 
      user: result.rows[0],
      message: 'Perfil actualizado exitosamente'
    });
  } catch (err) {
    console.error('Error PUT /api/me', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El nombre de usuario o email ya existe' });
    }
    res.status(500).json({ error: 'Error al actualizar perfil: ' + err.message });
  }
});

// Cambiar contraseña
router.put('/me/password', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const { contrasena_actual, contrasena_nueva } = req.body;
    
    if (!contrasena_actual || !contrasena_nueva) {
      return res.status(400).json({ error: 'Contraseña actual y nueva son requeridas' });
    }

    // Verificar contraseña actual
    const userResult = await db.query('SELECT contrasena FROM "usuario" WHERE id_usuario = $1', [id]);
    if (userResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const bcrypt = require('bcrypt');
    const match = await bcrypt.compare(contrasena_actual, userResult.rows[0].contrasena);
    if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    // Actualizar contraseña
    const hashedNew = await bcrypt.hash(contrasena_nueva, 10);
    await db.query('UPDATE "usuario" SET contrasena = $1, fecha_actualizacion = NOW() WHERE id_usuario = $2', [hashedNew, id]);
    
    res.json({ 
      ok: true, 
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (err) {
    console.error('Error PUT /api/me/password', err);
    res.status(500).json({ error: 'Error al cambiar contraseña: ' + err.message });
  }
});

// Eliminar cuenta de usuario
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    
    // Verificar si el usuario tiene permisos para eliminarse
    const userResult = await db.query('SELECT rol FROM "usuario" WHERE id_usuario = $1', [id]);
    if (userResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    const user = userResult.rows[0];
    
    // No permitir eliminar administradores (opcional, puedes quitar esta restricción)
    if (user.rol === 'administrador') {
      return res.status(403).json({ error: 'No se puede eliminar una cuenta de administrador' });
    }

    // Eliminar usuario
    const result = await db.query('DELETE FROM "usuario" WHERE id_usuario = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json({ 
      ok: true, 
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error DELETE /api/me', err);
    res.status(500).json({ error: 'Error al eliminar cuenta: ' + err.message });
  }
});

// Listar todos los usuarios (solo administradores)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador
    const id = req.user.id_usuario;
    const userResult = await db.query('SELECT rol FROM "usuario" WHERE id_usuario = $1', [id]);
    if (userResult.rowCount === 0 || userResult.rows[0].rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden ver todos los usuarios' });
    }

    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams = [];
    
    if (search) {
      whereClause = 'WHERE nombre_usuario ILIKE $1 OR email ILIKE $1';
      queryParams.push(`%${search}%`);
    }
    
    const countQuery = `SELECT COUNT(*) as total FROM "usuario" ${whereClause}`;
    const countResult = await db.query(countQuery, queryParams);
    
    queryParams.push(limit, offset);
    const usersQuery = `
      SELECT id_usuario, nombre_usuario, email, rol, activo, id_sede, direccion, numero_cel, ciudad, fecha_creacion 
      FROM "usuario" 
      ${whereClause}
      ORDER BY fecha_creacion DESC 
      LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}
    `;
    
    const usersResult = await db.query(usersQuery, queryParams);
    
    res.json({
      ok: true,
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
  } catch (err) {
    console.error('Error GET /api/usuarios', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Activar/desactivar usuario (solo administradores)
router.put('/:id/estado', authMiddleware, async (req, res) => {
  try {
    // Verificar si es administrador
    const adminId = req.user.id_usuario;
    const adminResult = await db.query('SELECT rol FROM "usuario" WHERE id_usuario = $1', [adminId]);
    if (adminResult.rowCount === 0 || adminResult.rows[0].rol !== 'administrador') {
      return res.status(403).json({ error: 'Acceso denegado. Solo administradores pueden cambiar estados' });
    }

    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ error: 'El campo activo debe ser booleano' });
    }

    const text = `
      UPDATE "usuario" 
      SET activo = $1, fecha_actualizacion = NOW()
      WHERE id_usuario = $2 
      RETURNING id_usuario, nombre_usuario, email, rol, activo, id_sede
    `;
    
    const result = await db.query(text, [activo, id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    
    res.json({ 
      ok: true, 
      user: result.rows[0],
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (err) {
    console.error('Error PUT /api/usuarios/:id/estado', err);
    res.status(500).json({ error: 'Error al cambiar estado: ' + err.message });
  }
});

module.exports = router;
