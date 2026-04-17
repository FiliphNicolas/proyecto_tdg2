/**
 * EDICIÓN DE PERFIL DE USUARIO - MEJORADO
 * =========================================
 * 
 * Sistema mejorado para editar la información personal y contraseña
 * con formularios responsivos en 2 columnas
 */

// ============================================
// CAMBIOS REALIZADOS
// ============================================

/*
1. FRONTEND - INFORMACIÓN PERSONAL (informacion-personal.html)

   ANTES:
   - Solo 2 campos: Nombre y Correo
   - Formulario simple en una columna
   
   DESPUÉS:
   - 5 campos editables: Nombre, Email, Teléfono, Dirección, Ciudad
   - Formulario de 2 columnas (responsive)
   - Teléfono | Dirección (columna izq/derecha)
   - Email | Ciudad (columna izq/derecha)
   - Teléfono | Dirección (column izq/derecha)
   - Validaciones mejoradas
   - Mensajes de error claros
*/

// ============================================
// CAMPOS EDITABLES POR USUARIO
// ============================================

/*
PERFIL PERSONAL:
✅ nombre_usuario      (Campo requerido)
✅ email               (Campo requerido, validado)
✅ numero_cel          (Opcional, teléfono)
✅ direccion           (Opcional)
✅ ciudad              (Opcional)

CONTRASEÑA:
✅ contrasena_actual   (Requerida para validar cambio)
✅ contrasena_nueva    (Mínimo 8 caracteres, requerida)
✅ contrasena_confirm  (Debe coincidir con nueva)

FIELDS NO EDITABLES (Solo admin puede cambiar):
❌ rol
❌ id_sede
❌ id_usuario
❌ fecha_creacion
❌ activo (estado de cuenta)
*/

// ============================================
// ENDPOINTS BACKEND UTILIZADOS
// ============================================

/*
OBTENER PERFIL:
GET /api/me
Headers: Authorization: Bearer {token}
Response: {
  ok: true,
  user: {
    id_usuario: 1,
    nombre_usuario: "Juan Pérez",
    email: "juan@example.com",
    numero_cel: "3001234567",
    direccion: "Calle Principal #123",
    ciudad: "Bogotá",
    rol: "vendedor",
    activo: true,
    fecha_creacion: "2024-01-15"
  }
}

ACTUALIZAR PERFIL:
PUT /api/me
Headers: Authorization: Bearer {token}
Body: {
  nombre_usuario: "Juan Pérez",
  email: "juan@example.com",
  numero_cel: "3001234567",          // Opcional
  direccion: "Calle Principal #123", // Opcional
  ciudad: "Bogotá"                   // Opcional
}
Response: {
  ok: true,
  user: { ...updated fields },
  message: "Perfil actualizado exitosamente"
}

CAMBIAR CONTRASEÑA:
PUT /api/me/password
Headers: Authorization: Bearer {token}
Body: {
  contrasena_actual: "oldPassword123",
  contrasena_nueva: "newPassword456"
}
Response: {
  ok: true,
  message: "Contraseña actualizada exitosamente"
}

ELIMINAR CUENTA:
DELETE /api/me
Headers: Authorization: Bearer {token}
Response: {
  ok: true,
  message: "Cuenta eliminada exitosamente"
}
*/

// ============================================
// ESTRUCTURA HTML MEJORADA
// ============================================

/*
ANTES:
<form id="updateProfileForm" class="info-list">
  <div class="info-row">
    <label for="nombre">Nombre</label>
    <input id="nombre" type="text" />
  </div>
  <div class="info-row">
    <label for="correo">Correo</label>
    <input id="correo" type="email" />
  </div>
  <button type="submit">Guardar cambios</button>
</form>

DESPUÉS:
<form id="updateProfileForm" class="info-list">
  <!-- DOS COLUMNAS -->
  <div class="form-columns-container info-columns">
    <!-- COLUMNA IZQUIERDA -->
    <div class="form-column">
      <div class="info-row">
        <label for="nombre">Nombre completo</label>
        <input id="nombre" type="text" placeholder="Tu nombre" required />
      </div>
      <div class="info-row">
        <label for="numero_cel">Teléfono</label>
        <input id="numero_cel" type="tel" placeholder="3001234567" />
      </div>
      <div class="info-row">
        <label for="ciudad">Ciudad</label>
        <input id="ciudad" type="text" placeholder="Bogotá" />
      </div>
    </div>
    
    <!-- COLUMNA DERECHA -->
    <div class="form-column">
      <div class="info-row">
        <label for="correo">Correo electrónico</label>
        <input id="correo" type="email" placeholder="correo@ejemplo.com" required />
      </div>
      <div class="info-row">
        <label for="direccion">Dirección</label>
        <input id="direccion" type="text" placeholder="Calle Principal #123" />
      </div>
    </div>
  </div>
  
  <!-- BOTÓN FULL-WIDTH -->
  <div class="form-columns-container" style="margin-top: 20px;">
    <div class="form-full-width">
      <button type="submit">Guardar cambios</button>
      <div id="update-profile-msg"></div>
    </div>
  </div>
</form>
*/

