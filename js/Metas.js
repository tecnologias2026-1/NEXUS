/**
 * Cache de amigos del usuario actual. Se llena al abrir el modal de
 * creación de meta colaborativa, llamando a obtenerAmigos() de datos.js.
 * Cada amigo tiene la forma { id, nombre, ...gamificación }.
 *
 * Para mantener compatibilidad con la lógica existente del modal
 * (que espera { id, name, initial, color }), se mapea al cargar.
 *
 * @type {Array<{id:number, name:string, initial:string, color:string}>}
 */
let AMIGOS_DEL_USUARIO = [];

// Paleta rotativa para asignar colores a los avatares de amigos
const _coloresAvatar = ['#F59E0B', '#10B981', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#0EA5E9', '#84CC16'];

/**
 * Carga los amigos del usuario actual desde datos.js y los normaliza
 * al formato que espera el modal (name, initial, color).
 */
async function cargarAmigosDelUsuario() {
  const amigos = await obtenerAmigos();
  AMIGOS_DEL_USUARIO = amigos.map((a, i) => ({
    id: a.id,
    name: a.nombre,
    initial: a.nombre.trim().charAt(0).toUpperCase() || 'A',
    color: _coloresAvatar[i % _coloresAvatar.length]
  }));
}

// Estado del modal — se reinicia en cada apertura
const state = {
  selectedFriendIds:  new Set(),
  currentStep:        1,
  lastFocusedElement: null,
};

// Referencias al DOM
const modalOverlay       = document.getElementById('modal-add-meta');
const modalDialog        = document.getElementById('modal-dialog-content');
const btnOpenModal       = document.getElementById('btn-open-modal');
const btnCloseModal      = document.getElementById('modal-meta-close');
const btnCancel          = document.getElementById('btn-modal-cancel');

const stepDot1           = document.getElementById('step-dot-1');
const stepDot2           = document.getElementById('step-dot-2');
const stepSection1       = document.getElementById('modal-step-1');
const stepSection2       = document.getElementById('modal-step-2');

const radiosTypo         = document.querySelectorAll('input[name="tipo-meta"]');
const inputNombre        = document.getElementById('meta-nombre');
const inputObjetivo      = document.getElementById('meta-objetivo');
const inputFecha         = document.getElementById('meta-fecha');
const btnStep1Next       = document.getElementById('btn-step1-next');

const friendsSearchInput = document.getElementById('friends-search');
const friendsList        = document.getElementById('friends-list');
const selectedFriendsEl  = document.getElementById('selected-friends');
const friendsEmptyMsg    = document.getElementById('friends-empty-msg');
const togglePrivacidad   = document.getElementById('toggle-privacidad');
const btnStep2Back       = document.getElementById('btn-step2-back');
const btnStep2Create     = document.getElementById('btn-step2-create');

const srAnnouncer        = document.getElementById('sr-announcer');
const personalGoalsList  = document.querySelector('[aria-label="Lista de metas personales"]');
const colabGoalsList     = document.querySelector('[aria-label="Lista de metas colaborativas"]');
const statusRegion       = document.getElementById('metas-status-region');


// Anuncia mensajes a tecnologías asistivas (aria-live).
// Limpia antes de escribir para que el mismo texto se anuncie si se repite.
function announce(message) {
  if (!srAnnouncer) return;
  srAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    srAnnouncer.textContent = message;
  });
}

// Devuelve todos los elementos enfocables visibles dentro de un contenedor.
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]') && !el.closest('.modal-step:not(.is-active)'));
}

// Muestra u oculta el mensaje de error de un campo.
function setFieldError(input, errorEl, isValid, message = '') {
  input.setAttribute('aria-invalid', String(!isValid));
  errorEl.classList.toggle('is-visible', !isValid);
  errorEl.textContent = isValid ? '' : message;
}

