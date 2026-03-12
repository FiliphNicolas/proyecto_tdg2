// Helper para cargar nav compartido
async function loadSharedNav() {
  try {
    console.log('Cargando navegación...');
    const res = await fetch('nav.html');
    const html = await res.text();
    console.log('HTML de nav cargado:', html.substring(0, 100) + '...');
    const navContainer = document.createElement('div');
    navContainer.innerHTML = html;
    document.body.insertBefore(navContainer, document.body.firstChild);
    console.log('Navegación insertada en el DOM');
    
    // Ejecutar scripts del nav
    const scripts = navContainer.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      newScript.textContent = script.textContent;
      document.head.appendChild(newScript);
    });
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
