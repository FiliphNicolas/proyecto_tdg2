-- Migración: Agregar columna token_type a user_sessions
-- Requerido para el sistema de refresh tokens

-- Agregar columna token_type
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS token_type VARCHAR(10) DEFAULT 'access';

-- Actualizar registros existentes
UPDATE user_sessions 
SET token_type = 'access' 
WHERE token_type IS NULL;

-- Agregar índice para consultas por tipo de token
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_type ON user_sessions(token_type);

-- Comentario sobre la columna
COMMENT ON COLUMN user_sessions.token_type IS 'Tipo de token: access (15min) o refresh (7días)';

-- Verificar la migración
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_sessions';