function setStatusMessage(message) {
  if (statusRegion) statusRegion.textContent = message;
  announce(message);
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function formatCurrencyCOP(value) {
  const numericValue = Number(value) || 0;
  return `$${numericValue.toLocaleString('es-CO')} COP`;
}

function parseLocalDate(fechaISO) {
  const [year, month, day] = String(fechaISO || '').split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDaysText(fechaISO) {
  const dueDate = parseLocalDate(fechaISO);
  if (!dueDate) return 'Sin fecha limite';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((dueDate - today) / 86400000);
  if (diffDays > 1) return `${diffDays} dias restantes`;
  if (diffDays === 1) return '1 dia restante';
  if (diffDays === 0) return 'Vence hoy';

  const overdueDays = Math.abs(diffDays);
  return overdueDays === 1 ? 'Vencida hace 1 dia' : `Vencida hace ${overdueDays} dias`;
}

function getProgress(meta) {
  const objetivo = Number(meta.monto_objetivo ?? meta.objetivo) || 0;
  const ahorrado = Number(meta.monto_ahorrado ?? meta.ahorrado) || 0;
  if (objetivo <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((ahorrado / objetivo) * 100)));
}

function getInitial(name) {
  return String(name || 'M').trim().charAt(0).toUpperCase() || 'M';
}

function getSafeTitleId(meta) {
  return `meta-${String(meta.id).replace(/[^a-zA-Z0-9_-]/g, '')}-titulo`;
}

function getDeleteIconSVG() {
  return `
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  `;
}

function getPlusIconSVG() {
  return `
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2.5"
      stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  `;
}

function getWithdrawIconSVG() {
  return `
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 19V5" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  `;
}

/**
 * Genera el bloque HTML de acciones de una meta:
 * - Botón "Retirar" SIEMPRE visible (gris si no se puede, verde si se puede).
 * - Botón "Eliminar".
 *
 * El aporte ya no tiene botón propio — se hace clickeando la card entera.
 */
function renderGoalActions(meta) {
  const puedeRetirar = typeof puedeRetirarseMeta === 'function' && puedeRetirarseMeta(meta);
  const safeName = escapeHTML(meta.nombre);
  const safeId = escapeHTML(meta.id);

  const claseRetirar = puedeRetirar
    ? 'btn-meta-opciones--retirar btn-meta-opciones--retirar--habilitado'
    : 'btn-meta-opciones--retirar btn-meta-opciones--retirar--bloqueado';

  const ariaRetirar = puedeRetirar
    ? `Retirar ahorro de la meta ${safeName}`
    : `Retiro bloqueado para ${safeName}. Cumple la fecha o el monto objetivo para habilitarlo`;

  return `
    <div class="meta-card-acciones">
      <button type="button" class="btn-meta-opciones ${claseRetirar}"
        aria-label="${ariaRetirar}"
        data-retirar-meta-id="${safeId}"
        data-puede-retirar="${puedeRetirar}">
        ${getWithdrawIconSVG()}
        <span class="btn-meta-retirar-label">Retirar</span>
      </button>
      <button type="button" class="btn-meta-opciones btn-meta-opciones--delete"
        aria-label="Eliminar meta ${safeName}"
        data-delete-meta-id="${safeId}">
        ${getDeleteIconSVG()}
      </button>
    </div>
  `;
}

/**
 * Disclaimer pequeño que aparece dentro de cada card de meta.
 * Avisa que el dinero aportado no se puede retirar hasta cumplir.
 */
function renderGoalDisclaimer() {
  return `
    <p class="meta-disclaimer" role="note">
      <svg aria-hidden="true" width="11" height="11" viewBox="0 0 24 24"
        fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>Al aportar, el dinero queda bloqueado hasta cumplir la fecha o el monto objetivo.</span>
    </p>
  `;
}

function getCalendarIconSVG() {
  return `
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  `;
}

function getPersonalIconSVG() {
  return `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  `;
}

function getUserIconSVG() {
  return `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  `;
}

function getPrivacyIconSVG() {
  return `
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  `;
}

/**
 * Carga las metas del usuario actual desde datos.js.
 * Reemplaza la lectura directa de localStorage para que el back
 * solo tenga que cambiar la fuente en datos.js cuando exista.
 *
 * @returns {Promise<Array>}
 */
async function cargarMetas() {
  try {
    return await obtenerMetas();
  } catch (error) {
    console.error('Error al cargar metas:', error);
    return [];
  }
}

function renderGoalProgress(meta, label) {
  const progress = getProgress(meta);
  return `
    <div class="meta-progreso-wrapper">
      <div class="meta-progreso-labels">
        <span class="meta-progreso-label">Progreso</span>
        <span class="meta-progreso-porcentaje" data-meta-porcentaje aria-hidden="true">${progress}%</span>
      </div>
      <div class="meta-progreso-barra"
        role="progressbar"
        aria-label="${escapeHTML(label)}"
        aria-valuenow="${progress}" aria-valuemin="0" aria-valuemax="100"
        aria-valuetext="${progress}% completado"
        data-meta-progreso>
        <div class="meta-progreso-relleno" style="width: ${progress}%"></div>
      </div>
    </div>
  `;
}

function renderGoalAmounts(meta) {
  const ahorrado = meta.monto_ahorrado ?? meta.ahorrado;
  const objetivo = meta.monto_objetivo ?? meta.objetivo;
  return `
    <div class="meta-montos">
      <div class="meta-monto-grupo">
        <span class="meta-monto-etiqueta">Ahorrado</span>
        <p class="meta-monto-valor meta-monto-ahorrado"
          data-meta-ahorrado aria-label="Monto ahorrado: ${escapeHTML(formatCurrencyCOP(ahorrado))}">
          ${escapeHTML(formatCurrencyCOP(ahorrado))}
        </p>
      </div>
      <div class="meta-monto-grupo meta-monto-grupo--derecha">
        <span class="meta-monto-etiqueta">Meta</span>
        <p class="meta-monto-valor meta-monto-objetivo"
          data-meta-objetivo aria-label="Monto objetivo: ${escapeHTML(formatCurrencyCOP(objetivo))}">
          ${escapeHTML(formatCurrencyCOP(objetivo))}
        </p>
      </div>
    </div>
  `;
}

function renderPersonalGoal(meta) {
  const titleId = getSafeTitleId(meta);
  const safeName = escapeHTML(meta.nombre);
  const daysText = getDaysText(meta.fecha_limite || meta.fechaLimite || meta.fecha);

  return `
    <li class="meta-item" data-meta-id="${escapeHTML(meta.id)}">
      <article class="meta-card meta-card--personal meta-card--clickable"
        role="button"
        tabindex="0"
        aria-labelledby="${escapeHTML(titleId)}"
        aria-label="Aportar a la meta ${safeName}"
        data-aportar-meta-id="${escapeHTML(meta.id)}">
        <header class="meta-card-header">
          <div class="meta-card-icono" aria-hidden="true">
            ${getPersonalIconSVG()}
          </div>

          <div class="meta-card-header-info">
            <h3 class="meta-card-titulo" id="${escapeHTML(titleId)}">${safeName}</h3>
            <p class="meta-card-dias" aria-label="Dias restantes: ${escapeHTML(daysText)}">
              ${getCalendarIconSVG()}
              <span data-meta-dias>${escapeHTML(daysText)}</span>
            </p>
          </div>

          ${renderGoalActions(meta)}
        </header>

        ${renderGoalProgress(meta, `Progreso de ${meta.nombre}`)}
        ${renderGoalAmounts(meta)}
        ${renderGoalDisclaimer()}
      </article>
    </li>
  `;
}

/**
 * Convierte un participante del schema { amigo_id, porcentaje_contribucion }
 * al formato que esperan los renderizadores ({ id, name, initial, color, esUsuarioActual, porcentaje }).
 * El amigo_id se resuelve buscando en AMIGOS_DEL_USUARIO; amigo_id=0 representa al usuario actual.
 */
function normalizarParticipante(p) {
  // Si ya viene en formato viejo (tiene 'name' o 'aporte'), devolverlo tal cual con porcentaje calculado
  if (p.name || p.nombre || p.aporte != null) {
    return {
      id: p.id || p.amigo_id,
      name: p.name || p.nombre || 'Participante',
      initial: p.initial || getInitial(p.name || p.nombre),
      color: p.color || '#64748B',
      esUsuarioActual: Boolean(p.esUsuarioActual),
      porcentaje: Number(p.porcentaje_contribucion ?? p.porcentaje) || 0
    };
  }
  // Formato del schema: { amigo_id, porcentaje_contribucion }
  const esYo = p.amigo_id === 0;
  const amigo = esYo ? null : AMIGOS_DEL_USUARIO.find(a => a.id === p.amigo_id);
  return {
    id: p.amigo_id,
    name: esYo ? 'Tú' : (amigo?.name || 'Amigo'),
    initial: esYo ? 'T' : (amigo?.initial || 'A'),
    color: esYo ? '#5B3DF5' : (amigo?.color || '#64748B'),
    esUsuarioActual: esYo,
    porcentaje: Number(p.porcentaje_contribucion) || 0
  };
}

function renderContributionItem(participant, meta) {
  const isCurrentUser = Boolean(participant.esUsuarioActual);
  const participantName = participant.name || participant.nombre || 'Participante';
  const percent = Number(participant.porcentaje) || 0;
  const avatarClass = isCurrentUser
    ? 'meta-contribucion-avatar meta-contribucion-avatar--tu'
    : 'meta-contribucion-avatar';
  const avatarStyle = !isCurrentUser && participant.color
    ? ` style="background:${escapeHTML(participant.color)};"`
    : '';
  const avatarContent = isCurrentUser
    ? getUserIconSVG()
    : escapeHTML(participant.initial || getInitial(participantName));

  return `
    <li class="meta-contribucion-item">
      <div class="${avatarClass}"${avatarStyle} aria-hidden="true">${avatarContent}</div>
      <span class="meta-contribucion-nombre">${escapeHTML(isCurrentUser ? 'Tu' : participantName)}</span>
      <div class="meta-contribucion-barra-wrapper">
        <div class="meta-contribucion-barra"
          role="progressbar" aria-label="Contribucion de ${escapeHTML(participantName)}"
          aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"
          aria-valuetext="${percent}%" data-contribucion-progreso>
          <div class="meta-contribucion-relleno" style="width: ${percent}%"></div>
        </div>
      </div>
      <span class="meta-contribucion-porcentaje" data-contribucion-valor aria-hidden="true">${percent}%</span>
    </li>
  `;
}

function renderColabGoal(meta) {
  const titleId = getSafeTitleId(meta);
  const safeName = escapeHTML(meta.nombre);
  const daysText = getDaysText(meta.fecha_limite || meta.fechaLimite || meta.fecha);
  const participantes = Array.isArray(meta.participantes) && meta.participantes.length
    ? meta.participantes.map(p => normalizarParticipante(p))
    : [{ id: 'usuario-actual', name: 'Tu', initial: 'T', esUsuarioActual: true, porcentaje: 0 }];
  const participantCount = participantes.length;

  return `
    <li class="meta-item" data-meta-id="${escapeHTML(meta.id)}">
      <article class="meta-card meta-card--colaborativa meta-card--clickable"
        role="button"
        tabindex="0"
        aria-labelledby="${escapeHTML(titleId)}"
        aria-label="Aportar a la meta colaborativa ${safeName}"
        data-aportar-meta-id="${escapeHTML(meta.id)}">
        <header class="meta-card-header">
          <div class="meta-card-avatar-grupo" aria-hidden="true">
            <span class="meta-card-avatar-inicial">${escapeHTML(getInitial(meta.nombre))}</span>
          </div>

          <div class="meta-card-header-info">
            <h3 class="meta-card-titulo" id="${escapeHTML(titleId)}">${safeName}</h3>
            <div class="meta-card-meta-grupo">
              <span class="meta-card-meta-item" aria-label="Numero de participantes: ${participantCount}">
                <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
                <span data-colab-personas>${participantCount} ${participantCount === 1 ? 'persona' : 'personas'}</span>
              </span>
              <span class="meta-card-meta-item" aria-label="Dias restantes: ${escapeHTML(daysText)}">
                ${getCalendarIconSVG()}
                <span data-colab-dias>${escapeHTML(daysText)}</span>
              </span>
            </div>
          </div>

          ${renderGoalActions(meta)}
        </header>

        ${renderGoalProgress(meta, `Progreso grupal de ${meta.nombre}`)}
        ${renderGoalAmounts(meta)}

        <div class="meta-contribuciones">
          <h4 class="meta-contribuciones-titulo">Contribucion Individual</h4>
          <ul class="meta-contribuciones-lista" role="list"
            aria-label="Contribuciones individuales de ${safeName}">
            ${participantes.map(participant => renderContributionItem(participant, meta)).join('')}
          </ul>

          ${(meta.privacidad_montos ?? meta.privacidad) ? `
            <p class="meta-privacidad-nota" role="note">
              ${getPrivacyIconSVG()}
              Los montos individuales estan ocultos
            </p>
          ` : ''}
        </div>
        ${renderGoalDisclaimer()}
      </article>
    </li>
  `;
}

function renderEmptyState(type) {
  const text = type === 'personal'
    ? 'Aun no tienes metas personales. Crea una con el boton "Agregar nueva meta".'
    : 'Aun no tienes metas colaborativas. Crea una y agrega amigos para compartirla.';

  return `
    <li class="metas-empty-state">
      <p>${escapeHTML(text)}</p>
    </li>
  `;
}

function renderGoalsList(listElement, goals, type) {
  if (!listElement) return;

  if (!goals.length) {
    listElement.innerHTML = renderEmptyState(type);
    return;
  }

  listElement.innerHTML = goals
    .map(goal => type === 'personal' ? renderPersonalGoal(goal) : renderColabGoal(goal))
    .join('');
}

async function renderGoals() {
  // Asegurar que la sesión esté inicializada antes de leer metas
  if (window.nexusReady) await window.nexusReady;
  // Cargar amigos para que renderColabGoal pueda resolver participantes
  await cargarAmigosDelUsuario();

  const metas = await cargarMetas();
  const personalGoals = metas.filter(meta => meta.tipo === 'personal');
  const colabGoals = metas.filter(meta => meta.tipo === 'colaborativa');

  renderGoalsList(personalGoalsList, personalGoals, 'personal');
  renderGoalsList(colabGoalsList, colabGoals, 'colaborativa');
}

/**
 * Construye los participantes de una meta colaborativa en formato del schema:
 * [{ amigo_id, porcentaje_contribucion }, ...].
 * El usuario actual se representa con amigo_id=0.
 *
 * Las contribuciones iniciales se reparten equitativamente entre todos
 * los participantes (incluyendo al usuario actual).
 */
function buildParticipants(amigos) {
  const totalParticipantes = amigos.length + 1; // +1 por el usuario actual
  const porcentajeBase = Math.floor(100 / totalParticipantes);
  return [
    { amigo_id: 0, porcentaje_contribucion: porcentajeBase },
    ...amigos.map(friend => ({
      amigo_id: friend.id,
      porcentaje_contribucion: porcentajeBase
    }))
  ];
}

async function deleteMeta(metaId) {
  const metas = await cargarMetas();
  const meta = metas.find(item => String(item.id) === String(metaId));
  if (!meta) return;

  const shouldDelete = confirm(`Eliminar la meta "${meta.nombre}"?`);
  if (!shouldDelete) return;

  await eliminarMetaDatos(metaId);
  await renderGoals();
  setStatusMessage(`Meta "${meta.nombre}" eliminada.`);
}


// GESTIÓN DEL MODAL

async function openModal() {
  state.lastFocusedElement = document.activeElement;
  state.currentStep = 1;
  state.selectedFriendIds.clear();
  resetForm();

  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');

  // Asegurar amigos cargados antes de renderizar el paso 2
  if (window.nexusReady) await window.nexusReady;
  await cargarAmigosDelUsuario();

  renderFriendsList(AMIGOS_DEL_USUARIO);
  goToStep(1);

  requestAnimationFrame(() => inputNombre.focus());
  announce('Modal de agregar meta abierto. Completa los campos del formulario.');
}

function closeModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.setAttribute('aria-hidden', 'true');

  // Restaura el foco al elemento que tenía antes de abrir (WCAG 2.4.3)
  if (state.lastFocusedElement) state.lastFocusedElement.focus();

  announce('Modal cerrado.');
}

