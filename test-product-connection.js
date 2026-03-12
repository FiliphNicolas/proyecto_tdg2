const db = require('./databasepg');

async function testProductConnection() {
    console.log('🔍 Probando conexión de productos a PostgreSQL...\n');
    
    try {
        // 1. Probar conexión básica
        const connected = await db.testConnection();
        if (!connected) {
            console.log('❌ No se puede conectar a PostgreSQL');
            return;
        }
        console.log('✅ Conexión a PostgreSQL establecida\n');
        
        // 2. Verificar tabla de productos
        const tableCheck = await db.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'Producto'
        `);
        
        if (tableCheck.rows.length > 0) {
            console.log('✅ Tabla "Producto" encontrada en la base de datos\n');
        } else {
            console.log('❌ Tabla "Producto" no encontrada\n');
            return;
        }
        
        // 3. Verificar estructura de la tabla
        const structureCheck = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Producto' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('📋 Estructura de la tabla Producto:');
        structureCheck.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        console.log('');
        
        // 4. Contar productos
        const countResult = await db.query('SELECT COUNT(*) as total FROM "Producto"');
        const totalProducts = parseInt(countResult.rows[0].total);
        console.log(`📦 Total de productos en la base de datos: ${totalProducts}\n`);
        
        // 5. Mostrar primeros 5 productos
        const productsResult = await db.query(`
            SELECT id_producto, nombre, precio, cantidad_stock, categoria 
            FROM "Producto" 
            ORDER BY id_producto 
            LIMIT 5
        `);
        
        if (productsResult.rows.length > 0) {
            console.log('📝 Productos conectados:');
            productsResult.rows.forEach(product => {
                console.log(`   - ID: ${product.id_producto} | ${product.nombre} | $${product.precio} | Stock: ${product.cantidad_stock}`);
            });
        } else {
            console.log('📝 No hay productos en la base de datos');
        }
        
        console.log('\n🎉 ¡Conexión de productos funcionando perfectamente!');
        console.log('🌐 Frontend disponible en: http://localhost:3000/productos.html');
        
    } catch (error) {
        console.error('❌ Error en la conexión de productos:', error.message);
    } finally {
        await db.closePool();
        console.log('\n🔌 Conexión cerrada');
    }
}

testProductConnection();
