# Systemsware – Sistema de Gestión Integral

## Descripción 

**Systemsware** es un sistema de gestión web completo diseñado para pequeñas y medianas empresas que requieren control integral de inventario, pedidos, usuarios y atención al cliente. La aplicación centraliza la gestión de productos, almacenes, movimientos de stock, estado de cuentas y proporciona herramientas avanzadas de reportes y un chatbot inteligente para soporte 24/7.

### Características principales

- ✅ **Autenticación avanzada** con JWT y roles (admin, empleado, vendedor)
- ✅ **Estado de cuenta completo** con estadísticas en tiempo real
- ✅ **Chatbot inteligente** con respuestas contextuales
- ✅ **Gestión de productos**: alta, baja, modificación, categorías
- ✅ **Control de inventario** y movimientos (entradas/salidas/ajustes)
- ✅ **Sistema de pedidos** con seguimiento completo
- ✅ **Reportes PDF** con filtros avanzados y exportación
- ✅ **Soporte/chat integrado** con asistente virtual
- ✅ **Administración de perfiles** y usuarios
- ✅ **Base de datos PostgreSQL** con trazabilidad completa
- ✅ **UI/UX moderna** con gradientes y diseño responsive

---

## 📋 Requisitos previos

Antes de instalar Systemsware, asegúrate de tener:

