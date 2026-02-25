// Helper para cargar nav compartido
async function loadSharedNav() {
  try {
    const res = await fetch('nav.html');
    const html = await res.text();
    const navContainer = document.createElement('div');
    navContainer.innerHTML = html;
    document.body.insertBefore(navContainer, document.body.firstChild);
  } catch (err) {
    console.error('Error cargando navegación:', err);
  }
}

// Ejecutar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSharedNav);
} else {
  loadSharedNav();
}
