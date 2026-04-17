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
    cedula               VARCHAR(20) UNIQUE,
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
    id_sede              INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1,
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
    id_sede              INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1,
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
    id_sede              INT REFERENCES sede(id_sede) ON DELETE SET NULL DEFAULT 1,
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
  ('Sede Sur', 'Bogotá', 'Carrera #123-45, Edificio Las Palmas', '(4) 5678-1234', 'sur@systemsware.com', 'María López', TRUE)
ON CONFLICT DO NOTHING;


-- ============================================
-- DATOS DE PRUEBA: PRODUCTOS
-- ============================================
INSERT INTO producto (codigo_producto, id_sede, nombre, descripcion, precio, cantidad_stock, categoria)
VALUES
  ('PROD-001', 1, 'Laptop Dell XPS 13', 'Portátil ultraligero 13 pulgadas', 1200.00, 15, 'Electrónica'),
  ('PROD-002', 1, 'Mouse Logitech MX', 'Ratón inalámbrico de precisión', 79.99, 50, 'Accesorios'),
  ('PROD-003', 2, 'Teclado Mecánico RGB', 'Teclado gaming con iluminación RGB', 149.99, 30, 'Accesorios'),
  ('PROD-004', 1, 'Monitor LG 27"', 'Pantalla IPS 4K 27 pulgadas', 399.99, 20, 'Monitores'),
  ('PROD-005', 2, 'SSD Kingston 1TB', 'Unidad de estado sólido 1TB NVMe', 89.99, 100, 'Almacenamiento')
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
INSERT INTO usuario (id_usuario, id_sede, nombre_usuario, contrasena, email, rol, activo, ciudad)
VALUES
  (1, 1, 'admin', '$2b$10$YourHashedPasswordHere', 'admin@systemsware.com', 'admin', TRUE, 'Bogotá'),
  (2, 1, 'vendedor1', '$2b$10$YourHashedPasswordHere', 'vendedor@systemsware.com', 'vendedor', TRUE, 'Bogotá'),
  (3, 2, 'empleado1', '$2b$10$YourHashedPasswordHere', 'empleado@systemsware.com', 'empleado', TRUE, 'Bogotá')
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
INSERT INTO inventario (id_sede, codigo_producto, tipo_movimiento, cantidad, descripcion)
VALUES
  (1, 'PROD-001', 'entrada', 20, 'Compra a proveedor distribuidor A'),
  (1, 'PROD-002', 'entrada', 100, 'Compra a proveedor distribuidor B'),
  (1, 'PROD-001', 'salida', 5, 'Venta pedido PED-001'),
  (2, 'PROD-003', 'entrada', 50, 'Reposición de stock'),
  (1, 'PROD-004', 'salida', 1, 'Venta pedido PED-002');

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_usuario_sede ON usuario(id_sede);
CREATE INDEX IF NOT EXISTS idx_producto_sede ON producto(id_sede);
CREATE INDEX IF NOT EXISTS idx_inventario_sede ON inventario(id_sede);
CREATE INDEX IF NOT EXISTS idx_inventario_producto ON inventario(codigo_producto);
CREATE INDEX IF NOT EXISTS idx_inventario_producto_sede ON inventario(codigo_producto, id_sede);
CREATE INDEX IF NOT EXISTS idx_inventario_fecha ON inventario(fecha_movimiento);
CREATE INDEX IF NOT EXISTS idx_pedido_fecha ON pedido(fecha_pedido);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado_pedido);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_cliente_email ON cliente(email);
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria(fecha_accion);

-- ============================================
-- FUNCTION Y TRIGGERS DE AUDITORIA
-- ============================================

-- Función para registrar cambios en la tabla auditoria
CREATE OR REPLACE FUNCTION fn_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id INT;
    v_action VARCHAR(50);
    v_details TEXT;
BEGIN
    -- Obtener el ID del usuario de la sesión (si exists)
    BEGIN
        v_user_id := current_setting('app.current_user_id')::INT;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := 1; -- Usuario por defecto si no se especifica
    END;

    -- Determinar la acción
    IF TG_OP = 'INSERT' THEN
        v_action := 'INSERT';
        v_details := row_to_json(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_details := json_build_object(
            'anterior', row_to_json(OLD),
            'nuevo', row_to_json(NEW)
        )::TEXT;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_details := row_to_json(OLD);
    END IF;

    -- Insertar en auditoria
    INSERT INTO auditoria (id_usuario, tabla_afectada, accion, detalles, fecha_accion)
    VALUES (v_user_id, TG_TABLE_NAME, v_action, v_details, CURRENT_TIMESTAMP);

    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS PARA TABLA: USUARIO
-- ============================================
CREATE TRIGGER trg_audit_usuario_insert
AFTER INSERT ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_usuario_update
AFTER UPDATE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_usuario_delete
AFTER DELETE ON usuario
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- TRIGGERS PARA TABLA: CLIENTE
-- ============================================
CREATE TRIGGER trg_audit_cliente_insert
AFTER INSERT ON cliente
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_cliente_update
AFTER UPDATE ON cliente
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_cliente_delete
AFTER DELETE ON cliente
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- TRIGGERS PARA TABLA: PRODUCTO
-- ============================================
CREATE TRIGGER trg_audit_producto_insert
AFTER INSERT ON producto
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_producto_update
AFTER UPDATE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_producto_delete
AFTER DELETE ON producto
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- TRIGGERS PARA TABLA: PEDIDO
-- ============================================
CREATE TRIGGER trg_audit_pedido_insert
AFTER INSERT ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_pedido_update
AFTER UPDATE ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_pedido_delete
AFTER DELETE ON pedido
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- TRIGGERS PARA TABLA: SEDE
-- ============================================
CREATE TRIGGER trg_audit_sede_insert
AFTER INSERT ON sede
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_sede_update
AFTER UPDATE ON sede
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

CREATE TRIGGER trg_audit_sede_delete
AFTER DELETE ON sede
FOR EACH ROW EXECUTE FUNCTION fn_audit_log();

-- ============================================
-- RESUMEN DE TABLAS CREADAS
-- ============================================
-- 1. SEDE (2 registros)
-- 2. CLIENTE (5 registros)
-- 3. USUARIO (3 registros) - Con relación a SEDE
-- 4. PRODUCTO (5 registros) - Con relación a SEDE
-- 5. PEDIDO (5 registros)
-- 6. DETALLE_PEDIDO (5 registros)
-- 7. INVENTARIO (5 registros) - Con relación a SEDE
-- 8. AUDITORIA (vacía, se llena al usar el sistema)
--
-- Total de tablas: 8
-- Total de registros de prueba: 30
-- Total de triggers: 15 (auditoría automática)
-- Relaciones principales:
--   - usuario.id_sede -> sede.id_sede
--   - producto.id_sede -> sede.id_sede
--   - inventario.id_sede -> sede.id_sede
--   - inventario.codigo_producto -> producto.codigo_producto
--   - pedido.id_pedido <- detalle_pedido.id_pedido
--   - auditoria.id_usuario -> usuario.id_usuario
-- ============================================
