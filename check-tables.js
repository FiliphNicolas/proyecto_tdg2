const db = require('./databasepg');

async function checkTables() {
    console.log('🔍 Verificando tablas en la base de datos systemsware...\n');
    
    try {
        const connected = await db.testConnection();
        if (!connected) {
            console.log('❌ No se puede conectar a la base de datos');
            return;
        }
        
        // Listar todas las tablas
        const tablesResult = await db.query(`
            SELECT table_name, table_type 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tablas encontradas:');
        tablesResult.rows.forEach(table => {
            console.log(`   - ${table.table_name} (${table.table_type})`);
        });
        
        // Buscar tablas que contienen "producto"
        const productTables = tablesResult.rows.filter(table => 
            table.table_name.toLowerCase().includes('producto')
        );
        
        if (productTables.length > 0) {
            console.log('\n📦 Tablas de productos encontradas:');
            productTables.forEach(table => {
                console.log(`   - ${table.table_name}`);
            });
            
            // Verificar estructura de la primera tabla de productos
            const firstProductTable = productTables[0].table_name;
            console.log(`\n📋 Estructura de la tabla ${firstProductTable}:`);
            
            const structureResult = await db.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = '${firstProductTable}' 
                AND table_schema = 'public'
                ORDER BY ordinal_position
            `);
            
            structureResult.rows.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable})`);
            });
            
            // Contar registros
            const countResult = await db.query(`SELECT COUNT(*) as total FROM "${firstProductTable}"`);
            const totalRecords = parseInt(countResult.rows[0].total);
            console.log(`\n📊 Total de registros: ${totalRecords}`);
            
            if (totalRecords > 0) {
                // Mostrar primeros registros
                const sampleResult = await db.query(`
                    SELECT * FROM "${firstProductTable}" 
                    ORDER BY "${structureResult.rows[0].column_name}" 
                    LIMIT 3
                `);
                
                console.log('\n📝 Primeros registros:');
                sampleResult.rows.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${JSON.stringify(row, null, 2)}`);
                });
            }
        }
        
        await db.closePool();
        console.log('\n✅ Verificación completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkTables();
