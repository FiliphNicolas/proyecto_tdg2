# 📊 Base de Datos - Systemsware

## 🗂️ Estructura de Archivos SQL

### 📋 `base-de-datos.sql`
- **Descripción**: Script principal de creación de la base de datos
- **Contenido**: 
  - Creación de base de datos `Systemsware`
  - Definición de todas las tablas
  - Relaciones y constraints
- **Uso**: `psql -f base-de-datos.sql`

### 📄 `datos-prueba.sql`
- **Descripción**: Datos de ejemplo para testing
- **Contenido**:
  - Usuarios de prueba
  - Productos de ejemplo
  - Datos de inventario
  - Registros de auditoría
- **Uso**: `psql -d Systemsware -f datos-prueba.sql`

### 🔧 `update-auditoria.sql`
- **Descripción**: Actualizaciones y migraciones de la tabla auditoría
- **Contenido**: 
  - Modificaciones de estructura
  - Nuevos campos
  - Indices de rendimiento
- **Uso**: `psql -d Systemsware -f update-auditoria.sql`

## 🚀 Instalación Rápida

```bash
# 1. Crear base de datos
psql -f sql/base-de-datos.sql

# 2. Cargar datos de prueba (opcional)
psql -d Systemsware -f sql/datos-prueba.sql

# 3. Aplicar actualizaciones (si es necesario)
psql -d Systemsware -f sql/update-auditoria.sql
```

## 📚 Tablas Principales

- **`usuario`**: Gestión de usuarios y autenticación
- **`producto`**: Catálogo de productos e inventario
- **`pedido`**: Gestión de pedidos y ventas
- **`cliente`**: Información de clientes
- **`inventario`**: Movimientos de inventario
- **`auditoria`**: Registro de actividades

## 🔐 Variables de Entorno

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=systemsware
DB_USER=postgres
DB_PASSWORD=1234
```

## 📝 Notas

- Los archivos SQL deben ejecutarse en orden: base-de-datos → datos-prueba → update-auditoria
- La base de datos utiliza PostgreSQL
- Todos los timestamps usan CURRENT_TIMESTAMP
- Los IDs son secuenciales excepto `codigo_producto` que es VARCHAR
