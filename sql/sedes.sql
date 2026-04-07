-- Tabla Sede
CREATE TABLE IF NOT EXISTS sede (
    id_sede          INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre           VARCHAR(100) NOT NULL,
    ciudad           VARCHAR(100) NOT NULL,
    direccion        VARCHAR(255),
    telefono         VARCHAR(20),
    email            VARCHAR(100),
    encargado        VARCHAR(100),
    activo           BOOLEAN      DEFAULT TRUE,
    fecha_creacion   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Datos de prueba para sedes
INSERT INTO sede (nombre, ciudad, direccion, telefono, email, encargado, activo)
VALUES
  ('Sede Principal', 'Bogotá', 'Carrera 5 #45-67, Centro comercial Platino', '(1) 2345-6789', 'bogota@systemsware.com', 'Juan García', TRUE),
  ('Sede Medellín', 'Medellín', 'Calle 10 #30-50, Parque Bolívar', '(4) 4567-8901', 'medellin@systemsware.com', 'María López', TRUE),
  ('Sede Cali', 'Cali', 'Avenida 6 #20-40, Zona Rosa', '(2) 3456-7890', 'cali@systemsware.com', 'Carlos Rodríguez', TRUE),
  ('Sede Barranquilla', 'Barranquilla', 'Boulevard 53 #45-60, Centro', '(5) 3456-7890', 'barranquilla@systemsware.com', 'Ana Martínez', TRUE),
  ('Sede Santa Marta', 'Santa Marta', 'Carrera 1 #12-34, Frente al mar', '(5) 4321-0987', 'santamarta@systemsware.com', 'Pedro Sánchez', TRUE);
