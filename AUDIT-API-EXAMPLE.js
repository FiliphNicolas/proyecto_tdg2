/**
 * GUÍA DE INTEGRACIÓN: MIDDLEWARE DE AUDITORÍA EN RUTAS
 * ======================================================
 * 
 * Este archivo muestra ejemplos de cómo integrar el middleware de auditoría
 * en tus rutas de Express para registrar automáticamente todos los cambios.
 */

// ============================================
// 1. IMPORTAR EL MIDDLEWARE
// ============================================
// En el inicio del archivo de ruta:
// const { auditMiddleware, auditQuery } = require('../javascript/audit-middleware');
// const db = require('../javascript/databasepg');
// const { authMiddleware } = require('./auth');

// ============================================
// 2. OPCIÓN A: USAR MIDDLEWARE EN RUTAS ESPECÍFICAS
// ============================================
// Para cada ruta que modifique datos (POST, PUT, DELETE):

// router.put('/me', auditMiddleware, authMiddleware, async (req, res) => {
//   try {
//     const id = req.user.id_usuario;
//     const { nombre_usuario, email } = req.body;
//
//     // Usar auditQuery en lugar de db.query para registrar el cambio
//     const text = `
//       UPDATE "usuario" 
//       SET nombre_usuario = $1, email = $2
//       WHERE id_usuario = $3 
//       RETURNING *
//     `;
//     const values = [nombre_usuario, email, id];
//     
//     const result = await auditQuery(db.pool, req.auditUserId, text, values);
//     res.json({ ok: true, user: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// ============================================
// 3. OPCIÓN B: APLICAR GLOBALMENTE EN server.js
// ============================================
// En server.js, después de las rutas de lectura, agrega:

// const { auditMiddleware } = require('./javascript/audit-middleware');
// 
// // Aplicar middleware global para auditoría
// app.use((req, res, next) => {
//   // Aplicar auditoría solo a métodos que modifican datos
//   if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
//     auditMiddleware(req, res, next);
//   } else {
//     next();
//   }
// });

// ============================================
// 4. EJEMPLO COMPLETO: RUTA CON AUDITORÍA
// ============================================

const express = require('express');
const db = require('../javascript/databasepg');
const { auditMiddleware, auditQuery } = require('../javascript/audit-middleware');
const { authMiddleware } = require('./auth');

const router = express.Router();

/**
 * CREAR usuario (auditoría)
 * POST /api/usuarios
 * Registra: Quién creó el usuario, cuándo, y los datos
 */
router.post('/', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    // Validar que el usuario sea admin
    const adminCheck = await db.query(
      'SELECT rol FROM "usuario" WHERE id_usuario = $1',
      [req.user.id_usuario]
    );
    if (adminCheck.rows[0]?.rol !== 'administrador') {
      return res.status(403).json({ error: 'Solo administradores pueden crear usuarios' });
    }

    const { nombre_usuario, email, contrasena, rol } = req.body;
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    const text = `
      INSERT INTO "usuario" (id_usuario, nombre_usuario, contrasena, email, rol, activo)
      VALUES ((SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM "usuario"), $1, $2, $3, $4, TRUE)
      RETURNING id_usuario, nombre_usuario, email, rol
    `;
    const values = [nombre_usuario, hashedPassword, email, rol || 'empleado'];

    // ⭐ USAR auditQuery PARA REGISTRAR EN AUDITORÍA
    const result = await auditQuery(
      db.pool,
      req.auditUserId,  // Quién hace el cambio
      text,
      values
    );

    res.status(201).json({
      ok: true,
      message: 'Usuario creado exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    console.error('Error creando usuario:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * ACTUALIZAR usuario (auditoría)
 * PUT /api/usuarios/:id
 * Registra: Quién cambió qué, cuándo, y los valores anteriores/nuevos
 */
router.put('/:id', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre_usuario, email, rol, activo } = req.body;

    const text = `
      UPDATE "usuario" 
      SET nombre_usuario = $1, email = $2, rol = $3, activo = $4
      WHERE id_usuario = $5
      RETURNING *
    `;
    const values = [nombre_usuario, email, rol, activo, id];

    // ⭐ USAR auditQuery PARA REGISTRAR EN AUDITORÍA
    const result = await auditQuery(
      db.pool,
      req.auditUserId,  // Quién hace el cambio
      text,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Usuario actualizado exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * ELIMINAR usuario (auditoría)
 * DELETE /api/usuarios/:id
 * Registra: Quién eliminó al usuario, cuándo, y los datos del usuario eliminado
 */
router.delete('/:id', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;

    const text = `
      DELETE FROM "usuario"
      WHERE id_usuario = $1
      RETURNING id_usuario, nombre_usuario, email
    `;
    const values = [id];

    // ⭐ USAR auditQuery PARA REGISTRAR EN AUDITORÍA
    const result = await auditQuery(
      db.pool,
      req.auditUserId,  // Quién hace el cambio
      text,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({
      ok: true,
      message: 'Usuario eliminado exitosamente',
      usuario: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ============================================
// 5. VERIFICAR AUDITORÍA EN BD
// ============================================
// Después de hacer cambios a través de la API:
//
// SELECT * FROM auditoria ORDER BY fecha_accion DESC;
//
// Verás registros como:
// {
//   id_auditoria: 1,
//   id_usuario: 2,                    ← Quién hizo el cambio
//   tabla_afectada: 'usuario',
//   accion: 'UPDATE',
//   fecha_accion: '2026-04-13 10:30:45',
//   detalles: {
//     anterior: { id_usuario: 5, nombre_usuario: 'vendor', ... },
//     nuevo: { id_usuario: 5, nombre_usuario: 'vendedor2', ... }
//   }
// }

// ============================================
// 6. CONSULTAR AUDITORÍA POR API
// ============================================
// En routes/auditoria.js, agrega:
//
// router.get('/', authMiddleware, async (req, res) => {
//   const result = await db.query(`
//     SELECT 
//       a.id_auditoria,
//       u.nombre_usuario as usuario_que_cambio,
//       a.tabla_afectada,
//       a.accion,
//       a.fecha_accion,
//       a.detalles
//     FROM auditoria a
//     JOIN usuario u ON a.id_usuario = u.id_usuario
//     ORDER BY a.fecha_accion DESC
//     LIMIT 100
//   `);
//   res.json(result.rows);
// });
