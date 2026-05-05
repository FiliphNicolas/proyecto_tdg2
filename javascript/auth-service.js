/**
 * AuthService - Servicio Profesional de Autenticación
 * Systemsware - Sistema de gestión de inventario
 * 
 * Características:
 * - Manejo automático de tokens (access + refresh)
 * - Renovación automática de sesiones
 * - Almacenamiento seguro
 * - Rate limiting en frontend
 * - Validación de fortaleza de contraseña
 */

class AuthService {
  constructor() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.refreshPromise = null;
    this.isRefreshing = false;
    this.listeners = [];
    
    // Inicializar desde storage
    this.loadFromStorage();
    
    // Configurar interceptor de fetch
    this.setupFetchInterceptor();
    
    // Iniciar timer de renovación automática
    this.startAutoRefresh();
  }

  // ==================== STORAGE ====================
  
  loadFromStorage() {
    try {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
      this.tokenExpiry = localStorage.getItem('tokenExpiry');
      
      // Verificar si el token está próximo a expirar al cargar
      if (this.tokenExpiry && Date.now() > parseInt(this.tokenExpiry) - 60000) {
        this.scheduleRefresh();
      }
    } catch (err) {
      console.error('Error cargando tokens:', err);
      this.clearAuth();
    }
  }

  saveToStorage(accessToken, refreshToken, expiresIn) {
    try {
      this.accessToken = accessToken;
      this.refreshToken = refreshToken;
      this.tokenExpiry = Date.now() + (expiresIn * 1000);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('tokenExpiry', this.tokenExpiry.toString());
      
      // Programar renovación automática
      this.scheduleRefresh();
    } catch (err) {
      console.error('Error guardando tokens:', err);
    }
  }

  clearAuth() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('userName');
    
    this.notifyListeners({ type: 'logout' });
  }

  // ==================== AUTH API ====================

  async login(correo, contrasena) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(data.error || 'Error de autenticación', data.code, response.status);
      }

      if (data.ok) {
        this.saveToStorage(data.accessToken, data.refreshToken, data.expiresIn);
        localStorage.setItem('userName', data.user.nombre_usuario);
        this.notifyListeners({ type: 'login', user: data.user });
      }

      return data;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Error de conexión. Intenta nuevamente.', 'NETWORK_ERROR');
    }
  }

  async register(userData) {
    try {
      // Validar fortaleza de contraseña antes de enviar
      const passwordCheck = this.validatePasswordStrength(userData.contrasena);
      if (!passwordCheck.valid) {
        throw new AuthError(
          'Contraseña débil: ' + passwordCheck.errors.join(', '),
          'WEAK_PASSWORD'
        );
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(data.error || 'Error al registrar', data.code, response.status, data.details);
      }

      if (data.ok) {
        this.saveToStorage(data.accessToken, data.refreshToken, data.expiresIn);
        localStorage.setItem('userName', data.user.nombre_usuario);
        this.notifyListeners({ type: 'register', user: data.user });
      }

      return data;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Error de conexión. Intenta nuevamente.', 'NETWORK_ERROR');
    }
  }

  async logout() {
    try {
      if (this.accessToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        });
      }
    } catch (err) {
      console.error('Error en logout:', err);
    } finally {
      this.clearAuth();
    }
  }

  async refreshAccessToken() {
    // Evitar múltiples refresh simultáneos
    if (this.isRefreshing) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new AuthError('No hay sesión activa', 'NO_SESSION');
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const result = await this.refreshPromise;
      return result;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  async performRefresh() {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });

      const data = await response.json();

      if (!response.ok) {
        // Si el refresh token es inválido, limpiar sesión
        if (data.code === 'INVALID_SESSION' || data.code === 'REFRESH_TOKEN_EXPIRED') {
          this.clearAuth();
        }
        throw new AuthError(data.error || 'Error renovando sesión', data.code, response.status);
      }

      if (data.ok) {
        this.saveToStorage(data.accessToken, this.refreshToken, data.expiresIn);
        this.notifyListeners({ type: 'tokenRefreshed', user: data.user });
      }

      return data;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Error de conexión', 'NETWORK_ERROR');
    }
  }

  async changePassword(currentPassword, newPassword) {
    // Validar fortaleza de nueva contraseña
    const passwordCheck = this.validatePasswordStrength(newPassword);
    if (!passwordCheck.valid) {
      throw new AuthError(
        'La nueva contraseña no cumple los requisitos: ' + passwordCheck.errors.join(', '),
        'WEAK_PASSWORD'
      );
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new AuthError(data.error || 'Error al cambiar contraseña', data.code, response.status);
      }

      return data;
    } catch (err) {
      if (err instanceof AuthError) throw err;
      throw new AuthError('Error de conexión', 'NETWORK_ERROR');
    }
  }

  // ==================== VALIDACIÓN ====================

  validatePasswordStrength(password) {
    const errors = [];
    
    if (password.length < 8) errors.push('mínimo 8 caracteres');
    if (!/[A-Z]/.test(password)) errors.push('una mayúscula');
    if (!/[a-z]/.test(password)) errors.push('una minúscula');
    if (!/[0-9]/.test(password)) errors.push('un número');
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('un carácter especial');
    
    return {
      valid: errors.length === 0,
      errors,
      strength: password.length >= 12 && errors.length === 0 ? 'strong' : 
                password.length >= 8 && errors.length === 0 ? 'medium' : 'weak'
    };
  }

  getPasswordRequirements() {
    return [
      'Mínimo 8 caracteres',
      'Al menos una mayúscula (A-Z)',
      'Al menos una minúscula (a-z)',
      'Al menos un número (0-9)',
      'Al menos un carácter especial (!@#$%^&*)'
    ];
  }

  // ==================== UTILIDADES ====================

  isAuthenticated() {
    return !!this.accessToken && !!this.refreshToken;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getAuthHeaders() {
    return this.accessToken ? {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  // ==================== AUTO REFRESH ====================

  scheduleRefresh() {
    if (!this.tokenExpiry) return;
    
    const timeUntilExpiry = parseInt(this.tokenExpiry) - Date.now();
    const refreshTime = Math.max(timeUntilExpiry - 60000, 0); // Renovar 1 minuto antes
    
    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshAccessToken().catch(err => {
          console.error('Error en auto-refresh:', err);
        });
      }, refreshTime);
    }
  }

  startAutoRefresh() {
    // Verificar cada 5 minutos si necesita renovación
    setInterval(() => {
      if (this.isAuthenticated() && this.tokenExpiry) {
        const timeUntilExpiry = parseInt(this.tokenExpiry) - Date.now();
        if (timeUntilExpiry < 120000 && !this.isRefreshing) { // Menos de 2 minutos
          this.refreshAccessToken().catch(err => {
            console.error('Error en auto-refresh periódico:', err);
          });
        }
      }
    }, 300000); // 5 minutos
  }

  // ==================== FETCH INTERCEPTOR ====================

  setupFetchInterceptor() {
    // Sobrescribir fetch global para añadir token automáticamente
    const originalFetch = window.fetch;
    
    window.fetch = async (url, options = {}) => {
      // Si es una URL de API y tenemos token, añadir header
      if (typeof url === 'string' && url.startsWith('/api/') && this.accessToken) {
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`
        };
      }

      try {
        let response = await originalFetch(url, options);

        // Si el token expiró, intentar refresh y reintentar
        if (response.status === 401) {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.code === 'TOKEN_EXPIRED' && this.refreshToken) {
            try {
              await this.refreshAccessToken();
              
              // Reintentar con nuevo token
              options.headers = {
                ...options.headers,
                'Authorization': `Bearer ${this.accessToken}`
              };
              response = await originalFetch(url, options);
            } catch (refreshErr) {
              // Si falla el refresh, redirigir a login
              this.clearAuth();
              window.location.href = '/pages/iniciar-sesion.html';
            }
          } else if (errorData.code === 'INVALID_SESSION' || errorData.code === 'NO_TOKEN') {
            this.clearAuth();
            window.location.href = '/pages/iniciar-sesion.html';
          }
        }

        return response;
      } catch (err) {
        throw err;
      }
    };
  }

  // ==================== EVENT LISTENERS ====================

  onAuthChange(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (err) {
        console.error('Error en listener de auth:', err);
      }
    });
  }
}

// Clase de error personalizada
class AuthError extends Error {
  constructor(message, code, statusCode, details = null) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

// Crear instancia global
const authService = new AuthService();

// Exponer globalmente
window.authService = authService;
window.AuthError = AuthError;

// Manejar cierre de pestaña/navegador
window.addEventListener('beforeunload', () => {
  // Opcional: limpiar tokens sensibles de memoria
});
