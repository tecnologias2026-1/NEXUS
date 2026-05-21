/**
 * ============================================================
 * MÓDULO: metas_social.js
 * ============================================================
 * Responsabilidad: Renderizar las metas colaborativas del usuario
 * actual dentro de la página social (Amigos.html), usando las clases
 * CSS específicas de esa página (collab-goal-card, etc.).
 *
 * Esta sección antes estaba hardcodeada en el HTML — por eso aparecía
 * en CUALQUIER usuario (incluido demo, que no tiene metas). Ahora
 * obtiene metas reales filtradas por usuario_id vía datos.js.
 *
 * Dependencias:
 * - datos.js → obtenerMetas, obtenerAmigos, nexusReady
 * ============================================================
 */

async function inicializarMetasColaborativasSocial() {
  try {
    if (window.nexusReady) await window.nexusReady;

    const [metas, amigos] = await Promise.all([
      obtenerMetas(),
      obtenerAmigos()
    ]);

    const colaborativas = metas.filter(m => m.tipo === 'colaborativa');
    const html = generarHTMLMetasColaborativasSocial(colaborativas, amigos);
    renderizarMetasColaborativasSocial(html);
  } catch (error) {
    console.error('❌ Error renderizando metas colaborativas en social:', error);
  }
}

function renderizarMetasColaborativasSocial(html) {
  const contenedor = document.querySelector('.collab-goals-list');
  if (!contenedor) return;
  contenedor.innerHTML = html;
}

function generarHTMLMetasColaborativasSocial(metas, amigos) {
  if (metas.length === 0) {
    return `
      <p class="collab-goals-empty" style="text-align: center; color: #94a3b8; padding: 2rem;">
        Aún no tienes metas colaborativas. Crea una desde la sección "Metas".
      </p>
    `;
  }
  return metas.map(meta => generarHTMLMetaColaborativaSocial(meta, amigos)).join('');
}

function generarHTMLMetaColaborativaSocial(meta, amigos) {
  const objetivo  = Number(meta.monto_objetivo) || 0;
  const ahorrado  = Number(meta.monto_ahorrado) || 0;
  const porcentaje = objetivo > 0 ? Math.min(100, Math.round((ahorrado / objetivo) * 100)) : 0;
  const diasTexto = calcularDiasRestantes(meta.fecha_limite);

  const participantes = Array.isArray(meta.participantes) ? meta.participantes : [];
  const numParticipantes = participantes.length;
  const personasTexto = numParticipantes === 1 ? '1 persona' : `${numParticipantes} personas`;

  const ocultarMontos = Boolean(meta.privacidad_montos);

  return `
    <article class="collab-goal-card" role="listitem"
             aria-label="Meta colaborativa: ${meta.nombre}, ${porcentaje}% completado">

      <header class="goal-card-header">
        <div class="goal-card-title-block">
          <span class="goal-emoji" aria-hidden="true">${meta.icono || '🎯'}</span>
          <h3 class="goal-card-title">${meta.nombre}</h3>
        </div>

        <div class="goal-card-meta">
          <svg aria-hidden="true" focusable="false"
               width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <span aria-label="${personasTexto}">${personasTexto}</span>

          <span aria-hidden="true" class="meta-separator">·</span>

          <svg aria-hidden="true" focusable="false"
               width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8"  y1="2" x2="8"  y2="6"/>
            <line x1="3"  y1="10" x2="21" y2="10"/>
          </svg>
          <time datetime="${meta.fecha_limite || ''}" aria-label="Fecha límite">${diasTexto}</time>
        </div>
      </header>

      <div class="goal-progress-block">
        <div class="goal-progress-header">
          <span class="goal-progress-label">Progreso</span>
          <span class="goal-progress-pct" aria-label="${porcentaje} por ciento completado">${porcentaje}%</span>
        </div>
        <div class="goal-progressbar" role="progressbar"
             aria-valuenow="${porcentaje}" aria-valuemin="0" aria-valuemax="100"
             aria-label="${porcentaje}% del objetivo alcanzado">
          <div class="goal-progressbar-fill" style="width: ${porcentaje}%"></div>
        </div>
      </div>

      <div class="goal-contributions">
        <h4 class="contributions-title">Contribución individual</h4>
        <ul class="contributions-list" role="list"
            aria-label="Progreso individual de cada participante">
          ${participantes.map(p => generarHTMLContribucion(p, amigos)).join('')}
        </ul>
      </div>

      ${ocultarMontos ? `
        <footer class="goal-card-footer" role="note"
                aria-label="Nota de privacidad financiera">
          <svg aria-hidden="true" focusable="false"
               width="13" height="13" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          Los montos individuales están ocultos
        </footer>
      ` : ''}
    </article>
  `;
}

function generarHTMLContribucion(participante, amigos) {
  const esYo = participante.amigo_id === 0;
  const amigo = esYo ? null : amigos.find(a => a.id === participante.amigo_id);
  const nombre = esYo ? 'Tú' : (amigo?.nombre || 'Amigo');
  const porcentaje = Number(participante.porcentaje_contribucion) || 0;

  const avatarClass = esYo ? 'contribution-avatar contribution-avatar--self' : 'contribution-avatar';
  const nameClass   = esYo ? 'contribution-name contribution-name--self' : 'contribution-name';
  const barClass    = esYo ? 'contribution-bar-fill contribution-bar-fill--self' : 'contribution-bar-fill';

  return `
    <li class="contribution-item">
      <svg class="${avatarClass}" aria-hidden="true" focusable="false"
           width="28" height="28" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="${nameClass}">${nombre}</span>
      <div class="contribution-bar-wrap" role="presentation">
        <div class="contribution-bar" aria-hidden="true">
          <div class="${barClass}" style="width: ${porcentaje}%"></div>
        </div>
      </div>
      <span class="contribution-pct" aria-label="${esYo ? 'Tu contribución' : 'Contribución de ' + nombre}: ${porcentaje}%">${porcentaje}%</span>
    </li>
  `;
}

/**
 * Calcula los días restantes hasta una fecha y devuelve un texto corto
 * tipo "15d", "Hoy", "Vencida".
 */
function calcularDiasRestantes(fechaISO) {
  if (!fechaISO) return '—';
  const [year, month, day] = String(fechaISO).split('-').map(Number);
  if (!year || !month || !day) return '—';
  const limite = new Date(year, month - 1, day);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  limite.setHours(0, 0, 0, 0);
  const dias = Math.ceil((limite - hoy) / 86400000);
  if (dias > 0) return `${dias}d`;
  if (dias === 0) return 'Hoy';
  return 'Vencida';
}
