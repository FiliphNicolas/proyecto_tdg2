# SYSTEMSWARE
## Sistema de Gestión de Inventario
### Documentación Técnica — Versión 2.0 | 2026

---

| Atributo | Valor |
|---|---|
| Proyecto | proyecto_tdg2 |
| Título | Systemsware: Sistema de Gestión de Inventario |
| Versión | 2.0.0 |
| Estado | Producción estable |
| Autor | FiliphNicolas |
| Última actualización | Marzo 2026 |
| Repositorio | github.com/FiliphNicolas/proyecto_tdg2 |

---

## Tabla de Contenidos

1. [Descripción General](#1-descripción-general)
2. [Arquitectura del Sistema](#2-arquitectura-del-sistema)
3. [Base de Datos](#3-base-de-datos)
4. [API REST](#4-api-rest)
5. [Instalación y Configuración](#5-instalación-y-configuración)
6. [Módulos del Sistema](#6-módulos-del-sistema)
7. [Seguridad](#7-seguridad)
8. [Solución de Problemas](#8-solución-de-problemas-comunes)
9. [Guía de Desarrollo](#9-guía-de-desarrollo)
10. [Contacto y Soporte](#10-contacto-y-soporte)

---

## 1. Descripción General

Systemsware es un sistema de gestión web completo diseñado para pequeñas y medianas empresas que requieren control integral de inventario, pedidos, usuarios y atención al cliente. La aplicación centraliza la gestión de productos, almacenes, movimientos de stock, estado de cuentas y proporciona herramientas avanzadas de reportes y un chatbot inteligente para soporte 24/7.

### 1.1 Objetivo del Sistema

Proveer una plataforma centralizada y segura para la administración eficiente del inventario, permitiendo a administradores y empleados gestionar productos, pedidos y reportes desde una interfaz web moderna y responsiva.

### 1.2 Alcance

- Gestión completa de productos e inventario (CRUD)
- Control de movimientos de stock (entradas, salidas, ajustes)
- Sistema de pedidos con seguimiento de estado
- Reportes exportables en PDF y CSV
- Autenticación con JWT y control de roles
- Chatbot de soporte integrado
- Panel de estado de cuenta por usuario

---

## 2. Arquitectura del Sistema

### 2.1 Stack Tecnológico

| Capa | Tecnología | Versión | Descripción |
|---|---|---|---|
| Backend | Node.js + Express.js | v14+ | Servidor web y API REST |
| Base de datos | PostgreSQL | v12+ | Almacenamiento relacional |
| Autenticación | JWT (jsonwebtoken) | Última estable | Tokens de sesión (8h) |
| Cifrado | bcrypt | v5+ | Hash de contraseñas (salt 10) |
| Reportes | PDFKit | Última estable | Generación de PDF en servidor |
| Frontend | HTML5 + CSS3 + JS | Vanilla | Sin frameworks de UI |
| Seguridad CORS | cors (npm) | Última estable | Control de orígenes |

### 2.2 Estructura de Directorios

```
proyecto_tdg2/
├── server.js                    # Servidor Express principal
├── databasepg.js                # Conexión a PostgreSQL
├── auth-check.js                # Middleware de autenticación JWT
├── nav-loader.js                # Cargador de navegación dinámico
├── styles.css                   # Estilos globales
├── package.json                 # Dependencias del proyecto
├── base-de-datos.sql            # Esquema de la base de datos
├── datos-prueba.sql             # Datos de ejemplo para desarrollo
├── update-database-schema.sql   # Migraciones del esquema
├── index.html                   # Página principal / Dashboard
├── iniciar-sesion.html          # Login
├── registrar-cuenta.html        # Registro de usuarios
├── perfil.html                  # Perfil de usuario
├── ver-estado-cuenta.html       # Dashboard de cuenta
├── productos.html               # Gestión de productos
├── reporte-inventario.html      # Reportes con exportación PDF
├── chatbot.html                 # Chatbot inteligente
├── servicio.html                # Servicios
└── soporte tecnico.html         # Soporte técnico
```

### 2.3 Flujo de Autenticación

1. El usuario envía credenciales (email + contraseña) al endpoint `POST /api/login`
2. El servidor verifica la contraseña con `bcrypt.compare()`
3. Si es válido, genera un JWT con payload `{ userId, rol }` y expiración de 8 horas
4. El cliente almacena el token y lo envía en cada petición como cabecera `Authorization`
5. El middleware `auth-check.js` valida el token en cada ruta protegida

---

## 3. Base de Datos

### 3.1 Configuración de Conexión

La conexión a PostgreSQL se configura en `databasepg.js` mediante variables de entorno:

```env
DB_USER     = postgres
DB_PASSWORD = 1234
DB_HOST     = localhost
DB_NAME     = Systemsware
PORT        = 3000
```

### 3.2 Tablas Principales

| Tabla | Descripción | Campos clave |
|---|---|---|
| `usuarios` | Registro de cuentas del sistema | id, nombre, email, contrasena_hash, rol, ciudad, telefono |
| `productos` | Catálogo de productos del inventario | id, nombre, descripcion, precio, stock, categoria, created_at |
| `movimientos` | Historial de entradas/salidas de stock | id, producto_id, tipo, cantidad, fecha, usuario_id |
| `pedidos` | Pedidos realizados por usuarios | id, usuario_id, estado, total, created_at |
| `detalle_pedidos` | Líneas de cada pedido | id, pedido_id, producto_id, cantidad, precio_unitario |

### 3.3 Roles de Usuario

| Rol | Descripción | Permisos principales |
|---|---|---|
| `admin` | Administrador del sistema | Acceso total: usuarios, productos, pedidos, reportes, configuración |
| `empleado` | Personal interno | Gestión de inventario, movimientos, ver reportes |
| `vendedor` | Agente de ventas | Crear pedidos, consultar productos, ver estado de cuenta |
| `usuario` | Cliente registrado | Ver productos, crear pedidos, ver historial propio |

---

## 4. API REST

### 4.1 Endpoints de Autenticación

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| POST | `/api/register` | Registrar nuevo usuario | No |
| POST | `/api/login` | Iniciar sesión y obtener JWT | No |
| POST | `/api/logout` | Cerrar sesión | Sí |
| GET | `/api/profile` | Obtener datos del usuario actual | Sí |
| PUT | `/api/profile` | Actualizar datos del perfil | Sí |

### 4.2 Endpoints de Inventario

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/productos` | Listar todos los productos | Sí |
| GET | `/api/productos/:id` | Obtener producto por ID | Sí |
| POST | `/api/productos` | Crear nuevo producto | Admin/Empleado |
| PUT | `/api/productos/:id` | Actualizar producto | Admin/Empleado |
| DELETE | `/api/productos/:id` | Eliminar producto | Admin |
| GET | `/api/movimientos` | Listar movimientos de stock | Admin/Empleado |
| POST | `/api/movimientos` | Registrar movimiento (entrada/salida) | Admin/Empleado |

### 4.3 Endpoints de Pedidos

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/pedidos` | Listar pedidos del usuario actual | Sí |
| GET | `/api/pedidos/all` | Listar todos los pedidos | Admin/Empleado |
| POST | `/api/pedidos` | Crear nuevo pedido | Sí |
| PUT | `/api/pedidos/:id/estado` | Actualizar estado del pedido | Admin/Empleado |

### 4.4 Endpoints de Reportes

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| GET | `/api/reportes/inventario` | Reporte de stock actual con filtros | Admin/Empleado |
| GET | `/api/reportes/ventas` | Reporte de pedidos y ventas | Admin |
| GET | `/api/reportes/pdf` | Exportar reporte como PDF | Admin/Empleado |

---

## 5. Instalación y Configuración

### 5.1 Requisitos Previos

- Node.js v14 o superior — https://nodejs.org/
- PostgreSQL v12 o superior — https://www.postgresql.org/
- npm (incluido con Node.js)
- Git (para clonar el repositorio)

### 5.2 Pasos de Instalación

**Paso 1: Clonar el repositorio**
```bash
git clone https://github.com/FiliphNicolas/proyecto_tdg2.git
cd proyecto_tdg2
```

**Paso 2: Instalar dependencias**
```bash
npm install
```

**Paso 3: Crear la base de datos**
```bash
psql -U postgres
```
```sql
CREATE DATABASE Systemsware;
\q
```

**Paso 4: Ejecutar el esquema SQL**
```bash
psql -U postgres -d Systemsware -f base-de-datos.sql
```

**Paso 5 (Opcional): Cargar datos de prueba**
```bash
psql -U postgres -d Systemsware -f datos-prueba.sql
```

**Paso 6: Configurar variables de entorno**

Crear archivo `.env` en la raíz del proyecto:
```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=1234
DB_HOST=localhost
DB_NAME=Systemsware
JWT_SECRET=tu_secreto_seguro_aqui
```

**Paso 7: Iniciar el servidor**
```bash
npm start
```

Abrir en el navegador: `http://localhost:3000/index.html`

### 5.3 Credenciales de Prueba

| Usuario | Correo | Contraseña | Rol |
|---|---|---|---|
| admin | admin@systemsware.com | 123456 | Admin |
| empleado1 | empleado1@systemsware.com | 123456 | Empleado |
| empleado2 | empleado2@systemsware.com | 123456 | Empleado |
| vendedor | vendedor@systemsware.com | 123456 | Vendedor |

---

## 6. Módulos del Sistema

### 6.1 Gestión de Inventario

Módulo central del sistema. Permite crear, editar, consultar y eliminar productos del catálogo. Registra movimientos de stock (entradas, salidas y ajustes) con trazabilidad completa por usuario y fecha. Cada movimiento queda registrado con el usuario que lo realizó y la fecha/hora exacta.

### 6.2 Sistema de Pedidos

Permite a los usuarios crear pedidos seleccionando productos del catálogo. Cada pedido tiene un ciclo de vida rastreable: `pendiente` → `procesando` → `completado` o `cancelado`. Los administradores y empleados pueden actualizar el estado y consultar el historial completo.

### 6.3 Generación de Reportes

Genera reportes de inventario y ventas con filtros avanzados (categoría, rango de fechas, rango de precios). Exporta a PDF usando PDFKit con plantillas personalizadas, y a CSV para análisis en hojas de cálculo.

### 6.4 Chatbot Inteligente

Asistente virtual disponible 24/7 integrado directamente en la aplicación. Responde preguntas frecuentes sobre servicios, precios, soporte e inventario. Incluye respuestas rápidas predefinidas y un indicador de escritura animado.

### 6.5 Seguridad y Autenticación

- Contraseñas almacenadas con bcrypt (salt factor 10)
- Sesiones manejadas con JWT con expiración de 8 horas
- Todas las rutas de API protegidas con middleware de autenticación
- Control de acceso basado en roles (RBAC)
- CORS configurado para desarrollo y producción

### 6.6 Estado de Cuenta

Panel personal con estadísticas en tiempo real: total de pedidos, monto gastado, pedidos pendientes y completados. Incluye historial de pedidos recientes y movimientos de inventario para roles autorizados. Avatar generado automáticamente con las iniciales del usuario.

---

## 7. Seguridad

### 7.1 Autenticación JWT

Los tokens JWT se generan al iniciar sesión y contienen el ID y rol del usuario. Tienen una duración de 8 horas. El middleware valida el token antes de procesar cada solicitud a rutas protegidas.

### 7.2 Cifrado de Contraseñas

Todas las contraseñas se almacenan con bcrypt (salt 10). Nunca se guardan en texto plano. La verificación usa `bcrypt.compare()` al iniciar sesión.

### 7.3 Recomendaciones para Producción

- Cambiar `JWT_SECRET` por un valor aleatorio seguro de al menos 32 caracteres
- Configurar HTTPS/SSL en el servidor de producción
- Usar variables de entorno para todas las credenciales sensibles
- Configurar CORS con los orígenes específicos del entorno de producción
- Implementar rate limiting en los endpoints de autenticación
- Habilitar logs de auditoría para operaciones críticas

---

## 8. Solución de Problemas Comunes

| Error | Causa probable | Solución |
|---|---|---|
| No se pudo conectar al servidor | Servidor Node.js no está corriendo | Ejecutar `npm start` y verificar la consola |
| Error 405 Method Not Allowed | Caché del navegador desactualizado | Reiniciar servidor y limpiar caché (Ctrl+Shift+Supr) |
| Connection refused en base de datos | PostgreSQL no está activo | Iniciar el servicio PostgreSQL en el sistema operativo |
| Base de datos no existe | No se creó la BD antes del SQL | Ejecutar: `CREATE DATABASE Systemsware;` |
| Token JWT inválido | Token expirado o mal formado | Cerrar sesión e iniciar sesión nuevamente |
| Error 403 Forbidden | Rol sin permisos para la operación | Verificar que el usuario tenga el rol adecuado |

---

## 9. Guía de Desarrollo

### 9.1 Entorno de Desarrollo

Para desarrollo activo con recarga automática:
```bash
npx nodemon server.js
```

### 9.2 Agregar un Nuevo Endpoint

1. Definir la ruta en `server.js` usando `app.get()`, `app.post()`, `app.put()` o `app.delete()`
2. Agregar el middleware de autenticación si la ruta lo requiere
3. Implementar la lógica usando el objeto `db` de `databasepg.js`
4. Manejar errores con `try/catch` y responder con códigos HTTP apropiados
5. Probar el endpoint con Postman o Insomnia

### 9.3 Convenciones de Código

- JavaScript ES6+ para todo el código de backend y frontend
- Variables y funciones en `camelCase`
- Tablas de base de datos en `snake_case`
- Rutas de API en `kebab-case`: `/api/estado-cuenta`
- Manejo de errores centralizado con `try/catch` en todos los handlers

### 9.4 Próximas Actualizaciones (v2.1)

- Dashboard analítico con gráficos interactivos
- Notificaciones en tiempo real con WebSocket
- Integración con APIs externas de pago y envíos
- Módulo de facturación electrónica
- Sistema de notificaciones por correo electrónico
- Backup automático de base de datos programado

---

## 10. Contacto y Soporte

| Canal | Información |
|---|---|
| Email | soporte@systemsware.com |
| Teléfono | +1 (555) 123-4567 |
| Web | www.systemsware.com |
| Repositorio | github.com/FiliphNicolas/proyecto_tdg2 |

Para reportar errores o solicitar nuevas funcionalidades, abrir un Issue en el repositorio de GitHub del proyecto.

---

*Systemsware © 2026 — Todos los derechos reservados*
