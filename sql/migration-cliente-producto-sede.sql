-- Migración: Agregar id_sede a tablas cliente y producto

-- Verificar si cliente ya tiene id_sede, si no, agregarla
ALTER TABLE cliente
ADD COLUMN IF NOT EXISTS id_sede INT DEFAULT 1;

-- Agregar constraint si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'cliente' AND constraint_name = 'fk_cliente_sede'
    ) THEN
        ALTER TABLE cliente
        ADD CONSTRAINT fk_cliente_sede 
        FOREIGN KEY (id_sede) REFERENCES sede(id_sede) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_cliente_sede ON cliente(id_sede);

-- Verificar si producto ya tiene id_sede, si no, agregarla
ALTER TABLE producto
ADD COLUMN IF NOT EXISTS id_sede INT DEFAULT 1;

-- Agregar constraint si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'producto' AND constraint_name = 'fk_producto_sede'
    ) THEN
        ALTER TABLE producto
        ADD CONSTRAINT fk_producto_sede 
        FOREIGN KEY (id_sede) REFERENCES sede(id_sede) ON DELETE SET NULL;
    END IF;
END $$;

-- Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_producto_sede ON producto(id_sede);

-- Actualizar registros existentes a DEFAULT 1 (Sede Principal)
UPDATE cliente SET id_sede = 1 WHERE id_sede IS NULL;
UPDATE producto SET id_sede = 1 WHERE id_sede IS NULL;

-- Confirmación
SELECT 'Migración completada: id_sede agregado a cliente y producto' as resultado;
