const { Pool } = require('pg');

const db = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'systemsware',
  user: 'postgres',
  password: '1234'
});

async function checkTable() {
  try {
    console.log(' Verificando tabla auditoria...');
    
    // Verificar si la tabla existe
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'auditoria'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      console.log(' La tabla auditoria NO existe');
      console.log(' Creando tabla auditoria...');
      
      // Crear tabla auditoria
      await db.query(`
        CREATE TABLE auditoria (
          id_auditoria SERIAL PRIMARY KEY,
          id_usuario INTEGER REFERENCES usuario(id_usuario),
          tabla_afectada VARCHAR(100),
          accion VARCHAR(50),
          descripcion TEXT,
          fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          estado VARCHAR(20) DEFAULT 'exitoso',
          ip_address VARCHAR(45),
          user_agent TEXT
        )
      `);
      
      console.log(' Tabla auditoria creada');
    } else {
      console.log(' Tabla auditoria existe');
    }
    
    // Mostrar estructura
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'auditoria' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n Estructura de la tabla:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Contar registros
    const count = await db.query('SELECT COUNT(*) as total FROM auditoria');
    console.log(`\n Total registros: ${count.rows[0].total}`);
    
    // Insertar registro de prueba si está vacía
    if (count.rows[0].total === 0) {
      console.log(' Insertando registro de prueba...');
      await db.query(`
        INSERT INTO auditoria (id_usuario, tabla_afectada, accion, descripcion, estado)
        VALUES (1, 'auditoria', 'CREATE', 'Tabla auditoria creada', 'exitoso')
      `);
      console.log(' Registro de prueba insertado');
    }
    
    // Mostrar registros recientes
    const recent = await db.query(`
      SELECT * FROM auditoria 
      ORDER BY fecha_accion DESC 
      LIMIT 5
    `);
    
    console.log('\n Registros recientes:');
    recent.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.fecha_accion} - ${row.accion} en ${row.tabla_afectada}`);
      console.log(`   Usuario: ${row.id_usuario} | Estado: ${row.estado}`);
      console.log(`   Detalles: ${row.descripcion || 'Sin detalles'}`);
    });
    
  } catch (err) {
    console.error(' Error:', err.message);
  } finally {
    await db.end();
  }
}

checkTable();
