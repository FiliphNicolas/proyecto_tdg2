# Configuración de PostgreSQL para Systemsware

## 📋 Requisitos

- PostgreSQL 12 o superior
- Node.js 14 o superior
- npm (Node Package Manager)

## 🚀 Configuración Rápida

### 1. Instalar PostgreSQL

**Windows:**
```bash
# Descargar desde https://www.postgresql.org/download/windows/
# O usar Chocolatey
choco install postgresql
```

**macOS:**
```bash
# Usar Homebrew
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 2. Crear Base de Datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE systemsware;

# Crear usuario (opcional)
CREATE USER systemsware_user WITH PASSWORD 'tu_contraseña';
GRANT ALL PRIVILEGES ON DATABASE systemsware TO systemsware_user;

# Salir
\q
```

### 3. Configurar Variables de Entorno

Copiar el archivo de configuración:
```bash
cp .env.example .env
```

Editar el archivo `.env` con tus credenciales:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=systemsware
DB_USER=postgres
DB_PASSWORD=tu_contraseña_real
JWT_SECRET=systemsware_super_secret_key_cambiar_en_produccion
```

### 4. Ejecutar Script de Base de Datos

```bash
# Ejecutar el script para crear tablas
psql -U postgres -d systemsware -f database-setup.sql
```

### 5. Instalar Dependencias y Ejecutar

```bash
# Instalar dependencias
npm install

# Ejecutar el servidor
npm start
```

## 📁 Estructura de Archivos

```
proyecto_tdg2/
├── databasepg.js          # Conexión a PostgreSQL
├── database-setup.sql     # Script para crear tablas
├── server.js            # Servidor Express
├── .env.example         # Plantilla de configuración
├── .env                 # Configuración real (no subir a git)
└── README-Database.md   # Esta documentación
```

## 🗄️ Tablas de la Base de Datos

### Usuario
- `id_usuario` (PK)
- `nombre_usuario`
- `email` (único)
- `contrasena` (hash)
- `rol`
- `activo`
- `fecha_creacion`
- `fecha_actualizacion`

### Producto
- `id_producto` (PK)
- `codigo_producto` (único)
- `nombre`
- `descripcion`
- `precio`
- `cantidad_stock`
- `categoria`
- `fecha_creacion`
- `fecha_actualizacion`

### Categoria
- `id_categoria` (PK)
- `nombre` (único)
- `descripcion`
- `fecha_creacion`

### MovimientoInventario
- `id_movimiento` (PK)
- `id_producto` (FK)
- `id_usuario` (FK)
- `tipo_movimiento`
- `cantidad`
- `cantidad_anterior`
- `cantidad_nueva`
- `motivo`
- `fecha_movimiento`

### Servicio
- `id_servicio` (PK)
- `nombre`
- `descripcion`
- `precio`
- `duracion_estimada`
- `activo`
- `fecha_creacion`

## 🔧 Funciones de Conexión

### `testConnection()`
Prueba la conexión a PostgreSQL y retorna `true`/`false`.

### `initializeDatabase()`
Verifica que las tablas existan y estén listas.

### `query(text, params)`
Ejecuta queries SQL con manejo de errores y logging.

### `getClient()`
Obtiene un cliente del pool para transacciones.

### `closePool()`
Cierra todas las conexiones elegantemente.

## 🚨 Solución de Problemas

### Error: "La tabla Usuario no existe"
```bash
# Ejecutar el script de configuración
psql -U postgres -d systemsware -f database-setup.sql
```

### Error: "Conexión rechazada"
1. Verificar que PostgreSQL esté corriendo
2. Verificar credenciales en `.env`
3. Verificar que el puerto 5432 esté disponible

### Error: "Base de datos no existe"
```bash
# Crear la base de datos
psql -U postgres -c "CREATE DATABASE systemsware;"
```

### Error: "Permiso denegado"
1. Verificar que el usuario tenga permisos
2. Ejecutar con usuario correcto: `psql -U postgres`

## 🐳 Docker (Opcional)

```dockerfile
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: systemsware
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: tu_contraseña
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Ejecutar:
```bash
docker-compose up -d
```

## 🔒 Seguridad en Producción

1. **Cambiar contraseña por defecto**
2. **Usar variables de entorno reales**
3. **Configurar SSL**
4. **Restringir acceso a la base de datos**
5. **Usar JWT_SECRET fuerte y única**
6. **Habilitar logging de auditoría**

## 📊 Monitoreo

El sistema incluye logging automático:
- Conexiones/desconexiones
- Queries ejecutadas con tiempo de ejecución
- Errores de conexión
- Estado del pool de conexiones

## 🔄 Backup

```bash
# Backup completo
pg_dump -U postgres systemsware > backup.sql

# Restaurar
psql -U postgres systemsware < backup.sql
```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del servidor
2. Verifica la configuración en `.env`
3. Asegúrate que PostgreSQL esté corriendo
4. Ejecuta el script de diagnóstico: `npm run verify`
