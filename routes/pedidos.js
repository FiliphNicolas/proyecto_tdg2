const express = require('express');
const db = require('../javascript/databasepg');

const router = express.Router();

// GET - Obtener todos los pedidos
router.get('/', async (req, res) => {
  try {
    // Query adaptada a la tabla existente
    const query = `
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.id_usuario,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.numero_pedido,
        p.direccion_envio,
        p.notas_pedido,
        c.nombre as nombre_cliente,
        c.email as email_cliente,
        c.telefono as telefono_cliente,
        u.nombre_usuario as nombre_usuario
      FROM pedido p
      LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
      LEFT JOIN usuario u ON p.id_usuario = u.id_usuario
      ORDER BY p.fecha_pedido DESC
    `;
    
    const result = await db.query(query);
    
    // Transformar datos para que coincidan con el frontend
    const pedidosTransformados = result.rows.map(row => ({
      id_pedido: row.id_pedido,
      numero_pedido: row.numero_pedido,
      nombre_cliente: row.nombre_cliente || 'Cliente ' + row.id_cliente,
      email_cliente: row.email_cliente || 'N/A',
      telefono_cliente: row.telefono_cliente || 'N/A',
      estado_pedido: row.estado,
      fecha_pedido: row.fecha_pedido,
      monto_total: parseFloat(row.total),
      direccion_envio: row.direccion_envio || 'N/A',
      notas_pedido: row.notas_pedido || 'N/A',
      id_usuario: row.id_usuario,
      nombre_usuario: row.nombre_usuario
    }));
    
    res.json({
      ok: true,
      pedidos: pedidosTransformados,
      total: pedidosTransformados.length
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
    
    // Primero verificar si existe el cliente, si no, crearlo
    let clienteResult = await db.query(
      'SELECT id_cliente FROM cliente WHERE email = $1',
      [email_cliente]
    );
    
    let id_cliente;
    if (clienteResult.rows.length === 0) {
      // Crear nuevo cliente
      const newClientResult = await db.query(
        'INSERT INTO cliente (nombre, email, telefono) VALUES ($1, $2, $3) RETURNING id_cliente',
        [nombre_cliente, email_cliente, telefono_cliente || null]
      );
      id_cliente = newClientResult.rows[0].id_cliente;
    } else {
      id_cliente = clienteResult.rows[0].id_cliente;
    }
    
    // Obtener usuario (por defecto id 1)
    const id_usuario = 1;
    
    // Generar número de pedido único si no se proporciona
    const numeroPedido = numero_pedido || `PED-${Date.now()}`;
    
    // Insertar pedido con la estructura existente
    const query = `
      INSERT INTO pedido (
        id_cliente, id_usuario, fecha_pedido, total, estado, numero_pedido, direccion_envio, notas_pedido
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      id_cliente,
      id_usuario,
      fecha_pedido || new Date().toISOString(),
      monto_total,
      estado_pedido || 'pendiente',
      numeroPedido,
      direccion_envio || null,
      notas_pedido || null
    ];
    
    const result = await db.query(query, values);
    
    // Obtener datos completos del pedido creado
    const pedidoCompleto = await db.query(`
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.id_usuario,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.numero_pedido,
        p.direccion_envio,
        p.notas_pedido,
        c.nombre as nombre_cliente,
        c.email as email_cliente,
        c.telefono as telefono_cliente
      FROM pedido p
      LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = $1
    `, [result.rows[0].id_pedido]);
    
    // Transformar para el frontend
    const pedidoTransformado = {
      id_pedido: pedidoCompleto.rows[0].id_pedido,
      numero_pedido: pedidoCompleto.rows[0].numero_pedido,
      nombre_cliente: pedidoCompleto.rows[0].nombre_cliente,
      email_cliente: pedidoCompleto.rows[0].email_cliente,
      telefono_cliente: pedidoCompleto.rows[0].telefono_cliente,
      estado_pedido: pedidoCompleto.rows[0].estado,
      fecha_pedido: pedidoCompleto.rows[0].fecha_pedido,
      monto_total: parseFloat(pedidoCompleto.rows[0].total),
      direccion_envio: direccion_envio || 'N/A',
      notas_pedido: notas_pedido || 'N/A'
    };
    
    res.status(201).json({
      ok: true,
      pedido: pedidoTransformado,
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
