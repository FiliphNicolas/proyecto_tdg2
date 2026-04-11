const db = require('./javascript/databasepg');

(async () => {
  try {
    console.log('🔍 Verificando estructura completa de la base de datos...');
    
    // Verificar tablas existentes
    const tables = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:');
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Estructura de tabla pedido
    console.log('\n🏗️ Estructura de tabla pedido:');
    const pedidoColumns = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'pedido' 
      ORDER BY ordinal_position
    `);
    
    pedidoColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, max: ${col.character_maximum_length})`);
    });
    
    // Estructura de tabla cliente
    console.log('\n👥 Estructura de tabla cliente:');
    const clienteColumns = await db.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable, 
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'cliente' 
      ORDER BY ordinal_position
    `);
    
    clienteColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, max: ${col.character_maximum_length})`);
    });
    
    // Verificar restricciones de foreign key
    console.log('\n🔗 Restricciones de foreign key:');
    const fkConstraints = await db.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'pedido'
    `);
    
    fkConstraints.rows.forEach(fk => {
      console.log(`  - ${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
