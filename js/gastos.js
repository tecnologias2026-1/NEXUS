/**
 * ============================================================
 * MÓDULO: gastos.js
 * ============================================================
 * Responsabilidad: Generar HTML para transacciones de GASTOS
 * 
 * Este módulo se encarga de:
 * - Crear el HTML visual de cada gasto
 * - Mapear iconos según categoría
 * - Formatear datos de gastos para visualización
 * 
 * No modifica el DOM directamente, solo genera strings HTML
 * ============================================================
 */

/**
 * Mapeo de iconos SVG por categoría de gasto
 * @type {Object<string, string>}
 */
const ICONOS_GASTOS = {
  'Estudios': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2z"/>
    <polyline points="23 18 1 18"/>
  </svg>`,
  
  'Entretenimiento': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>`,
  
  'Alimentación': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/>
    <line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>`,
  
  'Transporte': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M14 16H9m10 0h3v-3.15a1 1 0 0 0-.84-.99L16 11l-2.7-3.6a1 1 0 0 0-.8-.4H5.24a2 2 0 0 0-1.8 1.1l-.8 1.63A6 6 0 0 0 2 12.42V16h2"/>
    <circle cx="6.5" cy="16.5" r="2.5"/>
    <circle cx="16.5" cy="16.5" r="2.5"/>
  </svg>`,
  
  'Ropa': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z"/>
  </svg>`,

  'Servicios': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21h6"/>
    <path d="M12 17v4"/>
    <path d="M12 3a6 6 0 0 0-3 11v2h6v-2a6 6 0 0 0-3-11z"/>
  </svg>`,

  'Salud': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>`,

  'Otros': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <line x1="3" y1="9" x2="21" y2="9"/>
    <line x1="9" y1="21" x2="9" y2="9"/>
  </svg>`,

  'default': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="16"/>
    <line x1="8" y1="12" x2="16" y2="12"/>
  </svg>`
};

/**
 * Obtiene el icono SVG para una categoría de gasto
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} HTML del icono SVG
 * 
 * @example
 * obtenerIconoGasto("Estudios") // Retorna SVG de laptop
 */
function obtenerIconoGasto(categoria) {
  return ICONOS_GASTOS[categoria] || ICONOS_GASTOS['default'];
}

/**
 * Genera el HTML para una fila de gasto en la tabla de transacciones
 * @param {Object} gasto - Objeto de transacción de tipo gasto enriquecido por datos.js
 * @param {number} gasto.id - ID único
 * @param {string} gasto.nombre - Descripción del gasto
 * @param {number} gasto.valor - Monto en COP
 * @param {string} gasto.fecha - Fecha ISO (YYYY-MM-DD)
 * @param {Object} gasto.categoria - Objeto categoría completo {id, nombre, icono, color}
 * @returns {string}
 */
function generarFilaGasto(gasto) {
  if (!gasto || !gasto.nombre || !gasto.valor || !gasto.fecha || !gasto.categoria) {
    console.warn('⚠️ Gasto inválido:', gasto);
    return '';
  }

  const nombreCategoria = gasto.categoria.nombre;
  const fechaFormateada = formatearFecha(gasto.fecha);
  const iconoSVG = obtenerIconoGasto(nombreCategoria);
  const valorFormateado = gasto.valor.toLocaleString('es-CO');

  return `
    <li class="transaction-item" data-transaction-id="${gasto.id}" data-transaction-type="gasto">
      <div class="transaction-icon" aria-hidden="true">
        ${iconoSVG}
      </div>

      <div class="transaction-details">
        <h3 class="transaction-name">${gasto.nombre}</h3>
        <div class="transaction-meta">
          <span class="transaction-category">${nombreCategoria}</span>
          <span class="transaction-date" aria-label="${fechaFormateada}">${fechaFormateada}</span>
        </div>
      </div>

      <strong class="transaction-amount transaction-amount--expense">-$${valorFormateado} COP</strong>

      <button type="button"
              class="transaction-delete-btn"
              data-delete-transaction-id="${gasto.id}"
              aria-label="Eliminar gasto ${gasto.nombre}">
        <svg aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
        </svg>
      </button>
    </li>
  `;
}

/**
 * Genera HTML para múltiples gastos
 * @param {Array<Object>} gastos - Array de objetos de gastos
 * @returns {string} Concatenación de HTML de todos los gastos
 * 
 * @example
 * const gastos = [...];
 * const html = generarFilasGastos(gastos);
 */
function generarFilasGastos(gastos) {
  if (!Array.isArray(gastos) || gastos.length === 0) {
    return '';
  }
  
  return gastos.map(gasto => generarFilaGasto(gasto)).join('');
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generarFilaGasto,
    generarFilasGastos,
    obtenerIconoGasto
  };
}
