# Systemsware – Sistema de Inventario

## Descripción 

**Systemsware** es un sistema de inventario web diseñado para pequeñas y medianas empresas que requieren un control fiable y trazabilidad de sus existencias, movimientos y usuarios. La aplicación centraliza la gestión de productos, almacenes, entradas y salidas de stock, y proporciona herramientas para generar reportes detallados sobre ventas, ajustes e histórico de inventario.

### Características principales

- ✅ Registro e inicio de sesión con roles y permisos (admin, empleado, vendedor)
- ✅ Gestión de productos: alta, baja, modificación, categorías
- ✅ Control de inventario y movimientos (entradas/salidas/ajustes)
- ✅ Generación de reportes y exportación de datos
- ✅ Sistema de soporte/chat integrado
- ✅ Administración de perfiles y usuarios
- ✅ Base de datos PostgreSQL con trazabilidad completa

---

## 📋 Requisitos previos

Antes de instalar Systemsware, asegúrate de tener:

- **Node.js** (v14 o superior) — [descargar](https://nodejs.org/)
- **PostgreSQL** (v12 o superior) — [descargar](https://www.postgresql.org/download/)
- **npm** (incluido con Node.js)

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

- **📦 Inventario** — Ver, agregar, editar productos
- **📊 Reportes** — Generar reportes de stock y ventas
- **👤 Mi perfil** — Editar datos personales y cambiar contraseña
- **💬 Soporte** — Sistema de chat para consultas internas
- **⚙️ Configuración** — Opciones del sistema

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
├── server.js                          # Servidor Express principal
├── databasepg.js                      # Conexión a PostgreSQL
├── auth-check.js                      # Validación de autenticación
├── package.json                       # Dependencias del proyecto
│
├── *.html                             # Páginas web (login, registro, etc.)
├── styles.css                         # Estilos globales
├── nav-loader.js                      # Cargador de navegación
│
└── base de datos/
    ├── base-de-datos.sql              # Creación de tablas
    └── datos-prueba.sql               # Datos de ejemplo
```

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
- Las credenciales de la BD están en `databasepg.js`; cambialas en variables de entorno para producción

---

**Última actualización:** 9 de marzo de 2026  
**Versión:** 1.0.0