// Focus trap: mantiene el foco dentro del dialog (WCAG 2.1.2)
function handleFocusTrap(e) {
  if (e.key !== 'Tab') return;

  const focusable = getFocusableElements(modalDialog);
  if (!focusable.length) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}


// NAVEGACIÓN ENTRE PASOS

function goToStep(step) {
  state.currentStep = step;

  stepSection1.classList.toggle('is-active', step === 1);
  stepSection2.classList.toggle('is-active', step === 2);
  stepDot1.classList.toggle('is-active', step === 1);
  stepDot2.classList.toggle('is-active', step === 2);

  if (step === 1) {
    btnStep1Next.textContent = getSelectedType() === 'colaborativa'
      ? 'Siguiente →'
      : 'Crear meta';
  }

  // Mueve el foco al primer elemento interactivo del paso activo
  requestAnimationFrame(() => {
    const focusable = getFocusableElements(modalDialog);
    if (focusable.length) focusable[0].focus();
  });
}

/** @returns {'personal'|'colaborativa'} */
function getSelectedType() {
  for (const radio of radiosTypo) {
    if (radio.checked) return radio.value;
  }
  return 'personal';
}


// VALIDACIÓN — PASO 1

function validateStep1() {
  let isValid = true;

  const nombreValid = inputNombre.value.trim().length >= 2;
  setFieldError(inputNombre, document.getElementById('meta-nombre-error'), nombreValid, 'Escribe un nombre de al menos 2 caracteres.');
  if (!nombreValid) isValid = false;

  const objetivoVal   = parseFloat(inputObjetivo.value);
  const objetivoValid = !isNaN(objetivoVal) && objetivoVal >= 1000;
  setFieldError(inputObjetivo, document.getElementById('meta-objetivo-error'), objetivoValid, 'El monto minimo es $1.000 COP.');
  if (!objetivoValid) isValid = false;

  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(inputFecha.value);
  const fechaValid   = inputFecha.value !== '' && selectedDate > today;
  setFieldError(inputFecha, document.getElementById('meta-fecha-error'), fechaValid, 'Selecciona una fecha posterior a hoy.');
  if (!fechaValid) isValid = false;

  if (!isValid) {
    announce('El formulario tiene errores. Por favor revisa los campos marcados.');
    const firstInvalid = modalDialog.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
  }

  return isValid;
}


