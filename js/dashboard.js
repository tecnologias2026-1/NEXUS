/**
 * ============================================================
 * MÓDULO: dashboard.js
 * ============================================================
 * Responsabilidad: Renderizar el dashboard con datos derivados
 *
 * Llena dinámicamente:
 * - Header: nombre del usuario + iniciales del avatar
 * - Balance mensual + desglose de ingresos/gastos
 * - Gamificación: nivel, XP, racha
 * - Fondo de emergencia: cobertura, progreso, ahorro vs meta
 * - Métricas clave: tasa de ahorro, gastos fijos/ingreso, proyección anual
 *
 * Dependencias:
 * - datos.js     → obtenerUsuarioActual, obtenerTransacciones, obtenerMetas
 * - calculos.js  → cálculos puros sobre los datos
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Solo ejecutar si estamos en dashboard.html (existe el contenedor principal)
  if (!document.querySelector('.dashboard-main')) return;

  try {
    if (window.nexusReady) await window.nexusReady;
    await renderizarDashboard();
  } catch (error) {
    console.error('❌ Error renderizando dashboard:', error);
  }
});

/**
 * Función principal: orquesta el render de todas las secciones
 */
async function renderizarDashboard() {
  const [usuario, transacciones, metas] = await Promise.all([
    obtenerUsuarioActual(),
    obtenerTransacciones(),
    obtenerMetas()
  ]);

  if (!usuario) {
    console.warn('⚠️ No hay sesión activa para renderizar dashboard');
    return;
  }

  const mes = obtenerMesActual();

  renderizarHeaderUsuario(usuario);
  renderizarBalanceMensual(transacciones, mes);
  renderizarGamificacion(usuario);
  renderizarFondoEmergencia(metas, transacciones);
  renderizarMetricasClave(transacciones, mes);
}


/* ============================================================
   HEADER: AVATAR Y NOMBRE
   ============================================================ */

function renderizarHeaderUsuario(usuario) {
  const elNombre = document.getElementById('user-name');
  const elIniciales = document.getElementById('user-avatar-initials');

  if (elNombre) elNombre.textContent = usuario.nombre;
  if (elIniciales) {
    elIniciales.textContent = generarIniciales(usuario.nombre);
  }
}

function generarIniciales(nombre) {
  return String(nombre || '')
    .split(/\s+/)
    .slice(0, 2)
    .map(palabra => palabra.charAt(0).toUpperCase())
    .join('') || 'U';
}


/* ============================================================
   BALANCE MENSUAL
   ============================================================ */

function renderizarBalanceMensual(transacciones, mes) {
  const ingresos = calcularIngresosMes(transacciones, mes);
  const gastos   = calcularGastosMes(transacciones, mes);
  const balance  = ingresos - gastos;

  const elBalance  = document.getElementById('balance-heading');
  const elIngresos = document.getElementById('balance-income');
  const elGastos   = document.getElementById('balance-expenses');

  if (elBalance) {
    elBalance.innerHTML = `${formatearCOPCorta(balance)} <span class="balance-currency">COP</span>`;
    elBalance.setAttribute('aria-label', `Balance mensual: ${formatearCOP(balance)}`);
  }
  if (elIngresos) elIngresos.textContent = formatearCOP(ingresos);
  if (elGastos)   elGastos.textContent   = formatearCOP(gastos);
}

/**
 * Versión sin "COP" al final, para el heading grande del balance
 * (el span "COP" ya está aparte en el HTML)
 */
function formatearCOPCorta(valor) {
  const num = Number(valor) || 0;
  const signo = num < 0 ? '-' : '';
  return `${signo}$${Math.abs(num).toLocaleString('es-CO')}`;
}


/* ============================================================
   GAMIFICACIÓN
   ============================================================ */

function renderizarGamificacion(usuario) {
  const gam = usuario.gamificacion || {};

  const elNivel  = document.getElementById('gamification-heading');
  const elXpVal  = document.getElementById('gamification-xp-value');
  const elXpBar  = document.getElementById('gamification-xp-bar');
  const elXpFill = document.getElementById('gamification-xp-fill');
  const elRacha  = document.getElementById('gamification-streak-value');

  const nivel    = gam.nivel || 1;
  const xpActual = gam.xp_actual || 0;
  const xpMax    = gam.xp_siguiente_nivel || 100;
  const racha    = gam.racha_dias || 0;
  const pctXp    = Math.min(100, Math.max(0, Math.round((xpActual / xpMax) * 100)));

  if (elNivel)  elNivel.textContent = `Nivel ${nivel}`;
  if (elXpVal)  elXpVal.textContent = `${xpActual} / ${xpMax} XP`;
  if (elXpFill) elXpFill.style.width = `${pctXp}%`;
  if (elXpBar) {
    elXpBar.setAttribute('aria-valuenow', String(xpActual));
    elXpBar.setAttribute('aria-valuemax', String(xpMax));
    elXpBar.setAttribute('aria-label', `Progreso de experiencia: ${xpActual} de ${xpMax} XP`);
  }
  if (elRacha)  elRacha.textContent = String(racha);
}


/* ============================================================
   FONDO DE EMERGENCIA
   ============================================================ */

function renderizarFondoEmergencia(metas, transacciones) {
  const fondo = encontrarFondoEmergencia(metas);

  const elCobertura = document.getElementById('emergency-coverage-value');
  const elPct       = document.getElementById('emergency-pct-label');
  const elFill      = document.getElementById('emergency-bar-fill');
  const elSaved     = document.getElementById('emergency-saved');
  const elTarget    = document.getElementById('emergency-target');

  if (!fondo) {
    // No hay meta de emergencia configurada
    if (elCobertura) elCobertura.textContent = '— meses';
    if (elPct)       elPct.textContent = '0%';
    if (elFill)      elFill.style.width = '0%';
    if (elSaved)     elSaved.textContent = formatearCOP(0);
    if (elTarget)    elTarget.textContent = formatearCOP(0);
    return;
  }

  const ahorrado = Number(fondo.monto_ahorrado) || 0;
  const objetivo = Number(fondo.monto_objetivo) || 0;
  const pct      = objetivo > 0 ? Math.min(100, Math.round((ahorrado / objetivo) * 100)) : 0;

  const gastosPromedio = calcularGastosPromedioMensual(transacciones, 3);
  const cobertura      = calcularCoberturaMeses(ahorrado, gastosPromedio);

  if (elCobertura) elCobertura.textContent = gastosPromedio > 0 ? `${cobertura} meses` : '— meses';
  if (elPct)       elPct.textContent = `${pct}%`;
  if (elFill)      elFill.style.width = `${pct}%`;
  if (elSaved)     elSaved.textContent = formatearCOP(ahorrado);
  if (elTarget)    elTarget.textContent = formatearCOP(objetivo);
}


/* ============================================================
   MÉTRICAS CLAVE
   ============================================================ */

function renderizarMetricasClave(transacciones, mes) {
  const tasaAhorro     = calcularTasaAhorro(transacciones, mes);
  const ratioFijos     = calcularRatioGastosFijos(transacciones, mes);
  const proyeccionAnio = calcularProyeccionAnual(transacciones);

  const elTasa  = document.getElementById('metrics-savings-rate');
  const elRatio = document.getElementById('metrics-fixed-ratio');
  const elProy  = document.getElementById('metrics-annual-projection');

  if (elTasa)  elTasa.textContent  = `${tasaAhorro}%`;
  if (elRatio) elRatio.textContent = `${ratioFijos}%`;
  if (elProy)  elProy.textContent  = formatearCOP(proyeccionAnio);
}
