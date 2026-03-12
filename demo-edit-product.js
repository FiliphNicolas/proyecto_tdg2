const http = require('http');

// Demo: Editar un producto existente (ID: 1)
const productId = 1;
const updatedData = {
    nombre: "Laptop Dell Latitude - EDITADA",
    descripcion: "Laptop de 15 pulgadas actualizada con nueva descripción",
    precio: 1350.00,
    cantidad_stock: 12,
    categoria: "Electrónica"
};

const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api/public/productos/${productId}`,
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(updatedData))
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
        
        // Verificar los cambios
        console.log('\n🔍 Verificando cambios en el producto...');
        verifyChanges();
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(JSON.stringify(updatedData));
req.end();

function verifyChanges() {
    const getOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/public/productos',
        method: 'GET'
    };

    const getReq = http.request(getOptions, (res) => {
        res.setEncoding('utf8');
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.ok) {
                    const updatedProduct = result.products.find(p => p.id_producto === productId);
                    if (updatedProduct) {
                        console.log('✅ Producto actualizado encontrado:');
                        console.log(`   - ID: ${updatedProduct.id_producto}`);
                        console.log(`   - Nombre: ${updatedProduct.nombre}`);
                        console.log(`   - Descripción: ${updatedProduct.descripcion}`);
                        console.log(`   - Precio: $${updatedProduct.precio}`);
                        console.log(`   - Stock: ${updatedProduct.cantidad_stock}`);
                        console.log(`   - Categoría: ${updatedProduct.categoria}`);
                        console.log('\n🎉 ¡Producto editado exitosamente en PostgreSQL!');
                    }
                }
            } catch (err) {
                console.error('Error:', err);
            }
        });
    });

    getReq.on('error', (e) => {
        console.error(`Problem with GET request: ${e.message}`);
    });

    getReq.end();
}
