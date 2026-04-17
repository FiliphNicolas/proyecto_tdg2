-- ============================================
-- SCRIPT DE MIGRACIÓN: AGREGAR COLUMNA id_sede
-- ============================================
-- Este script agrega soporte para múltiples sedes
-- a las tablas usuario, producto e inventario
--
-- Ejecutar: psql -U postgres -d Systemsware -f migration-add-id_sede.sql

-- ============================================
-- PASO 1: Asegurar que la tabla SEDE existe
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

-- Insertar datos iniciales de sedes si no existen
INSERT INTO sede (nombre, ciudad, direccion, telefono, email, encargado, activo)
VALUES
  ('Sede Principal', 'Bogotá', 'Carrera 5 #45-67, Centro comercial Platino', '(1) 2345-6789', 'bogota@systemsware.com', 'Juan García', TRUE),
  ('Sede Sur', 'Bogotá', 'Carrera #123-45, Edificio Las Palmas', '(4) 5678-1234', 'sur@systemsware.com', 'María López', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- PASO 2: Agregar columna id_sede a USUARIO
-- ============================================
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS id_sede INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1;

-- ============================================
-- PASO 3: Agregar columna id_sede a PRODUCTO
-- ============================================
ALTER TABLE producto 
ADD COLUMN IF NOT EXISTS id_sede INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1;

-- ============================================
-- PASO 4: Agregar columna id_sede a INVENTARIO
-- ============================================
ALTER TABLE inventario 
ADD COLUMN IF NOT EXISTS id_sede INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1;

-- ============================================
-- PASO 5: Crear índices para performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_sede ON usuario(id_sede);
CREATE INDEX IF NOT EXISTS idx_producto_sede ON producto(id_sede);
CREATE INDEX IF NOT EXISTS idx_inventario_sede ON inventario(id_sede);
CREATE INDEX IF NOT EXISTS idx_inventario_producto_sede ON inventario(codigo_producto, id_sede);

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecutar estos comandos para verificar que las columnas se agregaron correctamente:
-- \d usuario
-- \d producto
-- \d inventario

-- Debería ver algo como:
-- id_sede              | integer           | not null default 1
