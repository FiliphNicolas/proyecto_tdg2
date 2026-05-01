# Manual Técnico - Systemsware

## Tabla de Contenidos
1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Instalación y Configuración](#instalación-y-configuración)
3. [Base de Datos](#base-de-datos)
4. [API Endpoints](#api-endpoints)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Seguridad y Autenticación](#seguridad-y-autenticación)
7. [Middleware y Componentes](#middleware-y-componentes)
8. [Despliegue y Producción](#despliegue-y-producción)
9. [Mantenimiento y Troubleshooting](#mantenimiento-y-troubleshooting)

---

## Arquitectura del Sistema

### Stack Tecnológico
- **Backend:** Node.js con Express.js
- **Base de Datos:** PostgreSQL
- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Autenticación:** JWT (JSON Web Tokens)
- **File Upload:** express-fileupload
- **PDF Generation:** jsPDF con AutoTable

### Patrón Arquitectural
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Base de Datos │
│   (HTML/JS/CSS) │◄──►│   (Express.js)  │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Navegador     │    │   API REST     │    │   Esquema SQL   │
│   Cliente       │    │   Endpoints     │    │   Relacional    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Componentes Principales
- **Servidor Web:** Express.js en puerto 3000
- **Motor de Plantillas:** Static HTML rendering
- **Manejo de Sesiones:** JWT con timeout configurable
- **Gestión de Archivos:** Upload limitado a 50KB
- **Auditoría:** Registro automático de acciones

---

## Instalación y Configuración

### Prerrequisitos
- **Node.js:** Versión 14+ 
- **PostgreSQL:** Versión 12+
- **NPM:** Gestor de paquetes
- **Git:** Control de versiones

### Pasos de Instalación

#### 1. Clonar Repositorio
```bash
git clone <repositorio-url>
cd proyecto_tdg2
```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Configurar Base de Datos
```bash
# Crear base de datos
psql -U postgres -c "CREATE DATABASE systemsware;"

# Importar esquema
psql -U postgres -d systemsware -f sql/schema-completo.sql
```

#### 4. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración
cp .env.example .env

# Editar .env con tus credenciales
nano .env
```

#### 5. Iniciar Servidor
```bash
npm start
```

### Configuración del Archivo .env
```env
# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=systemsware
DB_USER=postgres
DB_PASSWORD=tu_contraseña_aqui

# Servidor
PORT=3000
NODE_ENV=development

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=systemsware_super_secret_key_change_this_in_production

# Opcional: SSL
# DB_SSL=true
# DB_SSL_CERT=path/to/cert.pem
```

---

## Base de Datos

### Esquema Principal

#### Tablas Fundamentales

**1. Sede**
```sql
CREATE TABLE sede (
    id_sede              INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre               VARCHAR(100) NOT NULL,
    ciudad               VARCHAR(100) NOT NULL,
    direccion            VARCHAR(255),
    telefono             VARCHAR(20),
    email                VARCHAR(100),
    encargado            VARCHAR(100),
    activo               BOOLEAN DEFAULT TRUE,
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**2. Usuario**
```sql
CREATE TABLE usuario (
    id_usuario           INT PRIMARY KEY NOT NULL,
    id_sede              INT REFERENCES sede(id_sede),
    nombre_usuario       VARCHAR(50) UNIQUE NOT NULL,
    contrasena           VARCHAR(255) NOT NULL,
    email                VARCHAR(100) UNIQUE NOT NULL,
    rol                  VARCHAR(50) DEFAULT 'empleado',
    activo               BOOLEAN DEFAULT TRUE,
    direccion            VARCHAR(255),
    numero_cel           VARCHAR(15),
    fecha_registro       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**3. Producto**
```sql
CREATE TABLE producto (
    id_producto          INT PRIMARY KEY NOT NULL,
    nombre               VARCHAR(100) NOT NULL,
    descripcion          TEXT,
    precio               DECIMAL(10,2) NOT NULL,
    stock                INT DEFAULT 0,
    categoria            VARCHAR(50),
    proveedor            VARCHAR(100),
    id_sede              INT REFERENCES sede(id_sede),
    activo               BOOLEAN DEFAULT TRUE,
    fecha_creacion       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**4. Pedido**
```sql
CREATE TABLE pedido (
    id_pedido            INT PRIMARY KEY NOT NULL,
    id_cliente           INT REFERENCES cliente(id_cliente),
    id_usuario           INT REFERENCES usuario(id_usuario),
    fecha_pedido         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado               VARCHAR(20) DEFAULT 'pendiente',
    total                DECIMAL(10,2),
    id_sede              INT REFERENCES sede(id_sede)
);
```

**5. Auditoría**
```sql
CREATE TABLE auditoria (
    id_auditoria         INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_usuario           INT REFERENCES usuario(id_usuario),
    accion               VARCHAR(100) NOT NULL,
    tabla_afectada       VARCHAR(50),
    id_registro          INT,
    detalles             JSONB,
    ip_address           INET,
    fecha_accion         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Relaciones y Claves Foráneas
- `usuario.id_sede` → `sede.id_sede`
- `producto.id_sede` → `sede.id_sede`
- `pedido.id_cliente` → `cliente.id_cliente`
- `pedido.id_usuario` → `usuario.id_usuario`
- `auditoria.id_usuario` → `usuario.id_usuario`

#### Índices de Rendimiento
```sql
CREATE INDEX idx_usuario_email ON usuario(email);
CREATE INDEX idx_producto_categoria ON producto(categoria);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_accion);
```

---

## API Endpoints

### Autenticación (`/api/auth`)

#### POST `/api/auth/register`
**Descripción:** Registro de nuevos usuarios
```javascript
Request Body:
{
  nombre: "Juan Pérez",
  correo: "juan@ejemplo.com",
  contrasena: "password123",
  direccion: "Calle 123",
  numero_cel: "3001234567",
  ciudad: "Bogotá",
  rol: "empleado",
  id_sede: 1
}

Response:
{
  ok: true,
  token: "jwt_token_here",
  user: { id_usuario: 1, nombre_usuario: "juanperez", ... }
}
```

#### POST `/api/auth/login`
**Descripción:** Inicio de sesión
```javascript
Request Body:
{
  correo: "juan@ejemplo.com",
  contrasena: "password123",
  rememberMe: true
}

Response:
{
  ok: true,
  token: "jwt_token_here",
  message: "Sesión iniciada correctamente",
  user: { ... }
}
```

#### POST `/api/auth/logout`
**Descripción:** Cierre de sesión
```javascript
Headers: Authorization: Bearer <token>

Response:
{
  ok: true,
  message: "Sesión cerrada correctamente"
}
```

### Productos (`/api/productos`)

#### GET `/api/productos`
**Descripción:** Obtener todos los productos
```javascript
Query Parameters:
- page: número de página (default: 1)
- limit: límite de resultados (default: 10)
- categoria: filtro por categoría
- search: búsqueda por nombre

Response:
{
  ok: true,
  productos: [...],
  total: 100,
  page: 1,
  totalPages: 10
}
```

#### POST `/api/productos`
**Descripción:** Crear nuevo producto
```javascript
Request Body:
{
  nombre: "Producto Ejemplo",
  descripcion: "Descripción del producto",
  precio: 99.99,
  stock: 50,
  categoria: "Electrónicos",
  proveedor: "Proveedor SA",
  id_sede: 1
}

Response:
{
  ok: true,
  producto: { id_producto: 1, ... },
  message: "Producto creado exitosamente"
}
```

#### PUT `/api/productos/:id`
**Descripción:** Actualizar producto existente
```javascript
Request Body: (mismo que POST)
Response: (mismo que POST)
```

#### DELETE `/api/productos/:id`
**Descripción:** Eliminar producto
```javascript
Response:
{
  ok: true,
  message: "Producto eliminado exitosamente"
}
```

### Pedidos (`/api/pedidos`)

#### GET `/api/pedidos`
**Descripción:** Obtener lista de pedidos
```javascript
Query Parameters:
- estado: filtro por estado ('pendiente', 'proceso', 'completado', 'cancelado')
- id_cliente: filtro por cliente
- fecha_inicio: rango de fechas
- fecha_fin: rango de fechas
```

#### POST `/api/pedidos`
**Descripción:** Crear nuevo pedido
```javascript
Request Body:
{
  id_cliente: 1,
  productos: [
    { id_producto: 1, cantidad: 2, precio_unitario: 99.99 },
    { id_producto: 2, cantidad: 1, precio_unitario: 149.99 }
  ],
  id_sede: 1
}

Response:
{
  ok: true,
  pedido: { id_pedido: 1, ... },
  message: "Pedido creado exitosamente"
}
```

### Usuarios (`/api/usuarios`)

#### GET `/api/usuarios`
**Descripción:** Obtener usuarios (solo admin/gerente)
#### POST `/api/usuarios`
**Descripción:** Crear usuario (solo admin)
#### PUT `/api/usuarios/:id`
**Descripción:** Actualizar usuario
#### DELETE `/api/usuarios/:id`
**Descripción:** Eliminar usuario (solo admin)

### Estadísticas (`/api/estadisticas`)

#### GET `/api/estadisticas/dashboard`
**Descripción:** Datos para dashboard principal
```javascript
Response:
{
  ok: true,
  data: {
    totalProductos: 150,
    bajoStock: 12,
    agotados: 3,
    valorInventario: 50000.00,
    pedidosPendientes: 8,
    usuariosActivos: 25
  }
}
```

---

## Estructura del Proyecto

### Directorios Principales
```
proyecto_tdg2/
├── css/                 # Estilos CSS
├── javascript/          # Scripts del frontend
├── json/               # Datos JSON
├── pages/              # Páginas HTML
├── public/             # Archivos públicos
├── routes/             # Rutas API
├── sql/                # Scripts SQL
├── .env.example        # Configuración de ejemplo
├── package.json        # Dependencias
├── server.js           # Servidor principal
└── README.md           # Documentación
```

### Backend Structure

#### `/routes/` - Módulos API
- `auth.js` - Autenticación y sesiones
- `productos.js` - Gestión de productos
- `pedidos.js` - Gestión de pedidos
- `usuarios.js` - Gestión de usuarios
- `clientes.js` - Gestión de clientes
- `sedes.js` - Gestión de sedes
- `inventario.js` - Control de inventario
- `auditoria.js` - Registro de auditoría
- `estadisticas.js` - Métricas y reportes

#### `/javascript/` - Utilidades Backend
- `databasepg.js` - Conexión a PostgreSQL
- `auth-middleware.js` - Middleware de autenticación
- `audit-middleware.js` - Middleware de auditoría
- `session-timeout.js` - Gestión de sesiones

### Frontend Structure

#### `/pages/` - Páginas HTML
- `inicio.html` - Dashboard principal
- `iniciar-sesion.html` - Login
- `registrar-cuenta.html` - Registro
- `productos.html` - Gestión de productos
- `pedidos-crud.html` - CRUD de pedidos
- `reporte-inventario.html` - Reportes
- `perfil.html` - Perfil de usuario

#### `/javascript/` - Scripts Frontend
- `auth-modals.js` - Modales de autenticación
- `nav-loader.js` - Carga de navegación
- `graficas.js` - Gráficas con Chart.js
- `sede-selector.js` - Selector de sedes

---

## Seguridad y Autenticación

### Sistema de Autenticación JWT

#### Flujo de Autenticación
1. **Login:** Usuario envía credenciales
2. **Validación:** Servidor verifica en base de datos
3. **Token Generation:** Se crea JWT con datos del usuario
4. **Storage:** Token se almacena en localStorage
5. **Request Validation:** Cada request incluye token en headers

#### Estructura del Token JWT
```javascript
{
  "id_usuario": 1,
  "nombre_usuario": "juanperez",
  "rol": "empleado",
  "id_sede": 1,
  "iat": 1642694400,
  "exp": 1642698000
}
```

#### Middleware de Autenticación
```javascript
// auth-middleware.js
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Token requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Token inválido' });
  }
}
```

### Control de Sesiones

#### Características
- **Timeout:** 10 minutos de inactividad
- **Máximo Concurrentes:** 3 sesiones por usuario
- **Cleanup:** Limpieza automática de sesiones expiradas
- **Tracking:** Registro de actividad por sesión

#### Tabla de Sesiones
```sql
CREATE TABLE user_sessions (
    id_session           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario           INT REFERENCES usuario(id_usuario),
    token_hash          VARCHAR(64) NOT NULL,
    ip_address          INET,
    user_agent          TEXT,
    is_active           BOOLEAN DEFAULT TRUE,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at          TIMESTAMP,
    last_activity       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Seguridad de Contraseñas

#### Hashing con bcrypt
```javascript
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

#### Políticas de Contraseña
- Mínimo 6 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número

### Auditoría y Logging

#### Registro Automático
```javascript
// audit-middleware.js
function auditAction(req, res, next) {
  const auditData = {
    id_usuario: req.user?.id_usuario,
    accion: `${req.method} ${req.path}`,
    tabla_afectada: getAffectedTable(req.path),
    detalles: { body: req.body, params: req.params },
    ip_address: req.ip
  };
  
  // Guardar en tabla auditoría
  saveAuditRecord(auditData);
  next();
}
```

---

## Middleware y Componentes

### Middleware Principales

#### 1. CORS Configuration
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

#### 2. File Upload Handler
```javascript
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 50 * 1024 }, // 50KB
  abortOnLimit: true,
  responseOnLimit: 'Archivo demasiado grande'
}));
```

#### 3. Static Files Serving
```javascript
app.use(express.static(path.join(__dirname, 'public')));
```

#### 4. Body Parsers
```javascript
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

### Componentes Reutilizables

#### Database Connection Pool
```javascript
// databasepg.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

#### Error Handler Global
```javascript
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    ok: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});
```

---

## Despliegue y Producción

### Configuración de Producción

#### 1. Variables de Entorno
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=super_secure_production_key_here
DB_SSL=true
```

