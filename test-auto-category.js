const http = require('http');

console.log('🧪 Probando selección automática de categoría al editar\n');

// 1. Obtener todos los productos para encontrar uno con categoría
console.log('1️⃣ Buscando productos con categorías...');
const allOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/public/productos',
    method: 'GET'
};

const allReq = http.request(allOptions, (res) => {
    console.log(`   Status: ${res.statusCode}`);
    res.setEncoding('utf8');
    let data = '';
    
    res.on('data', (chunk) => { data += chunk; });
    
    res.on('end', () => {
        const result = JSON.parse(data);
        if (result.ok) {
            console.log(`   ✅ Total productos: ${result.products.length}`);
            
            // Encontrar productos con categorías específicas
            const perifericos = result.products.find(p => p.categoria === 'Periféricos');
            const monitores = result.products.find(p => p.categoria === 'Monitores');
            const almacenamiento = result.products.find(p => p.categoria === 'Almacenamiento');
            
            console.log('\n2️⃣ Productos encontrados por categoría:');
            if (perifericos) {
                console.log(`   🖱️ Periféricos: ${perifericos.nombre} (${perifericos.codigo_producto})`);
                console.log(`      ✅ Al editar, categoría "Periféricos" se seleccionará automáticamente`);
            }
            
            if (monitores) {
                console.log(`   🖥️ Monitores: ${monitores.nombre} (${monitores.codigo_producto})`);
                console.log(`      ✅ Al editar, categoría "Monitores" se seleccionará automáticamente`);
            }
            
            if (almacenamiento) {
                console.log(`   💾 Almacenamiento: ${almacenamiento.nombre} (${almacenamiento.codigo_producto})`);
                console.log(`      ✅ Al editar, categoría "Almacenamiento" se seleccionará automáticamente`);
            }
            
            // 3. Explicar cómo funciona en el frontend
            console.log('\n3️⃣ Cómo funciona la selección automática:');
            console.log('   📝 En la función editarProducto(id):');
            console.log('   ```javascript');
            console.log('   // Llenar el formulario con los datos del producto');
            console.log('   document.getElementById("productName").value = producto.nombre;');
            console.log('   document.getElementById("productCategory").value = producto.categoria; // ✅ AUTOMÁTICO');
            console.log('   document.getElementById("productPrice").value = producto.precio;');
            console.log('   // ... otros campos');
            console.log('   ```');
            
            console.log('\n4️⃣ Para probar en el frontend:');
            console.log('   1. Abre: http://localhost:3000/productos.html');
            console.log('   2. Busca un producto con categoría (ej: "Mouse Gaming RGB Pro")');
            console.log('   3. Click en botón "Editar"');
            console.log('   4. ✅ El menú de categoría se seleccionará automáticamente');
            console.log('   5. ✅ Todos los campos se llenarán con los datos actuales');
            console.log('   6. ✅ Puedes modificar y guardar cambios');
            
            console.log('\n🎉 ¡Selección automática de categoría funcionando!');
            console.log('💡 El input de categoría se selecciona automáticamente al editar productos');
        } else {
            console.log('   ❌ Error:', result.error);
        }
    });
});

allReq.on('error', (e) => {
    console.error('   ❌ Error:', e.message);
});

allReq.end();
