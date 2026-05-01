# Manual de Usuario - Systemsware

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Autenticación y Registro](#autenticación-y-registro)
3. [Página Principal (Dashboard)](#página-principal-dashboard)
4. [Gestión de Productos](#gestión-de-productos)
5. [Gestión de Pedidos](#gestión-de-pedidos)
6. [Reportes de Inventario](#reportes-de-inventario)
7. [Perfil de Usuario](#perfil-de-usuario)
8. [Navegación del Sistema](#navegación-del-sistema)

---

## Introducción

**Systemsware** es un sistema integral de gestión de inventario diseñado para facilitar el control y administración de productos, pedidos y usuarios en múltiples sedes.

### Características Principales
- Gestión completa de productos con control de stock
- Sistema de pedidos integrado
- Reportes detallados de inventario
- Gestión de usuarios por roles y sedes
- Dashboard con estadísticas en tiempo real

---

## Autenticación y Registro

### 1. Iniciar Sesión (`iniciar-sesion.html`)

**Acceso:** Página de login principal

![Página de Inicio de Sesión](images/screenshots/login-page.png)
*Figura 1: Interfaz de inicio de sesión de Systemsware*

**Instrucciones paso a paso:**
1. Ingresa tu correo electrónico en el campo "Correo electrónico"
2. Ingresa tu contraseña en el campo "Contraseña"
3. (Opcional) Marca "Recordarme" para mantener sesión activa
4. Haz clic en "Iniciar Sesión"

**Validaciones:**
- El correo debe tener formato válido (ejemplo@dominio.com)
- La contraseña debe tener al menos 6 caracteres
- El sistema mostrará errores específicos si las credenciales son incorrectas

**Funciones adicionales:**
- Botón 👁️ para mostrar/ocultar contraseña
- Enlace a página de registro si no tienes cuenta
- Redirección automática al dashboard tras login exitoso

**Ejemplo de validación:**
![Error de Validación](images/screenshots/login-error.png)
*Figura 2: Mensaje de error cuando las credenciales son incorrectas*

### 2. Registrar Cuenta (`registrar-cuenta.html`)

**Acceso:** Formulario de creación de nuevos usuarios

![Formulario de Registro](images/screenshots/register-page.png)
*Figura 3: Página de registro de nuevos usuarios con diseño de dos columnas*

**Instrucciones paso a paso:**
1. **Datos Personales (Columna izquierda):**
   - Nombre completo: Ingresa tu nombre y apellido
   - Número de celular: Teléfono de 7-10 dígitos
   - Rol: Selecciona entre Empleado, Vendedor o Gerente

![Datos Personales](images/screenshots/register-personal-data.png)
*Figura 4: Sección de datos personales del formulario de registro*

2. **Ubicación (Columna derecha):**
   - Dirección: Dirección completa (mínimo 5 caracteres)
   - Ciudad: Ciudad de residencia
   - Sede: Selecciona la sede asignada (se carga dinámicamente)

3. **Cuenta (Campos completos):**
   - Correo electrónico: Correo válido para el sistema
   - Contraseña: Mínimo 6 caracteres, debe incluir mayúsculas, minúsculas y números
   - Confirmar contraseña: Repite exactamente la contraseña anterior

![Campos de Cuenta](images/screenshots/register-account-fields.png)
*Figura 5: Campos de creación de cuenta con validaciones de contraseña*

4. **Finalización:**
   - Marca "Acepto los términos y condiciones"
   - Haz clic en "Crear cuenta"

![Registro Exitoso](images/screenshots/register-success.png)
*Figura 6: Mensaje de confirmación cuando el registro se completa exitosamente*

**Validaciones importantes:**
- Nombre solo permite letras y espacios (mínimo 3 caracteres)
- Celular debe ser numérico (7-10 dígitos)
- Las contraseñas deben coincidir exactamente
- Todos los campos son obligatorios

---

## Página Principal (Dashboard)

### Inicio (`inicio.html`)

**Acceso:** Dashboard principal tras iniciar sesión

![Dashboard Principal](images/screenshots/dashboard-overview.png)
*Figura 7: Vista completa del dashboard principal con estadísticas y gráficas*

**Características principales:**
1. **Resumen de Estadísticas:** Vista rápida de métricas clave

![Resumen de Estadísticas](images/screenshots/dashboard-summary.png)
*Figura 8: Panel de resumen con métricas clave del sistema*

2. **Gráficas Interactivas:**
   - Gráfica de Pedidos: Evolución temporal de pedidos
   - Gráfica de Inventario: Estado del stock por categorías
   - Gráfica de Usuarios: Actividad y distribución de usuarios

![Gráficas Interactivas](images/screenshots/dashboard-charts.png)
*Figura 9: Gráficas interactivas con Chart.js para análisis visual*

**Instrucciones de uso:**
- Las gráficas se actualizan automáticamente al cargar la página
- Puedes interactuar con las leyendas para mostrar/ocultar datos
- El panel de estadísticas muestra información en tiempo real

![Interacción con Gráficas](images/screenshots/chart-interaction.png)
*Figura 10: Ejemplo de interacción con las leyendas de las gráficas*

---

## Gestión de Productos

### Productos (`productos.html`)

**Acceso:** Menú principal → Productos

![Vista de Productos](images/screenshots/products-list.png)
*Figura 11: Vista principal de gestión de productos con lista y controles*

**Funcionalidades principales:**

#### 1. Vista General
- **Total de productos:** Contador actualizado en tiempo real
- **Botón Estadísticas:** 📊 Abre panel de métricas detalladas
- **Botón Agregar Producto:** + Abre formulario para nuevos productos

![Controles de Productos](images/screenshots/products-controls.png)
*Figura 12: Barra de controles superiores con estadísticas y botones*

#### 2. Panel de Estadísticas
- **Total Productos:** Número total de productos en el sistema
- **Bajo Stock:** Productos con menos de 10 unidades
- **Agotados:** Productos sin stock disponible
- **Valor Inventario:** Valor total del inventario
- **Productos por Categoría:** Distribución por tipo
- **Productos Más Caros:** Ranking por precio

#### 3. Gestión de Productos
- **Agregar:** Formulario completo para nuevos productos
- **Editar:** Modificar datos de productos existentes
- **Eliminar:** Remover productos del sistema (con confirmación)
- **Buscar:** Filtrado rápido por nombre o código

**Instrucciones paso a paso para agregar producto:**
1. Haz clic en "+ Agregar Producto"
2. Completa todos los campos del formulario
3. Selecciona categoría y proveedor
4. Define precio y stock inicial
5. Haz clic en "Guardar"

**Instrucciones para editar:**
1. Busca el producto en la lista
2. Haz clic en el botón "Editar"
3. Modifica los campos necesarios
4. Guarda los cambios

---

## Gestión de Pedidos

### Pedidos CRUD (`pedidos-crud.html`)

**Acceso:** Menú principal → Pedidos

**Características principales:**
- **Crear Pedidos:** Nuevo formulario de pedido completo
- **Listar Pedidos:** Vista tabular con todos los pedidos
- **Editar Pedidos:** Modificación de pedidos existentes
- **Eliminar Pedidos:** Remoción con confirmación
- **Buscar y Filtrar:** Búsqueda avanzada por múltiples criterios

**Instrucciones para crear pedido:**
1. Haz clic en "Nuevo Pedido"
2. Selecciona cliente del listado desplegable
3. Agrega productos usando el buscador
4. Define cantidades para cada producto
5. Confirma el pedido
6. El sistema calculará totales automáticamente

**Estados de pedido:**
- **Pendiente:** Recién creado, esperando procesamiento
- **En Proceso:** Siendo preparado
- **Completado:** Entregado al cliente
- **Cancelado:** Anulado por cualquier motivo

---

## Reportes de Inventario

### Reporte de Inventario (`reporte-inventario.html`)

**Acceso:** Menú principal → Reportes → Inventario

**Funcionalidades principales:**

#### 1. Generación de Reportes
- **Reporte Completo:** Todos los productos con detalles
- **Reporte por Categoría:** Filtrado por tipo de producto
- **Reporte de Stock Bajo:** Productos con bajo inventario
- **Reporte de Agotados:** Productos sin existencia

#### 2. Exportación
- **Excel:** Exporta a formato .xlsx
- **PDF:** Genera documento PDF con formato profesional
- **Imprimir:** Envía directamente a impresora

#### 3. Filtros Avanzados
- **Rango de fechas:** Por período específico
- **Categorías:** Selección múltiple
- **Rango de precios:** Productos en rango de valor
- **Sede:** Reporte por ubicación específica

**Instrucciones paso a paso:**
1. Selecciona el tipo de reporte deseado
2. Configura los filtros necesarios
3. Haz clic en "Generar Reporte"
4. Espera la carga de datos
5. Usa los botones de exportación según necesites

---

## Perfil de Usuario

### Perfil Principal (`perfil.html`)

**Acceso:** Menú usuario → Mi Perfil

**Secciones disponibles:**

#### 1. Información Personal
- **Nombre y Apellidos:** Datos básicos del usuario
- **Correo Electrónico:** Contacto principal
- **Teléfono:** Número de contacto
- **Dirección:** Ubicación del usuario

#### 2. Información del Sistema
- **Rol:** Nivel de acceso (Empleado, Vendedor, Gerente)
- **Sede Asignada:** Ubicación de trabajo principal
- **Fecha de Registro:** Cuándo se creó la cuenta
- **Último Acceso:** Última vez que inició sesión

#### 3. Seguridad
- **Cambiar Contraseña:** Actualizar credenciales
- **Actividad Reciente:** Registro de acciones en el sistema

**Instrucciones para actualizar perfil:**
1. Haz clic en "Editar Perfil"
2. Modifica los campos necesarios
3. Haz clic en "Guardar Cambios"
4. El sistema validará y actualizará la información

### Información Personal (`informacion-personal.html`)

**Acceso:** Perfil → Información Personal

**Características principales:**
- **Avatar de usuario:** Representación visual del perfil
- **Datos básicos:** Nombre, correo, sede asignada
- **Formulario de edición:** Actualización de datos personales

**Instrucciones paso a paso:**
1. Revisa tu información actual en la tarjeta de perfil
2. Haz clic en "Editar información" para modificar datos
3. Actualiza los campos necesarios (nombre, teléfono, dirección, etc.)
4. Haz clic en "Guardar cambios"
5. El sistema mostrará confirmación de actualización

**Campos editables:**
- Nombre completo
- Número de teléfono
- Dirección
- Ciudad
- Correo electrónico (con validación)

### Ver Usuario Actual (`ver-usuario-actual.html`)

**Acceso:** Perfil → Ver mi información

**Funcionalidades:**
- **Vista detallada:** Todos los datos del usuario en formato tarjeta
- **Información de rol:** Permisos y nivel de acceso
- **Datos de sede:** Ubicación y detalles de la sede asignada
- **Historial de actividad:** Registro de acciones recientes

**Secciones de información:**
1. **Datos Personales:** Nombre, correo, teléfono
2. **Información Laboral:** Rol, sede, fecha de ingreso
3. **Estadísticas de Uso:** Último acceso, número de sesiones
4. **Permisos:** Lista de funcionalidades disponibles

**Instrucciones de uso:**
- La página carga automáticamente los datos del usuario actual
- La información se actualiza en tiempo real
- No requiere acciones adicionales para visualización

---

## Navegación del Sistema

### Estructura de Menú

**Menú Principal (Navegación):**
- **Inicio:** Dashboard con estadísticas
- **Productos:** Gestión completa de inventario
- **Pedidos:** Administración de órdenes
- **Reportes:** Generación de informes
- **Usuarios:** Gestión de personal (solo administradores)
- **Mi Perfil:** Información personal y configuración

### Navegación entre Páginas
- **Barra de navegación:** Siempre visible en la parte superior
- **Migas de pan:** Ruta de navegación actual
- **Botones de acción:** Contextuales según página
- **Búsqueda rápida:** Acceso directo desde cualquier página

### Atajos de Teclado
- **Ctrl + B:** Buscar productos
- **Ctrl + N:** Nuevo (contexto dependiente)
- **Ctrl + S:** Guardar (en formularios)
- **ESC:** Cerrar modales y cancelar acciones

---

## Roles y Permisos

### Empleado
- Ver productos
- Crear pedidos básicos
- Ver reportes simples

### Vendedor
- Todas las funciones de empleado
- Editar productos
- Gestión completa de pedidos
- Reportes avanzados

### Gerente
- Todas las funciones anteriores
- Administración de usuarios
- Configuración del sistema
- Reportes ejecutivos

---

## Solución de Problemas Comunes

### Problemas de Acceso
- **Contraseña olvidada:** Contactar al administrador
- **Cuenta bloqueada:** Esperar 15 minutos o contactar soporte
- **Error de conexión:** Verificar que el servidor esté activo

### Problemas con Productos
- **No se puede agregar:** Verificar permisos y datos requeridos
- **Stock incorrecto:** Actualizar manualmente o sincronizar
- **Producto no encontrado:** Verificar ortografía y filtros

### Problemas con Pedidos
- **Pedido no se crea:** Verificar stock disponible y datos del cliente
- **Error en cálculos:** Refrescar la página y recalcular
- **No se puede modificar:** Verificar estado del pedido

---

## Contacto y Soporte

**Soporte Técnico:**
- **Email:** soporte@systemsware.com
- **Teléfono:** +57 1 234 5678
- **Horario:** Lunes a Viernes 8:00 AM - 6:00 PM

**Capacitación:**
- **Manual técnico:** Disponible para administradores
- **Videos tutoriales:** En el portal de formación
- **Capacitación presencial:** Coordinar con gerencia

---

## Glosario de Términos

- **SKU:** Stock Keeping Unit - Identificador único de producto
- **CRUD:** Create, Read, Update, Delete - Operaciones básicas
- **Dashboard:** Panel principal con métricas
- **Modal:** Ventana emergente para acciones específicas
- **API:** Application Programming Interface - Conexión con servidor

---

*Este manual se actualiza regularmente. Última actualización: Abril 2026*
