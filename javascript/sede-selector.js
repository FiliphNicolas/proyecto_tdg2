/**
 * Componente de Selector de Sedes
 * Permite cambiar entre sedes sin recargar la página
 */

class SedeSelector {
  constructor() {
    this.sedes = [];
    this.sedeActual = null;
    this.container = null;
    this.isInitialized = false;
  }

  async init() {
    if (this.isInitialized) return;
    
    try {
      await this.cargarSedes();
      this.renderizar();
      this.cargarSedeActual();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error inicializando selector de sedes:', error);
    }
  }

  async cargarSedes() {
    try {
      const response = await fetch('/api/sedes');
      const result = await response.json();
      
      if (result.ok) {
        this.sedes = result.sedes.filter(s => s.activo);
      }
    } catch (error) {
      console.error('Error cargando sedes:', error);
      this.sedes = [];
    }
  }

  renderizar() {
    // Crear contenedor si no existe
    if (!document.getElementById('sede-selector-container')) {
      const selector = document.createElement('div');
      selector.id = 'sede-selector-container';
      selector.innerHTML = this.generarHTML();
      document.body.insertBefore(selector, document.body.firstChild);
      this.container = selector;
      this.agregarEstilos();
    }
    
    this.actualizarOpciones();
    this.agregarEventListeners();
  }

  generarHTML() {
    const opcionesHTML = this.sedes
      .map(sede => `<option value="${sede.id_sede}">${sede.nombre} - ${sede.ciudad}</option>`)
      .join('');
    
    return `
      <div class="sede-selector-bar">
        <div class="sede-selector-content">
          <label for="sede-select" class="sede-label">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Sede:
          </label>
          <select id="sede-select" class="sede-dropdown">
            <option value="">Selecciona una sede...</option>
            ${opcionesHTML}
          </select>
          <span id="sede-info" class="sede-info"></span>
        </div>
      </div>
    `;
  }

  agregarEstilos() {
    if (document.getElementById('sede-selector-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'sede-selector-styles';
    style.textContent = `
      #sede-selector-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 9999;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .sede-selector-bar {
        max-width: 100%;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .sede-selector-content {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
        max-width: 900px;
      }

      .sede-label {
        color: white;
        font-size: 13px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
      }

      .sede-dropdown {
        padding: 8px 12px;
        border: 1px solid rgba(255,255,255,0.3);
        border-radius: 6px;
        background: rgba(255,255,255,0.95);
        color: #333;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        min-width: 200px;
      }

      .sede-dropdown:hover {
        background: white;
        border-color: rgba(255,255,255,0.6);
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
      }

      .sede-dropdown:focus {
        outline: none;
        border-color: white;
        box-shadow: 0 0 0 2px rgba(255,255,255,0.2);
      }

      .sede-info {
        color: rgba(255,255,255,0.85);
        font-size: 12px;
        font-weight: 400;
        white-space: nowrap;
      }

      /* Responsive */
      @media (max-width: 768px) {
        .sede-selector-bar {
          padding: 10px 12px;
        }

        .sede-selector-content {
          gap: 8px;
        }

        .sede-label {
          font-size: 12px;
        }

        .sede-dropdown {
          min-width: auto;
          padding: 6px 10px;
          font-size: 12px;
        }

        .sede-info {
          display: none;
        }
      }

      /* Ajuste para que el body tenga margen superior */
      body {
        padding-top: var(--sede-selector-height, 52px);
      }
    `;
    document.head.appendChild(style);
  }

  actualizarOpciones() {
    const select = document.getElementById('sede-select');
    if (select) {
      select.innerHTML = '<option value="">Selecciona una sede...</option>' +
        this.sedes.map(s => `<option value="${s.id_sede}">${s.nombre} - ${s.ciudad}</option>`).join('');
    }
  }

  agregarEventListeners() {
    const select = document.getElementById('sede-select');
    if (select) {
      select.addEventListener('change', (e) => this.cambiarSede(e.target.value));
    }
  }

  async cambiarSede(idSede) {
    if (!idSede) return;
    
    try {
      const sede = this.sedes.find(s => s.id_sede == idSede);
      if (sede) {
        this.sedeActual = sede;
        this.guardarSedeEnLocal(sede);
        this.actualizarUI(sede);
        
        // Disparar evento personalizado para que otras partes de la app se actualicen
        window.dispatchEvent(new CustomEvent('sedeChanged', { detail: sede }));
      }
    } catch (error) {
      console.error('Error cambiando sede:', error);
    }
  }

  cargarSedeActual() {
    const sedeGuardada = localStorage.getItem('sedaActual');
    if (sedeGuardada) {
      try {
        this.sedeActual = JSON.parse(sedeGuardada);
        this.actualizarUI(this.sedeActual);
        
        const select = document.getElementById('sede-select');
        if (select) {
          select.value = this.sedeActual.id_sede;
        }
      } catch (e) {
        console.error('Error cargando sed guardada:', e);
      }
    }
  }

  actualizarUI(sede) {
    const select = document.getElementById('sede-select');
    const info = document.getElementById('sede-info');
    
    if (select) {
      select.value = sede.id_sede;
    }
    
    if (info && sede.telefono) {
      info.textContent = `📞 ${sede.telefono}`;
    }
  }

  guardarSedeEnLocal(sede) {
    localStorage.setItem('sedaActual', JSON.stringify(sede));
  }

  obtenerSedeActual() {
    return this.sedeActual;
  }
}

// Inicializar automáticamente cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.sedeSelector = new SedeSelector();
  window.sedeSelector.init();
});
