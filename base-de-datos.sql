-- base de datos systemsware
CREATE DATABASE Systemsware;

--\c Systemsware 
-- psql shell

-- Tabla Cliente
CREATE TABLE cliente (
    id_cliente      SERIAL PRIMARY KEY,          -- ✅ NUEVO CAMPO
    nombre          VARCHAR(100) NOT NULL,
    apellido        VARCHAR(100) NOT NULL,
    email           VARCHAR(100) UNIQUE,
    telefono        VARCHAR(15),
    direccion       VARCHAR(255),
    fecha_registro  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuario
CREATE TABLE usuario (
    id_usuario      SERIAL PRIMARY KEY,
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
    id_pedido       SERIAL PRIMARY KEY,
    id_cliente      INT          NOT NULL REFERENCES Cliente(id_cliente),
    id_usuario      INT          NOT NULL REFERENCES Usuario(id_usuario),
    fecha_pedido    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    total           NUMERIC(10,2),
    estado          VARCHAR(50)  DEFAULT 'pendiente',
    codigo_detalle  VARCHAR(10)  NOT NULL
);

-- Tabla Detalle_Pedido  ✅ corregido "INT VARCHAR(50)" → solo INT
CREATE TABLE detalle_Pedido (
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