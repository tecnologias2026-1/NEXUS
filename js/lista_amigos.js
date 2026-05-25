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
 * Elimina un amigo del ranking y actualiza la vista
 * @param {number|string} amigoId
 * @returns {Promise<void>}
 */
async function eliminarAmigo(amigoId) {
  if (String(amigoId) === '0') return;

  try {
    const amigos = await obtenerAmigos();
    const amigo = amigos.find(item => String(item.id) === String(amigoId));
    const nombre = amigo?.nombre || 'este amigo';

    if (!confirm(`Eliminar a ${nombre} de tu circulo?`)) return;

    const eliminado = await eliminarAmigoDatos(amigoId);
    if (!eliminado) {
      throw new Error('No se encontro el amigo seleccionado.');
    }

    await inicializarListaAmigos();

    if (typeof inicializarMetasColaborativasSocial === 'function') {
      await inicializarMetasColaborativasSocial();
    }

    if (typeof mostrarToast === 'function') {
      mostrarToast('Amigo eliminado', `${nombre} ya no esta en tu ranking`);
    }

    console.log('Amigo eliminado:', amigoId);
  } catch (error) {
    console.error('Error al eliminar amigo:', error);
    alert('No se pudo eliminar el amigo. Intenta de nuevo.');
  }
}

/**
 * Activa la delegacion de eventos para botones de eliminar amigo
 * @returns {void}
 */
function inicializarEventosEliminarAmigos() {
  const contenedor = document.querySelector('.ranking-list');
  if (!contenedor || contenedor.dataset.deleteEventsBound === 'true') return;

  contenedor.dataset.deleteEventsBound = 'true';
  contenedor.addEventListener('click', async event => {
    const botonEliminar = event.target.closest('[data-delete-amigo-id]');
    if (!botonEliminar) return;

    event.preventDefault();
    await eliminarAmigo(botonEliminar.getAttribute('data-delete-amigo-id'));
  });
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
    inicializarEventosEliminarAmigos();
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
    agregarAmigo,
    eliminarAmigo,
    inicializarEventosEliminarAmigos
  };
}
