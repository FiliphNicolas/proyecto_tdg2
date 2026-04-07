# Base de Datos SYSTEMSWARE - Documentación Completa

## Estructura General

```
systemsware
├── 8 Tablas principales
├── 8 Índices de performance
└── 33 Registros de prueba
```

---

## 1. TABLA: SEDE 🏢
**Descripción:** Sucursales/oficinas del sistema

```sql
CREATE TABLE sede (
    id_sede              INT PRIMARY KEY (IDENTITY),
    nombre               VARCHAR(100)  -- Ej: "Sede Principal"
    ciudad               VARCHAR(100)  -- Ej: "Bogotá"
    direccion            VARCHAR(255)  -- Ej: "Carrera 5 #45-67"
    telefono             VARCHAR(20)   -- Ej: "(1) 2345-6789"
    email                VARCHAR(100)  -- Ej: "bogota@systemsware.com"
    encargado            VARCHAR(100)  -- Persona responsable
    activo               BOOLEAN       -- TRUE/FALSE
    fecha_creacion       TIMESTAMP
    fecha_actualizacion  TIMESTAMP
);
```

**Registros:** 5 sedes
- Sede Principal (Bogotá)
- Sede Medellín
- Sede Cali
- Sede Barranquilla
- Sede Santa Marta

---

## 2. TABLA: CLIENTE 👤
**Descripción:** Clientes/compradores del sistema

```sql
CREATE TABLE cliente (
    id_cliente           INT PRIMARY KEY,
    nombre               VARCHAR(100),
    apellido             VARCHAR(100),
    email                VARCHAR(100) UNIQUE,
    telefono             VARCHAR(15),
    direccion            VARCHAR(255),
    fecha_registro       TIMESTAMP,
    fecha_actualizacion  TIMESTAMP
);
```

**Registros:** 5 clientes
- Juan Pérez, María García, Carlos Rodríguez, Ana Martínez, Luis Sánchez

---

## 3. TABLA: USUARIO 👨‍💼
**Descripción:** Usuarios del sistema (empleados)

```sql
CREATE TABLE usuario (
    id_usuario           INT PRIMARY KEY,
    nombre_usuario       VARCHAR(50) UNIQUE,
    contrasena           VARCHAR(255),  -- Hash bcrypt
    email                VARCHAR(100) UNIQUE,
    rol                  VARCHAR(50),   -- admin|vendedor|empleado
    activo               BOOLEAN,
    direccion            VARCHAR(255),
    numero_cel           VARCHAR(15),
    ciudad               VARCHAR(100),
    fecha_creacion       TIMESTAMP,
    fecha_actualizacion  TIMESTAMP
);
```

**Registros:** 3 usuarios
- admin (admin@systemsware.com)
- vendedor1 (vendedor@systemsware.com)
- empleado1 (empleado@systemsware.com)

---

## 4. TABLA: PRODUCTO 📦
**Descripción:** Catálogo de productos

```sql
CREATE TABLE producto (
    codigo_producto      VARCHAR(30) PRIMARY KEY,  -- PK
    nombre               VARCHAR(150),
    descripcion          VARCHAR(500),
    precio               NUMERIC(10,2),
    cantidad_stock       INT,
    categoria            VARCHAR(100),
    fecha_creacion       TIMESTAMP,
    fecha_actualizacion  TIMESTAMP
);
```

**Registros:** 5 productos
| Código | Nombre | Precio | Stock |
|--------|--------|--------|-------|
| PROD-001 | Laptop Dell XPS 13 | $1,200.00 | 15 |
| PROD-002 | Mouse Logitech MX | $79.99 | 50 |
| PROD-003 | Teclado Mecánico RGB | $149.99 | 30 |
| PROD-004 | Monitor LG 27" | $399.99 | 20 |
| PROD-005 | SSD Kingston 1TB | $89.99 | 100 |

---

## 5. TABLA: PEDIDO 🛒
**Descripción:** Pedidos realizados por clientes

```sql
CREATE TABLE pedido (
    id_pedido            INT PRIMARY KEY (IDENTITY),
    numero_pedido        VARCHAR(50) UNIQUE,
    nombre_cliente       VARCHAR(255),
    email_cliente        VARCHAR(255),
    telefono_cliente     VARCHAR(50),
    estado_pedido        VARCHAR(50),  -- pending|processing|shipped|delivered|cancelled
    fecha_pedido         DATE,
    monto_total          DECIMAL(10,2),
    direccion_envio      TEXT,
    notas_pedido         TEXT,
    fecha_creacion       TIMESTAMP,
    fecha_actualizacion  TIMESTAMP
);
```

