const express = require('express');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./databasepg');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'systemsware_secret_change_this';

app.use(cors());
app.use(express.json());

// --- API endpoints defined below ---
// (Static files are served after so that POST/PUT/etc. don't trigger 405 responses)

// Registro de usuario
app.post('/api/register', async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    if (!nombre || !correo || !contrasena) return res.status(400).json({ error: 'Faltan campos requeridos' });

    const hashed = await bcrypt.hash(contrasena, 10);

    const text = 'INSERT INTO "Usuario" (nombre_usuario, contrasena, email, rol, activo) VALUES ($1,$2,$3,$4,$5) RETURNING id_usuario, nombre_usuario, email';
    const values = [nombre, hashed, correo, 'empleado', true];

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

    const text = 'SELECT id_usuario, nombre_usuario, contrasena FROM "Usuario" WHERE email = $1 LIMIT 1';
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
    const result = await db.query('SELECT id_producto, nombre, descripcion, precio, cantidad_stock FROM "Producto" ORDER BY id_producto');
    res.json({ ok: true, products: result.rows });
  } catch (err) {
    console.error('Error /api/sync/products', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Endpoint de sincronización: actualizar stock (ejemplo simple)
app.post('/api/sync/update-stock', authMiddleware, async (req, res) => {
  try {
    const { id_producto, cantidad } = req.body;
    if (!id_producto || typeof cantidad !== 'number') return res.status(400).json({ error: 'Datos inválidos' });

    const update = 'UPDATE "Producto" SET cantidad_stock = $1 WHERE id_producto = $2 RETURNING id_producto, cantidad_stock';
    const result = await db.query(update, [cantidad, id_producto]);
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
    const text = 'SELECT id_usuario, nombre_usuario, email, rol, activo FROM "Usuario" WHERE id_usuario = $1 LIMIT 1';
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
    const { nombre, correo, contrasena } = req.body;

    if (!nombre && !correo && !contrasena) return res.status(400).json({ error: 'Nada para actualizar' });

    // Actualizar nombre
    if (nombre) {
      await db.query('UPDATE "Usuario" SET nombre_usuario = $1 WHERE id_usuario = $2', [nombre, id]);
    }

    // Actualizar correo
    if (correo) {
      try {
        await db.query('UPDATE "Usuario" SET email = $1 WHERE id_usuario = $2', [correo, id]);
      } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'El correo ya está en uso' });
        throw err;
      }
    }

    // Actualizar contraseña
    if (contrasena) {
      const hashed = await bcrypt.hash(contrasena, 10);
      await db.query('UPDATE "Usuario" SET contrasena = $1 WHERE id_usuario = $2', [hashed, id]);
    }

    const result = await db.query('SELECT id_usuario, nombre_usuario, email, rol, activo FROM "Usuario" WHERE id_usuario = $1', [id]);
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
    const { contrasena } = req.body;
    if (!contrasena) return res.status(400).json({ error: 'Contraseña requerida' });
    const hashed = await bcrypt.hash(contrasena, 10);
    await db.query('UPDATE "Usuario" SET contrasena = $1 WHERE id_usuario = $2', [hashed, id]);
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
    const { nombre, descripcion, precio, cantidad_stock, categoria } = req.body;
    if (!nombre || precio == null) return res.status(400).json({ error: 'Faltan campos obligatorios' });

    const text = 'INSERT INTO "Producto" (nombre, descripcion, precio, cantidad_stock, categoria, fecha_creacion) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING id_producto, nombre, descripcion, precio, cantidad_stock, categoria';
    const values = [nombre, descripcion || null, precio, cantidad_stock || 0, categoria || null];
    const result = await db.query(text, values);
    res.status(201).json({ ok: true, product: result.rows[0] });
  } catch (err) {
    console.error('Error POST /api/productos', err);
    res.status(500).json({ error: 'Error del servidor' });
  }
});

// Listar productos (con búsqueda y filtrado opcional)
app.get('/api/productos', authMiddleware, async (req, res) => {
  try {
    const { q, categoria } = req.query;
    let text = 'SELECT id_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM "Producto"';
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
    text += ' ORDER BY id_producto';

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
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await db.query('SELECT id_producto, nombre, descripcion, precio, cantidad_stock, categoria FROM "Producto" WHERE id_producto = $1', [id]);
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
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
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
    const text = 'UPDATE "Producto" SET ' + fields.join(', ') + ' WHERE id_producto = $' + values.length + ' RETURNING id_producto, nombre, descripcion, precio, cantidad_stock, categoria';
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
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const result = await db.query('DELETE FROM "Producto" WHERE id_producto = $1 RETURNING id_producto', [id]);
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
                FROM "Producto"`;
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

// Servir archivos estáticos (HTML/CSS) desde la carpeta del proyecto
// debe definirse después de las rutas de la API para que solo responda a solicitudes GET/HEAD
app.use(express.static(path.join(__dirname)));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
