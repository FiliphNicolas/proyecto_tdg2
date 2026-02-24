const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '1234',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'systemsware'
});

pool.on('error', (err) => {
    console.error('Error en el pool de conexión:', err);
});

const query = (text, params) => {
    return pool.query(text, params);
};

const getClient = () => {
    return pool.connect();
};

module.exports = {
    query,
    getClient,
    pool
};