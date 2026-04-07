# Sistema de Sedes (Branches/Locations)

## Descripción
Sistema que permite a los usuarios cambiar entre diferentes sedes sin recargar la página, con persistencia de la selección y filtrado automático de datos por sede.

## Componentes Creados

### 1. **Tabla de Base de Datos** (`sql/sedes.sql`)
```sql
CREATE TABLE sede (
    id_sede          INT (Primary Key)
    nombre           VARCHAR(100)  -- Ej: "Sede Principal"
    ciudad           VARCHAR(100)  -- Ej: "Bogotá"
    direccion        VARCHAR(255)  -- Ej: "Carrera 5 #45-67"
    telefono         VARCHAR(20)   -- Ej: "(1) 2345-6789"
    email            VARCHAR(100)  -- Ej: "bogota@systemsware.com"
    encargado        VARCHAR(100)  -- Persona responsable
    activo           BOOLEAN       -- TRUE/FALSE
    fecha_creacion   TIMESTAMP
)
```

**Datos de Prueba Incluidos:**
- Sede Principal (Bogotá)
- Sede Medellín
- Sede Cali
- Sede Barranquilla
- Sede Santa Marta

### 2. **API REST** (`routes/sedes.js`)

#### GET `/api/sedes`
Obtiene todas las sedes activas.
```bash
curl http://localhost:3000/api/sedes
```
**Respuesta:**
```json
{
  "ok": true,
  "sedes": [
    {
      "id_sede": 1,
      "nombre": "Sede Principal",
      "ciudad": "Bogotá",
      "telefono": "(1) 2345-6789",
      ...
    }
  ]
}
```

#### GET `/api/sedes/:id`
Obtiene una sede específica.
```bash
curl http://localhost:3000/api/sedes/1
```

#### POST `/api/sedes`
Crea una nueva sede.
```bash
curl -X POST http://localhost:3000/api/sedes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Sede Nueva",
    "ciudad": "Bogotá",
    "direccion": "Calle 1 #2-3",
    "telefono": "(1) 9876-5432",
    "email": "nueva@systemsware.com",
    "encargado": "Usuario"
  }'
```

#### PUT `/api/sedes/:id`
Actualiza una sede.
```bash
curl -X PUT http://localhost:3000/api/sedes/1 \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Sede Bogotá Actualizada"}'
```

#### DELETE `/api/sedes/:id`
Elimina una sede.
```bash
curl -X DELETE http://localhost:3000/api/sedes/1
```

### 3. **Componente UI** (`javascript/sede-selector.js`)

**Clase: `SedeSelector`**

- **Ubicación:** Fijo en la parte superior de la página (z-index: 9999)
- **Responsive:** Se adapta a pantallas móviles
- **Storage:** Persistencia en `localStorage` (clave: `sedaActual`)

**Métodos Públicos:**
```javascript
// Inicializar el selector
await window.sedeSelector.init();

// Obtener sede actual
const sedeActual = window.sedeSelector.obtenerSedeActual();
// Output: { id_sede: 1, nombre: "Sede Principal", ciudad: "Bogotá", ... }

// Cambiar sede programáticamente
await window.sedeSelector.cambiarSede(2);
```

**Eventos Personalizados:**
```javascript
// Escuchar cambios de sede
window.addEventListener('sedeChanged', (e) => {
  console.log('Nueva sede:', e.detail);
  // Recargar datos de la página aquí si es necesario
});
```

### 4. **Plugin de Filtrado** (`javascript/sede-filter.js`)

**Funcionalidad:**
- Intercepta automáticamente todas las llamadas `fetch` a `/api/`
- Agrega parámetro `id_sede` en rutas GET
- Recarga datos cuando cambia la sede

**Uso:**
```javascript
// Incluir en la página
<script src="../javascript/sede-filter.js"></script>

// Define una función de recarga si quieres actualizar datos
window.recargarDatos = async () => {
  // Tu lógica de recarga
  await cargarInventario();
};
```

## Instalación y Configuración

### Paso 1: Crear la tabla en PostgreSQL
```bash
# Ejecutar en PostgreSQL
psql -U usuario -d base_datos -f sql/sedes.sql
```

### Paso 2: Actualizar routes (YA HECHO)
- ✅ Creado `routes/sedes.js`
- ✅ Registrado en `server.js`

### Paso 3: Integración en páginas
Coloca esto al final del `<body>` en cada página principal:

```html
<!-- Selector de Sedes -->
<script src="../javascript/sede-selector.js"></script>
<script src="../javascript/sede-filter.js"></script>
```

O mejor: Cárgalo en el archivo `nav.html` (YA HECHO)

## Integración con Módulos Existentes

### Ejemplo 1: Reporte de Inventario
```javascript
// En reporte-inventario.html
async function loadInventario() {
  const sede = window.sedeSelector.obtenerSedeActual();
  
  const url = sede 
    ? `/api/inventario/info?id_sede=${sede.id_sede}`
    : '/api/inventario/info';
    
  const response = await fetch(url);
  const result = await response.json();
  
  renderizarInventario(result.movimientos);
}

// Recargar cuando cambia la sede
window.addEventListener('sedeChanged', () => {
  loadInventario();
});
```

### Ejemplo 2: Modificar API para filtrar por sede
```javascript
// En routes/inventario.js
const query = `
  SELECT * FROM inventario i
  LEFT JOIN producto p ON i.codigo_producto = p.codigo_producto
  WHERE ($1::INT IS NULL OR i.id_sede = $1)
  ORDER BY i.fecha_movimiento DESC
`;

const id_sede = req.query.id_sede || null;
const result = await db.query(query, [id_sede]);
```

## Ajustes CSS Automáticos

El componente ajusta automáticamente:
- **Padding Top del Body:** Se agrega `padding-top` para que el contenido no quede debajo del selector
- **Z-index:** 9999 para que siempre esté encima
- **Responsive:** Se adapta para móviles (oculta información secundaria)

## Datos Almacenados en localStorage

```javascript
// Sede actual seleccionada
localStorage.sedaActual = JSON.stringify({
  id_sede: 1,
  nombre: "Sede Principal",
  ciudad: "Bogotá",
  direccion: "Carrera 5 #45-67",
  telefono: "(1) 2345-6789",
  email: "bogota@systemsware.com",
  encargado: "Juan García",
  activo: true,
  fecha_creacion: "2024-01-15T10:30:00.000Z"
})
```

## Próximos Pasos (Opcional)

1. **Multi-sede en Auditoría:** Registrar cambios de sede con timestamp
2. **Permisos por Sede:** Limitar acceso de usuarios a sedes específicas
3. **Reportes por Sede:** Filtros adicionales en reportes
4. **Tabla usuario_sede:** Relación muchos-a-muchos entre usuarios y sedes

## Troubleshooting

### El selector no aparece
```javascript
// Verifica la consola
console.log(window.sedeSelector);
console.log(localStorage.getItem('sedaActual'));
```

### Los datos no se filtran por sede
1. Asegúrate que la API acepta parámetro `id_sede`
2. Verifica que el endpoint filtra en SQL
3. Recarga la página después de cambiar sede

### Error de CORS
Asegúrate que `databasepg.js` está configurado correctamente.

