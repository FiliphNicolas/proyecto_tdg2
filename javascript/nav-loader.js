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

    // Cargar script de timeout de sesión
    loadSessionTimeout();
  } catch (err) {
    console.error('Error cargando navegación:', err);
  }
}

// Cargar script de timeout de sesión
function loadSessionTimeout() {
  // Solo cargar en páginas protegidas (no en login o registro)
  const protectedPages = ['/', '/inicio.html', '/perfil.html', '/productos.html', '/pedidos-crud.html', 
                           '/reporte-inventario.html', '/servicio.html'];
  const currentPath = window.location.pathname;
  
  const isProtected = protectedPages.some(page => 
    currentPath === page || currentPath.endsWith(page)
  );

  if (isProtected) {
    const script = document.createElement('script');
    script.src = 'session-timeout.js';
    script.onload = () => console.log('Session timeout script loaded');
    script.onerror = () => console.error('Failed to load session timeout script');
    document.head.appendChild(script);
  }
}

// Ejecutar cuando DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadSharedNav);
} else {
  loadSharedNav();
}
