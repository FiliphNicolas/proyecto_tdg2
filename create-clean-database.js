const { Pool } = require('pg');

async function createCleanDatabase() {
    console.log('🔧 Creando base de datos systemsware con estructura corregida...\n');
    
    try {
        // 1. Conectar como administrador
        const adminPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'postgres'
        });
        
        console.log('🔗 Conectando como administrador...');
        
        // 2. Eliminar y recrear base de datos
        await adminPool.query('DROP DATABASE IF EXISTS "systemsware"');
        await adminPool.query('CREATE DATABASE "systemsware"');
        console.log('✅ Base de datos systemsware creada');
        
        await adminPool.end();
        
        // 3. Conectar a la nueva base de datos
        const dbPool = new Pool({
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || '1234',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: 'systemsware'
        });
        
        console.log('🔗 Conectando a systemsware...');
        
        // 4. Crear tablas con SQL corregido
        console.log('⚙️  Creando tablas...');
        
        // Tabla Cliente
        await dbPool.query(`
            CREATE TABLE Cliente (
                id_cliente SERIAL PRIMARY KEY,
                nombre VARCHAR(100) NOT NULL,
                apellido VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                telefono VARCHAR(15),
                direccion VARCHAR(255),
                fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla Cliente creada');
        
        // Tabla Usuario
        await dbPool.query(`
            CREATE TABLE Usuario (
                id_usuario SERIAL PRIMARY KEY,
                nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
                contrasena VARCHAR(255) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                rol VARCHAR(50) DEFAULT 'empleado',
                activo BOOLEAN DEFAULT TRUE,
                direccion VARCHAR(255),
                numero_cel VARCHAR(20),
                ciudad VARCHAR(100),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla Usuario creada');
        
        // Tabla Producto (corregida según base-de-datos.sql)
        await dbPool.query(`
            CREATE TABLE Producto (
                codigo_producto VARCHAR(30) NOT NULL PRIMARY KEY,
                nombre VARCHAR(150) NOT NULL,
                descripcion VARCHAR(500),
                precio NUMERIC(10,2) NOT NULL,
                cantidad_stock INT DEFAULT 0,
                categoria VARCHAR(100),
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabla Producto creada');
        
        // Tabla Pedido
        await dbPool.query(`
            CREATE TABLE Pedido (
                id_pedido SERIAL PRIMARY KEY,
                id_cliente INT NOT NULL,
                id_usuario INT NOT NULL,
                fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                total NUMERIC(10,2),
                estado VARCHAR(50) DEFAULT 'pendiente',
                codigo_detalle VARCHAR(10) NOT NULL
            )
        `);
        console.log('✅ Tabla Pedido creada');
        
        // Tabla Detalle_Pedido
        await dbPool.query(`
            CREATE TABLE Detalle_Pedido (
                codigo_detalle VARCHAR(10) NOT NULL PRIMARY KEY,
                id_pedido INT NOT NULL,
                codigo_producto VARCHAR(30) NOT NULL,
                cantidad INT NOT NULL,
                precio_unitario NUMERIC(10,2) NOT NULL
            )
        `);
        console.log('✅ Tabla Detalle_Pedido creada');
        
        // Tabla Inventario
        await dbPool.query(`
            CREATE TABLE Inventario (
                id_movimiento INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                codigo_producto VARCHAR(30) NOT NULL,
                tipo_movimiento VARCHAR(50) NOT NULL,
                cantidad INT NOT NULL,
                fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                descripcion VARCHAR(255)
            )
        `);
        console.log('✅ Tabla Inventario creada');
        
        // Tabla Auditoria
        await dbPool.query(`
            CREATE TABLE Auditoria (
                id_auditoria INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
                id_usuario INT NOT NULL,
                tabla_afectada VARCHAR(50),
                accion VARCHAR(50),
                fecha_accion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                detalles TEXT
            )
        `);
        console.log('✅ Tabla Auditoria creada');
        
        // 5. Verificar todas las tablas
        const tablesResult = await dbPool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log(`\n✅ Total de tablas creadas: ${tablesResult.rows.length}`);
        tablesResult.rows.forEach(table => {
            console.log(`   - ${table.table_name}`);
        });
        
        // 6. Verificar estructura de Producto
        const productStructure = await dbPool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Producto' 
            AND table_schema = 'public'
            ORDER BY ordinal_position
        `);
        
        console.log('\n✅ Estructura de tabla Producto:');
        productStructure.rows.forEach(col => {
            console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        
        await dbPool.end();
        
        console.log('\n🎉 ¡Base de datos systemsware creada exitosamente!');
        console.log('🌐 Frontend: http://localhost:3000/productos.html');
        console.log('💡 Para cargar datos de prueba: psql -U postgres -d systemsware -f datos-prueba.sql');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createCleanDatabase();
