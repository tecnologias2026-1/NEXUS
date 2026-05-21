/**
 * ============================================================
 * MÓDULO: analisis.js
 * ============================================================
 * Responsabilidad: Renderizar la página de Análisis con datos reales
 *
 * Lee transacciones, metas y categorías del usuario actual y calcula
 * todas las métricas (en lugar de mostrar valores hardcodeados).
 *
 * Si se agrega una transacción nueva, refrescar la página de análisis
 * actualiza automáticamente los números.
 *
 * Dependencias:
 * - datos.js     → obtenerTransacciones, obtenerMetas, nexusReady
 * - calculos.js  → funciones puras de cálculo
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    if (window.nexusReady) await window.nexusReady;
    await renderizarAnalisis();
  } catch (error) {
    console.error('❌ Error renderizando análisis:', error);
  }
});

/**
 * Función principal: calcula todas las métricas y las inyecta en el DOM
 */
async function renderizarAnalisis() {
  const [transacciones, metas] = await Promise.all([
    obtenerTransacciones(),
    obtenerMetas()
  ]);

  const mes = obtenerMesActual();

  // ── SECCIÓN 1: 4 TARJETAS DE MÉTRICAS ──
  renderizarMetricaCambioAhorro(transacciones);
  renderizarMetricaAhorrosMes(transacciones, mes);
  renderizarMetricaGastosMes(transacciones, mes);
  renderizarMetricaMetaTotal(metas);

  // ── SECCIÓN 2: SALUD FINANCIERA ──
  renderizarSaludFinanciera(transacciones, mes);

  // ── SECCIÓN 3: PROYECCIONES A 3 MESES ──
  renderizarProyecciones(transacciones);
}


/* ============================================================
   SECCIÓN 1: TARJETAS DE MÉTRICAS
   ============================================================ */

function renderizarMetricaCambioAhorro(transacciones) {
  const el = document.getElementById('metric-savings-change');
  if (!el) return;

  const cambio = calcularCambioAhorroVsMesAnterior(transacciones);

  if (cambio === null) {
    el.textContent = '—';
    el.classList.remove('metric-value--negative', 'metric-value--positive');
    return;
  }

  el.textContent = formatearPorcentajeConSigno(cambio);
  el.classList.toggle('metric-value--negative', cambio < 0);
  el.classList.toggle('metric-value--positive', cambio > 0);
}

function renderizarMetricaAhorrosMes(transacciones, mes) {
  const el = document.getElementById('metric-total-savings');
  if (!el) return;
  const balance = calcularBalanceMes(transacciones, mes);
  el.textContent = formatearCOP(balance);
}

function renderizarMetricaGastosMes(transacciones, mes) {
  const el = document.getElementById('metric-total-expenses');
  if (!el) return;
  const gastos = calcularGastosMes(transacciones, mes);
  el.textContent = formatearCOP(gastos);
}

function renderizarMetricaMetaTotal(metas) {
  const el = document.getElementById('metric-goal-total');
  if (!el) return;
  const total = calcularMetaTotalAcumulada(metas);
  el.textContent = formatearCOP(total);
}


/* ============================================================
   SECCIÓN 2: SALUD FINANCIERA
   ============================================================ */

function renderizarSaludFinanciera(transacciones, mes) {
  const ingresos = calcularIngresosMes(transacciones, mes);
  const gastos   = calcularGastosMes(transacciones, mes);
  const fijos    = calcularGastosFijosMes(transacciones, mes);
  const ratio    = calcularRatioGastosFijos(transacciones, mes);

  const elIngresos = document.getElementById('health-income');
  const elGastos   = document.getElementById('health-expenses');
  const elFijos    = document.getElementById('health-fixed');
  const elRatio    = document.getElementById('health-ratio');

  if (elIngresos) elIngresos.textContent = formatearCOP(ingresos);
  if (elGastos)   elGastos.textContent   = formatearCOP(gastos);
  if (elFijos)    elFijos.textContent    = formatearCOP(fijos);
  if (elRatio)    elRatio.textContent    = `${ratio}%`;
}


/* ============================================================
   SECCIÓN 3: PROYECCIONES A 3 MESES
   ============================================================ */

function renderizarProyecciones(transacciones) {
  const proyecciones = calcularProyecciones(transacciones);

  proyecciones.forEach((proy, indice) => {
    const numero    = indice + 1;
    const elValor   = document.getElementById(`projection-value-${numero}`);
    const elBarra   = document.getElementById(`projection-bar-${numero}`);
    const elContenedor = document.getElementById(`projection-bar-container-${numero}`);

    if (elValor) elValor.textContent = formatearCOP(proy.valor);
    if (elBarra) elBarra.style.width = `${proy.porcentaje}%`;
    if (elContenedor) {
      elContenedor.setAttribute('aria-valuenow', String(proy.porcentaje));
      elContenedor.setAttribute('aria-label', `Proyección ${proy.etiqueta}: ${formatearCOP(proy.valor)}`);
    }
  });
}
