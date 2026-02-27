--- base de datos systemsware
CREATE DATABASE Systemsware;

-- Tabla Cliente
-- Tabla Cliente
CREATE TABLE Cliente (
    id_cliente   SERIAL PRIMARY KEY,
    nombre       VARCHAR(100) NOT NULL,
    apellido     VARCHAR(100) NOT NULL,
    email        VARCHAR(100) UNIQUE,
    telefono     VARCHAR(15),
    direccion    VARCHAR(255),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Usuario
CREATE TABLE Usuario (
    id_usuario      SERIAL PRIMARY KEY,
    nombre_usuario  VARCHAR(50)  UNIQUE NOT NULL,
    contrasena      VARCHAR(255) NOT NULL,          -- sin tilde para evitar problemas de encoding
    email           VARCHAR(100) UNIQUE NOT NULL,
    rol             VARCHAR(50)  DEFAULT 'empleado',
    activo          BOOLEAN      DEFAULT TRUE,
    fecha_creacion  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Producto
CREATE TABLE Producto (
    id_producto    SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    descripcion    VARCHAR(500),
    precio         NUMERIC(10,2) NOT NULL,
    cantidad_stock INT           DEFAULT 0,
    categoria      VARCHAR(100),
    fecha_creacion TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- Tabla Pedido (relaciona Cliente, Usuario y Producto)
CREATE TABLE Pedido (
    id_pedido    SERIAL PRIMARY KEY,
    id_cliente   INT NOT NULL REFERENCES Cliente(id_cliente),
    id_usuario   INT NOT NULL REFERENCES Usuario(id_usuario),
    fecha_pedido TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    total        NUMERIC(10,2),
    estado       VARCHAR(50)   DEFAULT 'pendiente'
);

-- Tabla Detalle_Pedido
CREATE TABLE Detalle_Pedido (
    id_pedido       INT           NOT NULL REFERENCES Pedido(id_pedido),
    id_producto     INT           NOT NULL REFERENCES Producto(id_producto),
    cantidad        INT           NOT NULL,
    precio_unitario NUMERIC(10,2) NOT NULL
);

-- Tabla Inventario (para rastrear movimientos de stock)
CREATE TABLE Inventario (
    id_movimiento    INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_producto      INT          NOT NULL REFERENCES Producto(id_producto),
    tipo_movimiento  VARCHAR(50)  NOT NULL,
    cantidad         INT          NOT NULL,
    fecha_movimiento TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    descripcion      VARCHAR(255)
);

-- Tabla Auditoria (para registrar cambios de usuarios)
CREATE TABLE Auditoria (
    id_auditoria   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario     INT         NOT NULL REFERENCES Usuario(id_usuario),
    tabla_afectada VARCHAR(50),
    accion         VARCHAR(50),
    fecha_accion   TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    detalles       TEXT
);
