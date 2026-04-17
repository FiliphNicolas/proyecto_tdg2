/**
 * GUÍA: ROLES EN SYSTEMSWARE
 * ==========================
 * 
 * Se agregó selector de roles al formulario de registro
 * Conoce qué roles están disponibles y sus permisos
 */

// ============================================
// ROLES DISPONIBLES
// ============================================

const ROLES = {
  empleado: {
    nombre: "Empleado",
    descripcion: "Acceso básico al sistema",
    permisos: [
      "ver_productos",
      "ver_pedidos",
      "ver_perfil",
      "cambiar_contraseña"
    ]
  },
  
  vendedor: {
    nombre: "Vendedor",
    descripcion: "Gestión de pedidos y clientes",
    permisos: [
      "ver_productos",
      "crear_pedidos",
      "modificar_pedidos",
      "ver_clientes",
      "crear_clientes",
      "ver_perfil",
      "cambiar_contraseña"
    ]
  },
  
  gerente: {
    nombre: "Gerente",
    descripcion: "Control completo de sede",
    permisos: [
      "ver_productos",
      "crear_productos",
      "modificar_productos",
      "ver_inventario",
      "registrar_movimientos",
      "crear_pedidos",
      "modificar_pedidos",
      "ver_clientes",
      "crear_clientes",
      "ver_auditoria",
      "generar_reportes",
      "ver_perfil",
      "cambiar_contraseña"
    ]
  },
  
  administrador: {
    nombre: "Administrador",
    descripcion: "Acceso total del sistema",
    permisos: [
      "*" // Todos los permisos
    ]
  }
};

// ============================================
// CAMBIOS REALIZADOS
// ============================================

/*
1. FRONTEND (registrar-cuenta.html):
   - ✅ Agregado select de roles con opciones: Empleado, Vendedor, Gerente
   - ✅ Validación del rol antes de enviar
   - ✅ Estilos CSS para el select
   - ✅ El rol se envía al backend durante el registro

2. BACKEND (routes/auth.js - POST /api/auth/register):
   - ✅ Acepta el campo 'rol' del formulario
   - ✅ Valida que sea un rol válido (empleado, vendedor, gerente, administrador)
   - ✅ Usa 'empleado' como rol por defecto si no se envía
   - ✅ Retorna el rol en la respuesta
   - ✅ Incluye el rol en el JWT token

3. CSS (styles.css):
   - ✅ Estilos para select con apariencia consistente
   - ✅ Icono de dropdown personalizado
   - ✅ Efectos hover y focus
*/

// ============================================
// CÓMO USAR LOS ROLES EN API
// ============================================

/*
REGISTRO CON ROL:
POST /api/auth/register

Body:
{
  "nombre": "Juan Vendedor",
  "correo": "juan@systemsware.com",
  "contrasena": "Password123",
  "direccion": "Calle 5 #123",
  "numero_cel": "3001234567",
  "ciudad": "Bogotá",
  "rol": "vendedor"  ← Roles: empleado, vendedor, gerente
}

Response:
{
  "ok": true,
  "user": {
    "id_usuario": 4,
    "nombre_usuario": "Juan Vendedor",
    "email": "juan@systemsware.com",
    "rol": "vendedor"
  },
  "token": "eyJhbGc..."
}

---

VERIFICAR TIENE PERMISO (Backend - Middleware):

const checkPermission = (rol, permiso) => {
  const roleData = ROLES[rol];
  if (!roleData) return false;
  
  // Si es admin, tiene todos los permisos
  if (roleData.permisos.includes('*')) return true;
  
  // Verificar si tiene el permiso específico
  return roleData.permisos.includes(permiso);
};

// Uso:
if (!checkPermission(req.user.rol, 'modificar_productos')) {
  return res.status(403).json({ error: 'No tienes permisos para esta acción' });
}

---

OBTENER USUARIOS POR ROL:
SELECT * FROM usuario WHERE rol = 'vendedor' ORDER BY fecha_creacion DESC;

---

CAMBIAR ROL DE UN USUARIO (Admin only):
UPDATE usuario 
SET rol = 'gerente' 
WHERE id_usuario = 4 
RETURNING id_usuario, nombre_usuario, rol;
*/

// ============================================
// EJEMPLO DE MIDDLEWARE DE PROTECCIÓN POR ROL
// ============================================

const checkRole = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    
    if (!rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ 
        error: 'Acceso denegado',
        mensaje: `Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`
      });
    }
    
    next();
  };
};

// Uso en rutas:
/*
router.post('/productos', authMiddleware, checkRole(['gerente', 'administrador']), async (req, res) => {
  // Solo gerentes o administradores pueden crear productos
});

router.get('/auditoria', authMiddleware, checkRole(['administrador', 'gerente']), async (req, res) => {
  // Solo gerentes o admins pueden ver auditoría
});
*/

// ============================================
// ESTRUCTURA DE TABLA USUARIO (actualizada)
// ============================================

/*
CREATE TABLE usuario (
    id_usuario              INT PRIMARY KEY,
    id_sede                 INT REFERENCES sede(id_sede),
    nombre_usuario          VARCHAR(50) UNIQUE,
    contrasena              VARCHAR(255),
    email                   VARCHAR(100) UNIQUE,
    rol                     VARCHAR(50) DEFAULT 'empleado',  ← Nuevo/Actualizado
    activo                  BOOLEAN DEFAULT TRUE,
    direccion               VARCHAR(255),
    numero_cel              VARCHAR(15),
    ciudad                  VARCHAR(100),
    fecha_creacion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Roles válidos:
- 'empleado' (rol por defecto)
- 'vendedor'
- 'gerente'
- 'administrador'
*/

// ============================================
// TESTING
// ============================================

/*
1. IR A: http://localhost:3000/pages/registrar-cuenta.html

2. Completar el formulario selectando diferentes roles:
   - Empleado
   - Vendedor
   - Gerente

3. Verificar en BD:
   SELECT id_usuario, nombre_usuario, rol FROM usuario ORDER BY fecha_creacion DESC;

4. Hacer login y verificar que el rol está en el JWT:
   - Abrir DevTools (F12)
   - Console
   - localStorage.getItem('authToken') → Copiar el token
   - Ir a jwt.io y decodificar el token
   - Verificar que contiene: { "rol": "vendedor", ... }
*/

// ============================================
// PRÓXIMOS PASOS
// ============================================

/*
Para completar la implementación de roles:

1. Crear middleware de autorización en cada ruta
2. Implementar verificación de permisos por acción
3. Agregar interfaz para cambiar roles (solo admin)
4. Documentar qué acciones puede hacer cada rol
5. Agregar rastreo de acciones en auditoría según rol
6. Crear reportes diferenciados por rol
*/
