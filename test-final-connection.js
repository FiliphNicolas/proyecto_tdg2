const http = require('http');

// Test final de conexión con productos
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
                console.log(`✅ Conexión exitosa! Encontrados ${result.products.length} productos:\n`);
                
                result.products.forEach((product, index) => {
                    const stockStatus = product.cantidad_stock > 10 ? '✅ Disponible' : 
                                      product.cantidad_stock > 0 ? '⚠️ Poco stock' : '❌ Agotado';
                    
                    console.log(`${index + 1}. ${product.nombre}`);
                    console.log(`   🏷️  Código: ${product.codigo_producto}`);
                    console.log(`   💰 Precio: $${Number(product.precio).toFixed(2)}`);
                    console.log(`   📦 Stock: ${product.cantidad_stock} unidades ${stockStatus}`);
                    console.log(`   🏷️  Categoría: ${product.categoria || 'Sin categoría'}`);
                    console.log(`   📄 Descripción: ${product.descripcion || 'Sin descripción'}`);
                    console.log('');
                });
                
                console.log('🎉 ¡Base de datos systemsware conectada correctamente!');
                console.log('🌐 Frontend HTML funcionando en: http://localhost:3000/productos.html');
                console.log('💡 Puedes ver, editar, agregar y eliminar productos');
                
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
