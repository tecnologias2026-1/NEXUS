/**
 * ============================================================
 * MÓDULO: amigo.js
 * ============================================================
 * Responsabilidad: Generar HTML para UN ítem amigo del ranking
 *
 * Este módulo se encarga de:
 * - Crear el HTML visual de cada amigo (posición del ranking)
 * - Aplicar estilos especiales según la posición (oro, plata, bronce, usuario actual)
 * - Mapear iconos de tendencia (sube, baja, neutral)
 *
 * No modifica el DOM directamente, solo genera strings HTML.
 * ============================================================
 */

/**
 * Mapeo de iconos SVG por tipo de tendencia
 * @type {Object<string, string>}
 */
const ICONOS_TENDENCIA = {
  'up': `<svg class="icon-trend icon-trend--up" aria-label="Subió posiciones"
              focusable="false" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round">
           <polyline points="18 15 12 9 6 15"/>
         </svg>`,

  'down': `<svg class="icon-trend icon-trend--down" aria-label="Bajó posiciones"
                focusable="false" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5"
                stroke-linecap="round" stroke-linejoin="round">
             <polyline points="6 9 12 15 18 9"/>
           </svg>`,

  'neutral': `<svg class="icon-trend icon-trend--neutral" aria-label="Sin cambio de posición"
                   focusable="false" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" stroke-width="2.5"
                   stroke-linecap="round" stroke-linejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>`
};

/**
 * Devuelve la clase CSS del avatar según la posición en el ranking
 * @param {number} posicion - Posición (1 = oro, 2 = plata, 3 = bronce, 4+ = normal)
 * @param {boolean} esUsuarioActual - Si es el usuario que está viendo la página
 * @returns {string} Clase CSS extra (ej: "ranking-avatar--gold")
 *
 * @example
 * obtenerClaseAvatar(1, false) // "ranking-avatar--gold"
 * obtenerClaseAvatar(4, true)  // "ranking-avatar--self"
 */
function obtenerClaseAvatar(posicion, esUsuarioActual) {
  if (esUsuarioActual) return 'ranking-avatar--self';
  if (posicion === 1) return 'ranking-avatar--gold';
  if (posicion === 2) return 'ranking-avatar--silver';
  if (posicion === 3) return 'ranking-avatar--bronce';
  return '';
}

/**
 * Obtiene el icono SVG de tendencia según el tipo
 * @param {string} tendencia - "up", "down" o "neutral"
 * @returns {string} HTML del icono SVG
 *
 * @example
 * obtenerIconoTendencia("up") // SVG con flecha hacia arriba
 */
function obtenerIconoTendencia(tendencia) {
  return ICONOS_TENDENCIA[tendencia] || ICONOS_TENDENCIA['neutral'];
}

/**
 * Genera el HTML para un ítem amigo del ranking
 * @param {Object} amigo - Objeto amigo del ranking
 * @param {number} amigo.id - ID único del amigo
 * @param {string} amigo.nombre - Nombre del amigo
 * @param {number} amigo.nivel - Nivel del amigo
 * @param {number} amigo.racha - Días consecutivos de actividad
 * @param {number} amigo.puntos - Puntos totales del amigo
 * @param {string} amigo.tendencia - "up", "down" o "neutral"
 * @param {boolean} amigo.esUsuarioActual - Si es el usuario actual
 * @param {number} posicion - Posición en el ranking (1, 2, 3, ...)
 * @returns {string} HTML de un <li> completo con la card del amigo
 *
 * @example
 * const amigo = { id: 1, nombre: "Sofía", nivel: 7, racha: 14, puntos: 2480, tendencia: "up", esUsuarioActual: false };
 * const html = generarFilaAmigo(amigo, 1);
 */
function generarFilaAmigo(amigo, posicion) {
  // Validar que el amigo tenga los datos necesarios
  if (!amigo || !amigo.nombre || amigo.puntos == null) {
    console.warn('⚠️ Amigo inválido:', amigo);
    return '';
  }

  const claseAvatar = obtenerClaseAvatar(posicion, amigo.esUsuarioActual);
  const iconoTendencia = obtenerIconoTendencia(amigo.tendencia);
  const puntosFormateados = amigo.puntos.toLocaleString('es-CO');

  // Clases extra cuando es el usuario actual (highlight visual)
  const claseItem = amigo.esUsuarioActual ? 'ranking-item ranking-item--self' : 'ranking-item';
  const claseCard = amigo.esUsuarioActual ? 'ranking-card ranking-card--self' : 'ranking-card';
  const claseUsername = amigo.esUsuarioActual ? 'ranking-username ranking-username--self' : 'ranking-username';

  return `
    <li class="${claseItem}" role="listitem" data-amigo-id="${amigo.id}">
      <article class="${claseCard}" aria-label="Posición ${posicion}: ${amigo.nombre}">
        <span class="ranking-pos" aria-label="Posición ${posicion}">${posicion}</span>

        <svg class="ranking-avatar ${claseAvatar}" aria-hidden="true" focusable="false"
             width="36" height="36" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>

        <div class="ranking-user-info">
          <span class="${claseUsername}">${amigo.nombre}</span>
          <div class="ranking-meta" aria-label="Nivel ${amigo.nivel}, racha de ${amigo.racha} días">
            <span class="ranking-level">Nivel ${amigo.nivel}</span>
            <svg class="icon-streak" aria-hidden="true" focusable="false"
                 width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c0 0-5 5-5 11a5 5 0 0 0 10 0C17 7 12 2 12 2z"/>
            </svg>
            <span class="ranking-streak">${amigo.racha}d</span>
          </div>
        </div>

        <div class="ranking-score-block">
          ${iconoTendencia}
          <span class="ranking-pts" aria-label="${amigo.puntos} puntos">${puntosFormateados}</span>
          <span class="ranking-pts-label" aria-hidden="true">pts</span>
        </div>
      </article>
    </li>
  `;
}

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generarFilaAmigo,
    obtenerClaseAvatar,
    obtenerIconoTendencia
  };
}
