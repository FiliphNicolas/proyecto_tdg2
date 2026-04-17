const express = require('express');
const db = require('../javascript/databasepg');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Obtener información completa de inventario
router.get('/info', async (req, res) => {
  try {
    // Obtener productos con stock actual
    const productosQuery = `
      SELECT 
        codigo_producto, 
        nombre, 
        cantidad_stock,
        precio,
        categoria
      FROM producto 
      ORDER BY codigo_producto
    `;
    
    const productosResult = await db.query(productosQuery);
    
    // Obtener movimientos de inventario con información de producto
    const movimientosQuery = `
      SELECT 
        i.id_movimiento,
        i.codigo_producto,
        p.nombre AS nombre_producto,
        i.tipo_movimiento,
        i.cantidad,
        i.id_sede,
        i.fecha_movimiento,
        i.descripcion
      FROM inventario i
      LEFT JOIN producto p ON p.codigo_producto = i.codigo_producto
      ORDER BY i.fecha_movimiento DESC, i.id_movimiento DESC
      LIMIT 200
    `;
    
    const movimientosResult = await db.query(movimientosQuery);
    
    // Calcular estadísticas
    let totalEntradas = 0;
    let totalSalidas = 0;
    let totalAjustes = 0;
    
    movimientosResult.rows.forEach(mov => {
      if (mov.tipo_movimiento === 'entrada') {
        totalEntradas += mov.cantidad;
      } else if (mov.tipo_movimiento === 'salida') {
        totalSalidas += mov.cantidad;
      } else if (mov.tipo_movimiento === 'ajuste') {
        totalAjustes += mov.cantidad;
      }
    });
    
    res.json({
      ok: true,
      productos: productosResult.rows,
      movimientos: movimientosResult.rows,
      estadisticas: {
        total_productos: productosResult.rowCount,
        total_movimientos: movimientosResult.rowCount,
        total_entradas: totalEntradas,
        total_salidas: totalSalidas,
        total_ajustes: totalAjustes,
        stock_total: productosResult.rows.reduce((sum, p) => sum + p.cantidad_stock, 0)
      }
    });
    
  } catch (err) {
    console.error('Error GET /api/inventario/info', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Obtener movimientos con filtros y paginación
router.get('/movimientos', async (req, res) => {
  try {
    const { page = 1, limit = 20, producto, tipo, fecha_desde, fecha_hasta } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    let params = [];
    let paramIndex = 1;
    
    if (producto) {
      whereClause += ` AND i.codigo_producto = $${paramIndex}`;
      params.push(producto);
      paramIndex++;
    }
    
    if (tipo) {
      whereClause += ` AND i.tipo_movimiento = $${paramIndex}`;
      params.push(tipo);
      paramIndex++;
    }
    
    if (fecha_desde) {
      whereClause += ` AND i.fecha_movimiento >= $${paramIndex}`;
      params.push(fecha_desde);
      paramIndex++;
    }
    
    if (fecha_hasta) {
      whereClause += ` AND i.fecha_movimiento <= $${paramIndex}`;
      params.push(fecha_hasta);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        i.id_movimiento,
        i.codigo_producto,
        i.tipo_movimiento,
        i.cantidad,
        i.id_sede,
        i.fecha_movimiento,
        i.descripcion
      FROM inventario i
      ${whereClause}
      ORDER BY i.fecha_movimiento DESC, i.id_movimiento DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);
    
    const result = await db.query(query, params);
    
    // Obtener total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM inventario i
      ${whereClause}
    `;
    
    const countResult = await db.query(countQuery, params.slice(0, -2));
    
    res.json({
      ok: true,
      movimientos: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(countResult.rows[0].total / limit)
      }
    });
    
  } catch (err) {
    console.error('Error GET /api/inventario/movimientos', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Crear movimiento de inventario
router.post('/movimientos', authMiddleware, async (req, res) => {
  try {
    const { codigo_producto, tipo_movimiento, cantidad, id_sede, descripcion } = req.body;
    
    if (!codigo_producto || !tipo_movimiento || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    if (!['entrada', 'salida', 'ajuste'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }
    
    // Verificar si el producto existe
    const productCheck = await db.query('SELECT codigo_producto FROM producto WHERE codigo_producto = $1', [codigo_producto]);
    if (productCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Código de producto inexistente' });
    }
    
    const insertQuery = `
      INSERT INTO inventario (codigo_producto, tipo_movimiento, cantidad, id_sede, descripcion, fecha_movimiento)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id_movimiento, codigo_producto, tipo_movimiento, cantidad, id_sede, descripcion, fecha_movimiento
    `;
    
    const result = await db.query(insertQuery, [codigo_producto, tipo_movimiento, cantidad, id_sede || 1, descripcion || null]);
    
    // Actualizar stock del producto
    let updateQuery = '';
    let updateValue = cantidad;
    
    if (tipo_movimiento === 'entrada') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    } else if (tipo_movimiento === 'salida') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    } else if (tipo_movimiento === 'ajuste') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    }
    
    await db.query(updateQuery, [updateValue, codigo_producto]);
    
    res.status(201).json({
      ok: true,
      movimiento: result.rows[0],
      message: 'Movimiento creado exitosamente'
    });
    
  } catch (err) {
    console.error('Error POST /api/inventario/movimientos', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Obtener resumen de stock
router.get('/stock', authMiddleware, async (req, res) => {
  try {
    const { categoria, min_stock } = req.query;
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramIndex = 1;
    
    if (categoria) {
      whereClause += ` AND categoria = $${paramIndex}`;
      params.push(categoria);
      paramIndex++;
    }
    
    if (min_stock) {
      whereClause += ` AND cantidad_stock <= $${paramIndex}`;
      params.push(min_stock);
      paramIndex++;
    }
    
    const query = `
      SELECT 
        codigo_producto,
        nombre,
        cantidad_stock,
        precio,
        categoria,
        CASE 
          WHEN cantidad_stock <= 5 THEN 'crítico'
          WHEN cantidad_stock <= 15 THEN 'bajo'
          ELSE 'adecuado'
        END as nivel_stock
      FROM producto
      ${whereClause}
      ORDER BY cantidad_stock ASC
    `;
    
    const result = await db.query(query, params);
    
    // Estadísticas de stock
    const statsQuery = `
      SELECT 
        COUNT(*) as total_productos,
        COUNT(CASE WHEN cantidad_stock <= 5 THEN 1 END) as stock_critico,
        COUNT(CASE WHEN cantidad_stock <= 15 THEN 1 END) as stock_bajo,
        COUNT(CASE WHEN cantidad_stock > 15 THEN 1 END) as stock_adecuado,
        SUM(cantidad_stock) as stock_total
      FROM producto
    `;
    
    const statsResult = await db.query(statsQuery);
    
    res.json({
      ok: true,
      productos: result.rows,
      estadisticas: statsResult.rows[0]
    });
    
  } catch (err) {
    console.error('Error GET /api/inventario/stock', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Actualizar movimiento de inventario
router.put('/movimientos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { codigo_producto, tipo_movimiento, cantidad, id_sede, descripcion, fecha_movimiento } = req.body;
    
    if (!codigo_producto || !tipo_movimiento || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }
    
    if (!['entrada', 'salida', 'ajuste'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
    }
    
    // Obtener movimiento actual para calcular diferencia de stock
    const currentMovementQuery = `
      SELECT codigo_producto, tipo_movimiento, cantidad
      FROM inventario 
      WHERE id_movimiento = $1
    `;
    
    const currentResult = await db.query(currentMovementQuery, [id]);
    if (currentResult.rowCount === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    
    const currentMovement = currentResult.rows[0];
    
    // Revertir stock del movimiento anterior
    let revertQuery = '';
    let revertValue = currentMovement.cantidad;
    
    if (currentMovement.tipo_movimiento === 'entrada') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    } else if (currentMovement.tipo_movimiento === 'salida') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    } else if (currentMovement.tipo_movimiento === 'ajuste') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    }
    
    await db.query(revertQuery, [revertValue, currentMovement.codigo_producto]);
    
    // Aplicar nuevo movimiento
    let updateQuery = '';
    let updateValue = cantidad;
    
    if (tipo_movimiento === 'entrada') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    } else if (tipo_movimiento === 'salida') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    } else if (tipo_movimiento === 'ajuste') {
      updateQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    }
    
    await db.query(updateQuery, [updateValue, codigo_producto]);
    
    // Actualizar movimiento
    const updateMovementQuery = `
      UPDATE inventario 
      SET codigo_producto = $1, tipo_movimiento = $2, cantidad = $3, id_sede = $4, descripcion = $5, fecha_movimiento = $6
      WHERE id_movimiento = $7
      RETURNING id_movimiento, codigo_producto, tipo_movimiento, cantidad, id_sede, descripcion, fecha_movimiento
    `;
    
    const result = await db.query(updateMovementQuery, [
      codigo_producto, 
      tipo_movimiento, 
      cantidad, 
      id_sede || 1,
      descripcion || null, 
      fecha_movimiento || new Date().toISOString(), 
      id
    ]);
    
    res.json({
      ok: true,
      movimiento: result.rows[0],
      message: 'Movimiento actualizado exitosamente'
    });
    
  } catch (err) {
    console.error('Error PUT /api/inventario/movimientos/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Eliminar movimiento de inventario
router.delete('/movimientos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obtener movimiento antes de eliminar para revertir stock
    const movementQuery = `
      SELECT codigo_producto, tipo_movimiento, cantidad
      FROM inventario 
      WHERE id_movimiento = $1
    `;
    
    const movementResult = await db.query(movementQuery, [id]);
    if (movementResult.rowCount === 0) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    
    const movement = movementResult.rows[0];
    
    // Revertir stock
    let revertQuery = '';
    let revertValue = movement.cantidad;
    
    if (movement.tipo_movimiento === 'entrada') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    } else if (movement.tipo_movimiento === 'salida') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2';
    } else if (movement.tipo_movimiento === 'ajuste') {
      revertQuery = 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';
    }
    
    await db.query(revertQuery, [revertValue, movement.codigo_producto]);
    
    // Eliminar movimiento
    const deleteQuery = 'DELETE FROM inventario WHERE id_movimiento = $1';
    await db.query(deleteQuery, [id]);
    
    res.json({
      ok: true,
      message: 'Movimiento eliminado exitosamente'
    });
    
  } catch (err) {
    console.error('Error DELETE /api/inventario/movimientos/:id', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

module.exports = router;
