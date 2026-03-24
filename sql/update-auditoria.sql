-- Actualizar tabla auditoria para conexión Systemsware
-- Ejecutar este script en PostgreSQL

-- Agregar columna estado si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='auditoria' AND column_name='estado'
    ) THEN
        ALTER TABLE auditoria ADD COLUMN estado VARCHAR(20) DEFAULT 'exitoso';
        RAISE NOTICE 'Columna estado agregada a auditoria';
    END IF;
END $$;

-- Actualizar registros existentes con estado
UPDATE auditoria 
SET estado = 'exitoso' 
WHERE estado IS NULL;

-- Insertar registros de conexión recientes
INSERT INTO auditoria (id_usuario, tabla_afectada, accion, descripcion, estado, fecha_accion) VALUES
(1, 'systemsware', 'CONEXION', 'Usuario conectado a Systemsware', 'exitoso', CURRENT_TIMESTAMP - INTERVAL '5 minutes'),
(1, 'auditoria', 'SELECT', 'Consulta SELECT * FROM auditoria', 'exitoso', CURRENT_TIMESTAMP - INTERVAL '3 minutes'),
(1, 'conexion-auditoria', 'VIEW', 'Acceso a página de conexión auditoría', 'exitoso', CURRENT_TIMESTAMP - INTERVAL '1 minute');

-- Mostrar registros actualizados
SELECT 
    id_auditoria,
    id_usuario,
    tabla_afectada,
    accion,
    descripcion,
    estado,
    fecha_accion
FROM auditoria 
ORDER BY fecha_accion DESC 
LIMIT 10;
