/**
 * ============================================================
 * MÓDULO: calculos.js
 * ============================================================
 * Responsabilidad: Funciones puras de cálculo financiero
 *
 * Este módulo NO toca el DOM. Solo recibe arrays/objetos y
 * devuelve números o estructuras de datos.
 *
 * Lo usan: analisis.js, dashboard.js
 *
 * El día que el back exista, estas funciones siguen siendo
 * válidas porque trabajan sobre los mismos shapes de datos.
 * ============================================================
 */

/**
 * Devuelve la fecha actual en formato YYYY-MM
 * @returns {string}
 */
function obtenerMesActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}`;
}

/**
 * Devuelve un mes en formato YYYY-MM desplazado N meses atrás del actual.
 * Ej: mesesAtras(1) en mayo 2026 → "2026-04"
 * @param {number} n - Número de meses hacia atrás
 * @returns {string}
 */
function mesAnterior(n = 1) {
  const hoy = new Date();
  hoy.setDate(1); // evitar problemas con días que no existen en otros meses
  hoy.setMonth(hoy.getMonth() - n);
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}`;
}

/**
 * Filtra transacciones que pertenezcan a un mes específico (YYYY-MM)
 * @param {Array} transacciones
 * @param {string} mes - "2026-05"
 * @returns {Array}
 */
function filtrarTransaccionesDelMes(transacciones, mes) {
  return transacciones.filter(t => String(t.fecha).startsWith(mes));
}


/* ============================================================
   CÁLCULOS DEL MES
   ============================================================ */

function calcularIngresosMes(transacciones, mes) {
  return filtrarTransaccionesDelMes(transacciones, mes)
    .filter(t => t.tipo === 'ingreso')
    .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
}

function calcularGastosMes(transacciones, mes) {
  return filtrarTransaccionesDelMes(transacciones, mes)
    .filter(t => t.tipo === 'gasto')
    .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
}

function calcularBalanceMes(transacciones, mes) {
  return calcularIngresosMes(transacciones, mes) - calcularGastosMes(transacciones, mes);
}

function calcularGastosFijosMes(transacciones, mes) {
  return filtrarTransaccionesDelMes(transacciones, mes)
    .filter(t => t.tipo === 'gasto' && t.fijo === true)
    .reduce((sum, t) => sum + (Number(t.valor) || 0), 0);
}

/**
 * Devuelve un map { categoria_id: totalGastado } de los gastos del mes.
 */
function calcularGastosPorCategoria(transacciones, mes) {
  const resultado = {};
  filtrarTransaccionesDelMes(transacciones, mes)
    .filter(t => t.tipo === 'gasto')
    .forEach(t => {
      const id = t.categoria_id ?? t.categoria?.id;
      if (id == null) return;
      resultado[id] = (resultado[id] || 0) + (Number(t.valor) || 0);
    });
  return resultado;
}

/**
 * Ratio gastos fijos / ingresos del mes (0-100)
 */
function calcularRatioGastosFijos(transacciones, mes) {
  const ingresos = calcularIngresosMes(transacciones, mes);
  if (ingresos <= 0) return 0;
  const fijos = calcularGastosFijosMes(transacciones, mes);
  return Math.round((fijos / ingresos) * 100);
}


/* ============================================================
   COMPARACIÓN ENTRE MESES
   ============================================================ */

/**
 * Cambio porcentual del ahorro vs mes anterior.
 * Devuelve número (puede ser negativo) o null si no hay datos.
 */
function calcularCambioAhorroVsMesAnterior(transacciones) {
  const mesActual = obtenerMesActual();
  const mesPrev   = mesAnterior(1);

  const ahorroActual = calcularBalanceMes(transacciones, mesActual);
  const ahorroPrev   = calcularBalanceMes(transacciones, mesPrev);

  if (ahorroPrev === 0) return null;
  return Math.round(((ahorroActual - ahorroPrev) / Math.abs(ahorroPrev)) * 100);
}

/**
 * Promedio mensual de flujo neto (ingresos - gastos) de los últimos N meses.
 * Útil para proyecciones.
 */
function calcularFlujoMensualPromedio(transacciones, mesesAtras = 3) {
  let totalFlujo = 0;
  let mesesConDatos = 0;

  for (let i = 1; i <= mesesAtras; i++) {
    const mes = mesAnterior(i);
    const tDelMes = filtrarTransaccionesDelMes(transacciones, mes);
    if (tDelMes.length === 0) continue;
    totalFlujo += calcularBalanceMes(transacciones, mes);
    mesesConDatos++;
  }

  if (mesesConDatos === 0) return 0;
  return Math.round(totalFlujo / mesesConDatos);
}

