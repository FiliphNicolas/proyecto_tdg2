# 🚀 Instrucciones para ejecutar Systemsware

## Requisitos previos
- Node.js instalado (versión 14+)
- PostgreSQL instalado y ejecutándose
- npm (incluido con Node.js)

## Pasos para ejecutar el proyecto

### 1️⃣ Instalar dependencias
Abre una terminal en la carpeta del proyecto y ejecuta:
```bash
npm install
```

### 2️⃣ Configurar la base de datos
- Abre PostgreSQL
- Ejecuta el archivo `base de datos/base-de-datos.sql` para crear la base de datos
- Verifica que tienes las credenciales correctas:
  - Usuario: `postgres`
  - Contraseña: `1234`
  - Host: `localhost`
  - Base de datos: `systemsware`

### 3️⃣ Iniciar el servidor
Ejecuta el siguiente comando:
```bash
npm start
```

Deberías ver:
```
Server running on port 3000
```

### 4️⃣ Abrir la aplicación
- Abre tu navegador
- Ve a: `http://localhost:3000`
- ¡Listo! La aplicación está lista para usar

## Solución de errores

### Error: "Cannot find module 'express'"
Ejecuta `npm install` nuevamente

### Error: "Cannot connect to database"
1. Verifica que PostgreSQL está ejecutándose
2. Revisa las credenciales en `databasepg.js`
3. Asegúrate de que la base de datos `systemsware` existe

### Error: "Port 3000 already in use"
Cambia el puerto en `server.js`:
```javascript
const PORT = process.env.PORT || 3001; // Cambia 3001 por otro número
```

## Estructura del proyecto

```
📁 systemsware sistema de invetario/
├── 📄 server.js           (Servidor Node.js)
├── 📄 databasepg.js       (Configuración de BD)
├── 📄 package.json        (Dependencias)
├── 📁 base de datos/
│   └── 📄 base-de-datos.sql  (Script SQL)
├── 📄 index.html          (Página de inicio)
├── 📄 iniciar seccion.html (Login)
├── 📄 registrar cuenta.html (Registro)
├── 📄 servicio.html       (Servicios)
├── 📄 generar-reporte.html (Reportes)
├── 📄 perfil.html         (Perfil del usuario)
└── 📄 chatbot.html        (Chatbot)
```

## Funcionalidades principales

✅ **Autenticación**: Registro e inicio de sesión con JWT  
✅ **Reportes**: Generación de reportes de inventario  
✅ **Servicios**: Catálogo de servicios disponibles  
✅ **Chatbot**: Asistente automático con IA basada en palabras clave  
✅ **Perfil**: Gestión de información del usuario  

## Credenciales de prueba

Puedes crear una cuenta nueva o si la BD tiene datos de prueba:
- Email: `test@systemsware.com`
- Contraseña: `123456`

## Soporte

Si tienes problemas:
1. Verifica que todos los servicios estén ejecutándose
2. Revisa la consola del navegador (F12) para errores
3. Revisa los logs del servidor
4. Asegúrate de tener Node.js v14+ instalado

¡Éxito! 🎉
