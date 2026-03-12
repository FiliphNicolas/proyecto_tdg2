const db = require('./databasepg');

async function deleteDatabase() {
    console.log('⚠️  ADVERTENCIA: Esto eliminará completamente la base de datos "systemsware"\n');
    
    try {
        // 1. Conectar a PostgreSQL (sin especificar base de datos)
        const { Pool } = require('pg');
        const adminPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'postgres' // Conectar a la base de datos postgres por defecto
        });

        console.log('🔗 Conectando a PostgreSQL para eliminar base de datos...');
        
        // 2. Verificar si la base de datos existe
        const checkResult = await adminPool.query(`
            SELECT 1 FROM pg_database WHERE datname = 'systemsware'
        `);
        
        if (checkResult.rows.length === 0) {
            console.log('❌ La base de datos "systemsware" no existe');
            await adminPool.end();
            return;
        }
        
        console.log('✅ Base de datos "systemsware" encontrada');
        
        // 3. Matar conexiones activas a la base de datos
        console.log('🔌 Terminando conexiones activas...');
        await adminPool.query(`
            SELECT pg_terminate_backend(pid) 
            FROM pg_stat_activity 
            WHERE datname = 'systemsware' AND pid <> pg_backend_pid()
        `);
        
        // 4. Eliminar la base de datos
        console.log('🗑️  Eliminando base de datos "systemsware"...');
        await adminPool.query('DROP DATABASE "systemsware"');
        
        console.log('✅ Base de datos "systemsware" eliminada exitosamente');
        console.log('\n📋 Resumen:');
        console.log('   - Base de datos eliminada: systemsware');
        console.log('   - Todas las tablas eliminadas');
        console.log('   - Todos los datos eliminados permanentemente');
        console.log('\n💡 Para recrear la base de datos, ejecuta:');
        console.log('   node database-setup.js');
        
        await adminPool.end();
        
    } catch (error) {
        console.error('❌ Error al eliminar base de datos:', error.message);
        
        // Intentar cerrar el pool si hay error
        try {
            await adminPool.end();
        } catch (endError) {
            console.error('Error cerrando pool:', endError.message);
        }
    }
}

deleteDatabase();
