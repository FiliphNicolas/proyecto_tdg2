const { Pool } = require('pg');

// Configuración de la conexión a PostgreSQL
const poolConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'systemsware',
    // Opciones de conexión adicionales
    max: 20, // Máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // Tiempo máximo de inactividad
    connectionTimeoutMillis: 2000, // Tiempo máximo para conectar
    // SSL si está configurado
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: false
    } : false
};

const pool = new Pool(poolConfig);

// Manejo de errores del pool
pool.on('error', (err) => {
    console.error('Error inesperado en el pool de PostgreSQL:', err);
    process.exit(-1);
});

pool.on('connect', (client) => {
    console.log('Nueva conexión establecida con PostgreSQL');
});

pool.on('remove', (client) => {
    console.log('Conexión removida del pool');
});

// Función para ejecutar queries con manejo de errores mejorado
const query = async (text, params = []) => {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        console.log('Query ejecutada:', { text, duration, rows: result.rowCount });
        return result;
    } catch (error) {
        console.error('Error en query PostgreSQL:', { text, params, error: error.message });
        throw error;
    }
};

// Función para obtener un cliente del pool (para transacciones)
const getClient = async () => {
    try {
        const client = await pool.connect();
        console.log('Cliente obtenido del pool');
        return client;
    } catch (error) {
        console.error('Error al obtener cliente del pool:', error);
        throw error;
    }
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        const client = await getClient();
        await client.query('SELECT NOW()');
        client.release();
        console.log(' Conexión a PostgreSQL establecida correctamente');
        return true;
    } catch (error) {
        console.error(' Error al conectar a PostgreSQL:', error.message);
        return false;
    }
};

// Función para inicializar la base de datos
const initializeDatabase = async () => {
    try {
        // Verificar si la tabla Usuario existe
        const result = await query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'Usuario'
            );
        `);
        
        if (!result.rows[0].exists) {
            console.log(' La tabla Usuario no existe. Ejecuta el script database-setup.sql');
        } else {
            console.log(' Base de datos verificada y lista para usar');
        }
        
        return true;
    } catch (error) {
        console.error(' Error al inicializar la base de datos:', error);
        return false;
    }
};

// Función para cerrar el pool (para shutdown elegante)
const closePool = async () => {
    try {
        await pool.end();
        console.log(' Pool de conexiones cerrado');
    } catch (error) {
        console.error('Error al cerrar el pool:', error);
    }
};

// Manejo de cierre graceful del proceso
process.on('SIGINT', async () => {
    console.log('\n Recibida señal SIGINT, cerrando conexiones...');
    await closePool();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n Recibida señal SIGTERM, cerrando conexiones...');
    await closePool();
    process.exit(0);
});

module.exports = {
    query,
    getClient,
    pool,
    testConnection,
    initializeDatabase,
    closePool
};