**Registros:** 5 pedidos
| # | Número | Cliente | Estado | Monto | Fecha |
|---|--------|---------|--------|-------|-------|
| 1 | PED-001 | Juan Pérez | delivered | $1,500.00 | 2026-03-15 |
| 2 | PED-002 | María García | processing | $2,800.50 | 2026-03-16 |
| 3 | PED-003 | Carlos Rodríguez | shipped | $950.75 | 2026-03-17 |
| 4 | PED-004 | Ana Martínez | pending | $3,200.00 | 2026-03-18 |
| 5 | PED-005 | Luis Sánchez | cancelled | $750.25 | 2026-03-19 |

---

## 6. TABLA: DETALLE_PEDIDO 📋
**Descripción:** Items dentro de cada pedido

```sql
CREATE TABLE detalle_pedido (
    codigo_detalle       VARCHAR(10) PRIMARY KEY,
    id_pedido            INT FK → pedido(id_pedido),
    codigo_producto      VARCHAR(30) FK → producto(codigo_producto),
    cantidad             INT,
    precio_unitario      NUMERIC(10,2)
);
```

**Registros:** 5 detalles
- DET-001: PED-001 → PROD-001 (1x Laptop → $1,200.00)
- DET-002: PED-001 → PROD-002 (2x Mouse → $79.99/u)
- DET-003: PED-002 → PROD-003 (1x Teclado → $149.99)
- DET-004: PED-002 → PROD-004 (1x Monitor → $399.99)
- DET-005: PED-003 → PROD-005 (2x SSD → $89.99/u)

---

## 7. TABLA: INVENTARIO 📊
**Descripción:** Movimientos de inventario (entradas/salidas)

```sql
CREATE TABLE inventario (
    id_movimiento        INT PRIMARY KEY (IDENTITY),
    codigo_producto      VARCHAR(30) FK → producto(codigo_producto),
    tipo_movimiento      VARCHAR(50),  -- entrada|salida|devolución|ajuste
    cantidad             INT,
    fecha_movimiento     TIMESTAMP,
    descripcion          VARCHAR(255)
);
```

**Registros:** 5 movimientos
1. PROD-001: ENTRADA +20 → Compra a proveedor distribuidor A
2. PROD-002: ENTRADA +100 → Compra a proveedor distribuidor B
3. PROD-001: SALIDA -5 → Venta pedido PED-001
4. PROD-003: ENTRADA +50 → Reposición de stock
5. PROD-004: SALIDA -1 → Venta pedido PED-002

---

## 8. TABLA: AUDITORIA 📝
**Descripción:** Registro de todas las acciones del sistema

```sql
CREATE TABLE auditoria (
    id_auditoria         INT PRIMARY KEY (IDENTITY),
    id_usuario           INT FK → usuario(id_usuario),
    tabla_afectada       VARCHAR(50),
    accion               VARCHAR(50),  -- INSERT|UPDATE|DELETE
    fecha_accion         TIMESTAMP,
    detalles             TEXT
);
```

**Registros:** Vacía (se llena automáticamente con cada acción)

---

## Diagrama de Relaciones (ER)

```
┌─────────────┐
│    SEDE     │
│─────────────│
│ id_sede (PK)│
│ nombre      │
│ ciudad      │
│ teléfono    │
└─────────────┘
       ▲
       │
   ┌───┴─────────────────────────────────────┐
   │                                         │
┌──▼──────────┐                     ┌────────▼─────┐
│  USUARIO    │                     │   CLIENTE    │
│─────────────│                     │──────────────│
│ id_usuario●─┼─┐                   │ id_cliente●  │
│ nombre      │ │                   │ nombre       │
│ rol         │ │                   │ email        │
└─────────────┘ │                   └──────────────┘
                │
                │ refieren
                │
          ┌─────▼──────────┐
          │   AUDITORIA    │
          │────────────────│
          │ id_auditoria   │
          │ id_usuario● ────┤
          │ tabla_afectada  │
          └────────────────┘


┌──────────────────┐              ┌────────────────┐
│    PRODUCTO      │              │     PEDIDO     │
│──────────────────│              │────────────────│
│ codigo_producto●─┼──┐        ┌──│ id_pedido●     │
│ nombre           │  │        │  │ numero_pedido  │
│ precio           │  │        │  │ estado_pedido  │
│ cantidad_stock   │  │        │  │ monto_total    │
└──────────────────┘  │        │  └────────────────┘
         ▲            │        │
         │            │        │
         │        ┌───▼────────▼──┐
         │        │ DETALLE_PEDIDO│
         │        │────────────────│
         │        │ codigo_detalle │
         │        │ id_pedido●─────┤
         └────────│ codigo_producto●
                  │ cantidad       │
                  │ precio_unitario│
                  └────────────────┘


┌─────────────────┐
│   INVENTARIO    │
│─────────────────│
│ id_movimiento   │
│ codigo_producto●─┬─→ PRODUCTO
│ tipo_movimiento │
│ cantidad        │
│ fecha_movimiento│
└─────────────────┘
```

