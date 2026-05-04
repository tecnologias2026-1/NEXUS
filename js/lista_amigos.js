/**
 * ============================================================
 * MÓDULO: lista_amigos.js
 * ============================================================
 * Responsabilidad: Gestionar la lista/ranking de amigos
 *
 * Este módulo se encarga de:
 * - Cargar amigos desde data.json (o localStorage)
 * - Ordenar amigos por puntos (mayor a menor)
 * - Delegar generación de HTML a amigo.js
 * - Renderizar el ranking en el DOM
 *
 * Responsabilidades delegadas:
 * - amigo.js → Generar HTML de cada ítem amigo
 * ============================================================
 */

/**
 * Carga la lista de amigos desde el almacenamiento disponible
 * Intenta primero localStorage, luego data.json
 *
 * @returns {Promise<Array>} Array de amigos
 *
 * @example
 * const amigos = await cargarAmigos();
 */
async function cargarAmigos() {
  try {
    // Opción 1: Intenta cargar desde localStorage (datos guardados)
    const amigosGuardados = localStorage.getItem('amigos');
    if (amigosGuardados) {
      console.log('📦 Amigos cargados desde localStorage');
      return JSON.parse(amigosGuardados);
    }

    // Opción 2: Carga desde data.json
    console.log('🔄 Cargando amigos desde data.json...');
    const respuesta = await fetch('data/data.json');

    if (!respuesta.ok) {
      throw new Error(`❌ Error HTTP ${respuesta.status}: No se pudo obtener data.json`);
    }

    const datos = await respuesta.json();
    const amigos = datos.amigos || [];

    // Guardar en localStorage para futuras cargas
    localStorage.setItem('amigos', JSON.stringify(amigos));
    console.log('✅ Amigos cargados desde data.json');

    return amigos;
  } catch (error) {
    console.error('❌ Error al cargar amigos:', error);
    return [];
  }
}

/**
 * Ordena la lista de amigos por puntos (mayor a menor)
 * @param {Array} amigos - Array de amigos
 * @returns {Array} Array ordenado por puntos descendente
 *
 * @example
 * const ranking = ordenarPorPuntos(amigos);
 */
function ordenarPorPuntos(amigos) {
  return amigos.slice().sort((a, b) => b.puntos - a.puntos);
}

/**
 * Genera el HTML completo del ranking de amigos
 * @param {Array} amigos - Array de amigos ordenados
 * @returns {string} HTML con todas las posiciones del ranking
 *
 * @example
 * const html = generarHTMLRanking(amigos);
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

  // Generar una fila por cada amigo, pasando su posición (índice + 1)
  return amigos
    .map((amigo, indice) => generarFilaAmigo(amigo, indice + 1))
    .join('');
}

/**
 * Renderiza el ranking en el DOM
 * @param {string} html - Fragmento HTML del ranking
 *
 * @example
 * renderizarRanking(html);
 */
function renderizarRanking(html) {
  const contenedor = document.querySelector('.ranking-list');

  if (!contenedor) {
    console.error('❌ Contenedor .ranking-list no encontrado en el DOM');
    return;
  }

  contenedor.innerHTML = html;
  console.log('✅ Ranking renderizado en el DOM');
}

/**
 * Función principal: Carga, ordena y renderiza el ranking de amigos
 * @returns {Promise<void>}
 *
 * @example
 * await inicializarListaAmigos();
 */
async function inicializarListaAmigos() {
  try {
    console.log('🚀 Inicializando ranking de amigos...');

    // 1. Verificar que la dependencia exista
    if (typeof generarFilaAmigo !== 'function') {
      throw new Error('❌ amigo.js no está cargado. Verifica el orden de los scripts.');
    }

    // 2. Cargar amigos
    const amigos = await cargarAmigos();

    // 3. Ordenar por puntos (mayor a menor)
    const ordenados = ordenarPorPuntos(amigos);

    // 4. Generar HTML
    const html = generarHTMLRanking(ordenados);

    // 5. Renderizar en el DOM
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
 * @param {Object} nuevoAmigo - Amigo a agregar
 * @returns {Promise<void>}
 *
 * @example
 * await agregarAmigo({
 *   id: 7,
 *   nombre: "Miguel Fernández",
 *   nivel: 1,
 *   racha: 0,
 *   puntos: 0,
 *   tendencia: "neutral",
 *   esUsuarioActual: false
 * });
 */
async function agregarAmigo(nuevoAmigo) {
  try {
    const amigos = await cargarAmigos();
    amigos.push(nuevoAmigo);

    localStorage.setItem('amigos', JSON.stringify(amigos));
    await inicializarListaAmigos();

    console.log('✅ Amigo agregado:', nuevoAmigo);
  } catch (error) {
    console.error('❌ Error al agregar amigo:', error);
  }
}

// Exportar funciones para uso en otros módulos
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
