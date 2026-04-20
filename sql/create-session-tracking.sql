-- Tabla para tracking de sesiones activas
-- Previene sobrecarga de cuenta por múltiples inicios de sesión simultáneos

CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES "usuario"(id_usuario) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_user_sessions_usuario ON user_sessions(id_usuario);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Límite de sesiones concurrentes por usuario (máximo 3)
CREATE OR REPLACE FUNCTION check_session_limit()
RETURNS TRIGGER AS $$
DECLARE
    active_session_count INTEGER;
    max_sessions INTEGER := 3;
BEGIN
    -- Contar sesiones activas y no expiradas para este usuario
    SELECT COUNT(*) INTO active_session_count
    FROM user_sessions 
    WHERE id_usuario = NEW.id_usuario 
    AND is_active = true 
    AND expires_at > NOW();
    
    -- Si excede el límite, desactivar la sesión más antigua
    IF active_session_count >= max_sessions THEN
        UPDATE user_sessions 
        SET is_active = false 
        WHERE id_usuario = NEW.id_usuario 
        AND is_active = true 
        AND expires_at > NOW()
        ORDER BY created_at ASC 
        LIMIT 1;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para aplicar el límite de sesiones
DROP TRIGGER IF EXISTS enforce_session_limit ON user_sessions;
CREATE TRIGGER enforce_session_limit
    BEFORE INSERT ON user_sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_session_limit();

-- Función para limpiar sesiones expiradas automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions 
    WHERE (expires_at < NOW() OR is_active = false)
    AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentario sobre la configuración
COMMENT ON TABLE user_sessions IS 'Control de sesiones activas para prevenir sobrecarga de cuentas';
COMMENT ON COLUMN user_sessions.token_hash IS 'Hash del token JWT para identificación única';
COMMENT ON COLUMN user_sessions.expires_at IS 'Fecha de expiración de la sesión';
