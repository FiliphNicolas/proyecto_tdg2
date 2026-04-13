// Componente de Modales de Autenticación - Systemsware
// Uso: 
// 1. Incluir este script en tu página
// 2. Llamar a openAuthModal('login') o openAuthModal('register')

class AuthModals {
    constructor() {
        this.init();
    }

    init() {
        // Crear el HTML de los modales si no existe
        if (!document.getElementById('authModal')) {
            this.createModals();
        }
        this.attachEventListeners();
    }

    createModals() {
        const modalHTML = `
            <div id="authModal" class="modal-overlay">
                <div class="modal-content">
                    <button class="modal-close" onclick="authModals.close()">&times;</button>
                    
                    <div class="modal-tabs">
                        <button class="modal-tab active" data-tab="login">Iniciar Sesión</button>
                        <button class="modal-tab" data-tab="register">Registrarse</button>
                    </div>
                    
                    <!-- Formulario de Inicio de Sesión -->
                    <div id="loginForm" class="modal-form active">
                        <h3> Bienvenido de vuelta</h3>
                        <p>Ingresa tus credenciales para acceder</p>
                        
                        <div id="loginSuccess" class="success-message" style="display: none;">
                            ¡Inicio de sesión exitoso! Redirigiendo...
                        </div>
                        
                        <form id="loginFormElement">
                            <div class="form-group">
                                <label for="loginEmail">Correo electrónico</label>
                                <input type="email" id="loginEmail" placeholder="correo@ejemplo.com" required>
                                <div class="error-message" id="loginEmailError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="loginPassword">Contraseña</label>
                                <div class="password-container">
                                    <input type="password" id="loginPassword" placeholder="Ingresa tu contraseña" required>
                                    <button type="button" class="password-toggle" data-field="loginPassword">
                                        <span class="eye-icon">?</span>
                                    </button>
                                </div>
                                <div class="error-message" id="loginPasswordError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label>
                                    <input type="checkbox" id="rememberMe">
                                    Recordarme
                                </label>
                            </div>
                            
                            <div class="error-message" id="loginError"></div>
                            
                            <button type="submit" class="btn-primary" id="loginBtn">
                                Iniciar Sesión
                                <span class="loading-spinner" id="loginSpinner"></span>
                            </button>
                        </form>
                    </div>
                    
                    <!-- Formulario de Registro -->
                    <div id="registerForm" class="modal-form">
                        <h3> Crear tu cuenta</h3>
                        <p>Completa tus datos para unirte a Systemsware</p>
                        
                        <div id="registerSuccess" class="success-message" style="display: none;">
                            ¡Cuenta creada exitosamente! Redirigiendo...
                        </div>
                        
                        <form id="registerFormElement">
                            <div class="form-group">
                                <label for="registerName">Nombre completo</label>
                                <input type="text" id="registerName" placeholder="Juan Pérez" required>
                                <div class="error-message" id="registerNameError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerEmail">Correo electrónico</label>
                                <input type="email" id="registerEmail" placeholder="correo@ejemplo.com" required>
                                <div class="error-message" id="registerEmailError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerPassword">Contraseña</label>
                                <div class="password-container">
                                    <input type="password" id="registerPassword" placeholder="Mínimo 6 caracteres" required>
                                    <button type="button" class="password-toggle" data-field="registerPassword">
                                        <span class="eye-icon">?</span>
                                    </button>
                                </div>
                                <div class="error-message" id="registerPasswordError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerConfirmPassword">Confirmar contraseña</label>
                                <div class="password-container">
                                    <input type="password" id="registerConfirmPassword" placeholder="Repite tu contraseña" required>
                                    <button type="button" class="password-toggle" data-field="registerConfirmPassword">
                                        <span class="eye-icon">?</span>
                                    </button>
                                </div>
                                <div class="error-message" id="registerConfirmPasswordError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerPhone">Número de celular</label>
                                <input type="tel" id="registerPhone" placeholder="3001234567" required>
                                <div class="error-message" id="registerPhoneError"></div>
                            </div>
                            
                            <div class="form-group">
                                <label for="registerAddress">Dirección</label>
                                <input type="text" id="registerAddress" placeholder="Calle Principal #123" required>
                                <div class="error-message" id="registerAddressError"></div>
                            </div>
                            
                            <div class="error-message" id="registerError"></div>
                            
                            <button type="submit" class="btn-primary" id="registerBtn">
                                Crear Cuenta
                                <span class="loading-spinner" id="registerSpinner"></span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        // Crear estilos CSS si no existen
        if (!document.getElementById('authModalsStyles')) {
            const style = document.createElement('style');
            style.id = 'authModalsStyles';
            style.textContent = `
                /* Estilos para Modales de Autenticación */
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                
                .modal-overlay.active {
                    display: flex;
                }
                
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    padding: 30px;
                    max-width: 400px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    position: relative;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                }
                
