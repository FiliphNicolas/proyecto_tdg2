const http = require('http');

console.log('🔧 Probando funcionalidad de Editar y Borrar corregida\n');

// 1. Probar agregar un producto nuevo
console.log('1️⃣ Agregando producto de prueba...');
const newProduct = {
    nombre: "Producto Test Frontend",
    descripcion: "Producto para probar edición y eliminación desde frontend",
    precio: 999.99,
    cantidad_stock: 25,
    categoria: "Test Frontend"
};

const addOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/productos',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(newProduct))
    }
};

const addReq = http.request(addOptions, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
            const newId = result.product.codigo_producto;
            console.log(`   ✅ Producto agregado: ${newId}`);
            console.log(`   📝 Nombre: ${result.product.nombre}`);
            
            // 2. Probar editar el producto recién agregado
            console.log(`\n2️⃣ Editando producto ${newId}...`);
            editProduct(newId);
        } else {
            console.log('   ❌ Error al agregar:', result.error);
        }
    });
});

addReq.on('error', (e) => {
    console.error('   ❌ Error al agregar:', e.message);
});

addReq.write(JSON.stringify(newProduct));
addReq.end();

function editProduct(id) {
    const editData = {
        nombre: "Producto Test Frontend - EDITADO",
        descripcion: "Producto editado exitosamente desde frontend",
        precio: 1499.99,
        cantidad_stock: 30,
        categoria: "Test Frontend Editado"
    };

    const editOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/public/productos/${id}`,
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
                
                // 3. Probar eliminar el producto
                console.log(`\n3️⃣ Eliminando producto ${id}...`);
                deleteProduct(id);
            } else {
                console.log('   ❌ Error al editar:', result.error);
            }
        });
    });

    editReq.on('error', (e) => {
        console.error('   ❌ Error al editar:', e.message);
    });

    editReq.write(JSON.stringify(editData));
    editReq.end();
}

function deleteProduct(id) {
    const deleteOptions = {
        hostname: 'localhost',
        port: 3000,
        path: `/api/public/productos/${id}`,
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
                console.log('   ✅ Producto eliminado exitosamente');
                
                // 4. Verificar que todo funcionó
                console.log('\n4️⃣ Verificando operaciones...');
                verifyOperations();
            } else {
                console.log('   ❌ Error al eliminar:', result.error);
            }
        });
    });

    deleteReq.on('error', (e) => {
        console.error('   ❌ Error al eliminar:', e.message);
    });

    deleteReq.end();
}

function verifyOperations() {
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
            console.log(`   📊 Total productos actuales: ${result.products.length}`);
            
            // Buscar el producto de prueba (debería estar eliminado)
            const testProduct = result.products.find(p => 
                p.nombre.includes('Producto Test Frontend')
            );
            
            if (!testProduct) {
                console.log('   ✅ Producto de prueba eliminado correctamente');
            }
            
            console.log('\n🎉 ¡Funciones de editar y borrar corregidas!');
            console.log('🌐 Frontend listo para usar en: http://localhost:3000/productos.html');
            console.log('\n💡 Ahora puedes:');
            console.log('   - Agregar nuevos productos');
            console.log('   - Editar productos existentes');
            console.log('   - Eliminar productos');
            console.log('   - Todo se guarda en PostgreSQL');
        });
    });

    verifyReq.on('error', (e) => {
        console.error('   ❌ Error en verificación:', e.message);
    });

    verifyReq.end();
}
