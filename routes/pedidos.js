const express = require('express');
const db = require('../javascript/databasepg');

const router = express.Router();

// GET - Verificar si un cliente ya ha realizado compras
router.get('/cliente/:id_cliente/historial', async (req, res) => {
  try {
    const { id_cliente } = req.params;
    
    // Verificar que el cliente exista
    const clienteResult = await db.query(
      'SELECT id_cliente, nombre, email FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );
    
    if (clienteResult.rows.length === 0) {
      return res.status(404).json({ 
        error: 'El cliente no existe',
        ya_compro: false
      });
    }
    
    const cliente = clienteResult.rows[0];
    
    // Obtener historial de compras del cliente
    const pedidosResult = await db.query(
      `SELECT 
        p.id_pedido,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.codigo_detalle
      FROM pedido p
      WHERE p.id_cliente = $1
      ORDER BY p.fecha_pedido DESC`,
      [id_cliente]
    );
    
    const ya_compro = pedidosResult.rows.length > 0;
    const total_compras = pedidosResult.rows.length;
    const monto_total = pedidosResult.rows.reduce((sum, p) => sum + parseFloat(p.total), 0);
    
    res.json({
      ok: true,
      ya_compro,
      total_compras,
      monto_total: monto_total.toFixed(2),
      cliente: {
        id_cliente: cliente.id_cliente,
        nombre: cliente.nombre,
        email: cliente.email
      },
      pedidos: pedidosResult.rows
    });
    
  } catch (err) {
    console.error('Error GET /api/pedidos/cliente/:id_cliente/historial', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// GET - Obtener todos los pedidos
router.get('/', async (req, res) => {
  try {
    // Query exacta como la solicitada por el usuario
    const query = `
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.id_usuario,
        p.id_sede,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.codigo_detalle
      FROM pedido p
      ORDER BY p.fecha_pedido DESC
    `;
    
    const result = await db.query(query);
    
    // Transformar datos para que coincidan con el frontend
    const pedidosTransformados = result.rows.map(row => ({
      id_pedido: row.id_pedido,
      id_cliente: row.id_cliente,
      id_usuario: row.id_usuario,
      id_sede: row.id_sede || 1,
      fecha_pedido: row.fecha_pedido,
      total: row.total,
      estado: row.estado,
      codigo_detalle: row.codigo_detalle,
      // Campos adicionales para compatibilidad con frontend
      numero_pedido: row.codigo_detalle,
      nombre_cliente: 'Cliente ' + row.id_cliente,
      email_cliente: 'N/A',
      telefono_cliente: 'N/A',
      estado_pedido: row.estado,
      monto_total: parseFloat(row.total),
      direccion_envio: 'N/A',
      notas_pedido: 'N/A'
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
      id_cliente,
      id_usuario,
      id_sede,
      fecha_pedido,
      total,
      estado,
      codigo_detalle
    } = req.body;
    
    // Verificar que el cliente exista
    const clienteResult = await db.query(
      'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
      [id_cliente]
    );
    
    if (clienteResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'El cliente con ID ' + id_cliente + ' no existe. Debe usar un ID de cliente existente (1, 2, 3, etc).' 
      });
    }
    
    // Verificar que el usuario exista
    const usuarioResult = await db.query(
      'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
      [id_usuario]
    );
    
    if (usuarioResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'El usuario con ID ' + id_usuario + ' no existe. Debe usar un ID de usuario existente (1 o 2).' 
      });
    }
    
    // Obtener el siguiente ID disponible para pedido
    const maxIdResult = await db.query('SELECT COALESCE(MAX(id_pedido), 0) as max_id FROM pedido');
    const nextId = parseInt(maxIdResult.rows[0].max_id) + 1;
    
    // Insertar pedido con ID manual generado
    const query = `
      INSERT INTO pedido (
        id_pedido, id_cliente, id_usuario, id_sede, fecha_pedido, total, estado, codigo_detalle
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id_pedido, id_cliente, id_usuario, id_sede, fecha_pedido, total, estado, codigo_detalle
    `;
    
    const values = [
      nextId,
      id_cliente,
      id_usuario,
      id_sede || 1,
      fecha_pedido || new Date().toISOString(),
      parseFloat(total) || 0,
      estado || 'pendiente',
      codigo_detalle || 'PED-' + Date.now().toString().slice(-6)
    ];
    
    const result = await db.query(query, values);
    
    // Obtener datos completos del pedido creado para respuesta
    const pedidoCompleto = await db.query(`
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.id_usuario,
        p.id_sede,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.codigo_detalle,
        c.nombre as nombre_cliente,
        c.email as email_cliente
      FROM pedido p
      LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = $1
    `, [result.rows[0].id_pedido]);
    
    // Transformar para el frontend
    const pedidoTransformado = {
      id_pedido: pedidoCompleto.rows[0].id_pedido,
      id_cliente: pedidoCompleto.rows[0].id_cliente,
      id_usuario: pedidoCompleto.rows[0].id_usuario,
      fecha_pedido: pedidoCompleto.rows[0].fecha_pedido,
      total: pedidoCompleto.rows[0].total,
      estado: pedidoCompleto.rows[0].estado,
      codigo_detalle: pedidoCompleto.rows[0].codigo_detalle,
      // Campos adicionales para compatibilidad
      numero_pedido: pedidoCompleto.rows[0].codigo_detalle,
      nombre_cliente: pedidoCompleto.rows[0].nombre_cliente || 'Cliente ' + pedidoCompleto.rows[0].id_cliente,
      email_cliente: pedidoCompleto.rows[0].email_cliente || 'N/A',
      telefono_cliente: 'N/A',
      estado_pedido: pedidoCompleto.rows[0].estado,
      monto_total: parseFloat(pedidoCompleto.rows[0].total),
      direccion_envio: 'N/A',
      notas_pedido: 'N/A'
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
      id_cliente,
      id_usuario,
      id_sede,
      fecha_pedido,
      total,
      estado,
      codigo_detalle
    } = req.body;
    
    // Verificar que el pedido exista
    const existingOrder = await db.query(
      'SELECT id_pedido FROM pedido WHERE id_pedido = $1',
      [id]
    );
    
    if (existingOrder.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    
    // Verificar que el cliente exista (si se proporciona)
    if (id_cliente) {
      const clienteResult = await db.query(
        'SELECT id_cliente FROM cliente WHERE id_cliente = $1',
        [id_cliente]
      );
      
      if (clienteResult.rows.length === 0) {
        return res.status(400).json({ 
          error: 'El cliente con ID ' + id_cliente + ' no existe.' 
        });
      }
    }
    
    // Verificar que el usuario exista (si se proporciona)
    if (id_usuario) {
      const usuarioResult = await db.query(
        'SELECT id_usuario FROM usuario WHERE id_usuario = $1',
        [id_usuario]
      );
      
      if (usuarioResult.rows.length === 0) {
        return res.status(400).json({ 
          error: 'El usuario con ID ' + id_usuario + ' no existe.' 
        });
      }
    }
    
    const query = `
      UPDATE pedido SET
        id_cliente = COALESCE($1, id_cliente),
        id_usuario = COALESCE($2, id_usuario),
        id_sede = COALESCE($3, id_sede),
        fecha_pedido = COALESCE($4, fecha_pedido),
        total = COALESCE($5, total),
        estado = COALESCE($6, estado),
        codigo_detalle = COALESCE($7, codigo_detalle)
      WHERE id_pedido = $8
      RETURNING *
    `;
    
    const values = [
      id_cliente,
      id_usuario,
      id_sede,
      fecha_pedido,
      total,
      estado,
      codigo_detalle,
      id
    ];
    
    const result = await db.query(query, values);
    
    // Obtener datos completos del pedido actualizado
    const pedidoCompleto = await db.query(`
      SELECT 
        p.id_pedido,
        p.id_cliente,
        p.id_usuario,
        p.id_sede,
        p.fecha_pedido,
        p.total,
        p.estado,
        p.codigo_detalle,
        c.nombre as nombre_cliente,
        c.email as email_cliente
      FROM pedido p
      LEFT JOIN cliente c ON p.id_cliente = c.id_cliente
      WHERE p.id_pedido = $1
    `, [result.rows[0].id_pedido]);
    
    // Transformar para el frontend
    const pedidoTransformado = {
      id_pedido: pedidoCompleto.rows[0].id_pedido,
      id_cliente: pedidoCompleto.rows[0].id_cliente,
      id_usuario: pedidoCompleto.rows[0].id_usuario,
      id_sede: pedidoCompleto.rows[0].id_sede || 1,
      fecha_pedido: pedidoCompleto.rows[0].fecha_pedido,
      total: pedidoCompleto.rows[0].total,
      estado: pedidoCompleto.rows[0].estado,
      codigo_detalle: pedidoCompleto.rows[0].codigo_detalle,
      // Campos adicionales para compatibilidad
      numero_pedido: pedidoCompleto.rows[0].codigo_detalle,
      nombre_cliente: pedidoCompleto.rows[0].nombre_cliente || 'Cliente ' + pedidoCompleto.rows[0].id_cliente,
      email_cliente: pedidoCompleto.rows[0].email_cliente || 'N/A',
      telefono_cliente: 'N/A',
      estado_pedido: pedidoCompleto.rows[0].estado,
      monto_total: parseFloat(pedidoCompleto.rows[0].total),
      direccion_envio: 'N/A',
      notas_pedido: 'N/A'
    };
    
    res.json({
      ok: true,
      pedido: pedidoTransformado,
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
