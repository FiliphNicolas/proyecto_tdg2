const express = require('express');
const db = require('../javascript/databasepg');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Obtener productos (protegido)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, categoria } = req.query;
    let text = 'SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM "producto"';
    const clauses = [];
    const values = [];
    if (q) {
      values.push('%' + q + '%');
      clauses.push('(nombre ILIKE $' + values.length + ' OR descripcion ILIKE $' + values.length + ')');
    }
    if (categoria) {
      values.push(categoria);
      clauses.push('categoria = $' + values.length);
    }
    if (clauses.length) text += ' WHERE ' + clauses.join(' AND ');
    text += ' ORDER BY codigo_producto';

    const result = await db.query(text, values);
    res.json({ ok: true, products: result.rows });
  } catch (err) {
    console.error('Error GET /api/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear producto (público para pruebas)
router.post('/public/productos', async (req, res) => {
  try {
    const { nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    if (!nombre || precio == null) return res.status(400).json({ error: 'Faltan campos obligatorios' });

    // Generar código de producto único
    const codigo = 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const text = 'INSERT INTO "producto" (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, fecha_creacion) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria';
    const values = [codigo, nombre, descripcion || null, precio, cantidad_stock || 0, categoria || null];
    const result = await db.query(text, values);
    res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error POST /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Listar productos (público, sin autenticación)
router.get('/public/productos', async (req, res) => {
  try {
    const { q, categoria } = req.query;
    let text = 'SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM "producto"';
    const clauses = [];
    const values = [];
    if (q) {
      values.push('%' + q + '%');
      clauses.push('(nombre ILIKE $' + values.length + ' OR codigo_producto ILIKE $' + values.length + ')');
    }
    if (categoria) {
      values.push(categoria);
      clauses.push('categoria = $' + values.length);
    }
    if (clauses.length) text += ' WHERE ' + clauses.join(' AND ');
    text += ' ORDER BY codigo_producto';

    const result = await db.query(text, values);
    res.json({ ok: true, products: result.rows });
  } catch (err) {
    console.error('Error GET /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener información de inventario
router.get('/public/inventario/info', authMiddleware, async (req, res) => {
  try {
    // Obtener productos
    const productosResult = await db.query('SELECT codigo_producto, nombre, cantidad_stock FROM "producto" ORDER BY codigo_producto');
    
    // Obtener movimientos
    const movimientosResult = await db.query(`
      SELECT id_movimiento, codigo_producto, tipo_movimiento, cantidad, descripcion, fecha_movimiento 
      FROM inventario 
      ORDER BY fecha_movimiento DESC, id_movimiento DESC 
    `);
    
    res.json({
      ok: true,
      productos: productosResult.rows,
      movimientos: movimientosResult.rows,
      total_productos: productosResult.rowCount,
      total_movimientos: movimientosResult.rowCount
    });
  } catch (err) {
    console.error('Error GET /api/public/inventario/info', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
