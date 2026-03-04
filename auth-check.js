/**
 * Script de verificación de autenticación
 * Redirige a login si el usuario no tiene token válido
 */

function checkAuth() {
    const token = localStorage.getItem('authToken');
    if (!token) {
        // No hay token, redirigir a login
        window.location.href = 'iniciar seccion.html';
        return false;
    }
    return true;
}

function getAuthToken() {
    return localStorage.getItem('authToken');
}

function getUserName() {
    return localStorage.getItem('userName') || 'Usuario';
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userName');
    window.location.href = 'iniciar seccion.html';
}

// Crear encabezado de autenticación para fetch requests
function getAuthHeaders() {
    const token = getAuthToken();
    return {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json'
    };
}

// Ejecutar verificación automáticamente al cargar el script
window.addEventListener('DOMContentLoaded', () => {
    // Obtener el nombre de la página actual
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Páginas que NO requieren autenticación
    const publicPages = [
        'iniciar seccion.html',
        'registrar cuenta.html',
        'recuperar.html',
        'index.html',
        'servicio.html'
    ];
    
    // Si la página requiere autenticación y no hay token
    if (!publicPages.includes(currentPage)) {
        checkAuth();
    }
});
