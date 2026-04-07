const express = require('express');
const db = require('../javascript/databasepg');

const router = express.Router();

// GET - Obtener todas las sedes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id_sede,
        nombre,
        ciudad,
        direccion,
        telefono,
        email,
        encargado,
        activo,
        fecha_creacion
      FROM sede
      ORDER BY nombre ASC
    `;
    
    const result = await db.query(query);
    res.json({
      ok: true,
      sedes: result.rows,
      total: result.rowCount
    });
  } catch (err) {
    console.error('Error GET /api/sedes', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// GET - Obtener una sede específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT * FROM sede WHERE id_sede = $1
    `;
    
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }
    
    res.json({
      ok: true,
      sede: result.rows[0]
    });
  } catch (err) {
    console.error('Error GET /api/sedes/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// POST - Crear nueva sede
router.post('/', async (req, res) => {
  try {
    const { nombre, ciudad, direccion, telefono, email, encargado } = req.body;
    
    if (!nombre || !ciudad) {
      return res.status(400).json({ error: 'Faltan campos requeridos: nombre y ciudad' });
    }
    
    const query = `
      INSERT INTO sede (nombre, ciudad, direccion, telefono, email, encargado, activo, fecha_creacion)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      nombre,
      ciudad,
      direccion || null,
      telefono || null,
      email || null,
      encargado || null
    ]);
    
    res.status(201).json({
      ok: true,
      sede: result.rows[0],
      message: 'Sede creada exitosamente'
    });
  } catch (err) {
    console.error('Error POST /api/sedes', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// PUT - Actualizar sede
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, ciudad, direccion, telefono, email, encargado, activo } = req.body;
    
    const query = `
      UPDATE sede SET
        nombre = COALESCE($1, nombre),
        ciudad = COALESCE($2, ciudad),
        direccion = COALESCE($3, direccion),
        telefono = COALESCE($4, telefono),
        email = COALESCE($5, email),
        encargado = COALESCE($6, encargado),
        activo = COALESCE($7, activo)
      WHERE id_sede = $8
      RETURNING *
    `;
    
    const result = await db.query(query, [
      nombre,
      ciudad,
      direccion,
      telefono,
      email,
      encargado,
      activo,
      id
    ]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }
    
    res.json({
      ok: true,
      sede: result.rows[0],
      message: 'Sede actualizada exitosamente'
    });
  } catch (err) {
    console.error('Error PUT /api/sedes/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// DELETE - Eliminar sede
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM sede WHERE id_sede = $1';
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sede no encontrada' });
    }
    
    res.json({
      ok: true,
      message: 'Sede eliminada exitosamente'
    });
  } catch (err) {
    console.error('Error DELETE /api/sedes/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

module.exports = router;
