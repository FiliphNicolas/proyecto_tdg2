/**
 * GUÍA: RELACIÓN PRODUCTO-SEDE E INVENTARIO-SEDE
 * ================================================
 * 
 * Se agregó id_sede en:
 * - PRODUCTO: Cada producto pertenece a una sede
 * - INVENTARIO: Cada movimiento de inventario se registra por sede
 * 
 * Esto permite:
 * ✓ Control de inventario descentralizado por sede
 * ✓ Reporte de stock disponible por sede
 * ✓ Auditoría de movimientos de inventario por sede
 */

// ============================================
// 1. QUERIES SQL DISPONIBLES
// ============================================

const queries = {
  // Productos disponibles en una sede
  productosPorSede: `
    SELECT 
      p.codigo_producto,
      p.nombre,
      p.descripcion,
      p.precio,
      p.cantidad_stock,
      p.categoria,
      s.nombre as sede_nombre
    FROM producto p
    JOIN sede s ON p.id_sede = s.id_sede
    WHERE p.id_sede = $1
    ORDER BY p.nombre
  `,

  // Inventario de un producto en una sede
  inventarioPorProductoSede: `
    SELECT 
      i.id_movimiento,
      i.tipo_movimiento,
      i.cantidad,
      i.fecha_movimiento,
      i.descripcion,
      s.nombre as sede_nombre
    FROM inventario i
    JOIN sede s ON i.id_sede = s.id_sede
    WHERE i.codigo_producto = $1 AND i.id_sede = $2
    ORDER BY i.fecha_movimiento DESC
  `,

  // Stock disponible por sede de un producto
  stockPorSede: `
    SELECT 
      p.codigo_producto,
      p.nombre,
      s.id_sede,
      s.nombre as sede_nombre,
      p.cantidad_stock,
      (
        SELECT COALESCE(SUM(CASE WHEN tipo_movimiento = 'entrada' THEN cantidad ELSE -cantidad END), 0)
        FROM inventario
        WHERE codigo_producto = p.codigo_producto AND id_sede = s.id_sede
      ) as stock_calculado
    FROM producto p
    CROSS JOIN sede s
    WHERE p.codigo_producto = $1
    ORDER BY s.nombre
  `,

  // Historial completo de inventario por sede
  historialInventarioPorSede: `
    SELECT 
      i.id_movimiento,
      i.codigo_producto,
      p.nombre as producto_nombre,
      i.id_sede,
      s.nombre as sede_nombre,
      i.tipo_movimiento,
      i.cantidad,
      i.fecha_movimiento,
      i.descripcion
    FROM inventario i
    JOIN producto p ON i.codigo_producto = p.codigo_producto
    JOIN sede s ON i.id_sede = s.id_sede
    WHERE i.id_sede = $1
    ORDER BY i.fecha_movimiento DESC
  `,

  // Crear producto en una sede
  crearProducto: `
    INSERT INTO producto (codigo_producto, id_sede, nombre, descripcion, precio, cantidad_stock, categoria)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `,

  // Registrar movimiento de inventario
  registrarMovimiento: `
    INSERT INTO inventario (id_sede, codigo_producto, tipo_movimiento, cantidad, descripcion)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  // Resumen de inventario por sede
  resumenInventarioPorSede: `
    SELECT 
      s.id_sede,
      s.nombre as sede_nombre,
      COUNT(DISTINCT i.codigo_producto) as cantidad_productos,
      COALESCE(SUM(CASE WHEN i.tipo_movimiento = 'entrada' THEN i.cantidad ELSE 0 END), 0) as total_entradas,
      COALESCE(SUM(CASE WHEN i.tipo_movimiento = 'salida' THEN i.cantidad ELSE 0 END), 0) as total_salidas
    FROM sede s
    LEFT JOIN inventario i ON s.id_sede = i.id_sede
    GROUP BY s.id_sede, s.nombre
    ORDER BY s.nombre
  `
};

// ============================================
// 2. ENDPOINTS EXPRESS DE EJEMPLO
// ============================================

const express = require('express');
const db = require('../javascript/databasepg');
const { auditMiddleware, auditQuery } = require('../javascript/audit-middleware');
const { authMiddleware } = require('./auth');

const router = express.Router();

/**
 * GET /api/productos/sede/:sedeId
 * Obtener todos los productos de una sede
 */
router.get('/sede/:sedeId', authMiddleware, async (req, res) => {
  try {
    const { sedeId } = req.params;
    const result = await db.query(queries.productosPorSede, [sedeId]);
    
    res.json({
      ok: true,
      sede_id: sedeId,
      total_productos: result.rows.length,
      productos: result.rows
    });
  } catch (err) {
    console.error('Error obteniendo productos por sede:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventario/producto/:codigoProducto/sede/:sedeId
 * Obtener historial de inventario de un producto en una sede
 */
router.get('/inventario/producto/:codigoProducto/sede/:sedeId', authMiddleware, async (req, res) => {
  try {
    const { codigoProducto, sedeId } = req.params;
    const result = await db.query(queries.inventarioPorProductoSede, [codigoProducto, sedeId]);
    
    res.json({
      ok: true,
      codigo_producto: codigoProducto,
      sede_id: sedeId,
      total_movimientos: result.rows.length,
      movimientos: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/productos/:codigoProducto/stock-por-sede
 * Ver disponibilidad de un producto en todas las sedes
 */
router.get('/:codigoProducto/stock-por-sede', authMiddleware, async (req, res) => {
  try {
    const { codigoProducto } = req.params;
    const result = await db.query(queries.stockPorSede, [codigoProducto]);
    
    res.json({
      ok: true,
      codigo_producto: codigoProducto,
      disponibilidad_por_sede: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventario/sede/:sedeId/historial
 * Ver historial completo de inventario de una sede
 */
router.get('/inventario/sede/:sedeId/historial', authMiddleware, async (req, res) => {
  try {
    const { sedeId } = req.params;
    const result = await db.query(queries.historialInventarioPorSede, [sedeId]);
    
    res.json({
      ok: true,
      sede_id: sedeId,
      total_movimientos: result.rows.length,
      movimientos: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/inventario/resumen
 * Ver resumen de inventario de todas las sedes
 */
router.get('/inventario/resumen', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(queries.resumenInventarioPorSede);
    
    res.json({
      ok: true,
      total_sedes: result.rows.length,
      resumen: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/productos
 * Crear nuevo producto en una sede (con auditoría)
 */
router.post('/', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const { codigo_producto, id_sede, nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    
    // Validar que la sede existe
    const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
    if (sedeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Sede no encontrada' });
    }

    const result = await auditQuery(
      db.pool,
      req.auditUserId,
      queries.crearProducto,
      [codigo_producto, id_sede, nombre, descripcion, precio, cantidad_stock || 0, categoria]
    );

    res.status(201).json({
      ok: true,
      message: 'Producto creado exitosamente',
      producto: result.rows[0]
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El código de producto ya existe' });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/inventario/movimiento
 * Registrar un movimiento de inventario (entrada/salida) con auditoría
 */
router.post('/movimiento', auditMiddleware, authMiddleware, async (req, res) => {
  try {
    const { id_sede, codigo_producto, tipo_movimiento, cantidad, descripcion } = req.body;
    
    // Validar datos
    if (!id_sede || !codigo_producto || !tipo_movimiento || !cantidad) {
      return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    if (!['entrada', 'salida'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'tipo_movimiento debe ser "entrada" o "salida"' });
    }

    // Validar que sede y producto existan
    const sedeCheck = await db.query('SELECT id_sede FROM sede WHERE id_sede = $1', [id_sede]);
    if (sedeCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Sede no encontrada' });
    }

    const prodCheck = await db.query('SELECT codigo_producto FROM producto WHERE codigo_producto = $1', [codigo_producto]);
    if (prodCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Producto no encontrado' });
    }

    const result = await auditQuery(
      db.pool,
      req.auditUserId,
      queries.registrarMovimiento,
      [id_sede, codigo_producto, tipo_movimiento, cantidad, descripcion || null]
    );

    res.status(201).json({
      ok: true,
      message: 'Movimiento de inventario registrado',
      movimiento: result.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ============================================
// 3. EJEMPLOS DE USO / LLAMADAS API
// ============================================

/*
CREAR PRODUCTO EN UNA SEDE:
POST /api/productos
{
  "codigo_producto": "PROD-006",
  "id_sede": 1,
  "nombre": "Webcam Logitech 4K",
  "descripcion": "Cámara web 4K con audio",
  "precio": 159.99,
  "cantidad_stock": 10,
  "categoria": "Accesorios"
}

RESPONSE:
{
  "ok": true,
  "message": "Producto creado exitosamente",
  "producto": {
    "codigo_producto": "PROD-006",
    "id_sede": 1,
    "nombre": "Webcam Logitech 4K",
    "descripcion": "Cámara web 4K con audio",
    "precio": 159.99,
    "cantidad_stock": 10,
    "categoria": "Accesorios"
  }
}

---

OBTENER PRODUCTOS DE UNA SEDE:
GET /api/productos/sede/1

RESPONSE:
{
  "ok": true,
  "sede_id": 1,
  "total_productos": 3,
  "productos": [
    {
      "codigo_producto": "PROD-001",
      "nombre": "Laptop Dell XPS 13",
      "descripcion": "Portátil ultraligero 13 pulgadas",
      "precio": 1200.00,
      "cantidad_stock": 15,
      "categoria": "Electrónica",
      "sede_nombre": "Sede Principal"
    },
    ...
  ]
}

---

REGISTRAR MOVIMIENTO ENTRADA DE INVENTARIO:
POST /api/inventario/movimiento
{
  "id_sede": 1,
  "codigo_producto": "PROD-001",
  "tipo_movimiento": "entrada",
  "cantidad": 50,
  "descripcion": "Compra a proveedor distribuidor C"
}

RESPONSE:
{
  "ok": true,
  "message": "Movimiento de inventario registrado",
  "movimiento": {
    "id_movimiento": 6,
    "id_sede": 1,
    "codigo_producto": "PROD-001",
    "tipo_movimiento": "entrada",
    "cantidad": 50,
    "fecha_movimiento": "2026-04-13T15:30:45.123Z",
    "descripcion": "Compra a proveedor distribuidor C"
  }
}

---

REGISTRAR MOVIMIENTO SALIDA DE INVENTARIO:
POST /api/inventario/movimiento
{
  "id_sede": 1,
  "codigo_producto": "PROD-002",
  "tipo_movimiento": "salida",
  "cantidad": 10,
  "descripcion": "Venta pedido PED-010"
}

---

VER DISPONIBILIDAD DE PRODUCTO EN TODAS LAS SEDES:
GET /api/productos/PROD-001/stock-por-sede

RESPONSE:
{
  "ok": true,
  "codigo_producto": "PROD-001",
  "disponibilidad_por_sede": [
    {
      "codigo_producto": "PROD-001",
      "nombre": "Laptop Dell XPS 13",
      "id_sede": 1,
      "sede_nombre": "Sede Principal",
      "cantidad_stock": 15,
      "stock_calculado": 60  // 20 entrada - 5 salida + 50 entrada + más
    },
    {
      "codigo_producto": "PROD-001",
      "nombre": "Laptop Dell XPS 13",
      "id_sede": 2,
      "sede_nombre": "Sede Sur",
      "cantidad_stock": 0,
      "stock_calculado": 0
    }
  ]
}

---

HISTORIAL DE INVENTARIO DE UNA SEDE:
GET /api/inventario/sede/1/historial

RESPONSE:
{
  "ok": true,
  "sede_id": 1,
  "total_movimientos": 5,
  "movimientos": [
    {
      "id_movimiento": 6,
      "codigo_producto": "PROD-001",
      "producto_nombre": "Laptop Dell XPS 13",
      "id_sede": 1,
      "sede_nombre": "Sede Principal",
      "tipo_movimiento": "entrada",
      "cantidad": 50,
      "fecha_movimiento": "2026-04-13T15:30:45.123Z",
      "descripcion": "Compra a proveedor distribuidor C"
    },
    ...
  ]
}

---

RESUMEN DE INVENTARIO POR SEDE:
GET /api/inventario/resumen

RESPONSE:
{
  "ok": true,
  "total_sedes": 2,
  "resumen": [
    {
      "id_sede": 1,
      "sede_nombre": "Sede Principal",
      "cantidad_productos": 4,
      "total_entradas": 270,
      "total_salidas": 16
    },
    {
      "id_sede": 2,
      "sede_nombre": "Sede Sur",
      "cantidad_productos": 2,
      "total_entradas": 50,
      "total_salidas": 0
    }
  ]
}
*/