- **Node.js** (v14 o superior) — [descargar](https://nodejs.org/)
- **PostgreSQL** (v12 o superior) — [descargar](https://www.postgresql.org/download/)
- **npm** (incluido con Node.js)

---

## 🆕 Nuevas Funcionalidades (v2.0)

### 🤖 Chatbot Inteligente
- **Asistente virtual 24/7** con respuestas contextuales
- **Indicador de escritura** animado para mejor UX
- **Respuestas rápidas** predefinidas (Servicios, Precios, Soporte, Inventario)
- **Interfaz conversacional** moderna con gradientes
- **Integración completa** con el sistema de gestión

### 📊 Estado de Cuenta Avanzado
- **Dashboard personal** con información completa del usuario
- **Estadísticas en tiempo real**: total pedidos, gastado, pendientes, completados
- **Historial de pedidos** con detalles y estados
- **Movimientos de inventario** (para roles autorizados)
- **Avatar automático** con iniciales del usuario
- **Diseño responsive** con tarjetas y tablas modernas

### 🎨 Mejoras de UI/UX
- **Diseño moderno** con gradientes y sombras suaves
- **Animaciones fluidas** y transiciones elegantes
- **Header centrado** perfectamente alineado
- **Mensajes del chatbot** centrados verticalmente
- **Interfaz limpia** e intuitiva

---

## 🚀 Instalación y configuración

### 1. Clonar o descargar el proyecto

```bash
cd c:\Users\pc\Desktop\systemsware\ sistema\ de\ invetario\proyecto_tdg2
```

### 2. Instalar dependencias

```bash
npm install
```

Esto descargará e instalará todas las librerías necesarias (`express`, `bcrypt`, `jsonwebtoken`, `pg`, `cors`, etc.).

### 3. Configurar la base de datos

#### a) Crear la base de datos en PostgreSQL

```bash
psql -U postgres
```

Dentro de PostgreSQL:

```sql
CREATE DATABASE Systemsware;
```

#### b) Ejecutar el script de creación de tablas

```bash
psql -U postgres -d Systemsware -f "base de datos/base-de-datos.sql"
```

#### c) Llenar con datos de prueba (opcional)

```bash
psql -U postgres -d Systemsware -f "base de datos/datos-prueba.sql"
```

### 4. Configurar variables de entorno (opcional)

Crea un archivo `.env` en la raíz del proyecto con:

```env
PORT=3000
DB_USER=postgres
DB_PASSWORD=1234
DB_HOST=localhost
DB_NAME=Systemsware
JWT_SECRET=tu_secreto_seguro_aqui
```

Si no creas este archivo, usará valores por defecto (los que aparecen arriba).

---

## ▶️ Ejecutar el servidor

```bash
npm start
```

O directamente:

```bash
node server.js
```

Deberías ver en la consola:

```
Server running on port 3000
```

Ahora abre en tu navegador:

```
http://localhost:3000/index.html
```

---

## 👤 Credenciales de prueba

Si ejecutaste `datos-prueba.sql`, puedes ingresar con:

| Usuario | Correo | Contraseña | Rol |
|---------|--------|------------|-----|
| admin | admin@systemsware.com | 123456 | Admin |
| empleado1 | empleado1@systemsware.com | 123456 | Empleado |
| empleado2 | empleado2@systemsware.com | 123456 | Empleado |
| vendedor | vendedor@systemsware.com | 123456 | Vendedor |

---

## 📖 Guía de uso

### Registro de nuevo usuario

1. Accede a `http://localhost:3000/registrar-cuenta.html`
2. Completa el formulario con:
   - Nombre
   - Dirección
   - Número de celular
   - Ciudad
   - Correo electrónico
   - Contraseña (mínimo 6 caracteres)
3. Haz clic en **"Registrar cuenta"**
4. Se te redirigirá automáticamente al inicio con sesión iniciada

### Iniciar sesión

1. Ve a `http://localhost:3000/iniciar-sesion.html`
2. Ingresa tu correo y contraseña
3. Haz clic en **"Iniciar Sesión"**
4. Se abrirá el panel principal del sistema

### Pantalla principal (Dashboard)

Encontrarás acceso a:

- **📦 Inventario** — Ver, agregar, editar productos y movimientos
- **📊 Reportes** — Generar reportes de stock y ventas con exportación PDF
- **👤 Mi perfil** — Editar datos personales y cambiar contraseña
- **� Ver estado de cuenta** — Dashboard completo con estadísticas
- **💬 Chatbot** — Asistente virtual inteligente 24/7
- **⚙️ Configuración** — Opciones del sistema

### 🤖 Usar el Chatbot

1. Accede al **Chatbot** desde el menú principal
2. El asistente te saludará automáticamente
3. Puedes usar las **respuestas rápidas**:
   - **Servicios** - Información sobre servicios disponibles
   - **Precios** - Tarifas y costos
   - **Soporte** - Contacto y ayuda técnica
   - **Inventario** - Consulta de productos y stock
4. Escribe tu pregunta en lenguaje natural
5. El chatbot responderá con información contextualizada

### 📊 Estado de Cuenta

1. Ve a **Ver estado de cuenta** desde tu perfil
2. Verás tu **información personal** completa:
   - Nombre, email, rol, teléfono, dirección
   - Avatar automático con tus iniciales
3. Consulta tus **estadísticas**:
   - Total de pedidos realizados
   - Total gastado
   - Pedidos pendientes y completados
4. Revisa tu **historial de pedidos** reciente
5. Si tienes rol autorizado, verás **movimientos de inventario**

### Gestión de productos

1. Abre **Inventario**
2. Para **agregar un producto**:
   - Haz clic en "Nuevo producto"
   - Completa: nombre, descripción, precio, stock, categoría
   - Guarda
3. Para **editar**: haz clic en el producto y modifica los datos
4. Para **eliminar**: selecciona y confirma

### Generar reportes

1. Ve a **Reportes**
2. Puedes filtrar por:
   - Categoría de productos
   - Rango de fechas
   - Rango de precios
3. Haz clic en **"Descargar"** para exportar a CSV o PDF

### Editar perfil

1. Accede a **Mi perfil**
2. Modifica nombre, correo o contraseña
3. Haz clic en **"Guardar cambios"**

---

## 🔧 Resolución de problemas

### Error: "No se pudo conectar al servidor"

**Solución:**
- Verifica que Node.js esté ejecutándose: `npm start`
- Comprueba que estés en la URL correcta: `http://localhost:3000`
- Abre las **DevTools** del navegador (F12) y revisa la pestaña **Console** para más detalles

### Error: 405 (Method Not Allowed)

**Solución:**
- Reinicia el servidor: cierra y ejecuta de nuevo `npm start`
- Limpia la caché del navegador (Ctrl+Shift+Supr)

### Error: "Connection refused" en la base de datos

**Solución:**
- Verifica que PostgreSQL esté corriendo
- En Windows, abre **Services** y busca "postgresql-x64"
- Comprueba credenciales en `databasepg.js`:
  ```javascript
  user: 'postgres',
  password: '1234',  // cambia si tu contraseña es diferente
  host: 'localhost',
  database: 'Systemsware'
  ```

### Error: "Base de datos no existe"

**Solución:**
- Crea la BD manualmente:
  ```bash
  psql -U postgres -c "CREATE DATABASE Systemsware;"
  ```
- Luego ejecuta el script de tablas

---

## 📁 Estructura del proyecto

```
proyecto_tdg2/
├── 🚀 server.js                          # Servidor Express principal
├── 🗄️ databasepg.js                      # Conexión a PostgreSQL
├── 🔐 auth-check.js                      # Validación de autenticación
├── 📦 package.json                       # Dependencias del proyecto
├── 🎨 styles.css                         # Estilos globales modernos
├── 🧭 nav-loader.js                      # Cargador de navegación dinámico
│
├── 🌐 Páginas HTML/
│   ├── 📄 index.html                     # Página principal
│   ├── 📄 iniciar-sesion.html            # Login
│   ├── 📄 registrar-cuenta.html          # Registro
│   ├── 📄 perfil.html                    # Perfil de usuario
│   ├── 📄 ver-estado-cuenta.html         # Estado de cuenta (NUEVO)
│   ├── 📄 productos.html                 # Gestión de productos
│   ├── 📄 reporte-inventario.html        # Reportes con PDF
│   ├── 📄 chatbot.html                   # Chatbot inteligente (NUEVO)
│   └── 📄 servicio.html                  # Servicios
│
└── 🗃️ Base de datos/
    ├── 📄 base-de-datos.sql              # Creación de tablas
    ├── 📄 datos-prueba.sql               # Datos de ejemplo
    └── 📄 update-database-schema.sql     # Actualizaciones de schema
```

---

## 🛠️ Stack Tecnológico

### Backend
- **Node.js + Express.js** - Servidor web y API REST
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación y autorización
- **bcrypt** - Encriptación de contraseñas
- **PDFKit** - Generación de reportes PDF

### Frontend
- **HTML5 Semántico** - Estructura accesible
- **CSS3 Moderno** - Gradientes, animaciones, responsive design
- **JavaScript Vanilla** - Lógica del cliente sin frameworks
- **Flexbox/Grid** - Layouts modernos y adaptables

### Características Técnicas
- **RESTful API** con endpoints documentados
- **Middleware de autenticación** JWT
- **Validación de inputs** y sanitización
- **CORS configurado** para desarrollo
- **Manejo de errores** centralizado

---

## 🔐 Seguridad

- Las contraseñas se almacenan hasheadas con **bcrypt** (salt 10)
- Los tokens de sesión usan **JWT** con expiración de 8 horas
- Todas las rutas de API están protegidas con middleware de autenticación
- Las peticiones entre cliente y servidor usan **CORS** y **HTTPS en producción**

---

## 📞 Soporte

Si encuentras problemas:

1. Revisa los **logs del servidor terminal**
2. Abre las **DevTools** del navegador (F12)
3. Verifica la conexión a la **base de datos** con `psql`
4. Consulta el archivo `INSTRUCCIONES.md` para pasos detallados

---

## 📝 Notas de desarrollo

- Para desarrollo activo con auto-reinicio: `npx nodemon server.js`
- Los cambios en `server.js` requieren reiniciar manualmente el servidor
- Las credenciales de la BD están en `databasepg.js`; cámbialas en variables de entorno para producción
- El chatbot utiliza JavaScript vanilla con manejo de eventos moderno
- Los estilos usan CSS Grid y Flexbox para diseño responsive
- Los reportes PDF se generan con PDFKit con plantillas personalizadas

---

## 📞 Soporte y Contacto

Si encuentras problemas:

1. 📋 Revisa los **logs del servidor terminal**
2. 🔍 Abre las **DevTools** del navegador (F12)
3. 🗄️ Verifica la conexión a la **base de datos** con `psql`
4. 📖 Consulta el archivo `INSTRUCCIONES.md` para pasos detallados
5. 🤖 Prueba el **chatbot** para ayuda contextualizada

**Contacto técnico:**
- **Email:** fsuan62@uan.edu.co
- **Teléfono:** 3114317402
- **Web:** www.systemsware.com

---

**Última actualización:** 16 de marzo de 2026  
**Versión:** 2.0.1  
**Estado:** ✅ Producción estable

---

**Systemsware © 2026 - Todos los derechos reservados**

