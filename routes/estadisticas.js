const express = require('express');
const db = require('../javascript/databasepg');

const router = express.Router();

// GET - Obtener estadísticas para dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Contar total de usuarios
    const usuariosQuery = 'SELECT COUNT(*) as total FROM "usuario"';
    const usuariosResult = await db.query(usuariosQuery);
    const totalUsuarios = parseInt(usuariosResult.rows[0].total) || 0;

    // Contar total de pedidos
    const pedidosQuery = 'SELECT COUNT(*) as total FROM pedido';
    const pedidosResult = await db.query(pedidosQuery);
    const totalPedidos = parseInt(pedidosResult.rows[0].total) || 0;

    // Contar total de productos en inventario
    const inventarioQuery = 'SELECT SUM(cantidad_stock) as total FROM producto';
    const inventarioResult = await db.query(inventarioQuery);
    const totalInventario = parseInt(inventarioResult.rows[0].total) || 0;

    // Obtener estado de pedidos (Pendiente, Completado, Cancelado, etc)
    const estadoPedidosQuery = `
      SELECT estado, COUNT(*) as cantidad 
      FROM pedido 
      GROUP BY estado 
      ORDER BY cantidad DESC
    `;
    const estadoPedidosResult = await db.query(estadoPedidosQuery);
    const estadoPedidos = estadoPedidosResult.rows;

    // Obtener categorías de productos con cantidad
    const categoriasQuery = `
      SELECT categoria, COUNT(*) as cantidad, SUM(cantidad_stock) as stock_total
      FROM producto 
      GROUP BY categoria 
      ORDER BY cantidad DESC
    `;
    const categoriasResult = await db.query(categoriasQuery);
    const categorias = categoriasResult.rows;

    // Obtener usuarios activos vs inactivos
    const actividadUserQuery = `
      SELECT activo, COUNT(*) as cantidad 
      FROM "usuario" 
      GROUP BY activo
    `;
    const actividadUserResult = await db.query(actividadUserQuery);
    const actividadUser = actividadUserResult.rows;

    res.json({
      ok: true,
      resumen: {
        totalUsuarios,
        totalPedidos,
        totalInventario
      },
      estadoPedidos,
      categorias,
      actividadUser
    });
  } catch (err) {
    console.error('Error en /api/estadisticas/dashboard:', err);
    res.status(500).json({ ok: false, error: 'Error al obtener estadísticas' });
  }
});

module.exports = router;