#### 2. PM2 Configuration
```json
{
  "name": "systemsware",
  "script": "server.js",
  "instances": "max",
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "production",
    "PORT": 3000
  },
  "error_file": "logs/err.log",
  "out_file": "logs/out.log",
  "log_file": "logs/combined.log"
}
```

#### 3. Nginx Reverse Proxy
```nginx
server {
    listen 80;
    server_name systemsware.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Base de Datos en Producción

#### 1. PostgreSQL Configuration
```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
```

#### 2. Backup Strategy
```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U postgres systemsware > backup_$DATE.sql
gzip backup_$DATE.sql

# Keep last 7 days
find /backups -name "backup_*.sql.gz" -mtime +7 -delete
```

#### 3. Connection Pooling
```javascript
// Production pool settings
const pool = new Pool({
  max: 50,
  min: 5,
  acquire: 30000,
  idle: 10000
});
```

### SSL/HTTPS Configuration

#### 1. Let's Encrypt Setup
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d systemsware.com
```

#### 2. Express HTTPS
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('/etc/letsencrypt/live/systemsware.com/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/systemsware.com/fullchain.pem')
};

https.createServer(options, app).listen(443);
```

---

## Mantenimiento y Troubleshooting

### Monitoring y Logging

#### 1. Application Logging
```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});
```

#### 2. Database Monitoring
```sql
-- Monitor active connections
SELECT * FROM pg_stat_activity WHERE state = 'active';

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### 3. Performance Metrics
```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbCheck = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      database: dbCheck.rows[0].now,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  } catch (err) {
    res.status(503).json({ status: 'unhealthy', error: err.message });
  }
});
```

