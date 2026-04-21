const express = require('express');
const db = require('../javascript/databasepg');
const { authMiddleware } = require('./auth');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Helper function to generate unique product code
function generateProductCode() {
  return 'PROD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

// Helper function to validate product data
function validateProductData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate && !data.codigo_producto) {
    errors.push('El código del producto es requerido');
  }
  
  if (!data.nombre || data.nombre.trim().length === 0) {
    errors.push('El nombre del producto es requerido');
  }
  
  if (data.precio === undefined || data.precio === null || isNaN(data.precio) || data.precio < 0) {
    errors.push('El precio debe ser un número válido mayor o igual a 0');
  }
  
  if (data.cantidad_stock !== undefined && (isNaN(data.cantidad_stock) || data.cantidad_stock < 0)) {
    errors.push('El stock debe ser un número válido mayor o igual a 0');
  }
  
  return errors;
}

// Obtener productos con filtros avanzados (protegido)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { q, categoria, min_price, max_price, min_stock, max_stock, sort_by, order, page = 1, limit = 50 } = req.query;
    
    let text = 'SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, id_sede, fecha_creacion, fecha_actualizacion FROM "producto"';
    const clauses = [];
    const values = [];
    
    // Búsqueda por texto
    if (q) {
      values.push('%' + q + '%');
      clauses.push('(nombre ILIKE $' + values.length + ' OR descripcion ILIKE $' + values.length + ' OR codigo_producto ILIKE $' + values.length + ')');
    }
    
    // Filtro por categoría
    if (categoria) {
      values.push(categoria);
      clauses.push('categoria = $' + values.length);
    }
    
    // Filtro por rango de precios
    if (min_price !== undefined) {
      values.push(parseFloat(min_price));
      clauses.push('precio >= $' + values.length);
    }
    
    if (max_price !== undefined) {
      values.push(parseFloat(max_price));
      clauses.push('precio <= $' + values.length);
    }
    
    // Filtro por rango de stock
    if (min_stock !== undefined) {
      values.push(parseInt(min_stock));
      clauses.push('cantidad_stock >= $' + values.length);
    }
    
    if (max_stock !== undefined) {
      values.push(parseInt(max_stock));
      clauses.push('cantidad_stock <= $' + values.length);
    }
    
    if (clauses.length) text += ' WHERE ' + clauses.join(' AND ');
    
    // Ordenamiento
    const validSortFields = ['codigo_producto', 'nombre', 'precio', 'cantidad_stock', 'categoria', 'fecha_creacion'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'codigo_producto';
    const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
    text += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    text += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const result = await db.query(text, values);
    
    // Obtener total de productos para paginación
    let countText = 'SELECT COUNT(*) as total FROM "producto"';
    if (clauses.length) {
      countText += ' WHERE ' + clauses.join(' AND ');
    }
    const countResult = await db.query(countText, values);
    
    res.json({ 
      ok: true, 
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error GET /api/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Crear producto (público para pruebas)
router.post('/public/productos', async (req, res) => {
  try {
    const { codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, id_sede, imagen } = req.body;
    
    // Validar datos
    const errors = validateProductData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }

    // Generar código de producto único si no se proporciona
    const codigo = codigo_producto || generateProductCode();
    
    // Verificar si el código ya existe
    const existingProduct = await db.query('SELECT codigo_producto FROM "producto" WHERE codigo_producto = $1', [codigo]);
    if (existingProduct.rows.length > 0) {
      return res.status(400).json({ error: 'El código del producto ya existe' });
    }

    const text = 'INSERT INTO "producto" (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, id_sede, imagen, fecha_creacion, fecha_actualizacion) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *';
    const values = [codigo, nombre, descripcion || null, precio, cantidad_stock || 0, categoria || null, id_sede || 1, imagen || null];
    const result = await db.query(text, values);
    
    // Registrar en auditoría
    try {
      await db.query(
        'INSERT INTO "auditoria" (id_usuario, tabla_afectada, accion, fecha_accion, detalles) VALUES ($1,$2,$3,NOW(),$4)',
        [1, 'producto', 'CREAR', `Producto creado: ${codigo} - ${nombre}`]
      );
    } catch (auditErr) {
      console.error('Error en auditoría:', auditErr);
    }
    
    res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error POST /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Listar productos (público, sin autenticación)
router.get('/public/productos', async (req, res) => {
  try {
    const { q, categoria, min_price, max_price, min_stock, max_stock, sort_by, order, page = 1, limit = 50 } = req.query;
    
    let text = 'SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, id_sede, imagen, fecha_creacion, fecha_actualizacion FROM "producto"';
    const clauses = [];
    const values = [];
    
    // Búsqueda por texto
    if (q) {
      values.push('%' + q + '%');
      clauses.push('(nombre ILIKE $' + values.length + ' OR descripcion ILIKE $' + values.length + ' OR codigo_producto ILIKE $' + values.length + ')');
    }
    
    // Filtro por categoría
    if (categoria) {
      values.push(categoria);
      clauses.push('categoria = $' + values.length);
    }
    
    // Filtro por rango de precios
    if (min_price !== undefined) {
      values.push(parseFloat(min_price));
      clauses.push('precio >= $' + values.length);
    }
    
    if (max_price !== undefined) {
      values.push(parseFloat(max_price));
      clauses.push('precio <= $' + values.length);
    }
    
    // Filtro por rango de stock
    if (min_stock !== undefined) {
      values.push(parseInt(min_stock));
      clauses.push('cantidad_stock >= $' + values.length);
    }
    
    if (max_stock !== undefined) {
      values.push(parseInt(max_stock));
      clauses.push('cantidad_stock <= $' + values.length);
    }
    
    if (clauses.length) text += ' WHERE ' + clauses.join(' AND ');
    
    // Ordenamiento
    const validSortFields = ['codigo_producto', 'nombre', 'precio', 'cantidad_stock', 'categoria', 'fecha_creacion'];
    const sortField = validSortFields.includes(sort_by) ? sort_by : 'codigo_producto';
    const sortOrder = order === 'DESC' ? 'DESC' : 'ASC';
    text += ` ORDER BY ${sortField} ${sortOrder}`;
    
    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    text += ` LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    const result = await db.query(text, values);
    
    // Obtener total de productos para paginación
    let countText = 'SELECT COUNT(*) as total FROM "producto"';
    if (clauses.length) {
      countText += ' WHERE ' + clauses.join(' AND ');
    }
    const countResult = await db.query(countText, values);
    
    res.json({ 
      ok: true, 
      products: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].total),
        pages: Math.ceil(countResult.rows[0].total / parseInt(limit))
      }
    });
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

// Obtener categorías disponibles (público)
router.get('/public/productos/categories', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT DISTINCT categoria, COUNT(*) as count FROM "producto" WHERE categoria IS NOT NULL GROUP BY categoria ORDER BY categoria'
    );
    
    res.json({ ok: true, categories: result.rows });
  } catch (err) {
    console.error('Error GET /api/public/productos/categories', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener estadísticas de productos (público)
router.get('/public/productos/stats', async (req, res) => {
  try {
    const stats = {};
    
    // Total de productos
    const totalResult = await db.query('SELECT COUNT(*) as total FROM "producto"');
    stats.total_products = parseInt(totalResult.rows[0].total);
    
    // Productos por categoría
    const categoryResult = await db.query(
      'SELECT categoria, COUNT(*) as count FROM "producto" WHERE categoria IS NOT NULL GROUP BY categoria ORDER BY count DESC'
    );
    stats.by_category = categoryResult.rows;
    
    // Productos con bajo stock (< 10)
    const lowStockResult = await db.query(
      'SELECT COUNT(*) as low_stock FROM "producto" WHERE cantidad_stock < 10'
    );
    stats.low_stock = parseInt(lowStockResult.rows[0].low_stock);
    
    // Productos agotados
    const outOfStockResult = await db.query(
      'SELECT COUNT(*) as out_of_stock FROM "producto" WHERE cantidad_stock = 0'
    );
    stats.out_of_stock = parseInt(outOfStockResult.rows[0].out_of_stock);
    
    // Valor total del inventario
    const valueResult = await db.query(
      'SELECT SUM(precio * cantidad_stock) as total_value FROM "producto" WHERE cantidad_stock > 0'
    );
    stats.total_inventory_value = parseFloat(valueResult.rows[0].total_value) || 0;
    
    // Productos más caros
    const expensiveResult = await db.query(
      'SELECT codigo_producto, nombre, precio FROM "producto" ORDER BY precio DESC LIMIT 5'
    );
    stats.most_expensive = expensiveResult.rows;
    
    // Productos con más stock
    const highStockResult = await db.query(
      'SELECT codigo_producto, nombre, cantidad_stock FROM "producto" ORDER BY cantidad_stock DESC LIMIT 5'
    );
    stats.highest_stock = highStockResult.rows;
    
    // Último producto con cambio de stock (basado en fecha_actualizacion)
    const lastStockResult = await db.query(
      'SELECT codigo_producto, nombre, cantidad_stock, fecha_actualizacion FROM "producto" WHERE fecha_actualizacion IS NOT NULL ORDER BY fecha_actualizacion DESC LIMIT 1'
    );
    stats.last_stock_update = lastStockResult.rows[0] || null;
    
    res.json({ ok: true, stats });
  } catch (err) {
    console.error('Error GET /api/public/productos/stats', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar stock de producto (público para pruebas)
router.patch('/public/productos/:codigo/stock', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { cantidad, operacion } = req.body; // operacion: 'set', 'add', 'subtract'
    
    if (!['set', 'add', 'subtract'].includes(operacion)) {
      return res.status(400).json({ error: 'Operación no válida. Use: set, add, o subtract' });
    }
    
    if (isNaN(cantidad) || cantidad < 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número válido mayor o igual a 0' });
    }
    
    // Verificar si el producto existe
    const existingProduct = await db.query('SELECT cantidad_stock FROM "producto" WHERE codigo_producto = $1', [codigo]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    let newStock;
    const currentStock = existingProduct.rows[0].cantidad_stock;
    
    switch (operacion) {
      case 'set':
        newStock = cantidad;
        break;
      case 'add':
        newStock = currentStock + cantidad;
        break;
      case 'subtract':
        newStock = Math.max(0, currentStock - cantidad);
        break;
    }
    
    const result = await db.query(
      'UPDATE "producto" SET cantidad_stock = $1, fecha_actualizacion = NOW() WHERE codigo_producto = $2 RETURNING *',
      [newStock, codigo]
    );
    
    // Registrar movimiento en inventario
    try {
      const tipoMovimiento = operacion === 'add' ? 'entrada' : operacion === 'subtract' ? 'salida' : 'ajuste';
      await db.query(
        'INSERT INTO "inventario" (codigo_producto, tipo_movimiento, cantidad, descripcion, fecha_movimiento) VALUES ($1,$2,$3,$4,NOW())',
        [codigo, tipoMovimiento, cantidad, `Actualización de stock: ${operacion} ${cantidad}`]
      );
    } catch (invErr) {
      console.error('Error en registro de inventario:', invErr);
    }
    
    // Registrar en auditoría
    try {
      await db.query(
        'INSERT INTO "auditoria" (id_usuario, tabla_afectada, accion, fecha_accion, detalles) VALUES ($1,$2,$3,NOW(),$4)',
        [1, 'producto', 'ACTUALIZAR_STOCK', `Stock actualizado: ${codigo} - ${operacion} ${cantidad} (nuevo: ${newStock})`]
      );
    } catch (auditErr) {
      console.error('Error en auditoría:', auditErr);
    }
    
    res.json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error PATCH /api/public/productos/:codigo/stock', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener un producto específico (público)
router.get('/public/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    const result = await db.query(
      'SELECT * FROM "producto" WHERE codigo_producto = $1',
      [codigo]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    res.json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error GET /api/public/productos/:codigo', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar producto (público para pruebas)
router.put('/public/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, descripcion, precio, cantidad_stock, categoria, id_sede, imagen } = req.body;
    
    // Validar que el producto existe
    const existingProduct = await db.query('SELECT codigo_producto FROM "producto" WHERE codigo_producto = $1', [codigo]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Validar datos
    const errors = validateProductData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({ error: 'Datos inválidos', details: errors });
    }

    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (nombre !== undefined) {
      updates.push(`nombre = $${paramIndex++}`);
      values.push(nombre);
    }
    
    if (descripcion !== undefined) {
      updates.push(`descripcion = $${paramIndex++}`);
      values.push(descripcion);
    }
    
    if (precio !== undefined) {
      updates.push(`precio = $${paramIndex++}`);
      values.push(precio);
    }
    
    if (cantidad_stock !== undefined) {
      updates.push(`cantidad_stock = $${paramIndex++}`);
      values.push(cantidad_stock);
    }
    
    if (categoria !== undefined) {
      updates.push(`categoria = $${paramIndex++}`);
      values.push(categoria);
    }
    
    if (id_sede !== undefined) {
      updates.push(`id_sede = $${paramIndex++}`);
      values.push(id_sede);
    }
    
    if (imagen !== undefined) {
      updates.push(`imagen = $${paramIndex++}`);
      values.push(imagen);
    }
    
    updates.push(`fecha_actualizacion = NOW()`);
    values.push(codigo);
    
    const text = `UPDATE "producto" SET ${updates.join(', ')} WHERE codigo_producto = $${paramIndex} RETURNING *`;
    const result = await db.query(text, values);
    
    // Registrar en auditoría
    try {
      await db.query(
        'INSERT INTO "auditoria" (id_usuario, tabla_afectada, accion, fecha_accion, detalles) VALUES ($1,$2,$3,NOW(),$4)',
        [1, 'producto', 'ACTUALIZAR', `Producto actualizado: ${codigo}`]
      );
    } catch (auditErr) {
      console.error('Error en auditoría:', auditErr);
    }
    
    res.json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error PUT /api/public/productos/:codigo', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar producto (público para pruebas)
router.delete('/public/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    
    // Verificar si el producto existe
    const existingProduct = await db.query('SELECT * FROM "producto" WHERE codigo_producto = $1', [codigo]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    
    // Verificar si el producto está en algún pedido activo
    try {
      const inOrder = await db.query(
        'SELECT dp.id_pedido FROM detalle_pedido dp JOIN pedido p ON dp.id_pedido = p.id_pedido WHERE dp.codigo_producto = $1 AND p.estado NOT IN (\'cancelled\', \'delivered\')',
        [codigo]
      );
      
      if (inOrder.rows.length > 0) {
        return res.status(400).json({ error: 'No se puede eliminar el producto porque está en pedidos activos' });
      }
    } catch (orderCheckErr) {
      console.error('Error verificando pedidos activos:', orderCheckErr);
      // Si hay error al verificar pedidos, continuamos con la eliminación
      // pero registramos el error
    }
    
    // Eliminar registros relacionados en inventario primero
    await db.query('DELETE FROM "inventario" WHERE codigo_producto = $1', [codigo]);
    
    // Eliminar el producto
    await db.query('DELETE FROM "producto" WHERE codigo_producto = $1', [codigo]);
    
    // Registrar en auditoría
    try {
      await db.query(
        'INSERT INTO "auditoria" (id_usuario, tabla_afectada, accion, fecha_accion, detalles) VALUES ($1,$2,$3,NOW(),$4)',
        [1, 'producto', 'ELIMINAR', `Producto eliminado: ${codigo} - ${existingProduct.rows[0].nombre}`]
      );
    } catch (auditErr) {
      console.error('Error en auditoría:', auditErr);
    }
    
    res.json({ ok: true, message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error('Error DELETE /api/public/productos/:codigo', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
  }
});

// Endpoint para subir imágenes de productos
router.post('/upload-image', authMiddleware, (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({ error: 'No se proporcionó ninguna imagen' });
    }

    const image = req.files.image;
    
    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(image.mimetype)) {
      return res.status(400).json({ error: 'Tipo de archivo no permitido. Solo se aceptan imágenes JPEG, PNG, GIF y WebP' });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (image.size > maxSize) {
      return res.status(400).json({ error: 'La imagen es demasiado grande. Máximo permitido: 5MB' });
    }

    // Generar nombre único
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(image.name);
    const filename = `product_${timestamp}_${randomString}${extension}`;
    
    // Ruta donde se guardará la imagen
    const uploadPath = path.join(__dirname, '..', 'public', 'images', 'products', filename);
    
    // Mover el archivo
    image.mv(uploadPath, (err) => {
      if (err) {
        console.error('Error al guardar imagen:', err);
        return res.status(500).json({ error: 'Error al guardar la imagen' });
      }
      
      // Devolver la ruta relativa para guardar en la base de datos
      const imagePath = `/images/products/${filename}`;
      res.json({ 
        ok: true, 
        imagePath: imagePath,
        message: 'Imagen subida exitosamente'
      });
    });
  } catch (err) {
    console.error('Error en upload de imagen:', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

module.exports = router;