// LISTA DE AMIGOS

/**
 * Renderiza la lista de amigos en el panel de búsqueda.
 * @param {Array<{id:number, name:string, initial:string, color:string}>} friends
 */
function renderFriendsList(friends) {
  friendsList.innerHTML = '';

  if (!friends.length) {
    const li = document.createElement('li');
    li.style.cssText = 'padding:12px 14px;font-size:13px;color:#94A3B8;';
    li.textContent = 'No se encontraron amigos.';
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.setAttribute('aria-disabled', 'true');
    friendsList.appendChild(li);
    return;
  }

  friends.forEach(friend => {
    const isSelected = state.selectedFriendIds.has(friend.id);
    const li = document.createElement('li');
    li.className = 'friend-item' + (isSelected ? ' is-selected' : '');
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', String(isSelected));
    li.setAttribute('data-friend-id', String(friend.id));
    li.setAttribute('tabindex', '0');
    li.innerHTML = `
      <span class="friend-item__avatar" style="background:${friend.color};" aria-hidden="true">
        ${friend.initial}
      </span>
      <span class="friend-item__name">${friend.name}</span>
      <span class="friend-item__check" aria-hidden="true">${isSelected ? '✓' : ''}</span>
    `;
    friendsList.appendChild(li);
  });
}

function toggleFriendSelection(friendId) {
  const friend = AMIGOS_DEL_USUARIO.find(f => f.id === friendId);
  if (!friend) return;

  if (state.selectedFriendIds.has(friendId)) {
    state.selectedFriendIds.delete(friendId);
    announce(`${friend.name} eliminado de la meta.`);
  } else {
    state.selectedFriendIds.add(friendId);
    announce(`${friend.name} agregado a la meta.`);
  }

  // Re-renderiza con el filtro de búsqueda activo
  const query    = friendsSearchInput.value.toLowerCase().trim();
  const filtered = AMIGOS_DEL_USUARIO.filter(f => f.name.toLowerCase().includes(query));
  renderFriendsList(filtered);

  renderSelectedChips();
  friendsEmptyMsg.style.display = state.selectedFriendIds.size > 0 ? 'none' : 'block';
}

