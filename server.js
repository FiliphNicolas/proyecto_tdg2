require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./databasepg');
const { protectPages, serveProtectedPage } = require('./auth-middleware');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'systemsware_secret_change_this';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Aplicar middleware de protección a todas las rutas
app.use(protectPages);

// Inicializar base de datos al iniciar el servidor
const initializeServer = async () => {
  try {
    console.log('🔄 Inicializando conexión a PostgreSQL...');

    // Probar conexión
    const connected = await db.testConnection();
    if (!connected) {
      console.error('❌ No se pudo conectar a PostgreSQL. Verifica tu configuración.');
      process.exit(1);
}

    // Inicializar base de datos
    await db.initializeDatabase();

    console.log('✅ Servidor inicializado correctamente');
} catch (error) {
    console.error('❌ Error al inicializar el servidor:', error);
    process.exit(1);
}
};

// --- API endpoints defined below ---
// (Static files are served after so that POST/PUT/etc. don't trigger 405 responses)

// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena, direccion, numero_cel, ciudad } = req.body;
    if (!nombre || !correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const hashed = await bcrypt.hash(contrasena, 10);

    const text = 'INSERT INTO "usuario" (nombre_usuario, contrasena, email, rol, activo, direccion, numero_cel, ciudad) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id_usuario, nombre_usuario, email';
    const values = [nombre, hashed, correo, 'empleado', true, direccion || null, numero_cel || null, ciudad || null];

    const result = await db.query(text, values);
    const user = result.rows[0];

    const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ ok: true, user, token });
} catch (err) {
    console.error('Error /api/register', err);
    if (err.code === '23505') return res.status(409).json({ error: 'El usuario o correo ya existe' });
    res.status(500).json({ error: 'Error al registrar: ' + err.message });
}
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const text = 'SELECT id_usuario, nombre_usuario, contrasena FROM "usuario" WHERE email = $1 LIMIT 1';
    const values = [correo];
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Credenciales inválidas' });

    const user = result.rows[0];
    const match = await bcrypt.compare(contrasena, user.contrasena);
    if (!match) return res.status(401).json({ error: 'Credenciales inválidas' });

    const token = jwt.sign({ id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ ok: true, user: { id_usuario: user.id_usuario, nombre_usuario: user.nombre_usuario }, token });
} catch (err) {
    console.error('Error /api/login', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
}
});

// Middleware para proteger rutas
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No autorizado' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Formato de token inválido' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
} catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
}
}

