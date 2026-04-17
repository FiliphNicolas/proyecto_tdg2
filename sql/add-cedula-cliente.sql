-- ============================================
-- Corrección: Agregar columna CEDULA a tabla CLIENTE
-- ============================================
-- Ejecutar: psql -U postgres -d systemsware -f sql/add-cedula-cliente.sql

-- Agregar columna cedula si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cliente' AND column_name = 'cedula'
    ) THEN
        ALTER TABLE cliente ADD COLUMN cedula VARCHAR(20) UNIQUE;
        RAISE NOTICE 'Columna cedula agregada exitosamente a tabla cliente';
    ELSE
        RAISE NOTICE 'Columna cedula ya existe en tabla cliente';
    END IF;
END $$;

-- Crear índice para búsqueda rápida por cedula
CREATE INDEX IF NOT EXISTS idx_cliente_cedula ON cliente(cedula);

-- Agregar constraint para validar que cedula sea válida
-- (Solo permitir números, letras y guiones - formato cédula típico)
ALTER TABLE cliente ADD CONSTRAINT chk_cedula_format 
CHECK (cedula IS NULL OR cedula ~ '^[A-Za-z0-9\-]+$')
ON CONFLICT DO NOTHING;

-- Mostrar estructura de la tabla cliente
\d cliente

SELECT 'Migración completada: Cédula agregada a tabla cliente' AS resultado;
