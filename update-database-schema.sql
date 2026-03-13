-- Script para actualizar la base de datos existente
-- Agrega las columnas faltantes a la tabla usuario

-- Conectarse a la base de datos Systemsware primero
-- \c Systemsware

-- Agregar columnas faltantes a la tabla usuario
ALTER TABLE usuario 
ADD COLUMN IF NOT EXISTS direccion VARCHAR(255),
ADD COLUMN IF NOT EXISTS numero_cel VARCHAR(15),
ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'usuario' 
AND column_name IN ('direccion', 'numero_cel', 'ciudad')
ORDER BY column_name;