// Renderiza los chips de amigos seleccionados con botón para quitarlos.
function renderSelectedChips() {
  selectedFriendsEl.innerHTML = '';
  state.selectedFriendIds.forEach(id => {
    const friend = AMIGOS_DEL_USUARIO.find(f => f.id === id);
    if (!friend) return;

    const chip = document.createElement('div');
    chip.className = 'friend-chip';
    chip.innerHTML = `
      <span class="friend-chip__avatar" style="background:${friend.color};" aria-hidden="true">
        ${friend.initial}
      </span>
      <span>${friend.name}</span>
      <button type="button" class="friend-chip__remove"
              data-remove-id="${friend.id}"
              aria-label="Quitar a ${friend.name} de la meta">×</button>
    `;
    selectedFriendsEl.appendChild(chip);
  });
}


// CREACIÓN DE META

async function createMeta() {
  const tipo       = getSelectedType();
  const nombre     = inputNombre.value.trim();
  const objetivo   = parseFloat(inputObjetivo.value);
  const fecha      = inputFecha.value;
  const iconoRaw   = document.querySelector('input[name="meta-icono"]:checked')?.value ?? 'laptop';
  const privacidad = tipo === 'colaborativa' ? togglePrivacidad.checked : false;
  const amigos     = tipo === 'colaborativa'
    ? AMIGOS_DEL_USUARIO.filter(f => state.selectedFriendIds.has(f.id))
    : [];

  // Mapear el valor del radio a emoji (alineado con metas.json existentes)
  const MAPA_ICONOS = { laptop: '💻', escudo: '🛡️', avion: '✈️', regalo: '🎁', casa: '🏠', auto: '🚗' };
  const icono = MAPA_ICONOS[iconoRaw] || '⭐';

  const usuario = await obtenerUsuarioActual();
  const nuevaMeta = {
    id: Date.now(),
    usuario_id: usuario ? usuario.id : null,
    tipo,
    nombre,
    icono,
    color_avatar: 'amber',
    monto_objetivo: objetivo,
    monto_ahorrado: 0,
    fecha_creacion: new Date().toISOString().split('T')[0],
    fecha_limite: fecha,
    ...(tipo === 'colaborativa' && {
      privacidad_montos: privacidad,
      participantes: buildParticipants(amigos)
    })
  };

  await agregarMetaDatos(nuevaMeta);
  await renderGoals();

  closeModal();
  setStatusMessage(`Meta "${nombre}" creada exitosamente.`);
}