// ============================================
// VALIDACIÓN JAVASCRIPT
// ============================================

/*
VALIDACIÓN PERFIL:
✅ nombre_usuario: requerido, no vacío
✅ email: requerido, debe tener @ y .
✅ numero_cel: opcional, puede ser teléfono
✅ direccion: opcional, máximo 255 caracteres
✅ ciudad: opcional, máximo 100 caracteres

VALIDACIÓN CONTRASEÑA:
✅ Contraseña actual: requerida
✅ Contraseña nueva: mínimo 8 caracteres
✅ Confirmación: debe coincidir exactamente
✅ No puede ser igual a la actual (validación backend)

MENSAJES DE ERROR:
- "Nombre y correo son requeridos."
- "Correo inválido."
- "Ingrese su contraseña actual."
- "La nueva contraseña debe tener al menos 8 caracteres."
- "Las nuevas contraseñas no coinciden."
- "Error al actualizar..."
*/

// ============================================
// ESTILOS CSS UTILIZADOS
// ============================================

/*
CLASES PRINCIPALES:
✅ .profile-card          - Contenedor principal
✅ .card-header           - Encabezado con avatar y nombre
✅ .card-body             - Área de contenido
✅ .info-list             - Contenedor del formulario
✅ .form-columns-container - Layout de 2 columnas (CSS Grid)
✅ .form-column           - Cada columna
✅ .form-full-width       - Campo que ocupa ambas columnas
✅ .info-row              - Fila individual (label + input)
✅ .info-label            - Etiqueta del campo
✅ .info-value            - Input del campo

COLORES Y ESTILOS:
- Fondo: #ffffff (blanco)
- Bordes: #ddd (gris claro)
- Texto: #333 (gris oscuro)
- Errores: rojo
- Éxito: verde (#2ecc71)
- Hover: azul (#667eea)
*/

// ============================================
// RESPONSIVE DESIGN
// ============================================

/*
DESKTOP (> 768px):
- 2 columnas lado a lado
- Gap: 20px
- Ancho max: sin restricción (ocupa disponible en card)

MÓVIL (≤ 768px):
- 1 columna
- Gap: 15px
- Padding: 15px
- Campos apilados verticalmente

@media (max-width: 768px) {
  .info-list .form-columns-container {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .info-list .form-full-width {
    grid-column: 1;
  }
}
*/

// ============================================
// PROCESO DE EDICIÓN (FLUJO COMPLETO)
// ============================================

/*
1. CARGAR DATOS INICIALES
   └─ loadProfile() triggered on page load
      ├─ GET /api/me with Authorization header
      ├─ Display name/email in card-header
      └─ Fill form inputs with current values

2. USUARIO EDITA CAMPOS
   └─ Modifica uno o más campos
      ├─ Validación en tiempo real (HTML5)
      └─ Sin envío automático

3. USUARIO ENVÍA FORMULARIO
   └─ Click en "Guardar cambios"
      ├─ Validación JavaScript (nombres, emails, etc.)
      ├─ Si válido: PUT /api/me con nuevos datos
      ├─ Backend valida y actualiza BD
      └─ Response con usuario actualizado

4. MOSTRAR RESULTADO
   └─ Si éxito (res.ok):
      ├─ Mostrar mensaje verde "Perfil actualizado correctamente."
      ├─ Actualizar card-header con nuevos datos
      └─ Mantener valores en inputs para más edits
   
   └─ Si error:
      ├─ Mostrar mensaje rojo con error específico
      └─ Mantener valores para reintentar
*/

// ============================================
// CAMBIOS DE CONTRASEÑA
// ============================================

/*
FLUJO:
1. Usuario ingresa:
   - Contraseña actual (verificación)
   - Contraseña nueva (mínimo 8 caracteres)
   - Confirmación (debe coincidir)

2. Validaciones:
   ✓ Contraseña actual: no vacía
   ✓ Contraseña nueva: >= 8 caracteres
   ✓ Confirmación: === Password nueva
   ✓ CANNOT: Nueva = Actual (backend lo rechaza)

3. Envío:
   PUT /api/me/password con:
   {
     contrasena_actual: "...",
     contrasena_nueva: "..."
   }

4. Backend:
   - Verifica contraseña actual con bcrypt.compare()
   - Si incorrecta: 401 "Contraseña actual incorrecta"
   - Si correcta: Hash nueva y actualiza
   - Response: { ok: true, message: "..." }

5. Frontend:
   - Éxito: Limpiar inputs, mostrar confirmación
   - Error: Mostrar error específico, mantener inputs
*/

