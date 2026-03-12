const http = require('http');

console.log('🔧 Demostración: Editar y Borrar Productos\n');

// 1. Editar un producto existente (PROD-001)
console.log('1️⃣ Editando producto PROD-001...');
const editData = {
    nombre: "Laptop Dell Inspiron 15 - ACTUALIZADA",
    descripcion: "Laptop 15 pulgadas, Intel i7, 16GB RAM, 512GB SSD - Versión Mejorada",
    precio: 1350000.00,
    cantidad_stock: 20,
    categoria: "Computadores Premium"
};

const editOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/productos/PROD-001',
    method: 'PUT',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(editData))
    }
};

const editReq = http.request(editOptions, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
            console.log('   ✅ Producto editado exitosamente');
            console.log(`   📝 Nuevo nombre: ${result.product.nombre}`);
            console.log(`   💰 Nuevo precio: $${result.product.precio}`);
            
            // 2. Borrar otro producto (PROD-011)
            console.log('\n2️⃣ Borrando producto PROD-011...');
            deleteProduct();
        } else {
            console.log('   ❌ Error al editar:', result.error);
        }
    });
});

editReq.on('error', (e) => {
    console.error('   ❌ Error en edición:', e.message);
});

editReq.write(JSON.stringify(editData));
editReq.end();

function deleteProduct() {
    const deleteOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/public/productos/PROD-011',
        method: 'DELETE'
    };

    const deleteReq = http.request(deleteOptions, (res) => {
        console.log(`   Status: ${res.statusCode}`);
        res.setEncoding('utf8');
        let data = '';
        
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
            const result = JSON.parse(data);
            if (result.ok) {
                console.log('   ✅ Producto PROD-011 eliminado exitosamente');
                
                // 3. Verificar cambios
                console.log('\n3️⃣ Verificando cambios...');
                verifyChanges();
            } else {
                console.log('   ❌ Error al eliminar:', result.error);
            }
        });
    });

    deleteReq.on('error', (e) => {
        console.error('   ❌ Error en eliminación:', e.message);
    });

    deleteReq.end();
}

function verifyChanges() {
    const verifyOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/public/productos',
        method: 'GET'
    };

    const verifyReq = http.request(verifyOptions, (res) => {
        res.setEncoding('utf8');
        let data = '';
        
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
            const result = JSON.parse(data);
            
            console.log(`   📊 Total productos: ${result.products.length}`);
            
            // Verificar producto editado
            const editedProduct = result.products.find(p => p.codigo_producto === 'PROD-001');
            if (editedProduct) {
                console.log(`   ✅ Producto editado encontrado: ${editedProduct.nombre}`);
                console.log(`      💰 Precio actualizado: $${editedProduct.precio}`);
            }
            
            // Verificar que el producto eliminado ya no existe
            const deletedProduct = result.products.find(p => p.codigo_producto === 'PROD-011');
            if (!deletedProduct) {
                console.log('   ✅ Producto PROD-011 eliminado correctamente');
            }
            
            console.log('\n🎉 ¡Operaciones de editar y borrar completadas!');
            console.log('🌐 Frontend: http://localhost:3000/productos.html');
        });
    });

    verifyReq.on('error', (e) => {
        console.error('   ❌ Error en verificación:', e.message);
    });

    verifyReq.end();
}
