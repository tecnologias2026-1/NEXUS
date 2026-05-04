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
 * 
 * @example
 * document.addEventListener('DOMContentLoaded', () => {
 *   inicializarTransacciones();
 * });
 */
async function inicializarTransacciones() {
  console.log('🚀 Inicializando sistema de transacciones...');

  try {
    // 1. Verificar que las dependencias existan
    if (typeof inicializarHistorial !== 'function') {
      throw new Error('❌ historial.js no está cargado. Verifica el orden de los scripts.');
    }

    if (typeof generarFilaGasto !== 'function' || typeof generarFilaIngreso !== 'function') {
      throw new Error('❌ gastos.js o ingresos.js no están cargados.');
    }

    // 2. Cargar el historial inicial
    await inicializarHistorial();

    // 3. Inicializar manejadores de eventos
    inicializarEventos();

    // 4. Configurar comportamiento de los botones de tipo
    configurarBotonesDeTipo();

    console.log('✅ Sistema de transacciones inicializado correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar transacciones:', error);
  }
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
    boton.addEventListener('click', (e) => {
      e.preventDefault();

      // Obtener el tipo seleccionado
      const tipo = boton.getAttribute('data-type');
      
      // Actualizar el valor del input oculto
      inputType.value = tipo;

      // Actualizar estados visuales de los botones
      botonesType.forEach(b => {
        b.classList.remove('form-toggle-btn--active');
        b.setAttribute('aria-pressed', 'false');
      });

      boton.classList.add('form-toggle-btn--active');
      boton.setAttribute('aria-pressed', 'true');

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

    // Obtener valores del formulario
    const tipo = document.querySelector('#transaction-type')?.value;
    const categoria = document.querySelector('#transaction-category')?.value;
    const monto = parseFloat(document.querySelector('#transaction-amount')?.value || 0);
    const descripcion = document.querySelector('#transaction-description')?.value;

    // Validación básica
    if (!tipo || !categoria || !monto || !descripcion) {
      alert('⚠️ Por favor completa todos los campos');
      console.warn('❌ Campos incompletos:', { tipo, categoria, monto, descripcion });
      return;
    }

    if (monto <= 0) {
      alert('⚠️ El monto debe ser mayor a 0');
      return;
    }

    // Crear nueva transacción
    const nuevaTransaccion = {
      id: Date.now(), // ID único basado en timestamp
      nombre: descripcion,
      valor: monto,
      fecha: new Date().toISOString().split('T')[0], // Fecha actual en formato YYYY-MM-DD
      categoria: categoria,
      tipo: tipo
    };

    console.log('✅ Nueva transacción:', nuevaTransaccion);

    // Agregar al historial
    await agregarTransaccion(nuevaTransaccion);

    // Limpiar formulario
    evento.target.reset();
    
    // Resetear el tipo a ingreso por defecto
    document.querySelector('#transaction-type').value = 'ingreso';
    const botonIngreso = document.querySelector('[data-type="ingreso"]');
    if (botonIngreso) botonIngreso.click();

    // Cerrar modal
    cerrarModalNuevaTransaccion();

    // Mostrar confirmación
    alert('✅ Transacción agregada correctamente');

  } catch (error) {
    console.error('❌ Error al procesar transacción:', error);
    alert('❌ Error al agregar la transacción. Intenta de nuevo.');
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
