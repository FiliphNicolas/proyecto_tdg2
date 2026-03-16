// Middleware de autenticación para todas las páginas
const path = require('path');

// Middleware para proteger páginas HTML
function protectPages(req, res, next) {
    const url = req.url;
    
    // Páginas públicas que no requieren autenticación
    const publicPages = [
        '/',
        '/iniciar-sesion.html',
        '/registrar-cuenta.html',
        '/index.html',
        '/chatbot.html',
        '/servicio.html',
        '/recuperar.html',
        '/api/login',
        '/api/register',
        '/api/public/',
        '/styles.css',
        '/nav-loader.js',
        '/auth-system.js',
        '/databasepg.js',
        '/favicon.ico'
    ];

    // Verificar si es una página pública
    const isPublic = publicPages.some(page => {
        if (page.endsWith('/')) {
            return url === page;
        }
        return url.startsWith(page);
    });

    // Si es una página pública, permitir acceso
    if (isPublic) {
        return next();
    }

    // Para páginas HTML protegidas, verificar si hay token
    if (url.endsWith('.html') || url === '/') {
        // Servir la página pero el sistema de autenticación del frontend se encargará
        return next();
    }

    // Para APIs protegidas, verificar token
    if (url.startsWith('/api/') && !url.startsWith('/api/public/')) {
        const auth = req.headers.authorization;
        if (!auth) {
            return res.status(401).json({ error: 'No autorizado' });
        }
        
        const parts = auth.split(' ');
        if (parts.length !== 2) {
            return res.status(401).json({ error: 'Formato de token inválido' });
        }
        
        try {
            const jwt = require('jsonwebtoken');
            const payload = jwt.verify(parts[1], process.env.JWT_SECRET || 'secreto');
            req.user = payload;
            next();
        } catch (err) {
            return res.status(401).json({ error: 'Token inválido' });
        }
    } else {
        // Para otros recursos, permitir acceso
        next();
    }
}

// Middleware para servir páginas con verificación de autenticación
function serveProtectedPage(filePath) {
    return (req, res) => {
        const fs = require('fs');
        
        // Verificar si el archivo existe
        fs.readFile(filePath, 'utf8', (err, content) => {
            if (err) {
                return res.status(404).send('Página no encontrada');
            }

            // Inyectar sistema de autenticación si es HTML
            if (filePath.endsWith('.html')) {
                // Verificar si ya tiene el sistema de autenticación
                if (!content.includes('auth-system.js')) {
                    // Inyectar el script de autenticación
                    const authScript = '<script src="auth-system.js"></script>';
                    const bodyCloseIndex = content.lastIndexOf('</body>');
                    
                    if (bodyCloseIndex !== -1) {
                        content = content.slice(0, bodyCloseIndex) + authScript + content.slice(bodyCloseIndex);
                    }
                }

                // Inyectar header de usuario si no existe
                if (!content.includes('auth-header')) {
                    const authHeader = `
                    <div class="auth-header" style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span class="user-name">Usuario</span> | 
                            <span class="user-role">Rol</span>
                        </div>
                        <div>
                            <button onclick="cerrarSesion()" style="background: rgba(255,255,255,0.2); border: none; color: white; padding: 5px 15px; border-radius: 5px; cursor: pointer;">Cerrar Sesión</button>
                        </div>
                    </div>`;
                    
                    const bodyIndex = content.indexOf('<body');
                    if (bodyIndex !== -1) {
                        const bodyEndIndex = content.indexOf('>', bodyIndex);
                        content = content.slice(0, bodyEndIndex + 1) + authHeader + content.slice(bodyEndIndex + 1);
                    }
                }
            }

            res.setHeader('Content-Type', 'text/html');
            res.send(content);
        });
    };
}

module.exports = {
    protectPages,
    serveProtectedPage
};
