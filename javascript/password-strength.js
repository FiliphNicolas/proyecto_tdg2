/**
 * PasswordStrengthIndicator - Componente de indicador de fortaleza de contraseña
 * Systemsware - Sistema de gestión de inventario
 */

class PasswordStrengthIndicator {
  constructor(inputElement, options = {}) {
    this.input = inputElement;
    this.options = {
      containerClass: 'password-strength-container',
      meterClass: 'password-strength-meter',
      textClass: 'password-strength-text',
      requirementsClass: 'password-requirements',
      showRequirements: true,
      ...options
    };
    
    this.container = null;
    this.meter = null;
    this.text = null;
    this.requirements = null;
    
    this.init();
  }

  init() {
    this.createElements();
    this.attachEvents();
    this.updateStrength('');
  }

  createElements() {
    // Crear contenedor
    this.container = document.createElement('div');
    this.container.className = this.options.containerClass;
    
    // Crear barra de fortaleza
    this.meter = document.createElement('div');
    this.meter.className = this.options.meterClass;
    this.meter.innerHTML = `
      <div class="strength-bar weak"></div>
      <div class="strength-bar medium"></div>
      <div class="strength-bar strong"></div>
    `;
    
    // Crear texto de fortaleza
    this.text = document.createElement('span');
    this.text.className = this.options.textClass;
    this.text.textContent = 'Ingresa una contraseña';
    
    this.container.appendChild(this.meter);
    this.container.appendChild(this.text);
    
    // Crear lista de requisitos si está habilitado
    if (this.options.showRequirements) {
      this.requirements = document.createElement('ul');
      this.requirements.className = this.options.requirementsClass;
      this.requirements.innerHTML = `
        <li data-req="length">Mínimo 8 caracteres</li>
        <li data-req="uppercase">Al menos una mayúscula</li>
        <li data-req="lowercase">Al menos una minúscula</li>
        <li data-req="number">Al menos un número</li>
        <li data-req="special">Al menos un carácter especial</li>
      `;
      this.container.appendChild(this.requirements);
    }
    
    // Insertar después del contenedor padre del input (no dentro del input container)
    const inputContainer = this.input.closest('.password-input-container') || this.input.parentNode;
    inputContainer.parentNode.insertBefore(this.container, inputContainer.nextSibling);
    
    // Añadir estilos CSS si no existen
    this.addStyles();
  }

  addStyles() {
    if (document.getElementById('password-strength-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'password-strength-styles';
    styles.textContent = `
      .password-strength-container {
        margin-top: 4px;
        margin-bottom: 8px;
        clear: both;
        width: 100%;
        display: block;
      }
      
      .password-strength-meter {
        display: flex;
        gap: 4px;
        margin-bottom: 6px;
        height: 4px;
      }
      
      .strength-bar {
        flex: 1;
        height: 100%;
        border-radius: 2px;
        background: #e0e0e0;
        transition: background 0.3s ease;
      }
      
      .strength-bar.weak.active { background: #dc3545; }
      .strength-bar.medium.active { background: #ffc107; }
      .strength-bar.strong.active { background: #28a745; }
      
      .password-strength-text {
        font-size: 12px;
        color: #666;
        font-weight: 500;
        display: block;
        margin-top: 4px;
      }
      
      .password-strength-text.weak { color: #dc3545; }
      .password-strength-text.medium { color: #ffc107; }
      .password-strength-text.strong { color: #28a745; }
      
      .password-requirements {
        list-style: none;
        padding: 0;
        margin: 8px 0 0 0;
        font-size: 11px;
        color: #666;
        display: none;
      }
      
      .password-requirements.visible {
        display: block;
      }
      
      .password-requirements li {
        padding: 2px 0;
        padding-left: 18px;
        position: relative;
        transition: color 0.2s ease;
      }
      
      .password-requirements li::before {
        content: '○';
        position: absolute;
        left: 0;
        font-size: 10px;
      }
      
      .password-requirements li.met {
        color: #28a745;
      }
      
      .password-requirements li.met::before {
        content: '✓';
        color: #28a745;
      }
    `;
    document.head.appendChild(styles);
  }

  attachEvents() {
    this.input.addEventListener('input', (e) => {
      this.updateStrength(e.target.value);
    });
    
    this.input.addEventListener('focus', () => {
      if (this.requirements) {
        this.requirements.classList.add('visible');
      }
    });
    
    this.input.addEventListener('blur', () => {
      if (this.requirements && !this.input.value) {
        this.requirements.classList.remove('visible');
      }
    });
  }

  updateStrength(password) {
    const analysis = this.analyzePassword(password);
    
    // Actualizar barras
    const bars = this.meter.querySelectorAll('.strength-bar');
    bars.forEach(bar => bar.classList.remove('active'));
    
    if (password.length > 0) {
      if (analysis.score >= 1) bars[0].classList.add('active');
      if (analysis.score >= 2) bars[1].classList.add('active');
      if (analysis.score >= 3) bars[2].classList.add('active');
    }
    
    // Actualizar texto
    const labels = {
      0: 'Muy débil',
      1: 'Débil',
      2: 'Media',
      3: 'Fuerte'
    };
    
    this.text.textContent = password.length === 0 ? 'Ingresa una contraseña' : labels[analysis.score];
    this.text.className = `password-strength-text ${analysis.strength}`;
    
    // Actualizar requisitos
    if (this.requirements) {
      this.updateRequirements(analysis);
    }
    
    // Disparar evento personalizado
    this.input.dispatchEvent(new CustomEvent('strengthChange', { 
      detail: analysis 
    }));
  }

  analyzePassword(password) {
    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    };
    
    const passedChecks = Object.values(checks).filter(Boolean).length;
    
    let score = 0;
    if (password.length === 0) score = 0;
    else if (passedChecks <= 2) score = 1;
    else if (passedChecks <= 4) score = 2;
    else score = 3;
    
    let strength = 'weak';
    if (score === 2) strength = 'medium';
    if (score === 3) strength = 'strong';
    
    return {
      score,
      strength,
      checks,
      passedChecks,
      isValid: passedChecks === 5 && password.length >= 8
    };
  }

  updateRequirements(analysis) {
    const reqElements = this.requirements.querySelectorAll('li');
    reqElements.forEach(el => {
      const req = el.dataset.req;
      if (analysis.checks[req]) {
        el.classList.add('met');
      } else {
        el.classList.remove('met');
      }
    });
  }

  isValid() {
    const analysis = this.analyzePassword(this.input.value);
    return analysis.isValid;
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}

// Función de utilidad para inicializar fácilmente
function initPasswordStrength(inputId, options = {}) {
  const input = document.getElementById(inputId);
  if (!input) {
    console.error(`No se encontró el input con id: ${inputId}`);
    return null;
  }
  return new PasswordStrengthIndicator(input, options);
}

// Exponer globalmente
window.PasswordStrengthIndicator = PasswordStrengthIndicator;
window.initPasswordStrength = initPasswordStrength;