// RESET DEL FORMULARIO

function resetForm() {
  document.querySelector('input[name="tipo-meta"][value="personal"]').checked = true;
  inputNombre.value   = '';
  inputObjetivo.value = '';
  inputFecha.value    = '';

  // Restaura icono por defecto si el elemento existe
  const iconLaptop = document.getElementById('icon-laptop');
  if (iconLaptop) iconLaptop.checked = true;

  // Limpia errores de validación
  [inputNombre, inputObjetivo, inputFecha].forEach(input => {
    input.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.form-error').forEach(el => el.classList.remove('is-visible'));

  // Limpia estado del paso 2
  state.selectedFriendIds.clear();
  if (selectedFriendsEl)  selectedFriendsEl.innerHTML = '';
  if (friendsSearchInput) friendsSearchInput.value    = '';
  if (friendsEmptyMsg)    friendsEmptyMsg.style.display = 'block';
  if (togglePrivacidad) {
    togglePrivacidad.checked = true;
    togglePrivacidad.setAttribute('aria-checked', 'true');
  }

  btnStep1Next.textContent = 'Crear meta';
}


// EVENT LISTENERS

document.addEventListener('DOMContentLoaded', async () => {

  await renderGoals();

  btnOpenModal.addEventListener('click', () => { openModal(); });
  btnCloseModal.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  // Cierra al hacer clic en el backdrop (fuera del panel)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay || e.target.id === 'modal-meta-backdrop') closeModal();
  });

  // Cierra con Escape (WCAG 2.1.1)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) closeModal();
  });

  // Focus trap dentro del modal (WCAG 2.1.2)
  modalOverlay.addEventListener('keydown', handleFocusTrap);

  // Actualiza el texto del botón al cambiar tipo de meta
  radiosTypo.forEach(radio => {
    radio.addEventListener('change', () => {
      btnStep1Next.textContent = getSelectedType() === 'colaborativa'
        ? 'Siguiente →'
        : 'Crear meta';
    });
  });

  // Botón principal del paso 1: valida y avanza o crea
  btnStep1Next.addEventListener('click', async () => {
    if (!validateStep1()) return;

    if (getSelectedType() === 'colaborativa') {
      goToStep(2);
      announce('Paso 2 de 2: Agrega amigos y configura la privacidad.');
    } else {
      await createMeta();
    }
  });

  btnStep2Back.addEventListener('click', () => {
    goToStep(1);
    announce('Volviste al paso 1.');
  });

  btnStep2Create.addEventListener('click', async () => {
    if (!state.selectedFriendIds.size) {
      announce('Debes agregar al menos un amigo para crear una meta colaborativa.');
      friendsSearchInput.focus();
      return;
    }
    await createMeta();
  });

  // Event delegation para la lista de amigos (click y teclado)
  friendsList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-friend-id]');
    if (item) toggleFriendSelection(parseInt(item.getAttribute('data-friend-id'), 10));
  });
  friendsList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-friend-id]');
    if (!item) return;
    e.preventDefault();
    toggleFriendSelection(parseInt(item.getAttribute('data-friend-id'), 10));
  });

  // Event delegation para quitar chips
  selectedFriendsEl.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-remove-id]');
    if (btn) toggleFriendSelection(parseInt(btn.getAttribute('data-remove-id'), 10));
  });

  // Filtrado de amigos en tiempo real
  friendsSearchInput.addEventListener('input', () => {
    const query    = friendsSearchInput.value.toLowerCase().trim();
    const filtered = AMIGOS_DEL_USUARIO.filter(f => f.name.toLowerCase().includes(query));
    renderFriendsList(filtered);
  });

  // Sincroniza aria-checked del switch de privacidad
  togglePrivacidad.addEventListener('change', () => {
    togglePrivacidad.setAttribute('aria-checked', String(togglePrivacidad.checked));
  });

  // Fija la fecha mínima del picker (hoy)
  inputFecha.setAttribute('min', new Date().toISOString().split('T')[0]);

  // Delegación de eventos en las listas de metas.
  // ORDEN IMPORTANTE: primero detectamos clicks en los botones de acción
  // (retirar, eliminar). Si el click NO cayó en ninguno de ellos pero sí
  // dentro de una card con data-aportar-meta-id, abrimos el modal de aportar.
  [personalGoalsList, colabGoalsList].forEach(list => {
    if (!list) return;

    list.addEventListener('click', async (e) => {
      // Botón Retirar: si está habilitado, retira; si está bloqueado, avisa.
      const retirarButton = e.target.closest('[data-retirar-meta-id]');
      if (retirarButton) {
        e.stopPropagation();
        const puedeRetirar = retirarButton.getAttribute('data-puede-retirar') === 'true';
        if (!puedeRetirar) {
          setStatusMessage('Solo se puede retirar al cumplir la fecha o el monto objetivo.');
          return;
        }
        await handleRetirarMeta(retirarButton.getAttribute('data-retirar-meta-id'));
        return;
      }

      // Botón Eliminar
      const deleteButton = e.target.closest('[data-delete-meta-id]');
      if (deleteButton) {
        e.stopPropagation();
        await deleteMeta(deleteButton.getAttribute('data-delete-meta-id'));
        return;
      }

      // Click en cualquier otra parte de la card → abrir modal de aportar
      const cardAportar = e.target.closest('[data-aportar-meta-id]');
      if (cardAportar) {
        abrirModalAportar(cardAportar.getAttribute('data-aportar-meta-id'));
      }
    });

    // Accesibilidad por teclado: Enter o Espacio sobre la card abren aportar
    list.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[data-aportar-meta-id]');
      if (!card) return;
      // Solo si el foco está en la card misma, no en un botón interno
      if (e.target.closest('button')) return;
      e.preventDefault();
      abrirModalAportar(card.getAttribute('data-aportar-meta-id'));
    });
  });

  // ── SUB-MODAL: APORTAR A META ──
  inicializarModalAportar();

});


