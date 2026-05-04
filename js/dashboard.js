/**
 * Módulo de utilidades para las páginas del dashboard.
 *
 * Este archivo existe para evitar errores 404 cuando las páginas
 * referencian js/dashboard.js. Aquí también se pueden agregar
 * funcionalidades comunes futuras del dashboard.
 */

document.addEventListener('DOMContentLoaded', () => {
  const announcer = document.getElementById('status-announcer');
  if (announcer) {
    announcer.textContent = '';
  }
});
