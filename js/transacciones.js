/**
 * ============================================================
 * MÓDULO: transacciones.js
 * ============================================================
 * Responsabilidad: Coordinador principal del sistema de transacciones
 * 
 * Este módulo se encarga de:
 * - Coordinar entre módulos especializados
 * - Manejar eventos del usuario (agregar transacción)
 * - Gestionar el modal de nueva transacción
 * - Actualizar la visualización en tiempo real
 * 
 * Dependencias de módulos:
 * - gastos.js → Generación de HTML para gastos
 * - ingresos.js → Generación de HTML para ingresos
 * - historial.js → Gestión del historial completo
 * ============================================================
 */

/**
 * Inicializa el sistema de transacciones cuando la página carga
 * @returns {void}
 */
async function inicializarTransacciones() {
  console.log('🚀 Inicializando sistema de transacciones...');

  try {
    if (typeof inicializarHistorial !== 'function') {
      throw new Error('❌ historial.js no está cargado. Verifica el orden de los scripts.');
    }

    if (typeof generarFilaGasto !== 'function' || typeof generarFilaIngreso !== 'function') {
      throw new Error('❌ gastos.js o ingresos.js no están cargados.');
    }

    await inicializarHistorial();
    if (typeof inicializarLimites === 'function') {
      await inicializarLimites();
    }
    inicializarEventos();
    configurarBotonesDeTipo();
    await llenarSelectCategorias(document.querySelector('#transaction-type')?.value || 'ingreso');

    console.log('✅ Sistema de transacciones inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar transacciones:', error);
  }
}

function limpiarMontoTransaccion(valor) {
  return String(valor || '').replace(/\D/g, '');
}

function formatearMilesTransaccion(valor) {
  const limpio = limpiarMontoTransaccion(valor);
  if (!limpio) return '';
  return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function enfocarHistorialTransacciones() {
  const historial = document.querySelector('.transaction-history-section');
  if (!historial) return;
  historial.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function mostrarConfirmacionTransaccion(mensaje, tipo = 'success') {
  const anterior = document.querySelector('.transaction-toast');
  if (anterior) anterior.remove();

  const toast = document.createElement('div');
  toast.className = `transaction-toast transaction-toast--${tipo}`;
  toast.setAttribute('role', 'status');
  toast.textContent = mensaje;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.classList.add('transaction-toast--hide');
    window.setTimeout(() => toast.remove(), 220);
  }, 2400);
}

/**
 * Llena el <select> de categorías del modal filtrando por tipo.
 * Las opciones se cargan dinámicamente desde categorias.json,
 * así que agregar una categoría nueva no requiere tocar el HTML.
 *
 * @param {string} tipo - "gasto" o "ingreso"
 * @returns {Promise<void>}
 */
async function llenarSelectCategorias(tipo) {
  const select = document.querySelector('#transaction-category');
  if (!select) return;

  const categorias = await obtenerCategorias();
  // Filtrar por tipo y excluir categorías de sistema (Ahorro/Retiro a meta),
  // que se crean automáticamente desde el módulo de Metas, no manualmente.
  const filtradas = categorias.filter(c => c.tipo === tipo && !c.sistema);

  select.innerHTML = `
    <option value="" disabled selected>Selecciona una categoría</option>
    ${filtradas.map(c => `<option value="${c.id}">${c.icono} ${c.nombre}</option>`).join('')}
  `;
}

/**
 * Configura los manejadores de eventos para el modal y formulario
 * @returns {void}
 */
