const db = require('./databasepg');

(async () => {
  try {
    console.log('🔍 Verificando tabla pedido...');
    
    // Primero obtener información de las columnas
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'pedido' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Columnas de la tabla pedido:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Luego obtener los datos
    const result = await db.query('SELECT * FROM pedido ORDER BY id_pedido');
    console.log(`\n📊 Total de pedidos: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('\n📄 Datos de pedidos:');
      result.rows.forEach((row, index) => {
        console.log(`  Pedido ${index + 1}:`, row);
      });
    } else {
      console.log('⚠️ No hay pedidos en la tabla');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
