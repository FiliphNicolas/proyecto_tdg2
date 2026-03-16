-- ============================================
-- DATOS DE PRUEBA PARA SYSTEMSWARE
-- ============================================

-- USUARIOS DE PRUEBA
-- Contraseña: "123456" (hasheada con bcrypt, salt 10)
-- Contraseña: "admin123" (hasheada con bcrypt, salt 10)

INSERT INTO usuario (id_usuario, nombre_usuario, contrasena, email, rol, activo) VALUES
(1,'admin', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'admin@systemsware.com', 'admin', true),
(2,'empleado1', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'empleado1@systemsware.com', 'empleado', true),
(3,'empleado2', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'empleado2@systemsware.com', 'empleado', true),
(4,'vendedor', '$2b$10$YOixghzuPvJLuNvjMZVH3OzDjPm6D2fGM8p8Y9K8G1U4L7Q9M3P8K', 'vendedor@systemsware.com', 'vendedor', true);

-- CLIENTES DE PRUEBA

INSERT INTO cliente (id_cliente, nombre, apellido, email, telefono, direccion) VALUES
(1,'Juan', 'García', 'juan.garcia@email.com', '3001234567', 'Calle 1 #123, Bogotá'),
(2,'María', 'López', 'maria.lopez@email.com', '3107654321', 'Carrera 5 #456, Medellín'),
(3,'Carlos', 'Rodríguez', 'carlos.r@email.com', '3209876543', 'Avenida 10 #789, Cali'),
(4,'Ana', 'Martínez', 'ana.m@email.com', '3145678901', 'Calle 20 #101, Barranquilla'),
(5,'Pedro', 'Sánchez', 'pedro.sanchez@email.com', '3176543210', 'Carrera 15 #202, Santa Marta');

-- PRODUCTOS DE PRUEBA

INSERT INTO producto (codigo_producto, nombre, descripcion, precio, cantidad_stock, categoria) VALUES
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

INSERT INTO pedido (id_pedido, id_cliente, id_usuario, total, estado, codigo_detalle) VALUES
(1,1, 1, 1650000.00, 'completado', 'PED-001-01'),
(2,2, 2, 2200000.00, 'en_proceso', 'PED-002-01'),
(3,3, 1, 800000.00, 'pendiente', 'PED-003-01');

-- DETALLES DE PEDIDOS

INSERT INTO detalle_pedido (codigo_detalle, id_pedido, codigo_producto, cantidad, precio_unitario) VALUES
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

INSERT INTO inventario (codigo_producto, tipo_movimiento, cantidad, descripcion) VALUES
('PROD-001', 'entrada', 20, 'Compra inicial de inventario'),
('PROD-002', 'entrada', 30, 'Compra a proveedor LG'),
('PROD-003', 'entrada', 50, 'Compra a proveedor mecánico'),
('PROD-004', 'entrada', 25, 'Compra a proveedor Logitech'),
('PROD-001', 'salida', 1, 'Venta pedido PED-001'),
('PROD-003', 'salida', 1, 'Venta pedido PED-001'),
('PROD-001', 'entrada', 20, 'Compra a proveedor Dell');

-- AUDITORÍA DE PRUEBA

INSERT INTO auditoria (id_usuario, tabla_afectada, accion, detalles) VALUES
(1, 'producto', 'INSERT', 'Se creó el producto Laptop Dell Inspiron 15'),
(1, 'producto', 'INSERT', 'Se creó el producto Monitor LG 24 pulgadas'),
(1, 'producto', 'INSERT', 'Se creó el producto Teclado Mecánico RGB'),
(1, 'producto', 'INSERT', 'Se creó el producto Mouse Logitech MX Master 3'),
(2, 'inventario', 'INSERT', 'Entrada de 20 unidades de PROD-001 - Laptop Dell'),
(2, 'inventario', 'INSERT', 'Entrada de 30 unidades de PROD-002 - Monitor LG'),
(2, 'inventario', 'INSERT', 'Entrada de 50 unidades de PROD-003 - Teclado Mecánico'),
(2, 'inventario', 'INSERT', 'Entrada de 25 unidades de PROD-004 - Mouse Logitech'),
(3, 'inventario', 'INSERT', 'Salida de 1 unidad de PROD-001 - Venta PED-001'),
(3, 'inventario', 'INSERT', 'Salida de 1 unidad de PROD-003 - Venta PED-001'),
(2, 'inventario', 'INSERT', 'Entrada de 20 unidades de PROD-001 - Compra Dell'),
(1, 'usuario', 'INSERT', 'Se creó el usuario admin@systemsware.com'),
(1, 'usuario', 'INSERT', 'Se creó el usuario empleado1@systemsware.com'),
(1, 'usuario', 'INSERT', 'Se creó el usuario empleado2@systemsware.com'),
(1, 'usuario', 'INSERT', 'Se creó el usuario vendedor@systemsware.com');

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
