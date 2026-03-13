const db = require('./databasepg.js');

async function updateDatabase() {
  try {
    console.log('🔧 Updating database schema...');
    
    // Agregar columnas faltantes
    await db.query(`
      ALTER TABLE usuario 
      ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
      ADD COLUMN IF NOT EXISTS numero_cel VARCHAR(15),
      ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100)
    `);
    
    console.log('✅ Database schema updated successfully');
    
    // Verificar las columnas
    const result = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'usuario' 
      AND column_name IN ('direccion', 'numero_cel', 'ciudad')
      ORDER BY column_name
    `);
    
    console.log('📋 Updated columns:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error.message);
    process.exit(1);
  }
}

updateDatabase();