---

## Relaciones y Restricciones

| FK | DE | HACIA | ACCIÓN |
|----|----|----|---|
| detalle_pedido.id_pedido | PEDIDO | pedido.id_pedido | CASCADE |
| detalle_pedido.codigo_producto | PRODUCTO | producto.codigo_producto | RESTRICT |
| inventario.codigo_producto | PRODUCTO | producto.codigo_producto | RESTRICT |
| auditoria.id_usuario | USUARIO | usuario.id_usuario | RESTRICT |

---

## Índices Creados (Performance)

```sql
-- Búsquedas frecuentes
CREATE INDEX idx_pedido_fecha ON pedido(fecha_pedido);
CREATE INDEX idx_pedido_estado ON pedido(estado_pedido);
CREATE INDEX idx_inventario_producto ON inventario(codigo_producto);
CREATE INDEX idx_inventario_fecha ON inventario(fecha_movimiento);
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_cliente_email ON cliente(email);
CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_accion);
```

---

## Estadísticas

| Tabla | Registros | Propósito |
|-------|-----------|----------|
| sede | 5 | Gestionar sucursales |
| cliente | 5 | Registrar clientes |
| usuario | 3 | Control de acceso |
| producto | 5 | Catálogo de productos |
| pedido | 5 | Órdenes de venta |
| detalle_pedido | 5 | Items por orden |
| inventario | 5 | Movimientos de stock |
| auditoria | 0 | Trazabilidad de acciones |
| **TOTAL** | **33** | - |

---

## Scripts Útiles de Consulta

### Ver todas las tablas
```sql
\dt
```

### Ver estructura de una tabla
```sql
\d nombre_tabla
```

### Contar registros por tabla
```sql
SELECT 
    'cliente' as tabla, COUNT(*) as registros FROM cliente UNION
SELECT 'usuario', COUNT(*) FROM usuario UNION
SELECT 'producto', COUNT(*) FROM producto UNION
SELECT 'pedido', COUNT(*) FROM pedido UNION
SELECT 'detalle_pedido', COUNT(*) FROM detalle_pedido UNION
SELECT 'inventario', COUNT(*) FROM inventario UNION
SELECT 'auditoria', COUNT(*) FROM auditoria UNION
SELECT 'sede', COUNT(*) FROM sede;
```

### Ver relaciones (Foreign Keys)
```sql
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

---

## Instalación Completa (Desde Cero)

### Opción 1: Ejecutar schema completo (RECOMENDADO)
```bash
psql -U postgres -d systemsware -f sql/schema-completo.sql
```

### Opción 2: Paso a paso
```bash
# 1. Crear base de datos
createdb -U postgres systemsware

# 2. Conectar y ejecutar scripts
psql -U postgres -d systemsware -f sql/base-de-datos.sql
psql -U postgres -d systemsware -f sql/sedes.sql
psql -U postgres -d systemsware -f sql/datos-prueba.sql
```

---

## Estado Actual de la BD

✅ **TABLA SEDE:** Creada + 5 datos precargados
✅ **TABLA CLIENTE:** Creada + 5 datos precargados
✅ **TABLA USUARIO:** Creada + 3 datos precargados
✅ **TABLA PRODUCTO:** Creada + 5 datos precargados
✅ **TABLA PEDIDO:** Creada + 5 datos precargados
✅ **TABLA DETALLE_PEDIDO:** Creada + 5 datos precargados
✅ **TABLA INVENTARIO:** Creada + 5 datos precargados
✅ **TABLA AUDITORIA:** Creada (vacía)
✅ **ÍNDICES:** 8 índices creados para performance
✅ **API ROUTES:** Todas operacionales (/api/sedes, /api/pedidos, /api/inventario, etc.)

---

## Próximos Pasos

1. **Frontend:** Integrar filtrado por sede en:
   - `reporte-inventario.html`
   - `pedidos-crud.html`
   - Otros módulos

2. **Relaciones Avanzadas:** Crear tabla `usuario_sede` para:
   - Asignar usuarios a sedes específicas
   - Control granular de permisos

3. **Auditoría:** Conectar sistema de auditoría para:
   - Registrar cambios automáticos
   - Trazabilidad completa

