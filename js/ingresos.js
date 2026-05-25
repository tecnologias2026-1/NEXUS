/**
 * ============================================================
 * MÓDULO: ingresos.js
 * ============================================================
 * Responsabilidad: Generar HTML para transacciones de INGRESOS
 * 
 * Este módulo se encarga de:
 * - Crear el HTML visual de cada ingreso
 * - Mapear iconos según categoría
 * - Formatear datos de ingresos para visualización
 * 
 * No modifica el DOM directamente, solo genera strings HTML
 * ============================================================
 */

/**
 * Mapeo de iconos SVG por categoría de ingreso
 * @type {Object<string, string>}
 */
const ICONOS_INGRESOS = {
  'Freelancia': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
    <circle cx="19" cy="12" r="1" fill="currentColor"/>
    <circle cx="5" cy="12" r="1" fill="currentColor"/>
    <path d="M12 5v14"/>
    <path d="M5 12h14"/>
  </svg>`,
  
  'Salario': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/>
    <line x1="12" y1="17" x2="12" y2="21"/>
  </svg>`,
  
  'Bonificación': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2L15.09 8.26H22L17.09 12.26L20.09 18.26L12 14L3.91 18.26L6.91 12.26L2 8.26H8.91L12 2Z"/>
  </svg>`,
  
  'Inversión': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
    <path d="M21 3v5h-5"/>
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
    <path d="M3 21v-5h5"/>
  </svg>`,
  
  'Devolución': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M23 1v6h-6"/>
    <path d="M20.6 15.5A9 9 0 0 1 5.404 3.605 9 9 0 1 0 23 15.5z"/>
  </svg>`,

  'Otros ingresos': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>`,

  'default': `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
    <line x1="9" y1="9" x2="9.01" y2="9"/>
    <line x1="15" y1="9" x2="15.01" y2="9"/>
  </svg>`
};

/**
 * Obtiene el icono SVG para una categoría de ingreso
 * @param {string} categoria - Nombre de la categoría
 * @returns {string} HTML del icono SVG
 * 
 * @example
 * obtenerIconoIngreso("Freelancia") // Retorna SVG de dinero
 */
function obtenerIconoIngreso(categoria) {
  return ICONOS_INGRESOS[categoria] || ICONOS_INGRESOS['default'];
}

/**
 * Genera el HTML para una fila de ingreso en la tabla de transacciones
 * @param {Object} ingreso - Objeto de transacción de tipo ingreso enriquecido por datos.js
 * @param {number} ingreso.id - ID único
 * @param {string} ingreso.nombre - Descripción
 * @param {number} ingreso.valor - Monto en COP
 * @param {string} ingreso.fecha - Fecha ISO (YYYY-MM-DD)
 * @param {Object} ingreso.categoria - Objeto categoría completo {id, nombre, icono, color}
 * @returns {string}
 */
function generarFilaIngreso(ingreso) {
  if (!ingreso || !ingreso.nombre || !ingreso.valor || !ingreso.fecha || !ingreso.categoria) {
    console.warn('⚠️ Ingreso inválido:', ingreso);
    return '';
  }

  const nombreCategoria = ingreso.categoria.nombre;
  const fechaFormateada = formatearFecha(ingreso.fecha);
  const iconoSVG = obtenerIconoIngreso(nombreCategoria);
  const valorFormateado = ingreso.valor.toLocaleString('es-CO');

  return `
    <li class="transaction-item" data-transaction-id="${ingreso.id}" data-transaction-type="ingreso">
      <div class="transaction-icon" aria-hidden="true">
        ${iconoSVG}
      </div>

      <div class="transaction-details">
        <h3 class="transaction-name">${ingreso.nombre}</h3>
        <div class="transaction-meta">
          <span class="transaction-category">${nombreCategoria}</span>
          <span class="transaction-date" aria-label="${fechaFormateada}">${fechaFormateada}</span>
        </div>
      </div>

      <strong class="transaction-amount transaction-amount--income">+$${valorFormateado} COP</strong>

      <button type="button"
              class="transaction-delete-btn"
              data-delete-transaction-id="${ingreso.id}"
              aria-label="Eliminar ingreso ${ingreso.nombre}">
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
 * Genera HTML para múltiples ingresos
 * @param {Array<Object>} ingresos - Array de objetos de ingresos
 * @returns {string} Concatenación de HTML de todos los ingresos
 * 
 * @example
 * const ingresos = [...];
 * const html = generarFilasIngresos(ingresos);
 */
function generarFilasIngresos(ingresos) {
  if (!Array.isArray(ingresos) || ingresos.length === 0) {
    return '';
  }
  
  return ingresos.map(ingreso => generarFilaIngreso(ingreso)).join('');
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generarFilaIngreso,
    generarFilasIngresos,
    obtenerIconoIngreso
  };
}
