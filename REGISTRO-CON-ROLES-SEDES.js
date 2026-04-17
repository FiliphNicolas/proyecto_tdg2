/**
 * GUÍA: REGISTRO CON ROLES Y SEDES DINÁMICAS
 * ===========================================
 * 
 * Se agregó selector de roles y sedes al formulario de registro
 * Las sedes se cargan dinámicamente desde la API
 */

// ============================================
// CAMBIOS REALIZADOS
// ============================================

/*
1. FRONTEND (pages/registrar-cuenta.html):
   ✅ Agregado selector de ROLES
      - Empleado (por defecto)
      - Vendedor
      - Gerente
   
   ✅ Agregado selector de SEDES (dinámico)
      - Se carga automáticamente desde API /api/sedes
      - Muestra "Nombre (Ciudad)" para cada opción
      - Validación: Obligatorio seleccionar sede
   
   ✅ Función cargarSedes()
      - Llamada al cargar la página
      - Valida respuesta de API
      - Maneja errores gracefully
   
   ✅ Validación completa
      - rol: debe ser empleado, vendedor o gerente
      - sede: debe ser un ID válido de sede

2. BACKEND (routes/auth.js - POST /api/auth/register):
   ✅ Acepta nuevo parámetro: id_sede
   ✅ Valida que la sede exista
   ✅ Si no proporciona sede: usa la primera disponible
   ✅ Crea usuario con: id_usuario, id_sede, rol
   ✅ Retorna usuario con id_sede en la respuesta

3. API PÚBLICA (routes/sedes.js - GET /api/sedes):
   ✅ Endpoint SIN AUTENTICACIÓN
   ✅ Devuelve todas las sedes activas
   ✅ Formato: { ok, sedes: [...], total }
   ✅ Ya existía, solo se está usando ahora
*/

// ============================================
// FLOW DE REGISTRO CON ROL Y SEDE
// ============================================

/*
1. Usuario abre: http://localhost:3000/pages/registrar-cuenta.html

2. JavaScript ejecuta:
   - window.addEventListener('DOMContentLoaded')
   - Llama a cargarSedes()

3. cargarSedes() hace:
   - fetch('GET', '/api/sedes')
   - Recibe lista de sedes
   - Llena el dropdown dinámicamente

4. Usuario completa formulario:
   - Nombre completo
   - Dirección
   - Número de teléfono
   - Ciudad
   - Selecciona ROL
   - Selecciona SEDE
   - Correo
   - Contraseña
   - Confirmar contraseña
   - Acepta términos

5. Usuario hace submit y JavaScript:
   - Valida todos los campos
   - Verifica rol en lista válida
   - Verifica sede es número
   - Hace fetch('POST', '/api/auth/register')

6. Backend valida:
   - Campos requeridos
   - Sede existe en BD
   - Rol es válido
   - Email único

7. Backend crea usuario:
   - INSERT INTO usuario (id_usuario, id_sede, nombre_usuario, ...)
   - Retorna usuario con id_sede

8. Frontend recibe respuesta:
   - Guarda token en localStorage
   - Redirige a inicio
*/

// ============================================
// EJEMPLOS DE REQUEST Y RESPONSE
// ============================================

/*
REQUEST - REGISTRO CON ROL Y SEDE:
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan Vendedor",
  "direccion": "Carrera 5 #123",
  "numero_cel": "3001234567",
  "ciudad": "Bogotá",
  "rol": "vendedor",
  "id_sede": 1,
  "correo": "juan@systemsware.com",
  "contrasena": "Password123"
}

RESPONSE 200 OK:
{
  "ok": true,
  "user": {
    "id_usuario": 4,
    "nombre_usuario": "Juan Vendedor",
    "email": "juan@systemsware.com",
    "rol": "vendedor",
    "id_sede": 1
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

TOKEN DECODIFICADO:
{
  "id_usuario": 4,
  "nombre_usuario": "Juan Vendedor",
  "rol": "vendedor",
  "id_sede": 1,
  "iat": 1681410000,
  "exp": 1681431600
}

---

REQUEST - OBTENER SEDES (sin autenticación):
GET /api/sedes

RESPONSE 200 OK:
{
  "ok": true,
  "sedes": [
    {
      "id_sede": 1,
      "nombre": "Sede Principal",
      "ciudad": "Bogotá",
      "direccion": "Carrera 5 #45-67, Centro comercial Platino",
      "telefono": "(1) 2345-6789",
      "email": "bogota@systemsware.com",
      "encargado": "Juan García",
      "activo": true,
      "fecha_creacion": "2026-04-13T10:30:45.123Z"
    },
    {
      "id_sede": 2,
      "nombre": "Sede Sur",
      "ciudad": "Bogotá",
      "direccion": "Carrera #123-45, Edificio Las Palmas",
      "telefono": "(4) 5678-1234",
      "email": "sur@systemsware.com",
      "encargado": "María López",
      "activo": true,
      "fecha_creacion": "2026-04-13T10:30:45.123Z"
    }
  ],
  "total": 2
}

---

ERROR - SEDE NO EXISTE:
REQUEST: { ..., "id_sede": 999 }

RESPONSE 400 Bad Request:
{
  "error": "La sede especificada no existe"
}

---

ERROR - EMAIL YA REGISTRADO:
REQUEST: { "correo": "juan@systemsware.com", ... }
(Si Juan ya existe)

RESPONSE 409 Conflict:
{
  "error": "El usuario o correo ya existe"
}
*/