/**
 * Proyecciones para los próximos 3 meses basadas en el flujo promedio
 * de los últimos meses. Cada proyección es el AHORRO ACUMULADO si el flujo
 * promedio se mantiene constante.
 *
 * @returns {Array<{etiqueta: string, valor: number, porcentaje: number}>}
 */
function calcularProyecciones(transacciones) {
  const flujoMensual = calcularFlujoMensualPromedio(transacciones, 3);

  // Para el porcentaje visual, normalizamos contra el máximo (flujo * 3)
  const maximo = Math.abs(flujoMensual * 3) || 1;

  return [1, 2, 3].map(mesN => {
    const valor = flujoMensual * mesN;
    const porcentaje = Math.min(100, Math.max(0, Math.round((Math.abs(valor) / maximo) * 100)));
    return {
      etiqueta: `Mes ${mesN}`,
      valor,
      porcentaje
    };
  });
}


/* ============================================================
   METAS
   ============================================================ */

function calcularAhorrosTotalesEnMetas(metas) {
  return metas.reduce((sum, m) => sum + (Number(m.monto_ahorrado) || 0), 0);
}

function calcularMetaTotalAcumulada(metas) {
  return metas.reduce((sum, m) => sum + (Number(m.monto_objetivo) || 0), 0);
}

/**
 * Identifica la meta del "fondo de emergencia" (por nombre).
 * Si no existe ninguna, devuelve null.
 */
function encontrarFondoEmergencia(metas) {
  const palabras = ['emergencia', 'emergency'];
  return metas.find(m => {
    const nombre = String(m.nombre || '').toLowerCase();
    return palabras.some(p => nombre.includes(p)) && m.tipo === 'personal';
  }) || null;
}

/**
 * Calcula cuántos meses cubre el fondo de emergencia con los gastos promedio.
 * @param {number} montoFondo - Monto ahorrado en el fondo
 * @param {number} gastosPromedioMes - Promedio de gastos mensuales
 * @returns {number}
 */
function calcularCoberturaMeses(montoFondo, gastosPromedioMes) {
  if (gastosPromedioMes <= 0) return 0;
  return Math.round((montoFondo / gastosPromedioMes) * 10) / 10; // 1 decimal
}


/* ============================================================
   GAMIFICACIÓN Y MÉTRICAS DEL DASHBOARD
   ============================================================ */

/**
 * Tasa de ahorro: ahorro / ingresos del mes (0-100)
 */
function calcularTasaAhorro(transacciones, mes) {
  const ingresos = calcularIngresosMes(transacciones, mes);
  if (ingresos <= 0) return 0;
  const ahorro = ingresos - calcularGastosMes(transacciones, mes);
  return Math.round((Math.max(0, ahorro) / ingresos) * 100);
}

/**
 * Proyección anual: flujo mensual promedio × 12
 */
function calcularProyeccionAnual(transacciones) {
  return calcularFlujoMensualPromedio(transacciones, 3) * 12;
}

/**
 * Promedio mensual de gastos de los últimos N meses.
 * Usado para calcular cobertura del fondo de emergencia.
 */
function calcularGastosPromedioMensual(transacciones, mesesAtras = 3) {
  let totalGastos = 0;
  let mesesConDatos = 0;

  for (let i = 0; i < mesesAtras; i++) {
    const mes = i === 0 ? obtenerMesActual() : mesAnterior(i);
    const tDelMes = filtrarTransaccionesDelMes(transacciones, mes);
    if (tDelMes.length === 0) continue;
    totalGastos += calcularGastosMes(transacciones, mes);
    mesesConDatos++;
  }

  if (mesesConDatos === 0) return 0;
  return Math.round(totalGastos / mesesConDatos);
}


/* ============================================================
   FORMATEO PARA UI
   ============================================================ */

/**
 * Formatea un número como moneda COP corta:
 * 1500 → "$1.500", 2500000 → "$2.500.000"
 */
function formatearCOP(valor) {
  const num = Number(valor) || 0;
  const signo = num < 0 ? '-' : '';
  return `${signo}$${Math.abs(num).toLocaleString('es-CO')} COP`;
}

/**
 * Formatea un porcentaje con signo: -5% / +12% / 0%
 */
function formatearPorcentajeConSigno(valor) {
  if (valor === null || valor === undefined) return '—';
  const signo = valor > 0 ? '+' : '';
  return `${signo}${valor}%`;
}
