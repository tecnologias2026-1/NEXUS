/**
 * ============================================================
 * MÓDULO: historial.js
 * ============================================================
 * Responsabilidad: Gestionar el historial general de transacciones
 *
 * Este módulo se encarga de:
 * - Obtener transacciones del usuario actual (ya enriquecidas con categoría)
 * - Ordenar transacciones por fecha (más recientes primero)
 * - Delegar generación de HTML a gastos.js e ingresos.js
 * - Renderizar el historial en el DOM
 *
 * Dependencias:
 * - datos.js     → Punto central de carga (obtenerTransacciones, etc.)
 * - gastos.js    → Generar HTML de gastos
 * - ingresos.js  → Generar HTML de ingresos
 * ============================================================
 */

/**
 * Carga las transacciones del usuario actual.
 * Cada transacción viene con su .categoria como objeto completo
 * (con nombre, icono, color) gracias al enriquecimiento de datos.js.
 *
 * @returns {Promise<Array>}
 */
async function cargarTransacciones() {
  return await obtenerTransacciones();
}

/**
 * Ordena las transacciones por fecha (más recientes primero)
 * @param {Array} transacciones
 * @returns {Array}
 */
function ordenarPorFecha(transacciones) {
  return transacciones.slice().sort((a, b) => {
    return new Date(b.fecha) - new Date(a.fecha);
  });
}

/**
 * Genera el HTML completo del historial de transacciones
 * @param {Array} transacciones - Array de transacciones ordenadas
 * @returns {string}
 */
function generarHTMLHistorial(transacciones) {
  if (transacciones.length === 0) {
    return `
      <div class="transaction-empty-state">
        <p>📋 No hay transacciones registradas aún.</p>
        <p>Comienza a agregar gastos e ingresos para verlos aquí.</p>
      </div>
    `;
  }

  const filas = transacciones.map(transaccion => {
    if (transaccion.tipo === 'gasto') {
      return generarFilaGasto(transaccion);
    } else if (transaccion.tipo === 'ingreso') {
      return generarFilaIngreso(transaccion);
    }
    return '';
  }).join('');

  return `<ul class="transaction-history-list" role="list">${filas}</ul>`;
}

/**
 * Renderiza el historial en el DOM
 * @param {string} html
 */
function renderizarHistorial(html) {
  const contenedor = document.querySelector('.transaction-history-content');
  if (!contenedor) {
    console.error('❌ Contenedor .transaction-history-content no encontrado');
    return;
  }
  contenedor.innerHTML = html;
}

/**
 * Función principal: Carga, ordena y renderiza el historial
 * @returns {Promise<void>}
 */
async function inicializarHistorial() {
  try {
    if (window.nexusReady) await window.nexusReady;

    const transacciones = await cargarTransacciones();
    const ordenadas = ordenarPorFecha(transacciones);
    const html = generarHTMLHistorial(ordenadas);
    renderizarHistorial(html);
  } catch (error) {
    console.error('❌ Error al inicializar historial:', error);
    renderizarHistorial(`
      <div class="transaction-error-state">
        <p>⚠️ Error al cargar el historial de transacciones</p>
        <p>Intenta recargar la página</p>
      </div>
    `);
  }
}

/**
 * Agrega una nueva transacción al historial y re-renderiza
 * @param {Object} nuevaTransaccion - Debe incluir categoria_id (no categoria)
 * @returns {Promise<void>}
 */
async function agregarTransaccion(nuevaTransaccion) {
  try {
    await agregarTransaccionDatos(nuevaTransaccion);
    await inicializarHistorial();
    // Re-renderizar los límites mensuales para reflejar el nuevo gasto/ingreso
    if (typeof inicializarLimites === 'function') {
      await inicializarLimites();
    }
    console.log('✅ Transacción agregada:', nuevaTransaccion);
  } catch (error) {
    console.error('❌ Error al agregar transacción:', error);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cargarTransacciones,
    ordenarPorFecha,
    generarHTMLHistorial,
    renderizarHistorial,
    inicializarHistorial,
    agregarTransaccion
  };
}
