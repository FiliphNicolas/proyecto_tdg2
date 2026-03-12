const http = require('http');

// Test adding a new product
const testData = {
    nombre: 'Producto de Prueba Test',
    descripcion: 'Este es un producto creado para probar el guardado en PostgreSQL',
    precio: 999.99,
    cantidad_stock: 50,
    categoria: 'Prueba'
};

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/productos',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(testData))
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('Response:', data);
        
        // Now test getting all products to see if it was saved
        console.log('\n🔍 Verificando si el producto fue guardado...');
        testGetProducts();
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify(testData));
req.end();

function testGetProducts() {
    const getOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/public/productos',
        method: 'GET'
    };

    const getReq = http.request(getOptions, (res) => {
        console.log(`\nGET Status: ${res.statusCode}`);
        res.setEncoding('utf8');
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.ok) {
                    console.log(`✅ Total productos en BD: ${result.products.length}`);
                    const testProduct = result.products.find(p => p.nombre === 'Producto de Prueba Test');
                    if (testProduct) {
                        console.log('✅ Producto de prueba encontrado en la base de datos:');
                        console.log(`   - ID: ${testProduct.id_producto}`);
                        console.log(`   - Nombre: ${testProduct.nombre}`);
                        console.log(`   - Precio: $${testProduct.precio}`);
                        console.log(`   - Stock: ${testProduct.cantidad_stock}`);
                    } else {
                        console.log('❌ Producto de prueba no encontrado');
                    }
                }
            } catch (err) {
                console.error('Error parsing response:', err);
            }
        });
    });

    getReq.on('error', (e) => {
        console.error(`Problem with GET request: ${e.message}`);
    });

    getReq.end();
}