/* ============================================================
   APORTAR A META — sub-modal y handler
   ============================================================ */

let _metaIdAportandoActual = null;

function inicializarModalAportar() {
  const modalAportar    = document.getElementById('modal-aportar-meta');
  const backdrop        = document.getElementById('modal-aportar-backdrop');
  const btnClose        = document.getElementById('modal-aportar-close');
  const btnCancel       = document.getElementById('modal-aportar-cancel');
  const form            = document.getElementById('form-aportar-meta');

  if (!modalAportar || !form) return;

  btnClose?.addEventListener('click', cerrarModalAportar);
  btnCancel?.addEventListener('click', cerrarModalAportar);
  backdrop?.addEventListener('click', cerrarModalAportar);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalAportar.classList.contains('active')) {
      cerrarModalAportar();
    }
  });

  form.addEventListener('submit', handleSubmitAporte);
}

async function abrirModalAportar(metaId) {
  const metas = await cargarMetas();
  const meta = metas.find(m => String(m.id) === String(metaId));
  if (!meta) return;

  _metaIdAportandoActual = metaId;

  const modal     = document.getElementById('modal-aportar-meta');
  const nombreEl  = document.getElementById('modal-aportar-nombre-meta');
  const inputEl   = document.getElementById('input-aportar-monto');

  if (nombreEl) nombreEl.textContent = meta.nombre;
  if (inputEl) inputEl.value = '';

  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  setTimeout(() => inputEl?.focus(), 50);
}