                .modal-close {
                    position: absolute;
                    top: 15px;
                    right: 15px;
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: #666;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                }
                
                .modal-close:hover {
                    color: #333;
                    background: #f0f0f0;
                }
                
                .modal-tabs {
                    display: flex;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #eee;
                }
                
                .modal-tab {
                    flex: 1;
                    padding: 12px;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-weight: 500;
                    color: #666;
                    transition: all 0.3s;
                    border-bottom: 2px solid transparent;
                }
                
                .modal-tab.active {
                    color: #007bff;
                    border-bottom-color: #007bff;
                }
                
                .modal-tab:hover {
                    color: #007bff;
                }
                
                .modal-form {
                    display: none;
                }
                
                .modal-form.active {
                    display: block;
                }
                
                .modal-form h3 {
                    margin-bottom: 8px;
                    color: #333;
                }
                
                .modal-form p {
                    margin-bottom: 20px;
                    color: #666;
                    font-size: 14px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }
                
                .form-group input[type="text"],
                .form-group input[type="email"],
                .form-group input[type="tel"],
                .form-group input[type="password"] {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.3s;
                }
                
                .form-group input:focus {
                    outline: none;
                    border-color: #007bff;
                }
                
                .password-container {
                    position: relative;
                }
                
                .password-toggle {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #666;
                    padding: 4px;
                }
                
                .password-toggle:hover {
                    color: #007bff;
                }
                
                .eye-icon {
                    font-size: 16px;
                }
                
                .error-message {
                    color: #dc3545;
                    font-size: 12px;
                    margin-top: 5px;
                    display: none;
                }
                
                .success-message {
                    background: #d4edda;
                    color: #155724;
                    padding: 12px;
                    border-radius: 6px;
                    margin-bottom: 15px;
                    text-align: center;
                    font-size: 14px;
                }
                
                .btn-primary {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: 500;
                    transition: background 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .btn-primary:hover {
                    background: #0056b3;
                }
                
                .btn-primary:disabled {
                    background: #ccc;
                    cursor: not-allowed;
                }
                
                .loading-spinner {
                    display: none;
                    width: 16px;
                    height: 16px;
                    border: 2px solid #f3f3f3;
                    border-top: 2px solid #007bff;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-left: 10px;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Insertar el HTML en el body
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    attachEventListeners() {
        // Event listeners para tabs
        document.querySelectorAll('.modal-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Event listeners para toggles de contraseña
        document.querySelectorAll('.password-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.togglePassword(e.target.dataset.field);
            });
        });

        // Event listener para cerrar modal haciendo clic fuera
        document.getElementById('authModal').addEventListener('click', (e) => {
            if (e.target.id === 'authModal') {
                this.close();
            }
        });

        // Event listener para cerrar con Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('authModal').classList.contains('active')) {
                this.close();
            }
        });

        // Event listeners para formularios
        document.getElementById('loginFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerFormElement').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });
    }

    open(tab = 'login') {
        document.getElementById('authModal').classList.add('active');
        this.switchTab(tab);
    }

    close() {
        document.getElementById('authModal').classList.remove('active');
        this.resetForms();
    }

    switchTab(tab) {
        // Actualizar tabs
        document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');
        
        // Actualizar formularios
        document.querySelectorAll('.modal-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tab + 'Form').classList.add('active');
    }

    togglePassword(fieldId) {
        const field = document.getElementById(fieldId);
        const icon = document.querySelector(`[data-field="${fieldId}"] .eye-icon`);
        
        if (field.type === 'password') {
            field.type = 'text';
            icon.textContent = '¡';
        } else {
            field.type = 'password';
            icon.textContent = '?';
        }
    }

    resetForms() {
        // Resetear formulario de login
        document.getElementById('loginFormElement').reset();
        document.getElementById('loginSuccess').style.display = 'none';
        document.querySelectorAll('#loginForm .error-message').forEach(err => err.style.display = 'none');
        
        // Resetear formulario de registro
        document.getElementById('registerFormElement').reset();
        document.getElementById('registerSuccess').style.display = 'none';
        document.querySelectorAll('#registerForm .error-message').forEach(err => err.style.display = 'none');
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.style.display = 'block';
    }

    hideError(elementId) {
        document.getElementById(elementId).style.display = 'none';
    }

    setLoading(formType, loading) {
        const btn = document.getElementById(formType + 'Btn');
        const spinner = document.getElementById(formType + 'Spinner');
        
        if (loading) {
            btn.disabled = true;
            spinner.style.display = 'inline-block';
        } else {
            btn.disabled = false;
            spinner.style.display = 'none';
        }
    }

    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    validatePhone(phone) {
        // Aceptar formatos colombianos (10 dígitos empezando con 3)
        const regex = /^3[0-9]{9}$/;
        return regex.test(phone.replace(/\s/g, ''));
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;
        
        // Resetear errores
        document.querySelectorAll('#loginForm .error-message').forEach(err => err.style.display = 'none');
        
        let valid = true;
        
        // Validar email
        if (!email) {
            this.showError('loginEmailError', 'El correo es obligatorio');
            valid = false;
        } else if (!this.validateEmail(email)) {
            this.showError('loginEmailError', 'Ingresa un correo válido');
            valid = false;
        }
        
        // Validar contraseña
        if (!password) {
            this.showError('loginPasswordError', 'La contraseña es obligatoria');
            valid = false;
        } else if (password.length < 6) {
            this.showError('loginPasswordError', 'La contraseña debe tener al menos 6 caracteres');
            valid = false;
        }
        
        if (!valid) return;
        
        this.setLoading('login', true);
        
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    correo: email,
                    contrasena: password,
                    rememberMe: rememberMe
                })
            });
            
            const data = await response.json();
            
            if (data.ok) {
                // Guardar datos de sesión
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userName', data.user.nombre_usuario);
                localStorage.setItem('loginTime', Date.now().toString());
                
                // Mostrar éxito
                document.getElementById('loginSuccess').style.display = 'block';
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/inicio.html';
                }, 1500);
            } else {
                this.showError('loginError', data.error || 'Correo o contraseña incorrectos');
            }
        } catch (error) {
            console.error('Error de login:', error);
            this.showError('loginError', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading('login', false);
        }
    }

    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('registerConfirmPassword').value.trim();
        const phone = document.getElementById('registerPhone').value.trim();
        const address = document.getElementById('registerAddress').value.trim();
        
        // Resetear errores
        document.querySelectorAll('#registerForm .error-message').forEach(err => err.style.display = 'none');
        
        let valid = true;
        
        // Validar nombre
        if (!name) {
            this.showError('registerNameError', 'El nombre es obligatorio');
            valid = false;
        } else if (name.length < 3) {
            this.showError('registerNameError', 'El nombre debe tener al menos 3 caracteres');
            valid = false;
        }
        
        // Validar email
        if (!email) {
            this.showError('registerEmailError', 'El correo es obligatorio');
            valid = false;
        } else if (!this.validateEmail(email)) {
            this.showError('registerEmailError', 'Ingresa un correo válido');
            valid = false;
        }
        
        // Validar contraseña
        if (!password) {
            this.showError('registerPasswordError', 'La contraseña es obligatoria');
            valid = false;
        } else if (password.length < 6) {
            this.showError('registerPasswordError', 'La contraseña debe tener al menos 6 caracteres');
            valid = false;
        }
        
        // Validar confirmación de contraseña
        if (!confirmPassword) {
            this.showError('registerConfirmPasswordError', 'Confirma tu contraseña');
            valid = false;
        } else if (password !== confirmPassword) {
            this.showError('registerConfirmPasswordError', 'Las contraseñas no coinciden');
            valid = false;
        }
        
        // Validar teléfono
        if (!phone) {
            this.showError('registerPhoneError', 'El teléfono es obligatorio');
            valid = false;
        } else if (!this.validatePhone(phone)) {
            this.showError('registerPhoneError', 'Ingresa un teléfono válido (10 dígitos, empezando con 3)');
            valid = false;
        }
        
        // Validar dirección
        if (!address) {
            this.showError('registerAddressError', 'La dirección es obligatoria');
            valid = false;
        } else if (address.length < 5) {
            this.showError('registerAddressError', 'La dirección debe tener al menos 5 caracteres');
            valid = false;
        }
        
        if (!valid) return;
        
        this.setLoading('register', true);
        
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nombre: name,
                    correo: email,
                    contrasena: password,
                    telefono: phone,
                    direccion: address
                })
            });
            
            const data = await response.json();
            
            if (data.ok) {
                // Mostrar éxito
                document.getElementById('registerSuccess').style.display = 'block';
                
                // Redirigir después de 1.5 segundos
                setTimeout(() => {
                    window.location.href = '/iniciar-sesion.html';
                }, 1500);
            } else {
                this.showError('registerError', data.error || 'Error al crear la cuenta');
            }
        } catch (error) {
            console.error('Error de registro:', error);
            this.showError('registerError', 'Error de conexión. Intenta nuevamente.');
        } finally {
            this.setLoading('register', false);
        }
    }
}

// Crear instancia global
let authModals;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    authModals = new AuthModals();
});

// Funciones globales para uso directo
function openAuthModal(tab = 'login') {
    if (authModals) {
        authModals.open(tab);
    }
}

function closeAuthModal() {
    if (authModals) {
        authModals.close();
    }
}
