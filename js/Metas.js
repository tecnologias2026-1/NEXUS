/** @type {Array<{id:number, name:string, initial:string, color:string}>} */
const MOCK_FRIENDS = [
  { id: 1, name: 'Natalia López',  initial: 'N', color: '#F59E0B' },
  { id: 2, name: 'Camilo Torres',  initial: 'C', color: '#10B981' },
  { id: 3, name: 'Sara Martínez',  initial: 'S', color: '#EF4444' },
  { id: 4, name: 'Andrés Gómez',   initial: 'A', color: '#3B82F6' },
  { id: 5, name: 'Laura Herrera',  initial: 'L', color: '#8B5CF6' },
  { id: 6, name: 'Felipe Vargas',  initial: 'F', color: '#EC4899' },
];

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


// Anuncia mensajes a tecnologías asistivas (aria-live).
// Limpia antes de escribir para que el mismo texto se anuncie si se repite.
function announce(message) {
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
function setFieldError(input, errorEl, isValid) {
  input.setAttribute('aria-invalid', String(!isValid));
  errorEl.classList.toggle('is-visible', !isValid);
}


// GESTIÓN DEL MODAL

function openModal() {
  state.lastFocusedElement = document.activeElement;
  state.currentStep = 1;
  state.selectedFriendIds.clear();
  resetForm();

  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');

  renderFriendsList(MOCK_FRIENDS);
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
  setFieldError(inputNombre, document.getElementById('meta-nombre-error'), nombreValid);
  if (!nombreValid) isValid = false;

  const objetivoVal   = parseFloat(inputObjetivo.value);
  const objetivoValid = !isNaN(objetivoVal) && objetivoVal >= 1000;
  setFieldError(inputObjetivo, document.getElementById('meta-objetivo-error'), objetivoValid);
  if (!objetivoValid) isValid = false;

  const today        = new Date(); today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(inputFecha.value);
  const fechaValid   = inputFecha.value !== '' && selectedDate > today;
  setFieldError(inputFecha, document.getElementById('meta-fecha-error'), fechaValid);
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
  const friend = MOCK_FRIENDS.find(f => f.id === friendId);
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
  const filtered = MOCK_FRIENDS.filter(f => f.name.toLowerCase().includes(query));
  renderFriendsList(filtered);

  renderSelectedChips();
  friendsEmptyMsg.style.display = state.selectedFriendIds.size > 0 ? 'none' : 'block';
}

// Renderiza los chips de amigos seleccionados con botón para quitarlos.
function renderSelectedChips() {
  selectedFriendsEl.innerHTML = '';
  state.selectedFriendIds.forEach(id => {
    const friend = MOCK_FRIENDS.find(f => f.id === id);
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

function createMeta() {
  const tipo       = getSelectedType();
  const nombre     = inputNombre.value.trim();
  const objetivo   = parseFloat(inputObjetivo.value);
  const fecha      = inputFecha.value;
  const icono      = document.querySelector('input[name="meta-icono"]:checked')?.value ?? '⭐';
  const privacidad = tipo === 'colaborativa' ? togglePrivacidad.checked : false;
  const amigos     = tipo === 'colaborativa'
    ? MOCK_FRIENDS.filter(f => state.selectedFriendIds.has(f.id))
    : [];

  // TODO: reemplazar por POST /api/metas cuando exista el backend
  console.group('[NEXUS] Nueva meta creada');
  console.table({ tipo, nombre, objetivo, fecha, icono, privacidad });
  if (amigos.length) console.log('Amigos:', amigos.map(a => a.name).join(', '));
  console.groupEnd();

  closeModal();
  announce(`Meta "${nombre}" creada exitosamente.`);
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
  if (togglePrivacidad)   togglePrivacidad.checked    = true;

  btnStep1Next.textContent = 'Crear meta';
}


// EVENT LISTENERS

document.addEventListener('DOMContentLoaded', () => {

  btnOpenModal.addEventListener('click', openModal);
  btnCloseModal.addEventListener('click', closeModal);
  btnCancel.addEventListener('click', closeModal);

  // Cierra al hacer clic en el backdrop (fuera del panel)
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
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
  btnStep1Next.addEventListener('click', () => {
    if (!validateStep1()) return;

    if (getSelectedType() === 'colaborativa') {
      goToStep(2);
      announce('Paso 2 de 2: Agrega amigos y configura la privacidad.');
    } else {
      createMeta();
    }
  });

  btnStep2Back.addEventListener('click', () => {
    goToStep(1);
    announce('Volviste al paso 1.');
  });

  btnStep2Create.addEventListener('click', () => {
    if (!state.selectedFriendIds.size) {
      announce('Debes agregar al menos un amigo para crear una meta colaborativa.');
      friendsSearchInput.focus();
      return;
    }
    createMeta();
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
    const filtered = MOCK_FRIENDS.filter(f => f.name.toLowerCase().includes(query));
    renderFriendsList(filtered);
  });

  // Sincroniza aria-checked del switch de privacidad
  togglePrivacidad.addEventListener('change', () => {
    togglePrivacidad.setAttribute('aria-checked', String(togglePrivacidad.checked));
  });

  // Fija la fecha mínima del picker (hoy)
  inputFecha.setAttribute('min', new Date().toISOString().split('T')[0]);

});