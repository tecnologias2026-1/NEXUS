/**
 * ============================================================
 * MÓDULO: lista_amigos.js
 * ============================================================
 * Responsabilidad: Gestionar la lista/ranking de amigos
 *
 * Este módulo se encarga de:
 * - Obtener amigos del usuario actual + insertar "Yo"
 * - Ordenar el ranking por puntos (mayor a menor)
 * - Delegar generación de HTML a amigo.js
 * - Renderizar el ranking en el DOM
 *
 * Dependencias:
 * - datos.js → Punto central (obtenerAmigosConYo, agregarAmigoDatos)
 * - amigo.js → Generar HTML de cada ítem amigo
 * ============================================================
 */

/**
 * Carga los amigos del usuario actual, ya con "Yo" insertado
 * para que aparezca en el ranking.
 * @returns {Promise<Array>}
 */
async function cargarAmigos() {
  return await obtenerAmigosConYo();
}

/**
 * Ordena los amigos por puntos (mayor a menor)
 * @param {Array} amigos
 * @returns {Array}
 */
function ordenarPorPuntos(amigos) {
  return amigos.slice().sort((a, b) => b.puntos - a.puntos);
}

/**
 * Genera el HTML del ranking completo
 * @param {Array} amigos - Array ordenado
 * @returns {string}
 */
function generarHTMLRanking(amigos) {
  if (amigos.length === 0) {
    return `
      <li class="ranking-empty-state">
        <p>👥 Aún no tienes amigos en tu círculo.</p>
        <p>Agrega amigos para empezar a competir sanamente.</p>
      </li>
    `;
  }

  return amigos
    .map((amigo, indice) => generarFilaAmigo(amigo, indice + 1))
    .join('');
}

/**
 * Renderiza el ranking en el DOM
 * @param {string} html
 */
function renderizarRanking(html) {
  const contenedor = document.querySelector('.ranking-list');
  if (!contenedor) {
    console.error('❌ Contenedor .ranking-list no encontrado');
    return;
  }
  contenedor.innerHTML = html;
}

/**
 * Función principal: carga, ordena y renderiza el ranking
 * @returns {Promise<void>}
 */
async function inicializarListaAmigos() {
  try {
    if (typeof generarFilaAmigo !== 'function') {
      throw new Error('amigo.js no está cargado. Verifica el orden de los scripts.');
    }

    if (window.nexusReady) await window.nexusReady;

    const amigos = await cargarAmigos();
    const ordenados = ordenarPorPuntos(amigos);
    const html = generarHTMLRanking(ordenados);
    renderizarRanking(html);
  } catch (error) {
    console.error('❌ Error al inicializar ranking:', error);
    renderizarRanking(`
      <li class="ranking-error-state">
        <p>⚠️ Error al cargar el ranking de amigos</p>
        <p>Intenta recargar la página</p>
      </li>
    `);
  }
}

/**
 * Agrega un nuevo amigo al ranking
 * @param {Object} nuevoAmigo
 * @returns {Promise<void>}
 */
async function agregarAmigo(nuevoAmigo) {
  try {
    // Asocia el amigo al usuario actual
    const usuario = await obtenerUsuarioActual();
    if (usuario) {
      nuevoAmigo.usuario_id = usuario.id;
    }
    nuevoAmigo.fecha_agregado = new Date().toISOString().split('T')[0];

    await agregarAmigoDatos(nuevoAmigo);
    await inicializarListaAmigos();
    console.log('✅ Amigo agregado:', nuevoAmigo);
  } catch (error) {
    console.error('❌ Error al agregar amigo:', error);
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    cargarAmigos,
    ordenarPorPuntos,
    generarHTMLRanking,
    renderizarRanking,
    inicializarListaAmigos,
    agregarAmigo
  };
}
