const db = require('./javascript/databasepg');

(async () => {
  try {
    console.log('🔍 Verificando datos de clientes...');
    
    // Obtener todos los clientes
    const clientesResult = await db.query(`
      SELECT 
        id_cliente,
        nombre,
        apellido,
        email,
        telefono,
        fecha_registro
      FROM cliente
      ORDER BY id_cliente
    `);
    
    console.log('📋 Clientes encontrados:');
    clientesResult.rows.forEach(cliente => {
      console.log(`  ID: ${cliente.id_cliente} | ${cliente.nombre} ${cliente.apellido || ''} | ${cliente.email || 'Sin email'} | ${cliente.telefono || 'Sin teléfono'}`);
    });
    
    console.log(`\n📊 Total de clientes: ${clientesResult.rows.length}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();
