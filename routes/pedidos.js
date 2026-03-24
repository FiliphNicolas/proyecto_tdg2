const express = require('express');
const db = require('../databasepg');

const router = express.Router();

// GET - Obtener todos los pedidos
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        id_pedido,
        numero_pedido,
        nombre_cliente,
        email_cliente,
        telefono_cliente,
        estado_pedido,
        fecha_pedido,
        monto_total,
        direccion_envio,
        notas_pedido
      FROM pedido
      ORDER BY fecha_pedido DESC, id_pedido DESC
    `;
    
    const result = await db.query(query);
    
    res.json({
      ok: true,
      pedidos: result.rows
    });
  } catch (err) {
    console.error('Error GET /api/pedidos', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// POST - Crear nuevo pedido
router.post('/', async (req, res) => {
  try {
    const {
      numero_pedido,
      nombre_cliente,
      email_cliente,
      telefono_cliente,
      estado_pedido,
      fecha_pedido,
      monto_total,
      direccion_envio,
      notas_pedido
    } = req.body;
    
    // Verificar que el número de pedido no exista
    const existingOrder = await db.query(
      'SELECT id_pedido FROM pedido WHERE numero_pedido = $1',
      [numero_pedido]
    );
    
    if (existingOrder.rows.length > 0) {
      return res.status(400).json({ error: 'El número de pedido ya existe' });
    }
    
    const query = `
      INSERT INTO pedido (
        numero_pedido, nombre_cliente, email_cliente, telefono_cliente,
        estado_pedido, fecha_pedido, monto_total, direccion_envio, notas_pedido
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      numero_pedido,
      nombre_cliente,
      email_cliente,
      telefono_cliente || null,
      estado_pedido,
      fecha_pedido,
      monto_total,
      direccion_envio || null,
      notas_pedido || null
    ];
    
    const result = await db.query(query, values);
    
    res.status(201).json({
      ok: true,
      pedido: result.rows[0],
      message: 'Pedido creado exitosamente'
    });
  } catch (err) {
    console.error('Error POST /api/pedidos', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// PUT - Actualizar pedido existente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      numero_pedido,
      nombre_cliente,
      email_cliente,
      telefono_cliente,
      estado_pedido,
      fecha_pedido,
      monto_total,
      direccion_envio,
      notas_pedido
    } = req.body;
    
    // Verificar que el pedido exista
    const existingOrder = await db.query(
      'SELECT id_pedido FROM pedido WHERE id_pedido = $1',
      [id]
    );
    
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Verificar que el nuevo número de pedido no exista (si es diferente)
    if (numero_pedido) {
      const duplicateOrder = await db.query(
        'SELECT id_pedido FROM pedido WHERE numero_pedido = $1 AND id_pedido != $2',
        [numero_pedido, id]
      );
      
      if (duplicateOrder.rows.length > 0) {
        return res.status(400).json({ error: 'El número de pedido ya existe' });
      }
    }
    
    const query = `
      UPDATE pedido SET
        numero_pedido = COALESCE($1, numero_pedido),
        nombre_cliente = COALESCE($2, nombre_cliente),
        email_cliente = COALESCE($3, email_cliente),
        telefono_cliente = COALESCE($4, telefono_cliente),
        estado_pedido = COALESCE($5, estado_pedido),
        fecha_pedido = COALESCE($6, fecha_pedido),
        monto_total = COALESCE($7, monto_total),
        direccion_envio = COALESCE($8, direccion_envio),
        notas_pedido = COALESCE($9, notas_pedido),
        fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id_pedido = $10
      RETURNING *
    `;
    
    const values = [
      numero_pedido,
      nombre_cliente,
      email_cliente,
      telefono_cliente,
      estado_pedido,
      fecha_pedido,
      monto_total,
      direccion_envio,
      notas_pedido,
      id
    ];
    
    const result = await db.query(query, values);
    
    res.json({
      ok: true,
      pedido: result.rows[0],
      message: 'Pedido actualizado exitosamente'
    });
  } catch (err) {
    console.error('Error PUT /api/pedidos/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// DELETE - Eliminar pedido
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que el pedido exista
    const existingOrder = await db.query(
      'SELECT id_pedido FROM pedido WHERE id_pedido = $1',
      [id]
    );
    
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    const query = 'DELETE FROM pedido WHERE id_pedido = $1';
    await db.query(query, [id]);
    
    res.json({
      ok: true,
      message: 'Pedido eliminado exitosamente'
    });
  } catch (err) {
    console.error('Error DELETE /api/pedidos/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

module.exports = router;
