const fs = require('fs');
const { Pool } = require('pg');

async function createDatabaseFromSQL() {
    console.log('🔧 Creando base de datos systemsware desde base-de-datos.sql...\n');
    
    try {
        // 1. Leer el archivo SQL
        console.log('📄 Leyendo archivo base-de-datos.sql...');
        const sqlContent = fs.readFileSync('base-de-datos.sql', 'utf8');
        console.log('✅ Archivo SQL leído correctamente\n');
        
        // 2. Conectar a PostgreSQL (base postgres por defecto)
        const adminPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'postgres'
        });
        
        console.log('🔗 Conectando a PostgreSQL...');
        
        // 3. Crear la base de datos si no existe
        try {
            await adminPool.query('CREATE DATABASE "systemsware"');
            console.log('✅ Base de datos "systemsware" creada');
        } catch (error) {
            if (error.code === '42P04') { // database already exists
                console.log('ℹ️  La base de datos "systemsware" ya existe, eliminándola...');
                await adminPool.query('DROP DATABASE "systemsware"');
                await adminPool.query('CREATE DATABASE "systemsware"');
                console.log('✅ Base de datos "systemsware" recreada');
            } else {
                throw error;
            }
        }
        
        // 4. Cerrar conexión a postgres y conectar a systemsware
        await adminPool.end();
        
        const systemswarePool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'systemsware'
        });
        
        console.log('🔗 Conectando a la base de datos "systemsware"...');
        
        // 5. Separar y ejecutar las sentencias SQL
        console.log('⚙️  Ejecutando sentencias SQL...');
        
        // Separar el contenido en sentencias individuales
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Se encontraron ${statements.length} sentencias SQL`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                console.log(`\n${i + 1}. Ejecutando: ${statement.substring(0, 50)}...`);
                await systemswarePool.query(statement);
                console.log('✅ Sentencia ejecutada correctamente');
            } catch (error) {
                console.error(`❌ Error en sentencia ${i + 1}:`, error.message);
                console.error('Sentencia completa:', statement);
            }
        }
        
        // 6. Verificar tablas creadas
        console.log('\n🔍 Verificando tablas creadas...');
        const tablesResult = await systemswarePool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log(`✅ Tablas creadas: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
        // 7. Verificar estructura de tabla Producto
        console.log('\n📋 Verificando tabla Producto...');
        const productStructure = await systemswarePool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Producto' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        if (productStructure.rows.length > 0) {
            console.log('✅ Estructura de la tabla Producto:');
            productStructure.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        }
        
        await systemswarePool.end();
        
        console.log('\n🎉 ¡Base de datos "systemsware" creada exitosamente!');
        console.log('🌐 Ahora puedes acceder al frontend en: http://localhost:3000/productos.html');
        console.log('💡 Para cargar datos de prueba, ejecuta: node load-test-data.js');
        
    } catch (error) {
        console.error('❌ Error al crear base de datos:', error.message);
    }
}

createDatabaseFromSQL();