function inicializarEventos() {
  // Botón para agregar transacción
  const btnAgregar = document.querySelector('#btn-add-transaction');
  const formTransaccion = document.querySelector('#form-nueva-transaccion');
  const btnCerrarModal = document.querySelector('#modal-close-btn');
  const btnCancelarModal = document.querySelector('#modal-cancel-btn');
  const inputMonto = document.querySelector('#transaction-amount');

  if (btnAgregar) {
    btnAgregar.addEventListener('click', () => {
      console.log('📝 Abriendo modal de nueva transacción');
      abrirModalNuevaTransaccion();
    });
  }

  if (formTransaccion) {
    formTransaccion.addEventListener('submit', manejarSubmitNuevaTransaccion);
  }

  if (btnCerrarModal) {
    btnCerrarModal.addEventListener('click', cerrarModalNuevaTransaccion);
  }

  if (btnCancelarModal) {
    btnCancelarModal.addEventListener('click', cerrarModalNuevaTransaccion);
  }

  if (inputMonto) {
    inputMonto.addEventListener('input', () => {
      const valorLimpio = limpiarMontoTransaccion(inputMonto.value);
      inputMonto.value = formatearMilesTransaccion(valorLimpio);
    });
  }

  // Cerrar modal al hacer click fuera del contenido
  const modal = document.querySelector('#add-transaction-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        cerrarModalNuevaTransaccion();
      }
    });
  }
}

/**
 * Configura el comportamiento de los botones de tipo (ingreso/gasto)
 * @returns {void}
 */
function configurarBotonesDeTipo() {
  const botonesType = document.querySelectorAll('.form-toggle-btn');
  const inputType = document.querySelector('#transaction-type');

  if (!botonesType.length || !inputType) return;

  botonesType.forEach(boton => {
    boton.addEventListener('click', async (e) => {
      e.preventDefault();

      const tipo = boton.getAttribute('data-type');
      inputType.value = tipo;

      botonesType.forEach(b => {
        b.classList.remove('form-toggle-btn--active');
        b.setAttribute('aria-pressed', 'false');
      });

      boton.classList.add('form-toggle-btn--active');
      boton.setAttribute('aria-pressed', 'true');

      // Re-filtrar categorías según el tipo nuevo
      await llenarSelectCategorias(tipo);

      console.log(`✅ Tipo seleccionado: ${tipo}`);
    });
  });
}


/**
 * Abre el modal para agregar una nueva transacción
 * @returns {void}
 */
function abrirModalNuevaTransaccion() {
  const modal = document.querySelector('#add-transaction-modal');
  if (modal) {
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden', 'false');
    console.log('📋 Modal abierto');
  }
}

/**
 * Cierra el modal de nueva transacción
 * @returns {void}
 */
function cerrarModalNuevaTransaccion() {
  const modal = document.querySelector('#add-transaction-modal');
  if (modal) {
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden', 'true');
    console.log('📋 Modal cerrado');
  }
}

/**
 * Maneja el envío del formulario de nueva transacción
 * @param {Event} evento - Evento de submit del formulario
 * @returns {Promise<void>}
 */
async function manejarSubmitNuevaTransaccion(evento) {
  evento.preventDefault();

  try {
    console.log('📤 Procesando nueva transacción...');

    const tipo = document.querySelector('#transaction-type')?.value;
    const categoriaIdRaw = document.querySelector('#transaction-category')?.value;
    const monto = parseInt(limpiarMontoTransaccion(document.querySelector('#transaction-amount')?.value), 10) || 0;
    const descripcion = document.querySelector('#transaction-description')?.value;
    const recurrente = document.querySelector('#transaction-recurring')?.checked || false;
    const fijo = document.querySelector('#transaction-fixed')?.checked || false;

    if (!tipo || !categoriaIdRaw || !monto || !descripcion) {
      alert('⚠️ Por favor completa todos los campos');
      console.warn('❌ Campos incompletos:', { tipo, categoriaIdRaw, monto, descripcion });
      return;
    }

    if (monto <= 0) {
      alert('⚠️ El monto debe ser mayor a 0');
      return;
    }

    const usuario = await obtenerUsuarioActual();
    const nuevaTransaccion = {
      id: Date.now(),
      usuario_id: usuario ? usuario.id : null,
      categoria_id: parseInt(categoriaIdRaw, 10),
      tipo: tipo,
      nombre: descripcion,
      valor: monto,
      fecha: new Date().toISOString().split('T')[0],
      recurrente: recurrente,
      fijo: fijo
    };

    console.log('✅ Nueva transacción:', nuevaTransaccion);

    await agregarTransaccion(nuevaTransaccion);

    // Limpiar formulario
    evento.target.reset();
    
    // Resetear el tipo a ingreso por defecto
    document.querySelector('#transaction-type').value = 'ingreso';
    const botonIngreso = document.querySelector('[data-type="ingreso"]');
    if (botonIngreso) botonIngreso.click();
    await llenarSelectCategorias('ingreso');

    // Cerrar modal
    cerrarModalNuevaTransaccion();

    // Mostrar confirmación
    mostrarConfirmacionTransaccion('Transacción agregada correctamente');
    enfocarHistorialTransacciones();

  } catch (error) {
    console.error('❌ Error al procesar transacción:', error);
    mostrarConfirmacionTransaccion('No se pudo agregar la transacción. Intenta de nuevo.', 'error');
  }
}

