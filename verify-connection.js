const db = require('./databasepg');

async function verifyConnection() {
    try {
        console.log('🔍 Verificando conexión a PostgreSQL...');
        
        // Probar conexión
        const connected = await db.testConnection();
        if (!connected) {
            console.log('❌ No se pudo conectar a PostgreSQL');
            return;
        }
        
        console.log('✅ Conexión exitosa');
        
        // Consultar productos
        const result = await db.query('SELECT * FROM "Producto" ORDER BY id_producto LIMIT 5');
        console.log(`📦 Encontrados ${result.rows.length} productos:`);
        
        result.rows.forEach(product => {
            console.log(`   - ${product.id_producto}: ${product.nombre} ($${product.precio}) - Stock: ${product.cantidad_stock}`);
        });
        
        await db.closePool();
        console.log('✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

verifyConnection();
