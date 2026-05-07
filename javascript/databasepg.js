const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
// Soporta tanto DATABASE_URL (Render, Railway, etc.) como variables separadas (local)
let poolConfig;

if (process.env.DATABASE_URL) {
  // Usar DATABASE_URL para servicios cloud (Render, Railway, Heroku, etc.)
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000, // Aumentado para conexiones cloud
  };
  console.log('Usando DATABASE_URL para conexión a PostgreSQL');
} else {
  // Usar variables separadas para desarrollo local
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'systemsware',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  };
  console.log('Usando configuración local de PostgreSQL');
}

const pool = new Pool(poolConfig);

// Manejo de errores del pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Función para probar la conexión
async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log(' Database connection successful');
    return true;
  } catch (err) {
    console.error(' Database connection failed:', err.message);
    return false;
  }
}

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'usuario'
    `);
    
    if (result.rows.length === 0) {
      console.log(' Tables not found. Please run sql/base-de-datos.sql first');
      return false;
    }
    
    console.log(' Database tables verified');
    return true;
  } catch (err) {
    console.error(' Error initializing database:', err.message);
    return false;
  }
}

// Función para ejecutar queries
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(' Query executed', { text, duration, rows: result.rowCount });
    return result;
  } catch (err) {
    console.error(' Query error', { text, params, error: err.message });
    throw err;
  }
}

// Función para obtener un cliente (para transacciones)
function getClient() {
  return pool.connect();
}

// Función para cerrar el pool
async function closePool() {
  await pool.end();
  console.log(' Database pool closed');
}

// Inicialización automática unificada para el servidor
async function initializeServer() {
  console.log(' Inicializando conexión a base de datos...');
  
  const connected = await testConnection();
  if (!connected) {
    throw new Error(' No se pudo conectar a PostgreSQL. Verifica tu configuración.');
  }
  
  const initialized = await initializeDatabase();
  if (!initialized) {
    throw new Error(' Error al inicializar tablas de la base de datos');
  }
  
  console.log(' Base de datos lista y conectada');
  return true;
}

module.exports = {
  pool,
  query,
  getClient,
  closePool,
  testConnection,
  initializeDatabase,
  initializeServer
};
