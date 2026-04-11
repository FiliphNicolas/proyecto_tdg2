const express = require('express');
const db = require('../javascript/databasepg');

const router = express.Router();

// GET - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id_cliente,
        nombre,
        apellido,
        email,
        telefono,
        direccion,
        fecha_registro
      FROM cliente
      ORDER BY id_cliente
    `;
    
    const result = await db.query(query);
    
    res.json({
      ok: true,
      clientes: result.rows,
      total: result.rows.length
    });
  } catch (err) {
    console.error('Error GET /api/clientes', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// POST - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      apellido,
      email,
      telefono,
      direccion
    } = req.body;
    
    // Verificar que el email no exista
    if (email) {
      const existingEmail = await db.query(
        'SELECT id_cliente FROM cliente WHERE email = $1',
        [email]
      );
      
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
    }
    
    // Obtener el siguiente ID disponible
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id_cliente), 0) as max_id FROM cliente');
    const nextId = parseInt(maxIdResult.rows[0].max_id) + 1;
    
    const query = `
      INSERT INTO cliente (id_cliente, nombre, apellido, email, telefono, direccion)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      nextId,
      nombre,
      apellido || null,
      email || null,
      telefono || null,
      direccion || null
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      ok: true,
      cliente: result.rows[0],
      message: 'Cliente creado exitosamente'
    });
  } catch (err) {
    console.error('Error POST /api/clientes', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// PUT - Actualizar cliente existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      apellido,
      email,
      telefono,
      direccion
    } = req.body;
    
    // Verificar que el cliente exista
    const existingCliente = await db.query(
      'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
      [id]
    );
    
    if (existingCliente.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Verificar que el nuevo email no exista (si es diferente y se proporciona)
    if (email) {
      const duplicateEmail = await db.query(
        'SELECT id_cliente FROM cliente WHERE email = $1 AND id_cliente != $2',
        [email, id]
      );
      
      if (duplicateEmail.rows.length > 0) {
        return res.status(400).json({ error: 'El email ya está registrado por otro cliente' });
      }
    }
    
    const query = `
      UPDATE cliente SET
        nombre = COALESCE($1, nombre),
        apellido = COALESCE($2, apellido),
        email = COALESCE($3, email),
        telefono = COALESCE($4, telefono),
        direccion = COALESCE($5, direccion)
      WHERE id_cliente = $6
      RETURNING *
    `;
    
    const values = [
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      id
    ];
    
    const result = await db.query(query, values);
    
    res.json({
      ok: true,
      cliente: result.rows[0],
      message: 'Cliente actualizado exitosamente'
    });
  } catch (err) {
    console.error('Error PUT /api/clientes/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// DELETE - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el cliente exista
    const existingCliente = await db.query(
      'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
      [id]
    );
    
    if (existingCliente.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Verificar que el cliente no tenga pedidos asociados
    const pedidosAsociados = await db.query(
      'SELECT id_pedido FROM pedido WHERE id_cliente = $1',
      [id]
    );
    
    if (pedidosAsociados.rows.length > 0) {
      return res.status(400).json({ 
        error: 'No se puede eliminar el cliente porque tiene pedidos asociados' 
      });
    }
    
    const query = 'DELETE FROM cliente WHERE id_cliente = $1';
    await db.query(query, [id]);
    
    res.json({
      ok: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (err) {
    console.error('Error DELETE /api/clientes/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

module.exports = router;