// ============================================
// VERIFICAR EN BASE DE DATOS
// ============================================

/*
1. Conectarse a PostgreSQL:
   psql -U postgres -d Systemsware

2. Ver nuevo usuario con sede y rol:
   SELECT id_usuario, nombre_usuario, email, rol, id_sede, ciudad 
   FROM usuario 
   ORDER BY fecha_creacion DESC 
   LIMIT 5;

3. Ver usuario con información de su sede:
   SELECT 
     u.id_usuario,
     u.nombre_usuario,
     u.rol,
     s.nombre as sede_nombre,
     s.ciudad
   FROM usuario u
   LEFT JOIN sede s ON u.id_sede = s.id_sede
   ORDER BY u.fecha_creacion DESC;

4. Ver todos los usuarios por sede:
   SELECT 
     s.nombre as sede,
     COUNT(u.id_usuario) as cantidad_usuarios,
     COUNT(CASE WHEN u.rol = 'vendedor' THEN 1 END) as vendedores,
     COUNT(CASE WHEN u.rol = 'gerente' THEN 1 END) as gerentes,
     COUNT(CASE WHEN u.rol = 'empleado' THEN 1 END) as empleados
   FROM sede s
   LEFT JOIN usuario u ON s.id_sede = u.id_sede
   GROUP BY s.id_sede, s.nombre;
*/

// ============================================
// TESTING DEL FRONTEND
// ============================================

/*
1. Abrir registro:
   http://localhost:3000/pages/registrar-cuenta.html

2. Verificar que el dropdown de sedes:
   ✅ Se carga automáticamente
   ✅ Muestra: "Sede Principal (Bogotá)"
   ✅ Muestra: "Sede Sur (Bogotá)"

3. Completar formulario y registrar:
   - Nombre: Test Usuario
   - Dirección: Calle Test 123
   - Teléfono: 3005551234
   - Ciudad: Bogotá
   - Rol: Vendedor
   - Sede: Sede Principal
   - Correo: test@systemsware.com
   - Contraseña: Test123456
   - Confirmar: Test123456

4. Verificar resultados:
   ✅ Crea usuario con rol = "vendedor"
   ✅ Crea usuario con id_sede = 1
   ✅ Redirige a inicio.html
   ✅ Token contiene id_sede y rol

5. En DevTools (Console):
   localStorage.getItem('authToken')
   // Copiar token sin comillas
   // Ir a: jwt.io
   // Pegar token
   // Verificar payload tiene: id_sede, rol
*/

// ============================================
// QUERIES ÚTILES PARA ADMINISTRACIÓN
// ============================================

/*
-- Cambiar rol de un usuario (solo admin):
UPDATE usuario 
SET rol = 'gerente' 
WHERE nombre_usuario = 'vendedor1'
RETURNING id_usuario, nombre_usuario, rol;

-- Cambiar sede de un usuario:
UPDATE usuario 
SET id_sede = 2 
WHERE nombre_usuario = 'vendedor1'
RETURNING id_usuario, nombre_usuario, id_sede;

-- Ver auditoría de cambios (triggers):
SELECT * FROM auditoria 
WHERE tabla_afectada = 'usuario' 
ORDER BY fecha_accion DESC 
LIMIT 10;

-- Usuarios sin sede asignada:
SELECT * FROM usuario WHERE id_sede IS NULL;

-- Usuarios por rol:
SELECT rol, COUNT(*) as cantidad 
FROM usuario 
GROUP BY rol 
ORDER BY cantidad DESC;

-- Usuarios sin sede por sede vacía:
UPDATE usuario 
SET id_sede = 1 
WHERE id_sede IS NULL;
*/

// ============================================
// ESTRUCTURA FINAL DE USUARIO
// ============================================

/*
CREATE TABLE usuario (
  id_usuario              INT PRIMARY KEY,
  id_sede                 INT REFERENCES sede(id_sede) ON DELETE SET NULL,
  nombre_usuario          VARCHAR(50) UNIQUE,
  contrasena              VARCHAR(255),
  email                   VARCHAR(100) UNIQUE,
  rol                     VARCHAR(50) DEFAULT 'empleado',
  activo                  BOOLEAN DEFAULT TRUE,
  direccion               VARCHAR(255),
  numero_cel              VARCHAR(15),
  ciudad                  VARCHAR(100),
  fecha_creacion          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

Índices:
- id_usuario (PRIMARY KEY)
- nombre_usuario (UNIQUE)
- email (UNIQUE)
- id_sede (para buscar usuarios por sede)
*/

// ============================================
// PRÓXIMOS PASOS RECOMENDADOS
// ============================================

/*
1. Agregar validación de permisos por rol en rutas protegidas
2. Crear interfaz de administración para cambiar roles/sedes
3. Agregar filtros de usuario por sede en dashboards
4. Implementar restricción de acceso por sede
5. Agregar reportes segmentados por sede
6. Crear API para cambiar rol (solo admin)
*/
