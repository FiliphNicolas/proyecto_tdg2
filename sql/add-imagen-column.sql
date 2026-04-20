-- Agregar columna de imagen a la tabla de productos
-- Para soportar imágenes locales en lugar de URLs

-- Verificar si la columna ya existe
DO $$ 
BEGIN
    -- Verificar si la columna imagen ya existe en la tabla producto
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'producto' 
        AND column_name = 'imagen'
    ) THEN
        -- La columna ya existe, no hacer nada
        RAISE NOTICE 'La columna imagen ya existe en la tabla producto';
    ELSE
        -- Agregar la columna imagen a la tabla producto
        ALTER TABLE "producto" 
        ADD COLUMN imagen VARCHAR(500);
        
        RAISE NOTICE 'Columna imagen agregada exitosamente a la tabla producto';
    END IF;
END $$;

-- Actualizar algunos productos existentes con imágenes placeholder
UPDATE "producto" 
SET imagen = 'https://via.placeholder.com/300x200/28a745/FFFFFF?text=' || REPLACE(nombre, ' ', '+') 
WHERE imagen IS NULL AND nombre IS NOT NULL;

-- Comentario sobre la nueva columna
COMMENT ON COLUMN "producto".imagen IS 'Ruta de la imagen local del producto (ej: /images/products/product_1234567890_abc123.jpg)';
