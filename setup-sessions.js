const db = require('./javascript/databasepg');

async function setupSessionTracking() {
  try {
    console.log('Configurando sistema de tracking de sesiones...');
    
    // Crear tabla de sesiones
    await db.query(`
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
      )
    `);
    
    // Crear índices
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_usuario ON user_sessions(id_usuario)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token_hash)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active)');
    
    // Crear función para límite de sesiones
    await db.query(`
      CREATE OR REPLACE FUNCTION check_session_limit()
      RETURNS TRIGGER AS $$
      DECLARE
        active_session_count INTEGER;
        max_sessions INTEGER := 3;
      BEGIN
        SELECT COUNT(*) INTO active_session_count
        FROM user_sessions 
        WHERE id_usuario = NEW.id_usuario 
        AND is_active = true 
        AND expires_at > NOW();
        
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
      $$ LANGUAGE plpgsql
    `);
    
    // Crear trigger
    await db.query('DROP TRIGGER IF EXISTS enforce_session_limit ON user_sessions');
    await db.query(`
      CREATE TRIGGER enforce_session_limit
      BEFORE INSERT ON user_sessions
      FOR EACH ROW
      EXECUTE FUNCTION check_session_limit()
    `);
    
    // Crear función de limpieza
    await db.query(`
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
      $$ LANGUAGE plpgsql
    `);
    
    console.log('✅ Sistema de sesiones configurado exitosamente');
    console.log('📋 Características habilitadas:');
    console.log('   - Límite de 3 sesiones simultáneas por usuario');
    console.log('   - Limpieza automática de sesiones expiradas');
    console.log('   - Tracking de IP y User Agent');
    console.log('   - Desactivación automática de sesión más antigua');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error configurando sesiones:', error);
    process.exit(1);
  }
}

setupSessionTracking();