// ============================================
// DATOS GUARDADOS EN BD
// ============================================

/*
TABLA: usuario
UPDATE triggers (auditoria table):
- Todos los cambios se registran en la tabla auditoria
- Incluye usuario_id, timestamp, operación (UPDATE)
- Antes/después en formato JSON
- Para cumplimiento y auditoría legal

EJEMPLO REGISTRO AUDITORIA:
{
  id_auditoria: 42,
  tabla: "usuario",
  operacion: "UPDATE",
  usuario_id: 5,
  datos_anterior: {
    "nombre_usuario": "Juan",
    "email": "juan@old.com",
    "numero_cel": "3001111111"
  },
  datos_nuevo: {
    "nombre_usuario": "Juan Pérez",
    "email": "juan@new.com",
    "numero_cel": "3002222222"
  },
  fecha: "2024-04-13 14:30:00"
}
*/

// ============================================
// SEGURIDAD
// ============================================

/*
✅ Contraseñas:
   - Hashed con bcrypt (salt: 10 rounds)
   - Nunca se envían en GET
   - Password verify antes de cambio
   - Mínimo 8 caracteres requeridas

✅ Tokens:
   - JWT en Authorization header
   - Verificado en cada PUT/GET
   - Requerido para cualquier edición
   - Sin token: 401 Unauthorized

✅ Datos personales:
   - Usuario solo edita su propia info
   - Backend valida user_id del token
   - Email debe ser único (constraint BD)
   - Teléfono/dirección pueden duplicarse (no problema)

✅ Validación:
   - Frontend: HTML5 + JavaScript
   - Backend: Validación redundante
   - Database: Constraints y triggers
   - Logging: Auditoría automática (triggers)
*/

// ============================================
// COMPARACIÓN CON SISTEMA ANTERIOR
// ============================================

/*
ANTERIOR:
- Nombre + Email only
- Sin teléfono o localidad
- Formulario vertical largo
- Poca información editable
- Menos contexto para el usuario

NUEVO:
- Nombre + Email + Teléfono + Dirección + Ciudad
- Información más completa del usuario
- Formulario compacto 2 columnas
- Mejor UX en escritorio y móvil
- Más campos útiles para la organización
- Misma seguridad y validación

IMPACTO:
✅ Mejor experiencia de usuario
✅ Datos más completos en BD
✅ Formulario visual más atractivo
✅ Responsive en todos los dispositivos
✅ Compatible con rol + sede system
*/

// ============================================
// NEXT STEPS / MEJORAS FUTURAS
// ============================================

/*
1. Foto de perfil:
   - Avatar actual: icono genérico
   - Permitir upload de imagen
   - Mostrar pequeña thumbnail en card-header

2. Panel admin:
   - Admin puede editar usuarios (incluir rol/sede)
   - Admin puede ver auditoría de cambios
   - Admin puede resetear contraseñas

3. Validaciones más estrictas:
   - Teléfono: formato E.164 o similar
   - Dirección: geolocalización y autocomplete
   - Ciudad: select con ciudades válidas

4. Notificaciones:
   - Email confirmando cambios
   - Email alertando cambio de contraseña
   - Historial de cambios en profile

5. Dos factores (2FA):
   - SMS o authenticator app
   - Requerido para cambios críticos
   - Mejor seguridad
*/

// ============================================
// ARCHIVOS MODIFICADOS
// ============================================

/*
1. pages/informacion-personal.html
   - Línea 28-70: Formulario perfil 2 columnas
   - Línea 77-100: Formulario contraseña 2 columnas
   - Línea 130-200: loadProfile() - cargar 5 campos
   - Línea 205-255: updateProfileForm listener - enviar 5 campos
   - Línea 260-310: updatePasswordForm listener - método PUT

2. css/styles.css
   - Línea 650-670: Estilos .info-list .form-columns-container
   - Línea 85-105: Media query responsivo
   - Estilos para .form-column, .form-full-width en info context

3. routes/usuarios.js
   - YA ESTABA HECHO: PUT /api/me acepta los 5 campos
   - YA ESTABA HECHO: PUT /api/me/password para contraseña
   - No se requirieron cambios en backend
*/
