-- ============================================
-- DATOS DE PRUEBA PARA SYSTEMSWARE
-- ============================================

-- USUARIOS DE PRUEBA
-- Contraseña: "123456" (hasheada con bcrypt, salt 10)
-- Contraseña: "admin123" (hasheada con bcrypt, salt 10)

INSERT INTO Usuario (nombre_usuario, contrasena, email, rol, activo) VALUES
('admin', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'admin@systemsware.com', 'admin', true),
('empleado1', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'empleado1@systemsware.com', 'empleado', true),
('empleado2', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'empleado2@systemsware.com', 'empleado', true),
('vendedor', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'vendedor@systemsware.com', 'vendedor', true);

-- CLIENTES DE PRUEBA

INSERT INTO Cliente (nombre, apellido, email, telefono, direccion) VALUES
('Juan', 'García', 'juan.garcia@email.com', '3001234567', 'Calle 1 #123, Bogotá'),
('María', 'López', 'maria.lopez@email.com', '3107654321', 'Carrera 5 #456, Medellín'),
('Carlos', 'Rodríguez', 'carlos.r@email.com', '3209876543', 'Avenida 10 #789, Cali'),
('Ana', 'Martínez', 'ana.m@email.com', '3145678901', 'Calle 20 #101, Barranquilla'),
('Pedro', 'Sánchez', 'pedro.sanchez@email.com', '3176543210', 'Carrera 15 #202, Santa Marta');

-- PRODUCTOS DE PRUEBA

INSERT INTO Producto (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria) VALUES
('PROD-001', 'Laptop Dell Inspiron 15', 'Laptop 15 pulgadas, Intel i5, 8GB RAM, 256GB SSD', 1200000.00, 15, 'Computadores'),
('PROD-002', 'Monitor LG 24 pulgadas', 'Monitor Full HD 1920x1080, IPS, 60Hz', 450000.00, 25, 'Monitores'),
('PROD-003', 'Teclado Mecánico RGB', 'Teclado mecánico con switches azules, retroiluminación RGB', 180000.00, 40, 'Periféricos'),
('PROD-004', 'Mouse Logitech MX Master 3', 'Mouse inalámbrico profesional, precisión 8K', 200000.00, 20, 'Periféricos'),
('PROD-005', 'Headset HyperX Cloud II', 'Audífonos gaming con micrófono, 7.1 surround', 350000.00, 12, 'Audio'),
('PROD-006', 'Webcam Logitech 4K', 'Cámara web 4K con auto-enfoque', 280000.00, 18, 'Periféricos'),
('PROD-007', 'Cable HDMI 2.1', 'Cable HDMI 2.1 de 3 metros, soporta 4K@120Hz', 45000.00, 100, 'Cables'),
('PROD-008', 'Adaptador USB-C Hub', 'Hub USB-C 7 en 1 con HDMI, USB 3.0 y carga rápida', 120000.00, 30, 'Adaptadores'),
('PROD-009', 'SSD Externo 1TB Samsung', 'Disco duro externo SSD 1TB, USB 3.1, portátil', 550000.00, 8, 'Almacenamiento'),
('PROD-010', 'Mousepad Gaming XXL', 'Mousepad grande 80x30cm con base antideslizante', 85000.00, 50, 'Accesorios'),
('PROD-011', 'Agrar Producto Nuevo', 'Producto agregado para prueba del sistema', 999999.99, 5, 'Prueba'),
('PROD-012', 'Impresora Laser HP', 'Impresora láser monocromática, 30ppm, WiFi', 850000.00, 25, 'Impresoras'),
('PROD-013', 'Router WiFi 6', 'Router inalámbrico 6GHz, 4 puertos Gigabit', 650000.00, 15, 'Redes'),
('PROD-014', 'Silla Gaming Ergonómica', 'Silla gaming con soporte lumbar, ajuste de altura', 1200000.00, 8, 'Mobiliario'),
('PROD-015', 'Disco Duro Externo 2TB', 'Disco duro externo 2TB USB 3.0', 450000.00, 12, 'Almacenamiento');

-- PEDIDOS DE PRUEBA

INSERT INTO Pedido (id_cliente, id_usuario, total, estado, codigo_detalle) VALUES
(1, 1, 1650000.00, 'completado', 'PED-001-01'),
(2, 2, 2200000.00, 'en_proceso', 'PED-002-01'),
(3, 1, 800000.00, 'pendiente', 'PED-003-01');

-- DETALLES DE PEDIDOS

INSERT INTO Detalle_Pedido (codigo_detalle, id_pedido, codigo_producto, cantidad, precio_unitario) VALUES
('PED-001-01', 1, 'PROD-001', 1, 1200000.00),
('PED-001-02', 1, 'PROD-003', 1, 180000.00),
('PED-001-03', 1, 'PROD-004', 1, 200000.00),
('PED-001-04', 1, 'PROD-007', 2, 90000.00),
('PED-002-01', 2, 'PROD-002', 2, 900000.00),
('PED-002-02', 2, 'PROD-005', 1, 350000.00),
('PED-002-03', 2, 'PROD-009', 1, 550000.00),
('PED-002-04', 2, 'PROD-006', 1, 280000.00),
('PED-003-01', 3, 'PROD-001', 1, 1200000.00),
('PED-003-02', 3, 'PROD-008', 1, 120000.00),
('PED-003-03', 3, 'PROD-010', 3, 255000.00);

-- MOVIMIENTOS DE INVENTARIO

INSERT INTO Inventario (codigo_producto, tipo_movimiento, cantidad, descripcion) VALUES
('PROD-001', 'entrada', 20, 'Compra a proveedor Dell'),
('PROD-002', 'entrada', 30, 'Compra a proveedor LG'),
('PROD-003', 'entrada', 50, 'Compra a proveedor mecánico'),
('PROD-001', 'salida', 1, 'Venta pedido PED-001'),
('PROD-003', 'salida', 1, 'Venta pedido PED-001'),
('PROD-004', 'salida', 1, 'Venta pedido PED-001'),
('PROD-002', 'salida', 2, 'Venta pedido PED-002'),
('PROD-005', 'salida', 1, 'Venta pedido PED-002'),
('PROD-009', 'salida', 1, 'Venta pedido PED-002'),
('PROD-006', 'salida', 1, 'Venta pedido PED-002'),
('PROD-001', 'ajuste', 2, 'Devolución de cliente');

-- ============================================
-- CREDENCIALES DE PRUEBA
-- ============================================
-- Usuario: admin
-- Correo: admin@systemsware.com
-- Contraseña: 123456
--
-- Usuario: empleado1
-- Correo: empleado1@systemsware.com
-- Contraseña: 123456
--
-- Usuario: empleado2
-- Correo: empleado2@systemsware.com
-- Contraseña: 123456
--
-- Usuario: vendedor
-- Correo: vendedor@systemsware.com
-- Contraseña: 123456
-- ============================================
