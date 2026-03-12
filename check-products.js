const db = require('./databasepg');

async function checkProducts() {
    try {
        console.log('🔍 Verificando productos en la base de datos...\n');
        
        const result = await db.query(`
            SELECT codigo_producto, nombre, precio, cantidad_stock, categoria 
            FROM producto 
            ORDER BY codigo_producto
        `);
        
        console.log('📦 Productos disponibles:');
        console.log('Código\t\tNombre\t\t\t\tPrecio\tStock\tCategoría');
        console.log('─────\t\t─────\t\t\t\t─────\t─────\t─────────');
        
        result.rows.forEach(product => {
            const codigo = product.codigo_producto.padEnd(12);
            const nombre = (product.nombre.length > 30 ? 
                product.nombre.substring(0, 27) + '...' : 
                product.nombre).padEnd(30);
            const precio = Number(product.precio).toFixed(2).padStart(10);
            const stock = product.cantidad_stock.toString().padStart(5);
            const categoria = product.categoria;
            
            console.log(`${codigo}\t${nombre}\t${precio}\t${stock}\t${categoria}`);
        });
        
        console.log(`\n✅ Total de productos: ${result.rows.length}`);
        
        // Mostrar productos con bajo stock
        const lowStock = result.rows.filter(p => p.cantidad_stock < 20);
        if (lowStock.length > 0) {
            console.log('\n⚠️  Productos con bajo stock (<20 unidades):');
            lowStock.forEach(product => {
                console.log(`   - ${product.codigo_producto}: ${product.nombre} (${product.cantidad_stock} unidades)`);
            });
        }
        
    } catch (error) {
        console.error('❌ Error al consultar productos:', error.message);
    } finally {
        await db.closePool();
        process.exit(0);
    }
}

checkProducts();
