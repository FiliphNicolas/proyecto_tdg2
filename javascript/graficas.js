// Cargar y mostrar gráficas de estadísticas en inicio.html
// Requiere Chart.js

async function cargarEstadisticas() {
  try {
    const response = await fetch('/api/estadisticas/dashboard');
    if (!response.ok) throw new Error('Error al cargar estadísticas');
    
    const data = await response.json();
    
    // Mostrar resumen en tarjetas
    mostrarResumen(data.resumen);
    
    // Crear gráficas
    crearGraficaPedidos(data.estadoPedidos);
    crearGraficaInventario(data.categorias);
    crearGraficaUsuarios(data.actividadUser);
    
  } catch (error) {
    console.error('Error cargando estadísticas:', error);
    document.getElementById('estadisticas-container').innerHTML = 
      '<p style="color: red; padding: 20px;">Error al cargar estadísticas</p>';
  }
}

function mostrarResumen(resumen) {
  const container = document.getElementById('estadisticas-resumen');
  if (container) {
    container.innerHTML = `
      <div class="estadistica-card">
        <h3>Usuarios</h3>
        <p class="numero-estadistica">${resumen.totalUsuarios}</p>
      </div>
      <div class="estadistica-card">
        <h3>Pedidos</h3>
        <p class="numero-estadistica">${resumen.totalPedidos}</p>
      </div>
      <div class="estadistica-card">
        <h3>Inventario</h3>
        <p class="numero-estadistica">${resumen.totalInventario}</p>
      </div>
    `;
  }
}

function crearGraficaPedidos(datos) {
  const ctx = document.getElementById('graficaPedidos');
  if (!ctx) return;
  
  const labels = datos.map(d => d.estado || 'Sin estado');
  const cantidades = datos.map(d => parseInt(d.cantidad) || 0);
  const colores = ['#10b981', '#f59e0b', '#ef4444', '#6366f1', '#8b5cf6'];
  
  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: cantidades,
        backgroundColor: colores.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Estado de Pedidos'
        }
      }
    }
  });
}

function crearGraficaInventario(datos) {
  const ctx = document.getElementById('graficaInventario');
  if (!ctx) return;
  
  const labels = datos.map(d => d.categoria || 'Sin categoría');
  const cantidades = datos.map(d => parseInt(d.cantidad) || 0);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Productos por Categoría',
        data: cantidades,
        backgroundColor: '#3b82f6',
        borderColor: '#1e40af',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Productos por Categoría'
        }
      },
      scales: {
        x: {
          beginAtZero: true
        }
      }
    }
  });
}

function crearGraficaUsuarios(datos) {
  const ctx = document.getElementById('graficaUsuarios');
  if (!ctx) return;
  
  const labels = datos.map(d => (d.activo ? 'Activos' : 'Inactivos'));
  const cantidades = datos.map(d => parseInt(d.cantidad) || 0);
  const colores = ['#10b981', '#ef4444'];
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: labels,
      datasets: [{
        data: cantidades,
        backgroundColor: colores,
        borderColor: '#fff',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        title: {
          display: true,
          text: 'Usuarios Activos vs Inactivos'
        }
      }
    }
  });
}

// Cargar gráficas cuando se abre la página
document.addEventListener('DOMContentLoaded', cargarEstadisticas);
