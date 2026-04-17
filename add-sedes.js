#!/usr/bin/env node
/**
 * Script para agregar sedes rápidamente
 * Uso: node add-sedes.js
 */

const http = require('http');

const nuevasSedes = [
  {
    nombre: 'Bogotá Sur',
    ciudad: 'Bogotá',
    direccion: 'Cra 10 #34-45, Usme',
    telefono: '(1) 3456-7890',
    email: 'sur@systemsware.com',
    encargado: 'Encargado Sur'
  },
  {
    nombre: 'Bogotá Centro',
    ciudad: 'Bogotá',
    direccion: 'Cra 7 #23-15, La Candelaria',
    telefono: '(1) 2345-6789',
    email: 'centro@systemsware.com',
    encargado: 'Encargado Centro'
  }
];

async function agregarSede(sede) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(sede);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/sedes',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', chunk => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          console.log(`✅ Sede creada: ${sede.nombre}`);
          resolve(JSON.parse(responseData));
        } else {
          console.error(`❌ Error al crear ${sede.nombre}:`, responseData);
          reject(new Error(responseData));
        }
      });
    });

    req.on('error', (err) => {
      console.error(`❌ Error de conexión: ${err.message}`);
      reject(err);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('📍 Agregando nuevas sedes...\n');
  
  try {
    for (const sede of nuevasSedes) {
      await agregarSede(sede);
    }
    console.log('\n✅ Todas las sedes fueron agregadas exitosamente');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
  }
}

// Ejecutar
main();
