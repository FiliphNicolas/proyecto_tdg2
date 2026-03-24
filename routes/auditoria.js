const express = require('express');
const db = require('../databasepg');
const { authMiddleware } = require('./auth');

const router = express.Router();

// Endpoint para auditoría de la base de datos
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Obtener información de conexión
    const connectionInfo = {
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'systemsware',
      user: process.env.DB_USER || 'postgres',
      port: process.env.DB_PORT || '5432'
    };

    // Obtener registros de auditoría recientes
    const auditQuery = `
      SELECT 
        a.id_auditoria,
        a.id_usuario,
        u.nombre_usuario,
        a.accion,
        a.tabla_afectada,
        a.descripcion,
        a.fecha_accion,
        a.estado
      FROM auditoria a
      LEFT JOIN usuario u ON a.id_usuario = u.id_usuario
      ORDER BY a.fecha_accion DESC
      LIMIT 50
    `;
    
    const auditResult = await db.query(auditQuery);
    
    // Obtener estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_auditorias,
        COUNT(CASE WHEN estado = 'exitoso' THEN 1 END) as exitosas,
        COUNT(CASE WHEN estado = 'error' THEN 1 END) as errores,
        COUNT(DISTINCT id_usuario) as usuarios_activos
      FROM auditoria
      WHERE fecha_accion >= NOW() - INTERVAL '7 days'
    `;
    
    const statsResult = await db.query(statsQuery);
    
    // Obtener información de conexión actual
    const connectionTest = await db.query('SELECT NOW() as current_time, version() as db_version');
    
    const stats = statsResult.rows[0];
    const connectionStatus = connectionTest.rows[0];
    
    res.json({
      ok: true,
      connectionInfo: connectionInfo,
      data: auditResult.rows,
      totalQueries: stats.total_auditorias || 0,
      activeConnections: stats.usuarios_activos || 1,
      avgResponseTime: Math.floor(Math.random() * 50) + 10, // Simulado
      errorRate: stats.total_auditorias > 0 ? Math.round((stats.errores / stats.total_auditorias) * 100) : 0
    });
    
  } catch (err) {
    console.error('Error /api/auditoria', err);
    res.status(500).json({ error: 'Error al obtener datos de auditoría: ' + err.message });
  }
});

// Endpoint para SELECT directo a tabla auditoria de Systemsware
router.get('/direct', authMiddleware, async (req, res) => {
  try {
    // Consulta directa a la tabla auditoria
    const auditQuery = `
      SELECT 
        id_auditoria,
        id_usuario,
        accion,
        tabla_afectada,
        detalles as descripcion,
        fecha_accion
      FROM auditoria 
      ORDER BY fecha_accion DESC 
      LIMIT 100
    `;
    
    const result = await db.query(auditQuery);
    
    // Obtener estadísticas básicas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_registros,
        COUNT(DISTINCT id_usuario) as usuarios_unicos,
        MAX(fecha_accion) as ultimo_registro
      FROM auditoria
    `;
    
    const statsResult = await db.query(statsQuery);
    
    res.json({
      ok: true,
      data: result.rows,
      stats: {
        total_registros: statsResult.rows[0].total_registros || 0,
        usuarios_unicos: statsResult.rows[0].usuarios_unicos || 0,
        ultimo_registro: statsResult.rows[0].ultimo_registro
      }
    });
    
  } catch (err) {
    console.error('Error /api/auditoria-direct', err);
    res.status(500).json({ 
      ok: false, 
      error: 'Error al consultar tabla auditoria: ' + err.message 
    });
  }
});

module.exports = router;
