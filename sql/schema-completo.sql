-- ============================================
-- SISTEMA INTEGRAL DE BASE DE DATOS SYSTEMSWARE
-- ============================================
-- Este script contiene todo el esquema completo
-- Ejecutar: psql -U postgres -d systemsware -f schema-completo.sql

-- ============================================
-- TABLA: SEDE
-- ============================================
CREATE TABLE IF NOT EXISTS sede (
    id_sede              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               VARCHAR(100) NOT NULL,
    ciudad               VARCHAR(100) NOT NULL,
    direccion            VARCHAR(255),
    telefono             VARCHAR(20),
    email                VARCHAR(100),
    encargado            VARCHAR(100),
    activo               BOOLEAN DEFAULT TRUE,
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: CLIENTE
-- ============================================
CREATE TABLE IF NOT EXISTS cliente (
    id_cliente           INT PRIMARY KEY NOT NULL,
    nombre               VARCHAR(100) NOT NULL,
    apellido             VARCHAR(100) NOT NULL,
    email                VARCHAR(100) UNIQUE,
    telefono             VARCHAR(15),
    direccion            VARCHAR(255),
    fecha_registro       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS usuario (
    id_usuario           INT PRIMARY KEY NOT NULL,
    nombre_usuario       VARCHAR(50) UNIQUE NOT NULL,
    contrasena           VARCHAR(255) NOT NULL,
    email                VARCHAR(100) UNIQUE NOT NULL,
    rol                  VARCHAR(50) DEFAULT 'empleado',
    activo               BOOLEAN DEFAULT TRUE,
    direccion            VARCHAR(255),
    numero_cel           VARCHAR(15),
    ciudad               VARCHAR(100),
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PRODUCTO
-- ============================================
CREATE TABLE IF NOT EXISTS producto (
    codigo_producto      VARCHAR(30) NOT NULL PRIMARY KEY,
    nombre               VARCHAR(150) NOT NULL,
    descripcion          VARCHAR(500),
    precio               NUMERIC(10,2) NOT NULL,
    cantidad_stock       INT DEFAULT 0,
    categoria            VARCHAR(100),
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS pedido (
    id_pedido            INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_pedido        VARCHAR(50) UNIQUE NOT NULL,
    nombre_cliente       VARCHAR(255) NOT NULL,
    email_cliente        VARCHAR(255) NOT NULL,
    telefono_cliente     VARCHAR(50),
    estado_pedido        VARCHAR(50) NOT NULL DEFAULT 'pending',
    fecha_pedido         DATE NOT NULL,
    monto_total          DECIMAL(10,2) NOT NULL,
    direccion_envio      TEXT,
    notas_pedido         TEXT,
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TABLA: DETALLE_PEDIDO
-- ============================================
CREATE TABLE IF NOT EXISTS detalle_pedido (
    codigo_detalle       VARCHAR(10) NOT NULL PRIMARY KEY,
    id_pedido            INT NOT NULL REFERENCES pedido(id_pedido) ON DELETE CASCADE,
    codigo_producto      VARCHAR(30) NOT NULL REFERENCES producto(codigo_producto),
    cantidad             INT NOT NULL,
    precio_unitario      NUMERIC(10,2) NOT NULL
);

-- ============================================
-- TABLA: INVENTARIO
-- ============================================
CREATE TABLE IF NOT EXISTS inventario (
    id_movimiento        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_producto      VARCHAR(30) NOT NULL REFERENCES producto(codigo_producto),
    tipo_movimiento      VARCHAR(50) NOT NULL,
    cantidad             INT NOT NULL,
    fecha_movimiento     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    descripcion          VARCHAR(255)
);

-- ============================================
-- TABLA: AUDITORIA
-- ============================================
CREATE TABLE IF NOT EXISTS auditoria (
    id_auditoria         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario           INT NOT NULL REFERENCES usuario(id_usuario),
    tabla_afectada       VARCHAR(50),
    accion               VARCHAR(50),
    fecha_accion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    detalles             TEXT
);

-- ============================================
-- DATOS DE PRUEBA: SEDES
-- ============================================
INSERT INTO sede (nombre, ciudad, direccion, telefono, email, encargado, activo)
VALUES
  ('Sede Principal', 'Bogotá', 'Carrera 5 #45-67, Centro comercial Platino', '(1) 2345-6789', 'bogota@systemsware.com', 'Juan García', TRUE),
  ('Sede Medellín', 'Medellín', 'Calle 10 #30-50, Parque Bolívar', '(4) 4567-8901', 'medellin@systemsware.com', 'María López', TRUE),
  ('Sede Cali', 'Cali', 'Avenida 6 #20-40, Zona Rosa', '(2) 3456-7890', 'cali@systemsware.com', 'Carlos Rodríguez', TRUE),
  ('Sede Barranquilla', 'Barranquilla', 'Boulevard 53 #45-60, Centro', '(5) 3456-7890', 'barranquilla@systemsware.com', 'Ana Martínez', TRUE),
  ('Sede Santa Marta', 'Santa Marta', 'Carrera 1 #12-34, Frente al mar', '(5) 4321-0987', 'santamarta@systemsware.com', 'Pedro Sánchez', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: PRODUCTOS
-- ============================================
INSERT INTO producto (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria)
VALUES
  ('PROD-001', 'Laptop Dell XPS 13', 'Portátil ultraligero 13 pulgadas', 1200.00, 15, 'Electrónica'),
  ('PROD-002', 'Mouse Logitech MX', 'Ratón inalámbrico de precisión', 79.99, 50, 'Accesorios'),
  ('PROD-003', 'Teclado Mecánico RGB', 'Teclado gaming con iluminación RGB', 149.99, 30, 'Accesorios'),
  ('PROD-004', 'Monitor LG 27"', 'Pantalla IPS 4K 27 pulgadas', 399.99, 20, 'Monitores'),
  ('PROD-005', 'SSD Kingston 1TB', 'Unidad de estado sólido 1TB NVMe', 89.99, 100, 'Almacenamiento')
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: CLIENTES
-- ============================================
INSERT INTO cliente (id_cliente, nombre, apellido, email, telefono, direccion)
VALUES
  (1, 'Juan', 'Pérez', 'juan.perez@email.com', '123-456-7890', 'Calle Principal 123'),
  (2, 'María', 'García', 'maria.garcia@email.com', '987-654-3210', 'Avenida Secundaria 456'),
  (3, 'Carlos', 'Rodríguez', 'carlos.rodriguez@email.com', '555-123-4567', 'Plaza Central 789'),
  (4, 'Ana', 'Martínez', 'ana.martinez@email.com', '333-999-8888', 'Bulevar Nuevo 321'),
  (5, 'Luis', 'Sánchez', 'luis.sanchez@email.com', '777-555-3333', 'Calle Antigua 654')
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: USUARIOS
-- ============================================
INSERT INTO usuario (id_usuario, nombre_usuario, contrasena, email, rol, activo, ciudad)
VALUES
  (1, 'admin', '$2b$10$YourHashedPasswordHere', 'admin@systemsware.com', 'admin', TRUE, 'Bogotá'),
  (2, 'vendedor1', '$2b$10$YourHashedPasswordHere', 'vendedor@systemsware.com', 'vendedor', TRUE, 'Medellín'),
  (3, 'empleado1', '$2b$10$YourHashedPasswordHere', 'empleado@systemsware.com', 'empleado', TRUE, 'Cali')
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: PEDIDOS
-- ============================================
INSERT INTO pedido (numero_pedido, nombre_cliente, email_cliente, telefono_cliente, estado_pedido, fecha_pedido, monto_total, direccion_envio, notas_pedido)
VALUES
  ('PED-001', 'Juan Pérez', 'juan.perez@email.com', '123-456-7890', 'delivered', '2026-03-15', 1500.00, 'Calle Principal 123', 'Entregar en horario laboral'),
  ('PED-002', 'María García', 'maria.garcia@email.com', '987-654-3210', 'processing', '2026-03-16', 2800.50, 'Avenida Secundaria 456', 'Cliente prefiere contacto por email'),
  ('PED-003', 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '555-123-4567', 'shipped', '2026-03-17', 950.75, 'Plaza Central 789', 'Urgente - cumpleaños'),
  ('PED-004', 'Ana Martínez', 'ana.martinez@email.com', '333-999-8888', 'pending', '2026-03-18', 3200.00, 'Bulevar Nuevo 321', 'Requiere factura fiscal'),
  ('PED-005', 'Luis Sánchez', 'luis.sanchez@email.com', '777-555-3333', 'cancelled', '2026-03-19', 750.25, 'Calle Antigua 654', 'Cancelado por cliente')
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: DETALLE_PEDIDO
-- ============================================
INSERT INTO detalle_pedido (codigo_detalle, id_pedido, codigo_producto, cantidad, precio_unitario)
VALUES
  ('DET-001', 1, 'PROD-001', 1, 1200.00),
  ('DET-002', 1, 'PROD-002', 2, 79.99),
  ('DET-003', 2, 'PROD-003', 1, 149.99),
  ('DET-004', 2, 'PROD-004', 1, 399.99),
  ('DET-005', 3, 'PROD-005', 2, 89.99)
ON CONFLICT DO NOTHING;

-- ============================================
-- DATOS DE PRUEBA: INVENTARIO
-- ============================================
INSERT INTO inventario (codigo_producto, tipo_movimiento, cantidad, descripcion)
VALUES
  ('PROD-001', 'entrada', 20, 'Compra a proveedor distribuidor A'),
  ('PROD-002', 'entrada', 100, 'Compra a proveedor distribuidor B'),
  ('PROD-001', 'salida', 5, 'Venta pedido PED-001'),
  ('PROD-003', 'entrada', 50, 'Reposición de stock'),
  ('PROD-004', 'salida', 1, 'Venta pedido PED-002');

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pedido_fecha ON pedido(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha ON inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_cliente_email ON cliente(email);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion);

-- ============================================
-- RESUMEN DE TABLAS CREADAS
-- ============================================
-- 1. SEDE (5 registros)
-- 2. CLIENTE (5 registros)
-- 3. USUARIO (3 registros)
-- 4. PRODUCTO (5 registros)
-- 5. PEDIDO (5 registros)
-- 6. DETALLE_PEDIDO (5 registros)
-- 7. INVENTARIO (5 registros)
-- 8. AUDITORIA (vacía, se llena al usar el sistema)
--
-- Total de tablas: 8
-- Total de registros de prueba: 33
-- ============================================
