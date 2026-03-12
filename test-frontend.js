const http = require('http');

// Test the frontend by getting products
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/productos',
    method: 'GET'
};

const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            if (result.ok) {
                console.log(`✅ Encontrados ${result.products.length} productos en la base de datos:\n`);
                
                result.products.forEach((product, index) => {
                    const stockStatus = product.cantidad_stock > 10 ? '✅ Disponible' : 
                                      product.cantidad_stock > 0 ? '⚠️ Poco stock' : '❌ Agotado';
                    
                    console.log(`${index + 1}. ${product.nombre}`);
                    console.log(`   📝 ID: ${product.id_producto}`);
                    console.log(`   💰 Precio: $${Number(product.precio).toFixed(2)}`);
                    console.log(`   📦 Stock: ${product.cantidad_stock} unidades ${stockStatus}`);
                    console.log(`   🏷️  Categoría: ${product.categoria || 'Sin categoría'}`);
                    console.log(`   📄 Descripción: ${product.descripcion || 'Sin descripción'}`);
                    console.log('');
                });
                
                console.log('🌐 Para ver los productos en el frontend HTML:');
                console.log('   Abre: http://localhost:3000/ver-productos.html');
                console.log('   O abre: http://localhost:3000/productos.html (modo edición)');
                
            } else {
                console.log('❌ Error al cargar productos');
            }
        } catch (err) {
            console.error('Error parsing response:', err);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Error de conexión: ${e.message}`);
});

req.end();
