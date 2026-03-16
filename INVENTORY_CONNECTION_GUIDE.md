# 📦 Guía de Conexión - Sistema de Inventario Systemsware

## 🎯 Overview
El sistema de inventario está completamente conectado entre la base de datos PostgreSQL, el backend Node.js/Express y las páginas web frontend.

## 🔗 Conexiones Principales

### 1. Base de Datos (PostgreSQL)
- **Tabla `inventario`**: Almacena todos los movimientos de inventario
- **Tabla `producto`**: Contiene información de productos y stock actual
- **Relación**: `inventario.codigo_producto` → `producto.codigo_producto`

### 2. Backend API (server.js)
- **GET `/api/public/inventario`**: Obtiene todos los movimientos con filtros
- **POST `/api/public/inventario`**: Agrega nuevos movimientos y actualiza stock
- **GET `/api/public/productos`**: Lista todos los productos disponibles

### 3. Frontend Pages
- **`gestion-inventario.html`**: Formulario para agregar movimientos
- **`reporte-inventario.html`**: Reporte completo con filtros y exportación
- **`test-inventario.html`**: Página de pruebas para verificar conexiones

## 🚀 Flujo de Datos

```
Usuario → Frontend → API → PostgreSQL → API → Frontend → Usuario
```

### Ejemplo: Agregar Movimiento
1. Usuario selecciona producto y cantidad en `gestion-inventario.html`
2. Frontend envía POST a `/api/public/inventario`
3. Backend inserta movimiento en tabla `inventario`
4. Backend actualiza `cantidad_stock` en tabla `producto`
5. Backend devuelve confirmación al frontend
6. Frontend muestra mensaje de éxito y actualiza UI

## 📊 Estructura de Datos

### Movimiento de Inventario
```json
{
  "codigo_producto": "PROD-001",
  "tipo_movimiento": "entrada", // o "salida"
  "cantidad": 10,
  "descripcion": "Compra a proveedor"
}
```

### Respuesta API
```json
{
  "ok": true,
  "movements": [
    {
      "codigo_producto": "PROD-001",
      "nombre_producto": "Laptop Dell Inspiron 15",
      "tipo_movimiento": "entrada",
      "cantidad": 20,
      "descripcion": "Compra inicial",
      "fecha_movimiento": "2025-01-15T10:30:00Z"
    }
  ]
}
```

## 🛠️ Características Implementadas

### Gestión de Inventario
- ✅ Agregar movimientos (entrada/salida)
- ✅ Actualización automática de stock
- ✅ Validación de productos existentes
- ✅ Información en tiempo real del producto

### Reporte de Inventario
- ✅ Listado completo de movimientos
- ✅ Filtros por producto, tipo, fecha
- ✅ Estadísticas (totales, entradas, salidas)
- ✅ Exportación a Excel y PDF
- ✅ Impresión optimizada

### Navegación
- ✅ Menú integrado con acceso directo
- ✅ Indicador de página activa
- ✅ Enlaces entre gestión y reportes

## 🧪 Pruebas y Verificación

### 1. Test de Conexión API
Visita `http://localhost:3000/test-inventario.html` para:
- Probar conexión a `/api/public/inventario`
- Probar conexión a `/api/public/productos`
- Agregar movimiento de prueba
- Ver respuestas en tiempo real

### 2. Datos de Prueba
El archivo `datos-prueba.sql` incluye:
- 15 productos de ejemplo
- 7 movimientos de inventario
- Usuarios de prueba (contraseña: "123456")

## 🔧 Configuración

### Variables de Entorno (.env)
```
PORT=3000
JWT_SECRET=systemsware_secret_change_this
# Configuración PostgreSQL en databasepg.js
```

### Dependencias Clave
- `express`: Servidor web
- `pg`: Cliente PostgreSQL
- `jsonwebtoken`: Autenticación
- `bcrypt`: Hash de contraseñas

## 📱 Uso del Sistema

### Para Agregar Movimientos:
1. Navega a "Gestión Inventario" en el menú
2. Selecciona un producto del dropdown
3. Elige tipo (entrada/salida)
4. Ingresa cantidad y descripción
5. Click en "Guardar Movimiento"

### Para Ver Reportes:
1. Navega a "Reporte Inventario" en el menú
2. Usa filtros si es necesario
3. Exporta a Excel/PDF o imprime

### Para Probar Conexión:
1. Visita `test-inventario.html`
2. Click en los botones de prueba
3. Revisa los resultados en pantalla

## 🚨 Solución de Problemas

### Si la API no responde:
1. Verifica que el servidor esté corriendo: `node server.js`
2. Revisa la consola para errores
3. Confirma conexión a PostgreSQL

### Si no hay datos:
1. Ejecuta `datos-prueba.sql` en tu base de datos
2. Verifica que las tablas existan
3. Revisa permisos de la base de datos

### Si los movimientos no actualizan stock:
1. Verifica el trigger en el backend (líneas 572-576 en server.js)
2. Confirma que el producto exista
3. Revisa la transacción en la base de datos

## 🔄 Flujo Completo

1. **Inicio**: Servidor levanta en puerto 3000
2. **Conexión**: Base de datos PostgreSQL inicializada
3. **Carga**: Productos y movimientos disponibles
4. **Operación**: Usuarios gestionan inventario vía web
5. **Reportes**: Datos exportables en múltiples formatos
6. **Auditoría**: Todos los cambios registrados

---

**Estado**: ✅ Sistema completamente funcional y conectado
**Última actualización**: 2025-06-17
**Versión**: 1.0
