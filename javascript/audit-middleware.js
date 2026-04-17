const db = require('./databasepg');

/**
 * Middleware de auditoría: Establece el usuario actual en la sesión de PostgreSQL
 * para que los triggers de auditoría sepan quién está haciendo cambios
 * 
 * Uso en rutas:
 *   router.put('/usuario/:id', auditMiddleware, authMiddleware, async (req, res) => { ... })
 */
const auditMiddleware = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id_usuario) {
      // Si no hay usuario autenticado, usar el ID por defecto (admin)
      req.auditUserId = 1;
    } else {
      req.auditUserId = req.user.id_usuario;
    }
    
    // Guardar el pool para usar después
    req.auditPool = db.pool || db;
    
    next();
  } catch (error) {
    console.error('Error en auditMiddleware:', error);
    next();
  }
};

/**
 * Función auxiliar para ejecutar queries con auditoría
 * Establece app.current_user_id en la conexión antes de ejecutar
 * 
 * Uso:
 *   const result = await auditQuery(pool, userId, sqlQuery, values);
 */
async function auditQuery(pool, userId, sqlText, values = []) {
  const client = await pool.connect();
  try {
    // Establecer el usuario actual para los triggers
    await client.query(`SET app.current_user_id = ${userId}`);
    
    // Ejecutar la query
    const result = await client.query(sqlText, values);
    
    return result;
  } finally {
    client.release();
  }
}

module.exports = {
  auditMiddleware,
  auditQuery
};
