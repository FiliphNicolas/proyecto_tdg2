-- Agregar cédulas a los clientes de prueba (datos simulados colombianos)
UPDATE cliente SET cedula = '1234567890' WHERE id_cliente = 1; -- Juan García
UPDATE cliente SET cedula = '9876543210' WHERE id_cliente = 2; -- María López
UPDATE cliente SET cedula = '5555666678' WHERE id_cliente = 3; -- Carlos Rodríguez
UPDATE cliente SET cedula = '4444333222' WHERE id_cliente = 4; -- Ana Martínez
UPDATE cliente SET cedula = '7777888899' WHERE id_cliente = 5; -- Pedro Sánchez
UPDATE cliente SET cedula = '2222111100' WHERE id_cliente = 6; -- Laura Fernández
UPDATE cliente SET cedula = '9999888877' WHERE id_cliente = 7; -- David Torres

-- Verificar que las cedulas fueron agregadas
SELECT id_cliente, nombre, apellido, cedula, email FROM cliente WHERE cedula IS NOT NULL ORDER BY id_cliente;