/**
 * Busca transacciones por término de búsqueda
 * @param {string} termino - Término de búsqueda
 * @returns {Promise<void>}
 * 
 * @example
 * buscarTransacciones("supermercado");
 */
async function buscarTransacciones(termino) {
  try {
    const transacciones = await cargarTransacciones();
    const resultado = transacciones.filter(t => 
      t.nombre.toLowerCase().includes(termino.toLowerCase()) ||
      t.categoria.toLowerCase().includes(termino.toLowerCase())
    );

    console.log(`🔍 Búsqueda: "${termino}" encontró ${resultado.length} resultados`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al buscar transacciones:', error);
    return [];
  }
}

/**
 * Filtra transacciones por tipo (gasto/ingreso)
 * @param {string} tipo - "gasto" o "ingreso"
 * @returns {Promise<void>}
 * 
 * @example
 * filtrarPorTipo("gasto");
 */
async function filtrarPorTipo(tipo) {
  try {
    const transacciones = await cargarTransacciones();
    const resultado = transacciones.filter(t => t.tipo === tipo);

    console.log(`📊 Filtro: Mostrando ${resultado.length} ${tipo}s`);
    return resultado;
  } catch (error) {
    console.error('❌ Error al filtrar transacciones:', error);
    return [];
  }
}

/**
 * Calcula el total de gastos o ingresos
 * @param {string} tipo - "gasto" o "ingreso"
 * @returns {Promise<number>} Total en la moneda actual
 * 
 * @example
 * const totalGastos = await calcularTotal("gasto");
 */
async function calcularTotal(tipo) {
  try {
    const transacciones = await cargarTransacciones();
    const total = transacciones
      .filter(t => t.tipo === tipo)
      .reduce((sum, t) => sum + t.valor, 0);

    return total;
  } catch (error) {
    console.error('❌ Error al calcular total:', error);
    return 0;
  }
}

/**
 * Exporta transacciones a formato CSV (para descargar)
 * @returns {Promise<void>}
 */
async function exportarACSV() {
  try {
    const transacciones = await cargarTransacciones();

    // Crear encabezados CSV
    const encabezados = ['ID', 'Nombre', 'Tipo', 'Categoría', 'Valor', 'Fecha'];
    const filas = transacciones.map(t => [
      t.id,
      t.nombre,
      t.tipo,
      t.categoria,
      t.valor,
      t.fecha
    ]);

    // Crear contenido CSV
    const csv = [
      encabezados.join(','),
      ...filas.map(fila => fila.join(','))
    ].join('\n');

    // Descargar archivo
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `transacciones-${new Date().toISOString().split('T')[0]}.csv`;
    enlace.click();

    console.log('✅ Transacciones exportadas a CSV');
  } catch (error) {
    console.error('❌ Error al exportar CSV:', error);
  }
}

// Auto-inicializar cuando el DOM está listo
document.addEventListener('DOMContentLoaded', inicializarTransacciones);

// Exportar funciones para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    inicializarTransacciones,
    abrirModalNuevaTransaccion,
    cerrarModalNuevaTransaccion,
    buscarTransacciones,
    filtrarPorTipo,
    calcularTotal,
    exportarACSV
  };
}
