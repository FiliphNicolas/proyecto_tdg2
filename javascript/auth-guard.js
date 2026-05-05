/**
 * AuthGuard - Protección de páginas para usuarios no autenticados
 * Redirige a iniciar-sesion.html si no hay sesión activa
 */
(function() {
  'use strict';

  // Función para verificar autenticación y redirigir si es necesario
  function checkAuth() {
    // Verificar si authService está disponible
    if (typeof authService === 'undefined') {
      console.error('AuthGuard: authService no está disponible');
      // Esperar a que authService se cargue
      setTimeout(checkAuth, 100);
      return;
    }

    // Verificar si hay sesión activa
    if (!authService.isAuthenticated()) {
      // Guardar la URL actual para redirección post-login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/pages/iniciar-sesion.html') {
        sessionStorage.setItem('redirectAfterLogin', currentPath);
      }
      
      // Redirigir a login de manera segura
      window.location.replace('/pages/iniciar-sesion.html');
      return;
    }

    // Verificar que el token sea válido llamando al endpoint /me
    fetch('/api/auth/me', {
      headers: authService.getAuthHeaders()
    })
    .then(response => {
      if (!response.ok) {
        // Token inválido, limpiar y redirigir
        authService.clearAuth();
        window.location.replace('/pages/iniciar-sesion.html');
      }
    })
    .catch(() => {
      // Error de red, asumir que no hay conexión pero mantener en la página
      console.warn('AuthGuard: No se pudo verificar sesión con el servidor');
    });
  }

  // Ejecutar verificación inmediatamente
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
