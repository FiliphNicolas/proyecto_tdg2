-- base de datos systemsware
CREATE DATABASE Systemsware;

--\c Systemsware 
-- psql shell

-- Tabla Cliente
CREATE TABLE cliente (
    id_cliente      INT PRIMARY KEY NOT NULL,          -- ✅ NUEVO CAMPO
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    telefono        VARCHAR(15),
    direccion       VARCHAR(255),
    fecha_registro  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuario
CREATE TABLE usuario (
    id_usuario      INT PRIMARY KEY NOT NULL,
    nombre_usuario  VARCHAR(50)  UNIQUE NOT NULL,
    contrasena      VARCHAR(255) NOT NULL,
    email           VARCHAR(100) UNIQUE NOT NULL,
    rol             VARCHAR(50)  DEFAULT 'empleado',
    activo          BOOLEAN      DEFAULT TRUE,
    direccion       VARCHAR(255),
    numero_cel      VARCHAR(15),
    ciudad          VARCHAR(100),
    fecha_creacion  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Producto  ✅ id_producto → codigo_producto VARCHAR(30)
CREATE TABLE producto (
    codigo_producto VARCHAR(30)  NOT NULL PRIMARY KEY,     -- ✅ RENOMBRADO Y TIPO CAMBIADO
    nombre          VARCHAR(150) NOT NULL,
    descripcion     VARCHAR(500),
    precio          NUMERIC(10,2) NOT NULL,
    cantidad_stock  INT           DEFAULT 0,
    categoria       VARCHAR(100),
    fecha_creacion  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Pedido
CREATE TABLE pedido (
    id_pedido       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_pedido   VARCHAR(50)  UNIQUE NOT NULL,
    nombre_cliente  VARCHAR(255) NOT NULL,
    email_cliente   VARCHAR(255) NOT NULL,
    telefono_cliente VARCHAR(50),
    estado_pedido   VARCHAR(50)  NOT NULL DEFAULT 'pending',
    fecha_pedido    DATE         NOT NULL,
    monto_total     DECIMAL(10,2) NOT NULL,
    direccion_envio TEXT,
    notas_pedido    TEXT,
    fecha_creacion  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo para pedidos
INSERT INTO pedido (numero_pedido, nombre_cliente, email_cliente, telefono_cliente, estado_pedido, fecha_pedido, monto_total, direccion_envio, notas_pedido) VALUES
('PED-001', 'Juan Pérez', 'juan.perez@email.com', '123-456-7890', 'delivered', '2026-03-15', 1500.00, 'Calle Principal 123, Ciudad', 'Entregar en horario laboral'),
('PED-002', 'María García', 'maria.garcia@email.com', '987-654-3210', 'processing', '2026-03-16', 2800.50, 'Avenida Secundaria 456, Pueblo', 'Cliente prefiere contacto por email'),
('PED-003', 'Carlos Rodríguez', 'carlos.rodriguez@email.com', '555-123-4567', 'shipped', '2026-03-17', 950.75, 'Plaza Central 789, Villa', 'Urgente - cumpleaños'),
('PED-004', 'Ana Martínez', 'ana.martinez@email.com', '333-999-8888', 'pending', '2026-03-18', 3200.00, 'Bulevar Nuevo 321, Ciudad Nueva', 'Requiere factura fiscal'),
('PED-005', 'Luis Sánchez', 'luis.sanchez@email.com', '777-555-3333', 'cancelled', '2026-03-19', 750.25, 'Calle Antigua 654, Pueblo Viejo', 'Cancelado por cliente');

-- Tabla Detalle_Pedido  ✅ corregido "INT VARCHAR(50)" → solo INT
CREATE TABLE detalle_pedido (
    codigo_detalle  VARCHAR(10)  NOT NULL PRIMARY KEY,
    id_pedido       INT          NOT NULL REFERENCES Pedido(id_pedido),
    codigo_producto VARCHAR(30)  NOT NULL REFERENCES Producto(codigo_producto), -- ✅ FK actualizada
    cantidad        INT          NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL
);

-- Tabla Inventario  ✅ FK corregida a Producto(codigo_producto)
CREATE TABLE inventario (
    id_movimiento    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_producto  VARCHAR(30)  NOT NULL REFERENCES Producto(codigo_producto), -- ✅ FK corregida
    tipo_movimiento  VARCHAR(50)  NOT NULL,
    cantidad         INT          NOT NULL,
    fecha_movimiento TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    descripcion      VARCHAR(255)
);

-- Tabla Auditoria
CREATE TABLE auditoria (
    id_auditoria   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     INT         NOT NULL REFERENCES Usuario(id_usuario),
    tabla_afectada VARCHAR(50),
    accion         VARCHAR(50),
    fecha_accion   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    detalles       TEXT
);