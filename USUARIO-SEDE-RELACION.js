/**
 * GUÍA: USO DE RELACIÓN USUARIO-SEDE
 * ===================================
 * 
 * Se agregó la columna id_sede como llave foránea en la tabla usuario
 * Cada usuario ahora pertenece a una sede específica
 */

// ============================================
// 1. QUERY SQL: OBTENER USUARIOS POR SEDE
// ============================================

const queries = {
  // Obtener todos los usuarios de una sede específica
  usuariosPorSede: `
    SELECT 
      u.id_usuario,
      u.nombre_usuario,
      u.email,
      u.rol,
      s.nombre as sede_nombre,
      s.ciudad
    FROM usuario u
    JOIN sede s ON u.id_sede = s.id_sede
    WHERE u.id_sede = $1
    ORDER BY u.nombre_usuario
  `,

  // Obtener información completa del usuario con su sede
  usuarioConSede: `
    SELECT 
      u.id_usuario,
      u.nombre_usuario,
      u.email,
      u.rol,
      u.activo,
      s.id_sede,
      s.nombre as sede_nombre,
      s.ciudad,
      s.direccion,
      s.telefono
    FROM usuario u
    LEFT JOIN sede s ON u.id_sede = s.id_sede
    WHERE u.id_usuario = $1
  `,

  // Listar sedes con cantidad de usuarios
  sedesConUsuarios: `
    SELECT 
      s.id_sede,
      s.nombre,
      s.ciudad,
      COUNT(u.id_usuario) as cantidad_usuarios
    FROM sede s
    LEFT JOIN usuario u ON s.id_sede = u.id_sede
    GROUP BY s.id_sede, s.nombre, s.ciudad
    ORDER BY s.nombre
  `,

  // Crear nuevo usuario asignando sede
  crearUsuarioConSede: `
    INSERT INTO usuario (id_usuario, id_sede, nombre_usuario, contrasena, email, rol, activo, ciudad)
    VALUES (
      (SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM usuario),
      $1,  -- id_sede
      $2,  -- nombre_usuario
      $3,  -- contrasena (hasheada)
      $4,  -- email
      $5,  -- rol
      TRUE,
      $6   -- ciudad
    )
    RETURNING id_usuario, nombre_usuario, email, rol, id_sede
  `,

  // Actualizar sede de un usuario
  actualizarSedeUsuario: `
    UPDATE usuario
    SET id_sede = $1
    WHERE id_usuario = $2
    RETURNING id_usuario, nombre_usuario, id_sede
  `
};

// ============================================
// 2. ENDPOINTS DE EJEMPLO EN EXPRESS
// ============================================

const express = require('express');
const db = require('../javascript/databasepg');
const { auditMiddleware, auditQuery } = require('../javascript/audit-middleware');
const { authMiddleware } = require('./auth');

const router = express.Router();

/**
 * GET /api/usuarios/sede/:sedeId
 * Obtener todos los usuarios de una sede
 */
router.get('/sede/:sedeId', authMiddleware, async (req, res) => {
  try {
    const { sedeId } = req.params;
    
    const result = await db.query(queries.usuariosPorSede, [sedeId]);
    
    res.json({
      ok: true,
      sede_id: sedeId,
      total: result.rows.length,
      usuarios: result.rows
    });
  } catch (err) {
    console.error('Error obteniendo usuarios por sede:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/usuarios/:id/with-sede
 * Obtener usuario con información de su sede
 */
router.get('/:id/with-sede', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(queries.usuarioConSede, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      usuario: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/sedes/with-usuarios
 * Listar todas las sedes con cantidad de usuarios
 */
router.get('/sedes/with-usuarios', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(queries.sedesConUsuarios);
    
    res.json({
      ok: true,
      total_sedes: result.rows.length,
      sedes: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/usuarios
 * Crear nuevo usuario con sede (con auditoría)
 */
router.post('/', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const { id_sede, nombre_usuario, contrasena, email, rol, ciudad } = req.body;
    
    // Validar que la sede existe
    const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
    if (sedeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Sede no encontrada' });
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const result = await auditQuery(
      db.pool,
      req.auditUserId,
      queries.crearUsuarioConSede,
      [id_sede, nombre_usuario, hashedPassword, email, rol || 'empleado', ciudad]
    );

    res.status(201).json({
      ok: true,
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/usuarios/:id/sede
 * Cambiar la sede de un usuario (con auditoría)
 */
router.put('/:id/sede', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { id_sede } = req.body;
    
    if (!id_sede) {
      return res.status(400).json({ error: 'id_sede es requerido' });
    }

    // Validar que la sede existe
    const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
    if (sedeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Sede no encontrada' });
    }

    const result = await auditQuery(
      db.pool,
      req.auditUserId,
      queries.actualizarSedeUsuario,
      [id_sede, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Sede del usuario actualizada exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ============================================
// 3. EJEMPLOS DE USO DESDE CLIENTE
// ============================================

/*
CREAR USUARIO CON SEDE:
REQUEST POST /api/usuarios
{
  "id_sede": 1,
  "nombre_usuario": "juan_vendedor",
  "email": "juan@systemsware.com",
  "contrasena": "password123",
  "rol": "vendedor",
  "ciudad": "Bogotá"
}

RESPONSE:
{
  "ok": true,
  "message": "Usuario creado exitosamente",
  "usuario": {
    "id_usuario": 4,
    "nombre_usuario": "juan_vendedor",
    "email": "juan@systemsware.com",
    "rol": "vendedor",
    "id_sede": 1
  }
}

---

OBTENER USUARIOS DE UNA SEDE:
REQUEST GET /api/usuarios/sede/1

RESPONSE:
{
  "ok": true,
  "sede_id": 1,
  "total": 2,
  "usuarios": [
    {
      "id_usuario": 1,
      "nombre_usuario": "admin",
      "email": "admin@systemsware.com",
      "rol": "admin",
      "sede_nombre": "Sede Principal",
      "ciudad": "Bogotá"
    },
    {
      "id_usuario": 2,
      "nombre_usuario": "vendedor1",
      "email": "vendedor@systemsware.com",
      "rol": "vendedor",
      "sede_nombre": "Sede Principal",
      "ciudad": "Bogotá"
    }
  ]
}

---

CAMBIAR SEDE DE UN USUARIO:
REQUEST PUT /api/usuarios/3/sede
{
  "id_sede": 1
}

RESPONSE:
{
  "ok": true,
  "message": "Sede del usuario actualizada exitosamente",
  "usuario": {
    "id_usuario": 3,
    "nombre_usuario": "empleado1",
    "id_sede": 1
  }
}

---

VER SEDES CON CANTIDAD DE USUARIOS:
REQUEST GET /api/sedes/with-usuarios

RESPONSE:
{
  "ok": true,
  "total_sedes": 2,
  "sedes": [
    {
      "id_sede": 1,
      "nombre": "Sede Principal",
      "ciudad": "Bogotá",
      "cantidad_usuarios": 3
    },
    {
      "id_sede": 2,
      "nombre": "Sede Sur",
      "ciudad": "Bogotá",
      "cantidad_usuarios": 1
    }
  ]
}
*/
