/**
 * Plugin de Filtrado por Sede
 * Integra automáticamente el filtrado por sede en las llamadas API
 */

// Función auxiliar para obtener la sede actual
function getSedeActual() {
  try {
    const sede = localStorage.getItem('sedaActual');
    return sede ? JSON.parse(sede) : null;
  } catch (e) {
    console.error('Error obteniendo sede actual:', e);
    return null;
  }
}

// Función para agregar ID de sede a los parámetros de búsqueda
function agregarSedeAURL(url) {
  const sede = getSedeActual();
  
  if (!sede || !sede.id_sede) {
    return url;
  }
  
  const separator = url.includes('?') ? '&' : '?';
  return url + separator + 'id_sede=' + sede.id_sede;
}

// Interceptar fetch para agregar parámetro de sede
const originalFetch = window.fetch;
window.fetch = function(...args) {
  let [resource, config] = args;
  
  // Solo aplicar a rutas de API GET
  if (typeof resource === 'string' && resource.includes('/api/') && (!config || config.method !== 'POST' && config.method !== 'PUT' && config.method !== 'DELETE')) {
    resource = agregarSedeAURL(resource);
    args[0] = resource;
  }
  
  return originalFetch.apply(this, args);
};

// Escuchar cambios de sede
window.addEventListener('sedeChanged', (e) => {
  console.log('Sede cambió a:', e.detail.nombre);
  // Recargaría datos si la página lo requiere
  if (window.recargarDatos && typeof window.recargarDatos === 'function') {
    window.recargarDatos();
  }
});

// Mostrar sede actual en consola
console.log('Sede actual:', getSedeActual());
