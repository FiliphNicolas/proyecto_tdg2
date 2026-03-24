// session-timeout.js - Manejo de timeout de sesión
class SessionManager {
    constructor() {
        this.sessionTimeout = 10 * 60 * 1000; // 10 minutos
        this.warningTimeout = 9 * 60 * 1000; // 9 minutos para advertencia
        this.warningShown = false;
        this.lastActivity = Date.now();
        this.timeoutTimer = null;
        this.warningTimer = null;
        
        // Obtener tiempo de login desde localStorage
        const loginTime = localStorage.getItem('loginTime');
        if (loginTime) {
            this.lastActivity = parseInt(loginTime);
        }
        
        this.init();
    }

    init() {
        // Detectar actividad del usuario
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'].forEach(event => {
            document.addEventListener(event, () => this.updateActivity());
        });

        // Iniciar monitoreo
        this.startMonitoring();
        
        // Interceptar respuestas de API para detectar timeout
        this.interceptAPIRequests();
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.warningShown = false;
        this.resetTimers();
    }

    startMonitoring() {
        this.resetTimers();
    }

    resetTimers() {
        // Limpiar timers existentes
        if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
        if (this.warningTimer) clearTimeout(this.warningTimer);

        // Timer para advertencia (9 minutos)
        this.warningTimer = setTimeout(() => {
            this.showWarning();
        }, this.warningTimeout);

        // Timer para cierre de sesión (10 minutos)
        this.timeoutTimer = setTimeout(() => {
            this.forceLogout();
        }, this.sessionTimeout);
    }

    showWarning() {
        if (this.warningShown) return;
        this.warningShown = true;

        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #ff9800;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        message.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <div>
                    <strong>Sesión por expirar</strong><br>
                    <small>Tu sesión expirará en 1 minuto por inactividad.</small>
                </div>
            </div>
            <button onclick="sessionManager.extendSession()" style="
                background: white;
                color: #ff9800;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                margin-top: 10px;
                cursor: pointer;
                font-weight: bold;
            ">Extender sesión</button>
        `;

        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);

        document.body.appendChild(message);

        // Auto-remover después de 50 segundos
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 50000);
    }

    extendSession() {
        // Remover advertencia si existe
        const warning = document.querySelector('div[style*="position: fixed"][style*="background: #ff9800"]');
        if (warning) warning.remove();

        // Actualizar actividad
        this.updateActivity();
        
        // Mostrar confirmación
        this.showNotification('Sesión extendida', 'Tu sesión ha sido extendida por 10 minutos más.');
    }

    showNotification(title, message) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4caf50;
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            font-family: Arial, sans-serif;
            max-width: 300px;
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                <div>
                    <strong>${title}</strong><br>
                    <small>${message}</small>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // Auto-remover después de 3 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    forceLogout() {
        // Limpiar tokens y tiempo de login
        localStorage.removeItem('authToken');
        localStorage.removeItem('userName');
        localStorage.removeItem('loginTime');
        sessionStorage.removeItem('authToken');
        
        // Mostrar mensaje de cierre
        const logoutMessage = document.createElement('div');
        logoutMessage.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            font-family: Arial, sans-serif;
            text-align: center;
        `;
        logoutMessage.innerHTML = `
            <div style="background: white; color: #333; padding: 40px; border-radius: 12px; max-width: 400px;">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="#f44336" style="margin-bottom: 20px;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
                <h2>Sesión Expirada</h2>
                <p>Tu sesión ha expirado por inactividad de 10 minutos.</p>
                <p>Serás redirigido a la página de inicio de sesión...</p>
            </div>
        `;

        document.body.appendChild(logoutMessage);

        // Redirigir después de 3 segundos
        setTimeout(() => {
            window.location.href = '/iniciar-sesion.html';
        }, 3000);
    }

    interceptAPIRequests() {
        // Guardar el fetch original
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                
                // Verificar si la respuesta indica timeout de sesión
                if (response.status === 401) {
                    const clonedResponse = response.clone();
                    try {
                        const data = await clonedResponse.json();
                        if (data.code === 'SESSION_TIMEOUT') {
                            this.forceLogout();
                            return response;
                        }
                    } catch (e) {
                        // Si no puede parsear JSON, continuar normalmente
                    }
                }
                
                return response;
            } catch (error) {
                return originalFetch(...args);
            }
        };
    }
}

// Crear instancia global
const sessionManager = new SessionManager();

// Exportar para uso en otros scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SessionManager;
}
