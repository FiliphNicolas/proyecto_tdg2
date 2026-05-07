# Guía de Deployment en Render

## Configuración de PostgreSQL en Render

### 1. Crear Base de Datos PostgreSQL en Render

1. Ve al Dashboard de Render: https://dashboard.render.com
2. Haz clic en **"New"** → **"PostgreSQL"**
3. Configura:
   - **Name**: `systemsware-db` (o el nombre que prefieras)
   - **Database**: `systemsware`
   - **User**: deja el valor por defecto
   - **Region**: elige la más cercana a tus usuarios
4. Haz clic en **"Create Database"**
5. Espera a que se cree (toma unos minutos)

### 2. Obtener DATABASE_URL

Una vez creada la base de datos:

1. Entra a tu base de datos en el dashboard
2. Busca el campo **"Internal Database URL"** o **"External Database URL"**
3. Copia la URL completa, tiene este formato:
   ```
   postgres://username:password@host:5432/database
   ```

### 3. Configurar Variables de Entorno en el Web Service

En tu Web Service de Render:

1. Ve a **"Environment"** → **"Environment Variables"**
2. Agrega estas variables:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DATABASE_URL` | `postgres://...` | La URL copiada del paso anterior |
| `NODE_ENV` | `production` | Indica ambiente de producción |
| `JWT_SECRET` | `tu-secreto-jwt-32-caracteres` | Secreto para tokens JWT (mínimo 32 chars) |
| `REFRESH_SECRET` | `tu-secreto-refresh-32-caracteres` | Secreto para refresh tokens |
| `PORT` | `10000` | Render asigna automáticamente |

**⚠️ IMPORTANTE**: No necesitas configurar `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` cuando usas `DATABASE_URL`.

### 4. Inicializar la Base de Datos

Tienes dos opciones:

#### Opción A: Usando Render Shell (Recomendado)

1. En tu Web Service, ve a **"Shell"**
2. Ejecuta:
   ```bash
   psql $DATABASE_URL -f sql/schema-completo.sql
   ```

#### Opción B: Conectar desde local

1. Copia la **External Database URL** (termina en `.ondigitalocean.app` o similar)
2. Desde tu terminal local:
   ```bash
   psql "postgresql://username:password@host:5432/database" -f sql/schema-completo.sql
   ```

### 5. Verificar Conexión

Revisa los logs de tu Web Service en Render. Deberías ver:

```
Usando DATABASE_URL para conexión a PostgreSQL
 Database connection successful
 Database tables verified
 Base de datos lista y conectada
 Server running on port 10000
```

### Troubleshooting

#### Error: "self-signed certificate"
Si ves este error, verifica que `NODE_ENV=production` esté configurado. Esto habilita SSL con `rejectUnauthorized: false`.

#### Error: "Connection refused"
- Verifica que la base de datos esté en estado "Available"
- Confirma que `DATABASE_URL` esté correctamente copiada
- Asegúrate de no tener espacios al inicio o final de la URL

#### Error: "database does not exist"
La base de datos debe crearse manualmente o ejecutar el schema SQL.

### Estructura de Variables en Render

```
Web Service (Node.js)
├── DATABASE_URL = postgres://user:pass@host:5432/dbname
├── NODE_ENV = production
├── JWT_SECRET = mi-secreto-super-seguro-32-caracteres!
└── REFRESH_SECRET = otro-secreto-diferente-32-caracteres!

PostgreSQL Service
├── Internal Database URL (para servicios en Render)
└── External Database URL (para conexiones externas)
```

---

**Nota**: El código ya fue actualizado para soportar `DATABASE_URL`. Solo necesitas configurar las variables en Render.
