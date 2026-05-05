-- Tabla para tokens de recuperación de contraseña
-- Los tokens son de un solo uso y expiran en 1 hora

CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES "usuario"(id_usuario) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(id_usuario)
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(id_usuario);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_hash ON password_reset_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires ON password_reset_tokens(expires_at);

-- Comentarios
COMMENT ON TABLE password_reset_tokens IS 'Tokens para recuperación de contraseña (un solo uso, 1 hora de validez)';
COMMENT ON COLUMN password_reset_tokens.token_hash IS 'Hash SHA256 del token original (nunca almacenar el token plano)';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Fecha de expiración del token (1 hora desde creación)';

-- Función para limpiar tokens expirados
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Verificar la tabla creada
SELECT 'Tabla password_reset_tokens creada exitosamente' as status;
