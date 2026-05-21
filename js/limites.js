/**
 * ============================================================
 * MÓDULO: limites.js
 * ============================================================
 * Responsabilidad: Renderizar la sección "Límites mensuales"
 * de transacciones.html con datos reales.
 *
 * Para cada límite configurado en limites.json:
 * - Lee la categoría asociada (nombre, icono, color)
 * - Calcula cuánto se gastó en esa categoría en el mes actual
 * - Calcula el porcentaje usado vs el límite
 * - Genera el HTML correspondiente
 *
 * Dependencias:
 * - datos.js     → obtenerLimites, obtenerCategoria, obtenerTransacciones
 * - calculos.js  → calcularGastosPorCategoria, obtenerMesActual, formatearCOP
 * ============================================================
 */

/**
 * Carga y renderiza los límites mensuales en el contenedor existente.
 * Reemplaza el HTML hardcodeado de transacciones.html.
 */
async function inicializarLimites() {
  try {
    if (window.nexusReady) await window.nexusReady;

    const [limites, transacciones, categorias] = await Promise.all([
      obtenerLimites(),
      obtenerTransacciones(),
      obtenerCategorias()
    ]);

    const mes = obtenerMesActual();
    const gastosPorCategoria = calcularGastosPorCategoria(transacciones, mes);

    const html = generarHTMLLimites(limites, categorias, gastosPorCategoria);
    renderizarLimites(html);
  } catch (error) {
    console.error('❌ Error renderizando límites:', error);
  }
}

/**
 * Genera el HTML de la lista de límites
 * @param {Array} limites
 * @param {Array} categorias
 * @param {Object} gastosPorCategoria - { categoria_id: total }
 * @returns {string}
 */
function generarHTMLLimites(limites, categorias, gastosPorCategoria) {
  if (limites.length === 0) {
    return `
      <li class="spending-limit-empty">
        <p style="text-align: center; color: #999; padding: 1rem;">
          No tienes límites configurados.
        </p>
      </li>
    `;
  }

  return limites
    .map(limite => generarFilaLimite(limite, categorias, gastosPorCategoria))
    .join('');
}

/**
 * Genera el HTML para UNA fila de límite con su barra de progreso.
 */
function generarFilaLimite(limite, categorias, gastosPorCategoria) {
  const categoria = categorias.find(c => c.id === limite.categoria_id);
  if (!categoria) return '';

  const gastado = gastosPorCategoria[limite.categoria_id] || 0;
  const limiteMonto = Number(limite.monto_limite) || 0;
  const porcentaje = limiteMonto > 0
    ? Math.min(100, Math.round((gastado / limiteMonto) * 100))
    : 0;
  const restante = Math.max(0, limiteMonto - gastado);

  const balanceTexto = `${formatearCOP(gastado)} de ${formatearCOP(limiteMonto)}`;
  const restanteTexto = `${formatearCOP(restante)} restante`;

  return `
    <li class="spending-limit-item" data-limite-id="${limite.id}">
      <div class="limit-item-header">
        <div class="limit-item-info">
          <h3 class="limit-category-name">${categoria.icono} ${categoria.nombre}</h3>
          <p class="limit-category-balance">${balanceTexto}</p>
        </div>
        <button type="button" class="limit-item-toggle"
                aria-label="Ver detalles de ${categoria.nombre}" aria-expanded="false">
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
               fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
        </button>
      </div>

      <div class="limit-progress-container"
           role="progressbar"
           aria-valuenow="${porcentaje}"
           aria-valuemin="0"
           aria-valuemax="100"
           aria-label="Progreso: ${porcentaje}% del límite usado">
        <div class="limit-progress-bar" style="width: ${porcentaje}%"></div>
      </div>

      <div class="limit-stats">
        <span class="limit-percentage">${porcentaje}% usado</span>
        <span class="limit-remaining">${restanteTexto}</span>
      </div>
    </li>
  `;
}

function renderizarLimites(html) {
  const contenedor = document.querySelector('.spending-limits-list');
  if (!contenedor) {
    console.error('❌ Contenedor .spending-limits-list no encontrado');
    return;
  }
  contenedor.innerHTML = html;
}
