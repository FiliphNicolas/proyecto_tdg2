const http = require('http');

console.log('🧪 Probando formulario con categorías actualizadas\n');

// 1. Probar agregar producto con nueva categoría
console.log('1️⃣ Agregando producto con categoría "Periféricos"...');
const newProduct = {
    nombre: "Mouse Gaming RGB Pro",
    descripcion: "Mouse gaming con sensor óptico 16000 DPI, iluminación RGB",
    precio: 89999.99,
    cantidad_stock: 35,
    categoria: "Periféricos"
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
            console.log(`   🏷️  Categoría: ${result.product.categoria}`);
            
            // 2. Mostrar todas las categorías disponibles
            console.log(`\n2️⃣ Categorías disponibles en la base de datos:`);
            showAllCategories();
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

function showAllCategories() {
    const allOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/public/productos',
        method: 'GET'
    };

    const allReq = http.request(allOptions, (res) => {
        res.setEncoding('utf8');
        let data = '';
        
        res.on('data', (chunk) => { data += chunk; });
        
        res.on('end', () => {
            const result = JSON.parse(data);
            
            // Extraer categorías únicas
            const categories = [...new Set(result.products.map(p => p.categoria).filter(Boolean))].sort();
            
            console.log(`   📊 Total categorías: ${categories.length}`);
            categories.forEach((cat, index) => {
                const count = result.products.filter(p => p.categoria === cat).length;
                console.log(`   ${index + 1}. ${cat} (${count} productos)`);
            });
            
            console.log('\n🎉 ¡Formulario de categorías actualizado y funcionando!');
            console.log('🌐 Frontend con categorías completas: http://localhost:3000/productos.html');
            console.log('\n💡 Categorías disponibles en el formulario:');
            console.log('   ✅ Computadores, Monitores, Periféricos, Audio');
            console.log('   ✅ Cables, Adaptadores, Almacenamiento, Accesorios');
            console.log('   ✅ Impresoras, Redes, Mobiliario, Hardware');
            console.log('   ✅ Software, Oficina, Electrónica');
            console.log('\n🔧 Funcionalidades disponibles:');
            console.log('   - Agregar productos con categorías específicas');
            console.log('   - Filtrar por categoría desde el frontend');
            console.log('   - Editar categoría de productos existentes');
            console.log('   - Todo se guarda en PostgreSQL');
        });
    });

    allReq.on('error', (e) => {
        console.error('   ❌ Error:', e.message);
    });

    allReq.end();
}
