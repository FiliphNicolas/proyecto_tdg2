#!/usr/bin/env node

/**
 * Script para verificar configuración y bases de datos
 * Antes de iniciar el servidor Systemsware
 */

const fs = require('fs');
const path = require('path');

console.log('\n╔════════════════════════════════════════════════════════╗');
console.log('║     🔍 VERIFICACIÓN DE CONFIGURACIÓN SYSTEMSWARE      ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

// 1. Verificar Node.js
console.log('✓ Node.js version:', process.version);

// 2. Verificar archivos críticos
console.log('\n📋 Verificando archivos...');
const requiredFiles = [
    'server.js',
    'databasepg.js',
    'package.json',
    'styles.css',
    'index.html'
];

let missingFiles = [];
requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${file}`);
    } else {
        console.log(`  ✗ ${file} (FALTANTE)`);
        missingFiles.push(file);
    }
});

if (missingFiles.length > 0) {
    console.log('\n⚠️ ADVERTENCIA: Archivos faltantes:', missingFiles.join(', '));
}

// 3. Verificar node_modules
console.log('\n📦 Verificando dependencias...');
const dependencies = ['express', 'cors', 'bcrypt', 'jsonwebtoken', 'pg'];
const packageJsonPath = path.join(__dirname, 'package.json');

if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
    console.log('  ⚠️  node_modules no encontrado. Ejecuta: npm install');
} else {
    dependencies.forEach(dep => {
        const depPath = path.join(__dirname, 'node_modules', dep);
        if (fs.existsSync(depPath)) {
            console.log(`  ✓ ${dep}`);
        } else {
            console.log(`  ✗ ${dep} (FALTANTE)`);
        }
    });
}

// 4. Verificar puerto disponible
console.log('\n🔌 Verificando puerto 3000...');
const net = require('net');
const server = net.createServer();
server.once('error', function(err) {
    if (err.code === 'EADDRINUSE') {
        console.log('  ⚠️ Puerto 3000 EN USO. Cambia el puerto en server.js');
    }
});
server.once('listening', function() {
    server.close();
    console.log('  ✓ Puerto 3000 disponible');
});
server.listen(3000);

// 5. Información de configuración
console.log('\n⚙️ Configuración actual:');
console.log('  - Servidor: http://localhost:3000');
console.log('  - Base de datos: localhost');
console.log('  - Puerto BD: 5432');

console.log('\n✅ Verificación completada. Puedes iniciar el servidor con: npm start\n');
