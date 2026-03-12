const fs = require('fs');
const { Pool } = require('pg');

async function executeSQLFile() {
    console.log('🔧 Ejecutando base-de-datos.sql en PostgreSQL...\n');
    
    try {
        // 1. Leer el archivo SQL
        console.log('📄 Leyendo base-de-datos.sql...');
        const sqlContent = fs.readFileSync('base-de-datos.sql', 'utf8');
        console.log('✅ Archivo SQL leído\n');
        
        // 2. Conectar a PostgreSQL como superusuario
        const adminPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'postgres'
        });
        
        console.log('🔗 Conectando como administrador...');
        
        // 3. Eliminar y recrear la base de datos
        console.log('🗑️  Eliminando base de datos systemsware si existe...');
        try {
            await adminPool.query('DROP DATABASE IF EXISTS "systemsware"');
            console.log('✅ Base de datos anterior eliminada');
        } catch (error) {
            console.log('ℹ️  La base de datos no existía o ya fue eliminada');
        }
        
        console.log('🆕 Creando nueva base de datos systemsware...');
        await adminPool.query('CREATE DATABASE "systemsware"');
        console.log('✅ Base de datos systemsware creada');
        
        // 4. Cerrar conexión de admin y conectar a la nueva base de datos
        await adminPool.end();
        
        const systemswarePool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'systemsware'
        });
        
        console.log('🔗 Conectando a la base de datos systemsware...');
        
        // 5. Procesar el archivo SQL línea por línea
        console.log('⚙️  Procesando sentencias SQL...');
        
        const lines = sqlContent.split('\n');
        let currentStatement = '';
        let statementCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Ignorar comentarios y líneas vacías
            if (line.startsWith('--') || line === '') {
                continue;
            }
            
            currentStatement += line + ' ';
            
            // Si la línea termina con ; es una sentencia completa
            if (line.endsWith(';')) {
                const statement = currentStatement.trim();
                if (statement) {
                    statementCount++;
                    try {
                        console.log(`${statementCount}. Ejecutando: ${statement.substring(0, 60)}...`);
                        await systemswarePool.query(statement);
                        console.log('   ✅ Éxito');
                    } catch (error) {
                        console.error(`   ❌ Error: ${error.message}`);
                        console.error(`   Sentencia: ${statement}`);
                    }
                }
                currentStatement = '';
            }
        }
        
        // 6. Verificar tablas creadas
        console.log('\n🔍 Verificando estructura creada...');
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
        
        // 7. Verificar estructura de Producto
        const productCheck = await systemswarePool.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'Producto' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
            LIMIT 5
        `);
        
        if (productCheck.rows.length > 0) {
            console.log('\n✅ Estructura de tabla Producto (primeras 5 columnas):');
            productCheck.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
            });
        }
        
        await systemswarePool.end();
        
        console.log('\n🎉 ¡Base de datos systemsware creada exitosamente desde base-de-datos.sql!');
        console.log('🌐 Frontend disponible en: http://localhost:3000/productos.html');
        console.log('💡 Para cargar datos de prueba: node load-datos-prueba.js');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
    }
}

executeSQLFile();
