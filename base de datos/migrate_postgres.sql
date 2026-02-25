-- Migration file adapted for PostgreSQL
-- Run with: psql -U <user> -d systemsware -f migrate_postgres.sql

BEGIN;

-- Tabla Cliente
CREATE TABLE IF NOT EXISTS "Cliente" (
  id_cliente SERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE,
  telefono VARCHAR(15),
  direccion VARCHAR(255),
  fecha_registro TIMESTAMP DEFAULT NOW()
);

-- Tabla Usuario
CREATE TABLE IF NOT EXISTS "Usuario" (
  id_usuario SERIAL PRIMARY KEY,
  nombre_usuario VARCHAR(50) UNIQUE NOT NULL,
  "contraseña" VARCHAR(255) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  rol VARCHAR(50) DEFAULT 'empleado',
  activo BOOLEAN DEFAULT TRUE,
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla Producto
CREATE TABLE IF NOT EXISTS "Producto" (
  id_producto SERIAL PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  descripcion VARCHAR(500),
  precio NUMERIC(10,2) NOT NULL,
  cantidad_stock INT DEFAULT 0,
  categoria VARCHAR(100),
  fecha_creacion TIMESTAMP DEFAULT NOW()
);

-- Tabla Pedido (relaciona Cliente, Usuario y Producto)
CREATE TABLE IF NOT EXISTS "Pedido" (
  id_pedido SERIAL PRIMARY KEY,
  id_cliente INT NOT NULL,
  id_usuario INT NOT NULL,
  fecha_pedido TIMESTAMP DEFAULT NOW(),
  total NUMERIC(10,2),
  estado VARCHAR(50) DEFAULT 'pendiente',
  CONSTRAINT fk_pedido_cliente FOREIGN KEY (id_cliente) REFERENCES "Cliente" (id_cliente) ON DELETE RESTRICT,
  CONSTRAINT fk_pedido_usuario FOREIGN KEY (id_usuario) REFERENCES "Usuario" (id_usuario) ON DELETE RESTRICT
);

-- Tabla Detalle_Pedido
CREATE TABLE IF NOT EXISTS "Detalle_Pedido" (
  id_detalle SERIAL PRIMARY KEY,
  id_pedido INT NOT NULL,
  id_producto INT NOT NULL,
  cantidad INT NOT NULL,
  precio_unitario NUMERIC(10,2) NOT NULL,
  CONSTRAINT fk_detalle_pedido FOREIGN KEY (id_pedido) REFERENCES "Pedido" (id_pedido) ON DELETE CASCADE,
  CONSTRAINT fk_detalle_producto FOREIGN KEY (id_producto) REFERENCES "Producto" (id_producto) ON DELETE RESTRICT
);

-- Tabla Inventario (para rastrear movimientos de stock)
CREATE TABLE IF NOT EXISTS "Inventario" (
  id_movimiento SERIAL PRIMARY KEY,
  id_producto INT NOT NULL,
  tipo_movimiento VARCHAR(50) NOT NULL,
  cantidad INT NOT NULL,
  fecha_movimiento TIMESTAMP DEFAULT NOW(),
  descripcion VARCHAR(255),
  CONSTRAINT fk_inventario_producto FOREIGN KEY (id_producto) REFERENCES "Producto" (id_producto) ON DELETE RESTRICT
);

-- Tabla Auditoría (para registrar cambios de usuarios)
CREATE TABLE IF NOT EXISTS "Auditoria" (
  id_auditoria SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  tabla_afectada VARCHAR(50),
  accion VARCHAR(50),
  fecha_accion TIMESTAMP DEFAULT NOW(),
  detalles TEXT,
  CONSTRAINT fk_auditoria_usuario FOREIGN KEY (id_usuario) REFERENCES "Usuario" (id_usuario) ON DELETE SET NULL
);

COMMIT;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_producto_nombre ON "Producto" (nombre);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON "Usuario" (email);
