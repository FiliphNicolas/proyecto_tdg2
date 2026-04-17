/**
 * CAMBIOS: FORMULARIO DE REGISTRO EN 2 COLUMNAS
 * =============================================
 * 
 * El formulario de registro ahora usa un layout CSS Grid de 2 columnas
 * responsive que se adapta a dispositivos móviles
 */

// ============================================
// CAMBIOS REALIZADOS
// ============================================

/*
1. ESTRUCTURA HTML (registrar-cuenta.html):
   ✅ Nuevo contenedor: form-columns-container
      - Usa CSS Grid con 2 columnas
      - Responsive: 1 columna en móvil
   
   ✅ COLUMNA IZQUIERDA: form-column
      - Nombre completo
      - Número de celular
      - Rol
   
   ✅ COLUMNA DERECHA: form-column
      - Dirección
      - Ciudad
      - Sede
   
   ✅ CAMPOS FULL-WIDTH: form-full-width
      - Correo electrónico
      - Contraseña
      - Confirmar contraseña
      - Form options (términos)

2. ESTILOS CSS (styles.css):
   ✅ .cuadro-azul
      - Ancho aumentado a 1000px (era 800px)
      - Ahora acomoda mejor 2 columnas
   
   ✅ .form-columns-container
      - display: grid
      - grid-template-columns: 1fr 1fr
      - gap: 20px (espacio entre columnas)
   
   ✅ .form-column
      - Cada columna ocupa 100% del ancho disponible
      - Stretch vertical
   
   ✅ .form-full-width
      - grid-column: 1 / -1 (ocupa ambas columnas)
   
   ✅ .barra
      - width: 100%
      - display: flex, flex-direction: column
      - margin-bottom: 15px
   
   ✅ .etiqueta
      - display: block
      - margin-bottom: 8px
      - font-weight: 500
   
   ✅ RESPONSIVE
      - En pantallas ≤ 768px: 1 columna
      - En pantallas > 768px: 2 columnas
*/

// ============================================
// LAYOUT VISUAL
// ============================================

/*
DESKTOP (> 768px):
┌───────────────────────────────────────────────┐
│  Crear tu cuenta                              │
│  Completa tus datos para unirte a Systemsware│
├────────────────┬────────────────┐
│                │                │
│  Nombre        │  Dirección     │
│  [  ]          │  [  ]          │
│                │                │
│  Celular       │  Ciudad        │
│  [  ]          │  [  ]          │
│                │                │
│  Rol           │  Sede          │
│  [✓]           │  [✓]           │
│                │                │
└────────────────┴────────────────┘
├─────────────────────────────────┐
│ Correo                          │
│ [  ]                            │
├─────────────────────────────────┐
│ Contraseña                      │
│ [  ] 👁️                        │
├─────────────────────────────────┐
│ Confirmar contraseña            │
│ [  ] 👁️                        │
├─────────────────────────────────┐
│ ☐ Acepto términos y condiciones│
│        [Crear cuenta]           │
│  ¿Ya tienes cuenta?             │
└─────────────────────────────────┘

MÓVIL (≤ 768px):
┌──────────────────────┐
│  Crear tu cuenta     │
│  Completa tus datos  │
├──────────────────────┐
│ Nombre               │
│ [  ]                 │
├──────────────────────┐
│ Dirección            │
│ [  ]                 │
├──────────────────────┐
│ Celular              │
│ [  ]                 │
├──────────────────────┐
│ Ciudad               │
│ [  ]                 │
├──────────────────────┐
│ Rol / Sede... etc    │
│ (continúa...)        │
└──────────────────────┘
*/

// ============================================
// COMPARACIÓN: ANTES vs DESPUÉS
// ============================================

/*
ANTES:
- 1 columna vertical
- Campos tipo "acordeón" apilados
- Ocupaba 800px ancho
- Parecía muy "largo"
- Usuario debe hacer mucho scroll

DESPUÉS:
- 2 columnas lado a lado (desktop)
- Forma compacta y eficiente
- Ocupa 1000px ancho (usa mejor el espacio)
- Parece más organizado
- Menos scroll necesario
- Responsivo automático en móvil
*/

// ============================================
// MEDIA QUERIES APLICADAS
// ============================================