// Endpoint de sincronización: obtener productos
app.get('/api/sync/products', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock FROM "producto" ORDER BY codigo_producto');
    res.json({ ok: true, products: result.rows });
} catch (err) {
    console.error('Error /api/sync/products', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Endpoint de sincronización: actualizar stock (ejemplo simple)
app.post('/api/sync/update-stock', authMiddleware, async (req, res) => {
  try {
    const { codigo_producto, cantidad } = req.body;
    if (!codigo_producto || typeof cantidad !== 'number') return res.status(400).json({ error: 'Datos inválidos' });

    const update = 'UPDATE "producto" SET cantidad_stock = $1 WHERE codigo_producto = $2 RETURNING codigo_producto, cantidad_stock';
    const result = await db.query(update, [cantidad, codigo_producto]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: result.rows[0] });
} catch (err) {
    console.error('Error /api/sync/update-stock', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Obtener datos del usuario autenticado
app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const text = 'SELECT id_usuario, nombre_usuario, email, rol, activo, direccion, numero_cel, ciudad, fecha_creacion FROM "usuario" WHERE id_usuario = $1 LIMIT 1';
    const result = await db.query(text, [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ ok: true, user: result.rows[0] });
} catch (err) {
    console.error('Error /api/me', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Actualizar datos del usuario autenticado (incluye nombre, correo y/o contraseña)
app.patch('/api/me', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const { nombre, correo, contrasena, direccion, numero_cel, ciudad } = req.body;

    if (!nombre && !correo && !contrasena && !direccion && !numero_cel && !ciudad) {
      return res.status(400).json({ error: 'Nada para actualizar' });
}

    // Actualizar nombre
    if (nombre) {
      await db.query('UPDATE "usuario" SET nombre_usuario = $1 WHERE id_usuario = $2', [nombre, id]);
}

    // Actualizar correo
    if (correo) {
      try {
        await db.query('UPDATE "usuario" SET email = $1 WHERE id_usuario = $2', [correo, id]);
} catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'El correo ya está en uso' });
        throw err;
}
}

    // Actualizar dirección
    if (direccion !== undefined) {
      await db.query('UPDATE "usuario" SET direccion = $1 WHERE id_usuario = $2', [direccion, id]);
}

    // Actualizar teléfono
    if (numero_cel !== undefined) {
      await db.query('UPDATE "usuario" SET numero_cel = $1 WHERE id_usuario = $2', [numero_cel, id]);
}

    // Actualizar ciudad
    if (ciudad !== undefined) {
      await db.query('UPDATE "usuario" SET ciudad = $1 WHERE id_usuario = $2', [ciudad, id]);
}

    // Actualizar contraseña
    if (contrasena) {
      const hashed = await bcrypt.hash(contrasena, 10);
      await db.query('UPDATE "usuario" SET contrasena = $1 WHERE id_usuario = $2', [hashed, id]);
}

    const result = await db.query('SELECT id_usuario, nombre_usuario, email, rol, activo FROM "usuario" WHERE id_usuario = $1', [id]);
    res.json({ ok: true, user: result.rows[0] });
} catch (err) {
    console.error('Error PATCH /api/me', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// endpoint dedicado solo a cambiar contraseña (utilizado por la interfaz actualmente)
app.post('/api/me/password', authMiddleware, async (req, res) => {
  try {
    const id = req.user.id_usuario;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });

    // Verificar contraseña actual
    const userResult = await db.query('SELECT contrasena FROM "usuario" WHERE id_usuario = $1', [id]);
    if (userResult.rowCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });

    const currentHash = userResult.rows[0].contrasena;
    const isValid = await bcrypt.compare(currentPassword, currentHash);
    if (!isValid) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    // Actualizar contraseña
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE "usuario" SET contrasena = $1 WHERE id_usuario = $2', [hashed, id]);
    res.json({ ok: true });
} catch (err) {
    console.error('Error POST /api/me/password', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// PRODUCTO CRUD
// Crear producto
app.post('/api/productos', authMiddleware, async (req, res) => {
  try {
    const { codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    if (!nombre || precio == null) return res.status(400).json({ error: 'Faltan campos obligatorios' });

    // Generar código automático si no se proporciona
    const final_codigo = codigo_producto || 'PROD-' + Date.now();

    const text = 'INSERT INTO "producto" (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria, fecha_creacion) VALUES ($1,$2,$3,$4,$5,$6,NOW()) RETURNING codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria';
    const values = [final_codigo, nombre, descripcion || null, precio, cantidad_stock || 0, categoria || null];
    const result = await db.query(text, values);
    res.status(201).json({ ok: true, product: result.rows[0] });
} catch (err) {
    console.error('Error POST /api/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Crear producto (público para pruebas)
app.post('/api/public/productos', async (req, res) => {
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

// Actualizar producto (público para pruebas)
app.put('/api/public/productos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    const fields = [];
    const values = [];
    if (nombre !== undefined) { fields.push('nombre = $' + (values.length + 1)); values.push(nombre); }
    if (descripcion !== undefined) { fields.push('descripcion = $' + (values.length + 1)); values.push(descripcion); }
    if (precio !== undefined) { fields.push('precio = $' + (values.length + 1)); values.push(precio); }
    if (cantidad_stock !== undefined) { fields.push('cantidad_stock = $' + (values.length + 1)); values.push(cantidad_stock); }
    if (categoria !== undefined) { fields.push('categoria = $' + (values.length + 1)); values.push(categoria); }
    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });

    fields.push('fecha_actualizacion = NOW()');
    values.push(id);
    const text = 'UPDATE producto SET ' + fields.join(', ') + ' WHERE codigo_producto = $' + values.length + ' RETURNING codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria';
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: result.rows[0] });
} catch (err) {
    console.error('Error PUT /api/public/productos/:id', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Eliminar producto (público para pruebas)
app.delete('/api/public/productos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const result = await db.query('DELETE FROM producto WHERE codigo_producto = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true });
} catch (err) {
    console.error('Error DELETE /api/public/productos/:id', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Listar productos (público, sin autenticación)
app.get('/api/public/productos', async (req, res) => {
  try {
    const { q, categoria } = req.query;
    let text = 'SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM producto';
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
    console.error('Error GET /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Obtener movimientos de inventario (público para pruebas)
app.get('/api/public/inventario', async (req, res) => {
  try {
    const { producto, tipo, fecha_desde, fecha_hasta } = req.query;

    let text = `
      SELECT i.codigo_producto, p.nombre as nombre_producto, i.tipo_movimiento,
             i.cantidad, i.descripcion, i.fecha_movimiento
      FROM inventario i
      JOIN producto p ON i.codigo_producto = p.codigo_producto
    `;

    const clauses = [];
    const values = [];

    if (producto) {
      values.push(producto);
      clauses.push('i.codigo_producto = $' + values.length);
}

    if (tipo) {
      values.push(tipo);
      clauses.push('i.tipo_movimiento = $' + values.length);
}

    if (fecha_desde) {
      values.push(fecha_desde);
      clauses.push('i.fecha_movimiento >= $' + values.length);
}

    if (fecha_hasta) {
      values.push(fecha_hasta);
      clauses.push('i.fecha_movimiento <= $' + values.length);
}

    if (clauses.length) {
      text += ' WHERE ' + clauses.join(' AND ');
}

    text += ' ORDER BY i.fecha_movimiento DESC, i.id_movimiento DESC';

    const result = await db.query(text, values);
    res.json({ ok: true, movements: result.rows });
} catch (err) {
    console.error('Error GET /api/public/inventario', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Obtener información completa del inventario (público)
app.get('/api/public/inventario/info', async (req, res) => {
  try {
    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_productos,
        SUM(cantidad_stock) as total_stock,
        COUNT(CASE WHEN cantidad_stock = 0 THEN 1 END) as productos_agotados,
        COUNT(CASE WHEN cantidad_stock <= 5 THEN 1 END) as stock_bajo,
        AVG(precio) as precio_promedio,
        SUM(cantidad_stock * precio) as valor_total_inventario
      FROM producto
    `;
    
    const statsResult = await db.query(statsQuery);
    
    // Productos con stock bajo
    const lowStockQuery = `
      SELECT codigo_producto, nombre, cantidad_stock, categoria
      FROM producto
      WHERE cantidad_stock <= 5 AND cantidad_stock > 0
      ORDER BY cantidad_stock ASC
      LIMIT 10
    `;
    
    const lowStockResult = await db.query(lowStockQuery);
    
    // Productos agotados
    const outOfStockQuery = `
      SELECT codigo_producto, nombre, categoria, precio
      FROM producto
      WHERE cantidad_stock = 0
      ORDER BY nombre
    `;
    
    const outOfStockResult = await db.query(outOfStockQuery);
    
    // Movimientos recientes
    const recentMovementsQuery = `
      SELECT 
        i.codigo_producto,
        p.nombre as nombre_producto,
        i.tipo_movimiento,
        i.cantidad,
        i.descripcion,
        i.fecha_movimiento
      FROM inventario i
      JOIN producto p ON i.codigo_producto = p.codigo_producto
      ORDER BY i.fecha_movimiento DESC
      LIMIT 10
    `;
    
    const recentMovementsResult = await db.query(recentMovementsQuery);
    
    // Productos por categoría
    const categoryQuery = `
      SELECT 
        categoria,
        COUNT(*) as total_productos,
        SUM(cantidad_stock) as total_stock,
        AVG(precio) as precio_promedio
      FROM producto
      WHERE categoria IS NOT NULL
      GROUP BY categoria
      ORDER BY total_stock DESC
    `;
    
    const categoryResult = await db.query(categoryQuery);
    
    // Top 10 productos más valiosos
    const valuableProductsQuery = `
      SELECT 
        codigo_producto,
        nombre,
        cantidad_stock,
        precio,
        (cantidad_stock * precio) as valor_total,
        categoria
      FROM producto
      ORDER BY valor_total DESC
      LIMIT 10
    `;
    
    const valuableProductsResult = await db.query(valuableProductsQuery);
    
    res.json({
      ok: true,
      data: {
        estadisticas_generales: statsResult.rows[0],
        productos_stock_bajo: lowStockResult.rows,
        productos_agotados: outOfStockResult.rows,
        movimientos_recientes: recentMovementsResult.rows,
        productos_por_categoria: categoryResult.rows,
        productos_mas_valiosos: valuableProductsResult.rows
      }
    });
    
  } catch (err) {
    console.error('Error GET /api/public/inventario/info', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Obtener registros de auditoría (requiere autenticación)
app.get('/api/auditoria', authMiddleware, async (req, res) => {
  try {
    const { tabla, accion, fecha_desde, fecha_hasta, limite = 100 } = req.query;

    let text = `
      SELECT
        a.id_auditoria,
        a.fecha_accion,
        u.nombre_usuario,
        a.tabla_afectada,
        a.accion,
        a.detalles
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
    `;

    const values = [];
    const clauses = [];

    if (tabla) {
      values.push(tabla);
      clauses.push('a.tabla_afectada = $' + values.length);
}

    if (accion) {
      values.push(accion);
      clauses.push('a.accion = $' + values.length);
}

    if (fecha_desde) {
      values.push(fecha_desde);
      clauses.push('a.fecha_accion >= $' + values.length);
}

    if (fecha_hasta) {
      values.push(fecha_hasta);
      clauses.push('a.fecha_accion <= $' + values.length);
}

    if (clauses.length) {
      text += ' WHERE ' + clauses.join(' AND ');
}

    text += ' ORDER BY a.fecha_accion DESC LIMIT $' + (values.length + 1);
    values.push(limite);

    const result = await db.query(text, values);
    res.json({ ok: true, data: result.rows });
} catch (err) {
    console.error('Error GET /api/auditoria', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Endpoint mejorado para reporte combinado de auditoría e inventario
app.get('/api/reporte-completo', authMiddleware, async (req, res) => {
  try {
    const { tabla, accion, fecha_desde, fecha_hasta, limite = 50 } = req.query;

    // Consulta principal de auditoría
    let query = `
      SELECT
        a.id_auditoria,
        a.fecha_accion,
        u.nombre_usuario,
        u.email,
        a.tabla_afectada,
        a.accion,
        a.detalles
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
    `;

    const values = [];
    const clauses = [];

    if (tabla) {
      values.push(tabla);
      clauses.push('a.tabla_afectada = $' + values.length);
}

    if (accion) {
      values.push(accion);
      clauses.push('a.accion = $' + values.length);
}

    if (fecha_desde) {
      values.push(fecha_desde);
      clauses.push('a.fecha_accion >= $' + values.length);
}

    if (fecha_hasta) {
      values.push(fecha_hasta);
      clauses.push('a.fecha_accion <= $' + values.length);
}

    if (clauses.length) {
      query += ' WHERE ' + clauses.join(' AND ');
}

    query += ' ORDER BY a.fecha_accion DESC LIMIT $' + (values.length + 1);
    values.push(limite);

    const result = await db.query(query, values);

    // Estadísticas adicionales
    const statsQuery = `
      SELECT
        a.tabla_afectada,
        COUNT(*) as total_auditoria,
        MAX(a.fecha_accion) as ultima_accion,
        STRING_AGG(DISTINCT u.nombre_usuario, ', ') as usuarios_activos
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      GROUP BY a.tabla_afectada
      ORDER BY total_auditoria DESC
    `;

    const statsResult = await db.query(statsQuery);

    // Timeline combinado
    const timelineQuery = `
      SELECT
        'auditoria' as tipo_evento,
        a.fecha_accion as fecha,
        u.nombre_usuario,
        a.tabla_afectada || ' - ' || a.accion as descripcion
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario

      UNION ALL

      SELECT
        'inventario' as tipo_evento,
        i.fecha_movimiento as fecha,
        'Sistema' as nombre_usuario,
        i.codigo_producto || ' - ' || i.tipo_movimiento || ' (' || i.cantidad || ')' as descripcion
      FROM inventario i

      ORDER BY fecha DESC
      LIMIT 15
    `;

    const timelineResult = await db.query(timelineQuery);

    res.json({
      ok: true,
      data: {
        auditoria: result.rows,
        estadisticas: statsResult.rows,
        timeline: timelineResult.rows,
        resumen: {
          total_registros: result.rowCount,
          tablas_afectadas: statsResult.rowCount,
          timeline_eventos: timelineResult.rowCount
}
}
});
} catch (err) {
    console.error('Error GET /api/reporte-completo', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
}
});

// Agregar movimiento de inventario (público para pruebas)
app.post('/api/public/inventario', async (req, res) => {
  try {
    const { codigo_producto, tipo_movimiento, cantidad, descripcion } = req.body;

    if (!codigo_producto || !tipo_movimiento || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
}

    if (!['entrada', 'salida'].includes(tipo_movimiento)) {
      return res.status(400).json({ error: 'Tipo de movimiento inválido' });
}

    // Verificar que el producto existe
    const productCheck = await db.query('SELECT codigo_producto FROM producto WHERE codigo_producto = $1', [codigo_producto]);
    if (productCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
}

    // Insertar movimiento de inventario
    const text = 'INSERT INTO inventario (codigo_producto, tipo_movimiento, cantidad, descripcion, fecha_movimiento) VALUES ($1, $2, $3, $4, NOW()) RETURNING *';
    const values = [codigo_producto, tipo_movimiento, cantidad, descripcion || null];
    const result = await db.query(text, values);

    // Actualizar stock del producto
    const stockUpdate = tipo_movimiento === 'entrada'
      ? 'UPDATE producto SET cantidad_stock = cantidad_stock + $1 WHERE codigo_producto = $2'
      : 'UPDATE producto SET cantidad_stock = cantidad_stock - $1 WHERE codigo_producto = $2';

    await db.query(stockUpdate, [cantidad, codigo_producto]);

    res.status(201).json({ ok: true, movement: result.rows[0] });
} catch (err) {
    console.error('Error POST /api/public/inventario', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Crear nuevo producto (público)
app.post('/api/public/productos', async (req, res) => {
  try {
    const { codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria } = req.body;

    if (!nombre || !precio || !cantidad_stock || !categoria) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    // Generar código automático si no se proporciona
    let finalCode = codigo_producto;
    if (!finalCode) {
      const prefix = 'PROD';
      const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      finalCode = `${prefix}-${random}`;
    }

    // Verificar si el código ya existe
    const existingProduct = await db.query(
      'SELECT codigo_producto FROM producto WHERE codigo_producto = $1',
      [finalCode]
    );

    if (existingProduct.rowCount > 0) {
      return res.status(400).json({ error: 'El código de producto ya existe' });
    }

    const text = `
      INSERT INTO producto (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [finalCode, nombre, descripcion || null, precio, cantidad_stock, categoria];
    
    const result = await db.query(text, values);
    
    res.status(201).json({ 
      ok: true, 
      producto: result.rows[0],
      message: 'Producto creado exitosamente'
    });

  } catch (err) {
    console.error('Error POST /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Actualizar producto (público)
app.put('/api/public/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { nombre, descripcion, precio, cantidad_stock, categoria } = req.body;

    if (!nombre || !precio || !cantidad_stock || !categoria) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const text = `
      UPDATE producto 
      SET nombre = $1, descripcion = $2, precio = $3, cantidad_stock = $4, categoria = $5
      WHERE codigo_producto = $6
      RETURNING *
    `;
    const values = [nombre, descripcion || null, precio, cantidad_stock, categoria, codigo];
    
    const result = await db.query(text, values);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ 
      ok: true, 
      producto: result.rows[0],
      message: 'Producto actualizado exitosamente'
    });

  } catch (err) {
    console.error('Error PUT /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Eliminar producto (público)
app.delete('/api/public/productos/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    // Verificar si el producto existe
    const exists = await db.query(
      'SELECT codigo_producto FROM producto WHERE codigo_producto = $1',
      [codigo]
    );

    if (exists.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar el producto
    await db.query('DELETE FROM producto WHERE codigo_producto = $1', [codigo]);

    res.json({ 
      ok: true, 
      message: 'Producto eliminado exitosamente'
    });

  } catch (err) {
    console.error('Error DELETE /api/public/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Listar productos (con búsqueda y filtrado opcional)
app.get('/api/productos', authMiddleware, async (req, res) => {
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

// Obtener un producto por id
app.get('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const result = await db.query('SELECT codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM "producto" WHERE codigo_producto = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: result.rows[0] });
} catch (err) {
    console.error('Error GET /api/productos/:id', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Actualizar producto
app.put('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const { nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    const fields = [];
    const values = [];
    if (nombre !== undefined) { values.push(nombre); fields.push('nombre = $' + values.length); }
    if (descripcion !== undefined) { values.push(descripcion); fields.push('descripcion = $' + values.length); }
    if (precio !== undefined) { values.push(precio); fields.push('precio = $' + values.length); }
    if (cantidad_stock !== undefined) { values.push(cantidad_stock); fields.push('cantidad_stock = $' + values.length); }
    if (categoria !== undefined) { values.push(categoria); fields.push('categoria = $' + values.length); }
    if (fields.length === 0) return res.status(400).json({ error: 'Nada para actualizar' });

    values.push(id);
    const text = 'UPDATE "producto" SET ' + fields.join(', ') + ' WHERE codigo_producto = $' + values.length + ' RETURNING codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria';
    const result = await db.query(text, values);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, product: result.rows[0] });
} catch (err) {
    console.error('Error PUT /api/productos/:id', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Eliminar producto
app.delete('/api/productos/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const result = await db.query('DELETE FROM "producto" WHERE codigo_producto = $1 RETURNING codigo_producto', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true });
} catch (err) {
    console.error('Error DELETE /api/productos/:id', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Generar Reporte de Inventario
app.get('/api/reporte', authMiddleware, async (req, res) => {
  try {
    const { q, categoria } = req.query;
    let text = `SELECT
                  codigo_producto as codigo,
                  nombre as producto,
                  categoria,
                  cantidad_stock as cantidad,
                  precio,
                  (cantidad_stock * precio) as total
                FROM "producto"`;
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
    res.json({ ok: true, data: result.rows });
} catch (err) {
    console.error('Error GET /api/reporte', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Obtener lista de servicios
app.get('/api/servicios', async (req, res) => {
  try {
    const servicios = [
      {
        id: 1,
        nombre: 'Mantenimiento preventivo',
        descripcion: 'Mantenimiento regular para prevenir problemas y garantizar disponibilidad',
        enlace: '#'
},
      {
        id: 2,
        nombre: 'Reparación',
        descripcion: 'Reparación de equipos y sistemas dañados con garantía',
        enlace: '#'
},
      {
        id: 3,
        nombre: 'Consultoría técnica',
        descripcion: 'Asesoría especializada en tecnología y optimización',
        enlace: '#'
},
      {
        id: 4,
        nombre: 'Instalación de sistemas',
        descripcion: 'Instalación y configuración de soluciones completas',
        enlace: '#'
}
    ];
    res.json({ ok: true, servicios: servicios });
} catch (err) {
    console.error('Error GET /api/servicios', err);
    res.status(500).json({ error: 'Error del servidor' });
}
});

// Exportar inventario a Excel
app.get('/api/inventario/export/excel', authMiddleware, async (req, res) => {
  try {
        // Obtener datos de inventario
    const result = await db.query(`
      SELECT
        p.codigo_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.cantidad_stock,
        p.categoria,
        p.fecha_creacion
      FROM "producto" p
      ORDER BY p.nombre
    `);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No hay productos para exportar' });
}

    // Crear workbook y worksheet
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Código', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Categoría', 'Fecha Creación']
    ];

    result.rows.forEach(row => {
      wsData.push([
        row.codigo_producto,
        row.nombre,
        row.descripcion || '',
        parseFloat(row.precio),
        parseInt(row.cantidad_stock),
        row.categoria || '',
        new Date(row.fecha_creacion).toLocaleDateString('es-ES')
      ]);
});

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    // Generar buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers
    const filename = `inventario_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(excelBuffer);
} catch (err) {
    console.error('Error exportando a Excel:', err);
    res.status(500).json({ error: 'Error al exportar a Excel' });
}
});

// Exportar inventario a PDF
app.get('/api/inventario/export/pdf', authMiddleware, async (req, res) => {
  try {
    const jsPDF = require('jspdf');
        // Obtener datos de inventario
    const result = await db.query(`
      SELECT
        p.codigo_producto,
        p.nombre,
        p.descripcion,
        p.precio,
        p.cantidad_stock,
        p.categoria
      FROM "producto" p
      ORDER BY p.nombre
    `);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No hay productos para exportar' });
}

    // Crear PDF
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text('Reporte de Inventario', 14, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    doc.text(`Total productos: ${result.rowCount}`, 14, 37);

    // Tabla de productos
    const tableData = result.rows.map(row => [
      row.codigo_producto,
      row.nombre,
      row.descripcion || '',
      `$${parseFloat(row.precio).toFixed(2)}`,
      row.cantidad_stock,
      row.categoria || ''
    ]);

    autoTable(doc, {
      head: [['Código', 'Nombre', 'Descripción', 'Precio', 'Stock', 'Categoría']],
      body: tableData,
      startY: 45,
      styles: {
        fontSize: 9,
        cellPadding: 2
},
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255
},
      alternateRowStyles: {
        fillColor: [245, 245, 245]
}
});

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
}

    // Generar buffer y enviar
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const filename = `inventario_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(pdfBuffer);
} catch (err) {
    console.error('Error exportando a PDF:', err);
    res.status(500).json({ error: 'Error al exportar a PDF' });
}
});

// Exportar movimientos de inventario a Excel
app.get('/api/movimientos/export/excel', authMiddleware, async (req, res) => {
  try {
    const XLSX = require('xlsx');
    const { producto, tipo, fechaDesde, fechaHasta } = req.query;

    // Construir consulta con filtros
    let query = `
      SELECT
        m.codigo_producto,
        p.nombre as nombre_producto,
        m.tipo_movimiento,
        m.cantidad,
        m.descripcion,
        m.fecha_movimiento
      FROM "inventario" m
      LEFT JOIN "producto" p ON m.codigo_producto = p.codigo_producto
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (producto) {
      query += ` AND m.codigo_producto = $${paramIndex++}`;
      params.push(producto);
}

    if (tipo) {
      query += ` AND m.tipo_movimiento = $${paramIndex++}`;
      params.push(tipo);
}

    if (fechaDesde) {
      query += ` AND m.fecha_movimiento >= $${paramIndex++}`;
      params.push(fechaDesde);
}

    if (fechaHasta) {
      query += ` AND m.fecha_movimiento <= $${paramIndex++}`;
      params.push(fechaHasta);
}

    query += ` ORDER BY m.fecha_movimiento DESC`;

    // Ejecutar consulta
    const result = await db.query(query, params);

    // Crear workbook
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Descripción']
    ];

    result.rows.forEach(row => {
      wsData.push([
        new Date(row.fecha_movimiento).toLocaleDateString('es-ES'),
        row.nombre_producto || 'Producto no encontrado',
        row.codigo_producto,
        row.tipo_movimiento,
        parseInt(row.cantidad),
        row.descripcion || ''
      ]);
});

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');

    // Generar buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    // Configurar headers
    const filename = `movimientos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(excelBuffer);
} catch (err) {
    console.error('Error exportando movimientos a Excel:', err);
    res.status(500).json({ error: 'Error al exportar movimientos a Excel' });
}
});

// Exportar movimientos de inventario a PDF
app.get('/api/movimientos/export/pdf', authMiddleware, async (req, res) => {
  try {
    const jsPDF = require('jspdf');
    const autoTable = require('jspdf-autotable');
    const { producto, tipo, fechaDesde, fechaHasta } = req.query;

    // Construir consulta con filtros
    let query = `
      SELECT
        m.codigo_producto,
        p.nombre as nombre_producto,
        m.tipo_movimiento,
        m.cantidad,
        m.descripcion,
        m.fecha_movimiento
      FROM "inventario" m
      LEFT JOIN "producto" p ON m.codigo_producto = p.codigo_producto
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (producto) {
      query += ` AND m.codigo_producto = $${paramIndex++}`;
      params.push(producto);
}

    if (tipo) {
      query += ` AND m.tipo_movimiento = $${paramIndex++}`;
      params.push(tipo);
}

    if (fechaDesde) {
      query += ` AND m.fecha_movimiento >= $${paramIndex++}`;
      params.push(fechaDesde);
}

    if (fechaHasta) {
      query += ` AND m.fecha_movimiento <= $${paramIndex++}`;
      params.push(fechaHasta);
}

    query += ` ORDER BY m.fecha_movimiento DESC`;

    // Ejecutar consulta
    const result = await db.query(query, params);

    // Crear PDF
    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.text('Reporte de Movimientos de Inventario', 14, 20);

    doc.setFontSize(12);
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 14, 30);
    doc.text(`Total movimientos: ${result.rowCount}`, 14, 37);

    // Mostrar filtros aplicados
    let yPos = 44;
    if (producto || tipo || fechaDesde || fechaHasta) {
      doc.text('Filtros aplicados:', 14, yPos);
      yPos += 7;

      if (producto) {
        const productResult = await db.query('SELECT nombre FROM "producto" WHERE codigo_producto = $1', [producto]);
        if (productResult.rowCount > 0) {
          doc.text(`- Producto: ${productResult.rows[0].nombre}`, 20, yPos);
          yPos += 5;
}
}

      if (tipo) {
        doc.text(`- Tipo: ${tipo}`, 20, yPos);
        yPos += 5;
}

      if (fechaDesde) {
        doc.text(`- Desde: ${new Date(fechaDesde).toLocaleDateString('es-ES')}`, 20, yPos);
        yPos += 5;
}

      if (fechaHasta) {
        doc.text(`- Hasta: ${new Date(fechaHasta).toLocaleDateString('es-ES')}`, 20, yPos);
        yPos += 5;
}
      yPos += 5;
}

    // Tabla de movimientos
    const tableData = result.rows.map(row => [
      new Date(row.fecha_movimiento).toLocaleDateString('es-ES'),
      row.nombre_producto || 'Producto no encontrado',
      row.codigo_producto,
      row.tipo_movimiento,
      parseInt(row.cantidad),
      row.descripcion || ''
    ]);

    autoTable(doc, {
      head: [['Fecha', 'Producto', 'Código', 'Tipo', 'Cantidad', 'Descripción']],
      body: tableData,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 2
},
      headStyles: {
        fillColor: [66, 139, 202],
        textColor: 255
},
      alternateRowStyles: {
        fillColor: [245, 245, 245]
}
});

    // Pie de página
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
}

    // Generar buffer y enviar
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    const filename = `movimientos_${new Date().toISOString().slice(0, 10)}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(pdfBuffer);
} catch (err) {
    console.error('Error exportando movimientos a PDF:', err);
    res.status(500).json({ error: 'Error al exportar movimientos a PDF' });
}
});

// Obtener estado de cuenta completo del usuario
app.get('/api/estado-cuenta', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id_usuario;

    // Obtener información del usuario
    const userQuery = `
      SELECT id_usuario, nombre_usuario, email, rol, activo, direccion, numero_cel, ciudad,
             fecha_creacion, fecha_actualizacion
      FROM "usuario"
      WHERE id_usuario = $1
    `;
    const userResult = await db.query(userQuery, [userId]);

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
}

    const usuario = userResult.rows[0];

    // Obtener pedidos del usuario
    const pedidosQuery = `
      SELECT p.id_pedido, p.fecha_pedido, p.total, p.estado, p.codigo_detalle,
             COUNT(dp.codigo_producto) as cantidad_productos
      FROM "pedido" p
      LEFT JOIN "detalle_Pedido" dp ON p.id_pedido = dp.id_pedido
      WHERE p.id_usuario = $1
      GROUP BY p.id_pedido, p.fecha_pedido, p.total, p.estado, p.codigo_detalle
      ORDER BY p.fecha_pedido DESC
      LIMIT 10
    `;
    const pedidosResult = await db.query(pedidosQuery, [userId]);

    // Obtener estadísticas
    const statsQuery = `
      SELECT
        COUNT(DISTINCT p.id_pedido) as total_pedidos,
        COALESCE(SUM(p.total), 0) as total_gastado,
        COUNT(DISTINCT CASE WHEN p.estado = 'pendiente' THEN p.id_pedido END) as pedidos_pendientes,
        COUNT(DISTINCT CASE WHEN p.estado = 'completado' THEN p.id_pedido END) as pedidos_completados
      FROM "pedido" p
      WHERE p.id_usuario = $1
    `;
    const statsResult = await db.query(statsQuery, [userId]);

    // Obtener movimientos de inventario recientes (si el usuario tiene rol de empleado)
    let movimientosInventario = [];
    if (usuario.rol === 'empleado' || usuario.rol === 'admin') {
      const inventarioQuery = `
        SELECT i.codigo_producto, p.nombre as nombre_producto, i.tipo_movimiento,
               i.cantidad, i.descripcion, i.fecha_movimiento
        FROM "inventario" i
        JOIN "producto" p ON i.codigo_producto = p.codigo_producto
        ORDER BY i.fecha_movimiento DESC
        LIMIT 5
      `;
      const inventarioResult = await db.query(inventarioQuery);
      movimientosInventario = inventarioResult.rows;
}

    res.json({
      ok: true,
      usuario: usuario,
      pedidos: pedidosResult.rows,
      estadisticas: statsResult.rows[0],
      movimientos_inventario: movimientosInventario
});
} catch (err) {
    console.error('Error GET /api/estado-cuenta', err);
    res.status(500).json({ error: 'Error del servidor: ' + err.message });
}
});

// Rutas protegidas específicas (requieren autenticación)
app.get('/reporte-inventario.html', serveProtectedPage(path.join(__dirname, 'reporte-inventario.html')));

// Servir páginas HTML públicas
app.get('/iniciar-sesion.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'iniciar-sesion.html'));
});

app.get('/registrar-cuenta.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'registrar-cuenta.html'));
});

app.get('/servicio.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'servicio.html'));
});

app.get('/chatbot.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'chatbot.html'));
});

app.get('/test-inventario.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-inventario.html'));
});

app.get('/test-modal-productos.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'test-modal-productos.html'));
});

// Servir archivos estáticos públicos (CSS, JS, imágenes, HTML)
app.use(express.static(path.join(__dirname)));

// Página principal (redirige a login si no está autenticado)
app.get('/', (req, res) => {
  const authHeader = req.headers.authorization || req.headers.cookie;
  if (authHeader && authHeader.includes('authToken')) {
    res.sendFile(path.join(__dirname, 'index.html'));
} else {
    res.redirect('/iniciar-sesion.html');
}
});

// Iniciar servidor después de inicializar la base de datos
initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Open http://localhost:${PORT} in your browser`);
});
}).catch(error => {
  console.error('❌ Error crítico al iniciar el servidor:', error);
  process.exit(1);
});