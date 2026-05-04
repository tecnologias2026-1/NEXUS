/**
 * ============================================================
 * MÓDULO: utils.js
 * ============================================================
 * Responsabilidad: Funciones utilitarias compartidas entre módulos
 *
 * Este módulo agrupa helpers que no pertenecen a un dominio específico
 * (gastos, ingresos, historial, etc.) y que pueden ser reutilizados
 * por cualquier otro módulo del proyecto.
 *
 * Debe cargarse ANTES que cualquier módulo que dependa de sus funciones.
 * ============================================================
 */

/**
 * Formatea una fecha ISO a formato legible en español
 * @param {string} fechaISO - Fecha en formato ISO (YYYY-MM-DD)
 * @returns {string} Fecha formateada (ej: "5 octubre")
 *
 * @example
 * formatearFecha("2024-10-05") // "5 octubre"
 */
function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO + 'T00:00:00');
  const opciones = { day: 'numeric', month: 'long' };
  return fecha.toLocaleDateString('es-ES', opciones);
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    formatearFecha
  };
}