/*
@media (max-width: 768px) {
  .cuadro-azul {
    max-width: 100%;    ← Ocupar ancho completo en móvil
    padding: 15px;      ← Padding más pequeño
  }
  
  .form-columns-container {
    grid-template-columns: 1fr;  ← Solo 1 columna
    gap: 15px;                    ← Espaciado reducido
  }
  
  .form-full-width {
    grid-column: 1;     ← Vuelve a una columna
  }
}

Breakpoints:
- 0px - 768px: 1 columna (móvil)
- 768px+: 2 columnas (tablet/desktop)
*/

// ============================================
// CÓMO AGREGAR MÁS CAMPOS
// ============================================

/*
AGREGAR A COLUMNA IZQUIERDA:
<div class="form-column">
  <!-- Campos existentes -->
  
  <!-- NUEVO CAMPO -->
  <div class="barra">
    <label class="etiqueta" for="new_field">Etiqueta</label>
    <input type="text" id="new_field" placeholder="..." required>
    <span class="error" id="error-new_field"></span>
  </div>
</div>

AGREGAR FULL-WIDTH:
<div class="form-columns-container">
  <div class="form-full-width">
    <div class="barra">
      <label class="etiqueta" for="new_field">Etiqueta</label>
      <input type="text" id="new_field" placeholder="..." required>
    </div>
  </div>
</div>

AGREGAR NUEVA COLUMNA:
Si necesitas 3 columnas:
.form-columns-container {
  grid-template-columns: 1fr 1fr 1fr;  ← Cambiar a 1fr 1fr 1fr
}

Si necesitas 3 columnas solo en algunos espacios:
.form-columns-container.tres-columnas {
  grid-template-columns: 1fr 1fr 1fr;
}
*/

// ============================================
// VALIDACIÓN EN JAVASCRIPT
// ============================================

/*
La validación se mantiene igual. El JavaScript busca por:
- document.getElementById("nombre").value
- document.getElementById("rol").value
- etc.

Todos los campos mantienen sus IDs y funcionan igual
que antes, solo cambiaron su posición visualmente.
*/

// ============================================
// TESTING: VERIFICAR RESPONSIVIDAD
// ============================================

/*
1. DESKTOP (1920x1080 o similar):
   - Debe mostrar exactamente 2 columnas
   - Nombre | Dirección (izq/derecha)
   - Celular | Ciudad (izq/derecha)
   - Rol | Sede (izq/derecha)
   - Correo en full-width
   - Etc.

2. TABLET (768px):
   - Debe mostrar exactamente 1 columna
   - Todos los campos apilados verticalmente
   - Sin overflow horizontal

3. MÓVIL (375px):
   - Debe verse igual que tablet
   - Responsive completo
   - Legible y usable

CÓMO PROBAR EN CHROME:
Abrir DevTools (F12) → Ctrl+Shift+M → Toggle Device Toolbar
- Seleccionar diferentes dispositivos
- Verificar que se adapta bien
*/

// ============================================
// COMPATIBILIDAD CSS
// ============================================

/*
CSS Grid está soportado en:
✅ Chrome 57+ (2017)
✅ Firefox 52+ (2017)
✅ Safari 10.1+ (2017)
✅ Edge 16+ (2017)
✅ Opera 44+ (2017)

No es compatible con Internet Explorer.
Si necesitas IE: usar flexbox fallback o cambiar a float.
*/

// ============================================
// ARCHIVOS MODIFICADOS
// ============================================

/*
1. pages/registrar-cuenta.html
   - Línea 19-95: Restructured form with grid
   
2. css/styles.css
   - Línea 31: Aumentado max-width de 800px a 1000px
   - Línea 36-51: Agregadas clases form-columns-container, etc.
   - Línea 52-67: Media query responsive
   - Línea 90-108: Estilos para .barra y .etiqueta
*/

// ============================================
// POSIBLES MEJORAS FUTURAS
// ============================================

/*
1. 3 columnas en pantallas muy grandes (>1400px)
2. Animación CSS para las transiciones de columnas
3. Agregar icono de validación ✓ en cada campo
4. Cambiar orden de campos en móvil (más lógico)
5. Agregar tooltips para campos complejos
6. Separar en secciones: "Datos", "Credenciales", etc.
7. Agregar progress bar de completitud del formulario
*/