### Common Issues y Solutions

#### 1. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d systemsware

# Restart PostgreSQL
sudo systemctl restart postgresql
```

#### 2. Memory Leaks
```javascript
// Monitor memory usage
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log(`Memory: RSS=${memUsage.rss/1024/1024}MB, Heap=${memUsage.heapUsed/1024/1024}MB`);
}, 60000);
```

#### 3. Session Management
```javascript
// Cleanup expired sessions
cron.schedule('0 */6 * * *', async () => {
  await cleanupExpiredSessions();
  logger.info('Expired sessions cleaned up');
});
```

### Backup y Recovery

#### 1. Automated Backups
```bash
#!/bin/bash
# /scripts/backup.sh
BACKUP_DIR="/backups/systemsware"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
pg_dump -h localhost -U postgres systemsware | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://systemsware-backups/
```

#### 2. Point-in-Time Recovery
```bash
# Restore from backup
gunzip -c backup_20231201_120000.sql.gz | psql -h localhost -U postgres systemsware

# Verify data integrity
psql -U postgres -d systemsware -c "SELECT COUNT(*) FROM usuario;"
```

### Security Best Practices

#### 1. Regular Updates
```bash
# Update dependencies
npm audit fix
npm update

# Security scan
npm audit
```

#### 2. Environment Security
```bash
# Secure .env file
chmod 600 .env

# Use environment-specific secrets
export JWT_SECRET=$(openssl rand -base64 32)
```

#### 3. Input Validation
```javascript
// Sanitize inputs
const validator = require('validator');

function sanitizeInput(input) {
  return validator.escape(input.trim());
}
```

---

## Referencias y Recursos

### Documentación Oficial
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [PostgreSQL Manual](https://www.postgresql.org/docs/)
- [JWT Handbook](https://jwt.io/)

### Herramientas Recomendadas
- **API Testing:** Postman, Insomnia
- **Database Management:** pgAdmin, DBeaver
- **Monitoring:** PM2, New Relic
- **Logging:** Winston, Morgan

### Scripts Útiles
```bash
# Development
npm run dev          # Start development server
npm run lint         # Run ESLint
npm run verify       # Verify configuration

# Production
npm start            # Start production server
pm2 start ecosystem.config.js
pm2 logs systemsware
```

---

*Manual Técnico Systemsware v1.0 - Última actualización: Abril 2026*
