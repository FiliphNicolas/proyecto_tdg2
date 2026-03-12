// Script de diagnóstico para el servidor
const db = require('./databasepg');

async function diagnosticServer() {
    console.log('🔍 Iniciando diagnóstico del servidor...\n');
    
    // 1. Probar conexión a base de datos
    console.log('1. Probando conexión a PostgreSQL...');
    const connected = await db.testConnection();
    
    if (!connected) {
        console.log('❌ Falló la conexión a PostgreSQL');
        console.log('💡 Soluciones posibles:');
        console.log('   - Verifica que PostgreSQL esté corriendo');
        console.log('   - Revisa el archivo .env con las credenciales correctas');
        console.log('   - Asegúrate que la base de datos "systemsware" exista');
        return;
    }
    
    console.log('✅ Conexión a PostgreSQL exitosa\n');
    
    // 2. Verificar tablas
    console.log('2. Verificando tablas en la base de datos...');
    try {
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('📋 Tablas encontradas:');
        tables.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });
        
        const requiredTables = ['Usuario', 'Producto', 'Categoria', 'MovimientoInventario', 'Servicio'];
        const missingTables = requiredTables.filter(table => 
            !tables.rows.some(row => row.table_name === table)
        );
        
        if (missingTables.length > 0) {
            console.log('\n❌ Faltan las siguientes tablas:');
            missingTables.forEach(table => console.log(`   - ${table}`));
            console.log('\n💡 Ejecuta: psql -U postgres -d systemsware -f database-setup.sql');
        } else {
            console.log('\n✅ Todas las tablas requeridas existen');
        }
    } catch (error) {
        console.log('❌ Error al verificar tablas:', error.message);
    }
    
    // 3. Verificar estructura de la tabla Usuario
    console.log('\n3. Verificando estructura de la tabla Usuario...');
    try {
        const columns = await db.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Usuario' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('📊 Columnas de la tabla Usuario:');
        columns.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
        });
        
        const requiredColumns = ['nombre_usuario', 'email', 'contrasena', 'direccion', 'numero_cel', 'ciudad'];
        const missingColumns = requiredColumns.filter(col => 
            !columns.rows.some(row => row.column_name === col)
        );
        
        if (missingColumns.length > 0) {
            console.log('\n❌ Faltan las siguientes columnas:');
            missingColumns.forEach(col => console.log(`   - ${col}`));
            console.log('\n💡 Necesitas actualizar la tabla Usuario');
        } else {
            console.log('\n✅ Estructura de tabla Usuario correcta');
        }
    } catch (error) {
        console.log('❌ Error al verificar estructura:', error.message);
    }
    
    // 4. Probar endpoint de registro
    console.log('\n4. Verificando configuración del servidor...');
    console.log('📝 Variables de entorno:');
    console.log(`   - DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   - DB_PORT: ${process.env.DB_PORT || 5432}`);
    console.log(`   - DB_NAME: ${process.env.DB_NAME || 'systemsware'}`);
    console.log(`   - DB_USER: ${process.env.DB_USER || 'postgres'}`);
    console.log(`   - PORT: ${process.env.PORT || 3000}`);
    
    console.log('\n✅ Diagnóstico completado');
    console.log('\n🚀 Si todo está correcto, ejecuta: npm start');
    
    // Cerrar conexión
    await db.closePool();
    process.exit(0);
}

// Ejecutar diagnóstico
diagnosticServer();
