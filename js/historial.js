/**
 * ============================================================
 * MÓDULO: historial.js
 * ============================================================
 * Responsabilidad: Gestionar el historial general de transacciones
 * 
 * Este módulo se encarga de:
 * - Cargar datos desde data.json (o localStorage)
 * - Organizar transacciones por tipo (gastos/ingresos)
 * - Ordenar transacciones por fecha (más recientes primero)
 * - Delegar generación de HTML a gastos.js e ingresos.js
 * - Renderizar el historial en el DOM
 * 
 * Responsabilidades delegadas:
 * - gastos.js → Generar HTML de gastos
 * - ingresos.js → Generar HTML de ingresos
 * ============================================================
 */

/**
 * Carga las transacciones desde el almacenamiento disponible
 * Intenta primero localStorage, luego data.json
 * 
 * @returns {Promise<Array>} Array de transacciones
 * @throws {Error} Si no puede cargar los datos
 * 
 * @example
 * const transacciones = await cargarTransacciones();
 */
async function cargarTransacciones() {
  try {
    // Opción 1: Intenta cargar desde localStorage (datos guardados por usuario)
    const transaccionesGuardadas = localStorage.getItem('transacciones');
    if (transaccionesGuardadas) {
      console.log('📦 Transacciones cargadas desde localStorage');
      return JSON.parse(transaccionesGuardadas);
    }

    // Opción 2: Carga desde data.json
    console.log('🔄 Cargando transacciones desde data.json...');
    const respuesta = await fetch('data/data.json');
    
    if (!respuesta.ok) {
      throw new Error(`❌ Error HTTP ${respuesta.status}: No se pudo obtener data.json`);
    }

    const datos = await respuesta.json();
    const transacciones = datos.transacciones || [];

    // Guardar en localStorage para futuras cargas (más rápido)
    localStorage.setItem('transacciones', JSON.stringify(transacciones));
    console.log('✅ Transacciones cargadas desde data.json');

    return transacciones;
  } catch (error) {
    console.error('❌ Error al cargar transacciones:', error);
    return [];
  }
}

/**
 * Separa las transacciones en gastos e ingresos
 * @param {Array} transacciones - Array de todas las transacciones
 * @returns {Object} { gastos: [...], ingresos: [...] }
 * 
 * @example
 * const { gastos, ingresos } = separarTransacciones(transacciones);
 */
function separarTransacciones(transacciones) {
  const gastos = [];
  const ingresos = [];

  transacciones.forEach(transaccion => {
    if (transaccion.tipo === 'gasto') {
      gastos.push(transaccion);
    } else if (transaccion.tipo === 'ingreso') {
      ingresos.push(transaccion);
    }
  });

  return { gastos, ingresos };
}

/**
 * Ordena las transacciones por fecha (más recientes primero)
 * @param {Array} transacciones - Array de transacciones
 * @returns {Array} Array ordenado por fecha descendente
 * 
 * @example
 * const ordenadas = ordenarPorFecha(transacciones);
 */
function ordenarPorFecha(transacciones) {
  return transacciones.slice().sort((a, b) => {
    return new Date(b.fecha) - new Date(a.fecha);
  });
}

/**
 * Genera el HTML completo del historial de transacciones
 * @param {Array} transacciones - Array de transacciones ordenadas
 * @returns {string} HTML con todas las transacciones en un <ul>
 * 
 * @example
 * const html = generarHTMLHistorial(transacciones);
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

  // Generar filas para cada transacción según su tipo
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
 * @param {string} selectorfragmento HTML del historial
 * 
 * @example
 * renderizarHistorial(html);
 */
function renderizarHistorial(html) {
  const contenedor = document.querySelector('.transaction-history-content');
  
  if (!contenedor) {
    console.error('❌ Contenedor .transaction-history-content no encontrado en el DOM');
    return;
  }

  contenedor.innerHTML = html;
  console.log('✅ Historial renderizado en el DOM');
}

/**
 * Función principal: Carga, organiza y renderiza el historial
 * @returns {Promise<void>}
 * 
 * @example
 * await inicializarHistorial();
 */
async function inicializarHistorial() {
  try {
    console.log('🚀 Inicializando historial...');

    // 1. Cargar transacciones
    const transacciones = await cargarTransacciones();

    // 2. Ordenar por fecha (más recientes primero)
    const ordenadas = ordenarPorFecha(transacciones);

    // 3. Generar HTML
    const html = generarHTMLHistorial(ordenadas);

    // 4. Renderizar en el DOM
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
 * Agrega una nueva transacción al historial
 * @param {Object} nuevaTransaccion - Transacción a agregar
 * @returns {Promise<void>}
 * 
 * @example
 * await agregarTransaccion({ 
 *   id: 6, 
 *   nombre: "Compra", 
 *   valor: 100, 
 *   fecha: "2024-10-10", 
 *   categoria: "Alimentación", 
 *   tipo: "gasto" 
 * });
 */
async function agregarTransaccion(nuevaTransaccion) {
  try {
    // Cargar transacciones actuales
    const transacciones = await cargarTransacciones();

    // Agregar nueva transacción
    transacciones.push(nuevaTransaccion);

    // Guardar en localStorage
    localStorage.setItem('transacciones', JSON.stringify(transacciones));

    // Reinicializar historial
    await inicializarHistorial();

    console.log('✅ Transacción agregada:', nuevaTransaccion);
  } catch (error) {
    console.error('❌ Error al agregar transacción:', error);
  }
}

/**
 * Limpia todo el historial (útil para testing)
 * ⚠️ CUIDADO: Elimina todas las transacciones guardadas
 * 
 * @returns {void}
 */
function limpiarHistorial() {
  if (confirm('⚠️ ¿Estás seguro de que deseas eliminar todo el historial?')) {
    localStorage.removeItem('transacciones');
    inicializarHistorial();
    console.log('✅ Historial limpiado');
  }
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cargarTransacciones,
    separarTransacciones,
    ordenarPorFecha,
    generarHTMLHistorial,
    renderizarHistorial,
    inicializarHistorial,
    agregarTransaccion,
    limpiarHistorial
  };
}