function cerrarModalAportar() {
  const modal = document.getElementById('modal-aportar-meta');
  const form  = document.getElementById('form-aportar-meta');
  if (!modal) return;

  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  if (form) form.reset();
  _metaIdAportandoActual = null;
}

async function handleSubmitAporte(e) {
  e.preventDefault();
  if (!_metaIdAportandoActual) return;

  const inputEl = document.getElementById('input-aportar-monto');
  const monto = parseFloat(inputEl?.value || 0);

  if (!monto || monto <= 0) {
    announce('El monto debe ser mayor a 0.');
    inputEl?.focus();
    return;
  }

  const resultado = await aportarAMeta(_metaIdAportandoActual, monto);

  if (!resultado.exito) {
    setStatusMessage(resultado.mensaje || 'No se pudo registrar el aporte.');
    return;
  }

  cerrarModalAportar();
  await renderGoals();
  setStatusMessage(`Aporte de ${formatCurrencyCOP(monto)} registrado correctamente.`);
}


/* ============================================================
   RETIRAR DE META — confirmación + ejecución
   ============================================================ */

async function handleRetirarMeta(metaId) {
  const metas = await cargarMetas();
  const meta = metas.find(m => String(m.id) === String(metaId));
  if (!meta) return;

  const montoRetirar = Number(meta.monto_ahorrado) || 0;
  const confirmar = confirm(
    `Vas a retirar ${formatCurrencyCOP(montoRetirar)} de la meta "${meta.nombre}".\n\n` +
    `El monto se sumará a tu balance como ingreso, y la meta será eliminada.\n\n¿Continuar?`
  );
  if (!confirmar) return;

  const resultado = await retirarDeMeta(metaId);

  if (!resultado.exito) {
    setStatusMessage(resultado.mensaje || 'No se pudo procesar el retiro.');
    return;
  }

  await renderGoals();
  setStatusMessage(
    `Retiraste ${formatCurrencyCOP(resultado.monto)} de "${meta.nombre}". Meta cerrada.`
  );
}
