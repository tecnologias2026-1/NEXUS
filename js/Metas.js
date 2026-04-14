/**
 * =============================================================================
 * NEXUS — Módulo de Metas Financieras
 * =============================================================================
 * Archivo  : js/metas.js
 * Autor    : Equipo NEXUS — Módulo Frontend / JS
 * Versión  : 1.0.0
 * Fecha    : 2026-04-13
 *
 * Responsabilidades:
 *   1. Abrir / cerrar el modal "Agregar Meta" con gestión completa de foco
 *      (focus trap, restaurar foco al cerrar, aria-hidden)
 *   2. Navegación entre pasos del formulario (paso 1 → paso 2 si colaborativa)
 *   3. Validación de campos antes de avanzar o crear la meta
 *   4. Renderizar la lista de amigos disponibles (datos MOCK)
 *   5. Lógica de selección / deselección de amigos (chips)
 *   6. Filtrado de amigos en tiempo real (búsqueda)
 *   7. Anuncios accesibles vía región aria-live
 *
 * Patrones y estándares:
 *   - WCAG 2.2 AA: focus trap (2.1.2), focus visible (2.4.7),
 *     error identification (3.3.1), labels (3.3.2)
 *   - Event delegation para listas dinámicas
 *   - Sin dependencias externas (vanilla JS)
 * =============================================================================
 */

'use strict';

/* =============================================================================
   DATOS MOCK — Lista de amigos del usuario actual
   En producción esta lista vendría de una llamada al backend.
   ============================================================================= */

/** @type {Array<{id:number, name:string, initial:string, color:string}>} */
const MOCK_FRIENDS = [
  { id: 1, name: 'Natalia López',   initial: 'N', color: '#F59E0B' },
  { id: 2, name: 'Camilo Torres',   initial: 'C', color: '#10B981' },
  { id: 3, name: 'Sara Martínez',   initial: 'S', color: '#EF4444' },
  { id: 4, name: 'Andrés Gómez',    initial: 'A', color: '#3B82F6' },
  { id: 5, name: 'Laura Herrera',   initial: 'L', color: '#8B5CF6' },
  { id: 6, name: 'Felipe Vargas',   initial: 'F', color: '#EC4899' },
];

/* =============================================================================
   ESTADO DEL MÓDULO
   ============================================================================= */

/**
 * Estado local del modal de crear meta.
 * Se reinicia cada vez que el modal se abre.
 */
const state = {
  /** IDs de amigos seleccionados para la meta colaborativa */
  selectedFriendIds: new Set(),

  /** Paso activo del modal (1 o 2) */
  currentStep: 1,

  /** Elemento que tenía el foco antes de abrir el modal (para restaurarlo) */
  lastFocusedElement: null,
};

/* =============================================================================
   REFERENCIAS AL DOM
   Se obtienen una sola vez al inicializar para evitar consultas repetidas.
   ============================================================================= */

// ─── Modal ──────────────────────────────────────────────────────────────────
const modalOverlay    = document.getElementById('modal-add-meta');
const modalDialog     = document.getElementById('modal-dialog-content');
const btnOpenModal    = document.getElementById('btn-open-modal');
const btnCloseModal   = document.getElementById('modal-meta-close');
const btnCancel       = document.getElementById('btn-modal-cancel');

// ─── Indicadores de paso ────────────────────────────────────────────────────
const stepDot1        = document.getElementById('step-dot-1');
const stepDot2        = document.getElementById('step-dot-2');

// ─── Pasos del formulario ───────────────────────────────────────────────────
const stepSection1    = document.getElementById('modal-step-1');
const stepSection2    = document.getElementById('modal-step-2');

// ─── Controles del Paso 1 ───────────────────────────────────────────────────
const radiosTypo      = document.querySelectorAll('input[name="tipo-meta"]');
const inputNombre     = document.getElementById('meta-nombre');
const inputObjetivo   = document.getElementById('meta-objetivo');
const inputFecha      = document.getElementById('meta-fecha');
const btnStep1Next    = document.getElementById('btn-step1-next');

// ─── Controles del Paso 2 ───────────────────────────────────────────────────
const friendsSearchInput = document.getElementById('friends-search');
const friendsList        = document.getElementById('friends-list');
const selectedFriendsEl  = document.getElementById('selected-friends');
const friendsEmptyMsg    = document.getElementById('friends-empty-msg');
const togglePrivacidad   = document.getElementById('toggle-privacidad');
const btnStep2Back       = document.getElementById('btn-step2-back');
const btnStep2Create     = document.getElementById('btn-step2-create');

// ─── Accesibilidad ──────────────────────────────────────────────────────────
const srAnnouncer     = document.getElementById('sr-announcer');


/* =============================================================================
   UTILIDADES
   ============================================================================= */

/**
 * Anuncia un mensaje a tecnologías de asistencia (screenreaders)
 * a través de la región aria-live="polite".
 *
 * Limpiamos antes de escribir para garantizar que el mismo mensaje
 * se anuncia aunque se repita.
 *
 * @param {string} message - Texto a anunciar.
 */
function announce(message) {
  srAnnouncer.textContent = '';
  // requestAnimationFrame garantiza que el DOM flush se produce antes
  // de escribir el nuevo mensaje, activando la región live.
  requestAnimationFrame(() => {
    srAnnouncer.textContent = message;
  });
}

/**
 * Obtiene todos los elementos enfocables dentro de un contenedor.
 * Se usa para implementar el focus trap del modal.
 *
 * @param {HTMLElement} container
 * @returns {HTMLElement[]}
 */
function getFocusableElements(container) {
  return Array.from(
    container.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), ' +
      'select:not([disabled]), textarea:not([disabled]), ' +
      '[tabindex]:not([tabindex="-1"])'
    )
  ).filter(el => !el.closest('[hidden]') && !el.closest('.modal-step:not(.is-active)'));
}

/**
 * Muestra u oculta el mensaje de error de un campo de formulario.
 *
 * @param {HTMLInputElement} input    - Campo a validar.
 * @param {HTMLElement}      errorEl  - Párrafo de error asociado.
 * @param {boolean}          isValid  - true = quitar error, false = mostrar.
 */
function setFieldError(input, errorEl, isValid) {
  if (isValid) {
    input.setAttribute('aria-invalid', 'false');
    errorEl.classList.remove('is-visible');
  } else {
    input.setAttribute('aria-invalid', 'true');
    errorEl.classList.add('is-visible');
  }
}


/* =============================================================================
   GESTIÓN DEL MODAL
   ============================================================================= */

/**
 * Abre el modal de "Agregar Meta".
 * - Guarda el elemento con foco actual para restaurarlo al cerrar.
 * - Actualiza aria-hidden del overlay.
 * - Reinicia el estado interno (paso, amigos seleccionados).
 * - Renderiza la lista de amigos.
 * - Mueve el foco al primer elemento del dialog.
 */
function openModal() {
  // Guardar elemento con foco para restaurarlo al cerrar (WCAG 2.4.3)
  state.lastFocusedElement = document.activeElement;

  // Reiniciar estado
  state.currentStep = 1;
  state.selectedFriendIds.clear();
  resetForm();

  // Mostrar overlay
  modalOverlay.classList.add('is-open');
  modalOverlay.setAttribute('aria-hidden', 'false');

  // Render de la lista de amigos (paso 2)
  renderFriendsList(MOCK_FRIENDS);

  // Activar paso 1
  goToStep(1);

  // Foco inicial: título del modal (tabindex="-1" permitiría recibirlo,
  // pero aquí movemos al primer input del paso 1 para fluidez UX)
  requestAnimationFrame(() => {
    inputNombre.focus();
  });

  announce('Modal de agregar meta abierto. Completa los campos del formulario.');
}

/**
 * Cierra el modal de "Agregar Meta".
 * - Oculta el overlay.
 * - Restaura el foco al elemento que lo tenía antes.
 * - Actualiza aria-hidden.
 */
function closeModal() {
  modalOverlay.classList.remove('is-open');
  modalOverlay.setAttribute('aria-hidden', 'true');

  // Restaurar foco al botón que abrió el modal (WCAG 2.4.3)
  if (state.lastFocusedElement) {
    state.lastFocusedElement.focus();
  }

  announce('Modal cerrado.');
}

/**
 * Focus trap: atrapa el foco dentro del dialog mientras está abierto.
 * Implementa el patrón estándar de WCAG 2.1.2 (No Keyboard Trap).
 *
 * Al llegar al último elemento con Tab, vuelve al primero.
 * Al llegar al primero con Shift+Tab, salta al último.
 *
 * @param {KeyboardEvent} e
 */
function handleFocusTrap(e) {
  if (e.key !== 'Tab') return;

  const focusable = getFocusableElements(modalDialog);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last  = focusable[focusable.length - 1];

  if (e.shiftKey) {
    // Shift+Tab: si estamos en el primer elemento, saltar al último
    if (document.activeElement === first) {
      e.preventDefault();
      last.focus();
    }
  } else {
    // Tab: si estamos en el último elemento, volver al primero
    if (document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
}


/* =============================================================================
   NAVEGACIÓN ENTRE PASOS
   ============================================================================= */

/**
 * Navega al paso indicado (1 o 2).
 * Actualiza:
 *   - Visibilidad de las secciones de paso (.is-active)
 *   - Indicadores visuales de paso (step-dot)
 *   - Texto del botón "Siguiente/Crear meta"
 *
 * @param {1|2} step
 */
function goToStep(step) {
  state.currentStep = step;

  // Mostrar la sección del paso activo
  stepSection1.classList.toggle('is-active', step === 1);
  stepSection2.classList.toggle('is-active', step === 2);

  // Actualizar indicadores visuales
  stepDot1.classList.toggle('is-active', step === 1);
  stepDot2.classList.toggle('is-active', step === 2);

  // Ajustar texto del botón principal del paso 1
  const isColaborativa = getSelectedType() === 'colaborativa';
  if (step === 1) {
    btnStep1Next.textContent = isColaborativa ? 'Siguiente →' : 'Crear meta';
  }

  // Mover foco al primer elemento del nuevo paso (UX de teclado)
  requestAnimationFrame(() => {
    const focusable = getFocusableElements(modalDialog);
    if (focusable.length > 0) focusable[0].focus();
  });
}

/**
 * Retorna el tipo de meta seleccionado actualmente.
 * @returns {'personal'|'colaborativa'}
 */
function getSelectedType() {
  for (const radio of radiosTypo) {
    if (radio.checked) return radio.value;
  }
  return 'personal';
}


/* =============================================================================
   VALIDACIÓN — PASO 1
   ============================================================================= */

/**
 * Valida todos los campos del paso 1.
 * Muestra los mensajes de error correspondientes.
 *
 * @returns {boolean} true si todos los campos son válidos.
 */
function validateStep1() {
  let isValid = true;

  // ─── Nombre ─────────────────────────────────────────────────────────────
  const nombreValid = inputNombre.value.trim().length >= 2;
  setFieldError(
    inputNombre,
    document.getElementById('meta-nombre-error'),
    nombreValid
  );
  if (!nombreValid) isValid = false;

  // ─── Objetivo ───────────────────────────────────────────────────────────
  const objetivoVal = parseFloat(inputObjetivo.value);
  const objetivoValid = !isNaN(objetivoVal) && objetivoVal >= 1000;
  setFieldError(
    inputObjetivo,
    document.getElementById('meta-objetivo-error'),
    objetivoValid
  );
  if (!objetivoValid) isValid = false;

  // ─── Fecha ──────────────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(inputFecha.value);
  const fechaValid = inputFecha.value !== '' && selectedDate > today;
  setFieldError(
    inputFecha,
    document.getElementById('meta-fecha-error'),
    fechaValid
  );
  if (!fechaValid) isValid = false;

  // Si hay errores, anunciar para screenreaders y enfocar el primer campo inválido
  if (!isValid) {
    announce('El formulario tiene errores. Por favor revisa los campos marcados.');
    const firstInvalid = modalDialog.querySelector('[aria-invalid="true"]');
    if (firstInvalid) firstInvalid.focus();
  }

  return isValid;
}


/* =============================================================================
   LISTA DE AMIGOS — RENDER Y SELECCIÓN
   ============================================================================= */

/**
 * Renderiza la lista de amigos disponibles en el panel de búsqueda.
 * Marca como seleccionados los que ya están en state.selectedFriendIds.
 *
 * @param {Array<{id:number, name:string, initial:string, color:string}>} friends
 */
function renderFriendsList(friends) {
  friendsList.innerHTML = '';

  if (friends.length === 0) {
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

    /*
      Accesibilidad: el nombre del amigo es el label de la opción.
      El checkmark visual es aria-hidden.
    */
    li.innerHTML = `
      <span class="friend-item__avatar"
            style="background:${friend.color};"
            aria-hidden="true">
        ${friend.initial}
      </span>
      <span class="friend-item__name">${friend.name}</span>
      <span class="friend-item__check" aria-hidden="true">
        ${isSelected ? '✓' : ''}
      </span>
    `;

    friendsList.appendChild(li);
  });
}

/**
 * Agrega o quita un amigo de la selección y actualiza la UI.
 *
 * @param {number} friendId
 */
function toggleFriendSelection(friendId) {
  const friend = MOCK_FRIENDS.find(f => f.id === friendId);
  if (!friend) return;

  if (state.selectedFriendIds.has(friendId)) {
    // Deseleccionar
    state.selectedFriendIds.delete(friendId);
    announce(`${friend.name} eliminado de la meta.`);
  } else {
    // Seleccionar
    state.selectedFriendIds.add(friendId);
    announce(`${friend.name} agregado a la meta.`);
  }

  // Volver a renderizar la lista filtrada actual
  const query = friendsSearchInput.value.toLowerCase().trim();
  const filtered = MOCK_FRIENDS.filter(f =>
    f.name.toLowerCase().includes(query)
  );
  renderFriendsList(filtered);

  // Actualizar chips de seleccionados
  renderSelectedChips();

  // Mostrar/ocultar mensaje de vacíos
  friendsEmptyMsg.style.display = state.selectedFriendIds.size > 0
    ? 'none'
    : 'block';
}

/**
 * Renderiza los chips de amigos seleccionados debajo del panel.
 * Cada chip tiene un botón "×" para deseleccionar.
 */
function renderSelectedChips() {
  selectedFriendsEl.innerHTML = '';

  state.selectedFriendIds.forEach(id => {
    const friend = MOCK_FRIENDS.find(f => f.id === id);
    if (!friend) return;

    const chip = document.createElement('div');
    chip.className = 'friend-chip';
    chip.innerHTML = `
      <span class="friend-chip__avatar"
            style="background:${friend.color};"
            aria-hidden="true">
        ${friend.initial}
      </span>
      <span>${friend.name}</span>
      <button type="button"
              class="friend-chip__remove"
              data-remove-id="${friend.id}"
              aria-label="Quitar a ${friend.name} de la meta">
        ×
      </button>
    `;

    selectedFriendsEl.appendChild(chip);
  });
}


/* =============================================================================
   CREACIÓN DE META (simulado)
   ============================================================================= */

/**
 * Recopila los datos del formulario y "crea" la meta.
 * En producción aquí iría una llamada fetch/POST al backend.
 */
function createMeta() {
  const tipo        = getSelectedType();
  const nombre      = inputNombre.value.trim();
  const objetivo    = parseFloat(inputObjetivo.value);
  const fecha       = inputFecha.value;
  const icono       = document.querySelector('input[name="meta-icono"]:checked')?.value ?? '⭐';
  const privacidad  = tipo === 'colaborativa' ? togglePrivacidad.checked : false;
  const amigos      = tipo === 'colaborativa'
                        ? MOCK_FRIENDS.filter(f => state.selectedFriendIds.has(f.id))
                        : [];

  /*
    En producción: aquí haríamos un fetch POST y esperaríamos respuesta.
    Por ahora mostramos un log y un anuncio accesible de éxito.
  */
  console.group('[NEXUS] Nueva meta creada');
  console.table({ tipo, nombre, objetivo, fecha, icono, privacidad });
  if (amigos.length) console.log('Amigos:', amigos.map(a => a.name).join(', '));
  console.groupEnd();

  closeModal();
  announce(`Meta "${nombre}" creada exitosamente.`);

  /*
    TODO (producción):
    - POST /api/metas con los datos
    - En respuesta exitosa, añadir la card al DOM sin recargar (DOM diff)
    - Manejar errores de red con feedback al usuario
  */
}


/* =============================================================================
   REINICIAR FORMULARIO
   ============================================================================= */

/**
 * Reinicia todos los campos del formulario a sus valores por defecto.
 * Se llama cada vez que el modal se abre, para evitar datos residuales.
 */
function resetForm() {
  // Paso 1
  document.querySelector('input[name="tipo-meta"][value="personal"]').checked = true;
  inputNombre.value   = '';
  inputObjetivo.value = '';
  inputFecha.value    = '';
  document.getElementById('icon-laptop').checked = true;

  // Limpiar errores de validación
  const allInputs = [inputNombre, inputObjetivo, inputFecha];
  allInputs.forEach(input => {
    input.setAttribute('aria-invalid', 'false');
  });
  document.querySelectorAll('.form-field__error').forEach(el => {
    el.classList.remove('is-visible');
  });

  // Paso 2
  state.selectedFriendIds.clear();
  if (selectedFriendsEl) selectedFriendsEl.innerHTML = '';
  if (friendsSearchInput) friendsSearchInput.value = '';
  if (friendsEmptyMsg) friendsEmptyMsg.style.display = 'block';
  if (togglePrivacidad) togglePrivacidad.checked = true;

  // Ajustar texto del botón del paso 1
  btnStep1Next.textContent = 'Crear meta';
}


/* =============================================================================
   EVENT LISTENERS
   Se registran todos al final para mantener el código organizado.
   ============================================================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ─── Abrir modal ──────────────────────────────────────────────────────────
  btnOpenModal.addEventListener('click', openModal);

  // ─── Cerrar modal (botón ×) ───────────────────────────────────────────────
  btnCloseModal.addEventListener('click', closeModal);

  // ─── Cerrar modal (botón Cancelar) ────────────────────────────────────────
  btnCancel.addEventListener('click', closeModal);

  // ─── Cerrar modal al hacer clic en el overlay (fuera del dialog) ──────────
  modalOverlay.addEventListener('click', (e) => {
    // Solo cerrar si el clic fue directamente en el overlay, no en el dialog
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // ─── Cerrar modal con Escape (WCAG 2.1.1) ────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('is-open')) {
      closeModal();
    }
  });

  // ─── Focus trap dentro del modal ─────────────────────────────────────────
  modalOverlay.addEventListener('keydown', handleFocusTrap);

  // ─── Cambio de tipo de meta: actualizar texto del botón ───────────────────
  radiosTypo.forEach(radio => {
    radio.addEventListener('change', () => {
      const isColaborativa = getSelectedType() === 'colaborativa';
      btnStep1Next.textContent = isColaborativa ? 'Siguiente →' : 'Crear meta';
    });
  });

  // ─── Botón "Siguiente / Crear" del paso 1 ────────────────────────────────
  btnStep1Next.addEventListener('click', () => {
    if (!validateStep1()) return;

    const tipo = getSelectedType();

    if (tipo === 'colaborativa') {
      // Ir al paso 2 (selección de amigos)
      goToStep(2);
      announce('Paso 2 de 2: Agrega amigos y configura la privacidad.');
    } else {
      // Meta personal: crear directamente
      createMeta();
    }
  });

  // ─── Botón "Atrás" del paso 2 ─────────────────────────────────────────────
  btnStep2Back.addEventListener('click', () => {
    goToStep(1);
    announce('Volviste al paso 1.');
  });

  // ─── Botón "Crear meta colaborativa" del paso 2 ──────────────────────────
  btnStep2Create.addEventListener('click', () => {
    if (state.selectedFriendIds.size === 0) {
      announce('Debes agregar al menos un amigo para crear una meta colaborativa.');
      friendsSearchInput.focus();
      return;
    }
    createMeta();
  });

  // ─── Selección de amigos: click en un ítem de la lista ────────────────────
  /*
    Event delegation: escuchamos en el contenedor <ul> para manejar
    todos los <li> sin registrar un listener por cada uno.
  */
  friendsList.addEventListener('click', (e) => {
    const item = e.target.closest('[data-friend-id]');
    if (!item) return;

    const id = parseInt(item.getAttribute('data-friend-id'), 10);
    toggleFriendSelection(id);
  });

  // ─── Selección de amigos: activación por teclado (Enter / Space) ──────────
  friendsList.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const item = e.target.closest('[data-friend-id]');
    if (!item) return;

    e.preventDefault(); // Prevenir scroll en Space
    const id = parseInt(item.getAttribute('data-friend-id'), 10);
    toggleFriendSelection(id);
  });

  // ─── Quitar amigo mediante el botón × del chip ────────────────────────────
  /*
    Event delegation en el contenedor de chips.
  */
  selectedFriendsEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-id]');
    if (!removeBtn) return;

    const id = parseInt(removeBtn.getAttribute('data-remove-id'), 10);
    toggleFriendSelection(id);
  });

  // ─── Búsqueda de amigos en tiempo real ───────────────────────────────────
  /*
    Filtramos MOCK_FRIENDS en base al valor del input y re-renderizamos.
    En producción podría incluir debounce + llamada al backend.
  */
  friendsSearchInput.addEventListener('input', () => {
    const query = friendsSearchInput.value.toLowerCase().trim();
    const filtered = MOCK_FRIENDS.filter(f =>
      f.name.toLowerCase().includes(query)
    );
    renderFriendsList(filtered);
  });

  // ─── Sincronizar aria-checked del toggle de privacidad ───────────────────
  /*
    El toggle usa un <input type="checkbox"> con role="switch".
    Mantenemos aria-checked sincronizado para tecnologías de asistencia.
  */
  togglePrivacidad.addEventListener('change', () => {
    togglePrivacidad.setAttribute(
      'aria-checked',
      String(togglePrivacidad.checked)
    );
  });

  // ─── Fijar fecha mínima del input de fecha (hoy) ─────────────────────────
  /*
    Evita que el usuario seleccione fechas pasadas directamente en el picker.
    La validación JS también lo verifica como segunda línea de defensa.
  */
  const today = new Date().toISOString().split('T')[0];
  inputFecha.setAttribute('min', today);

}); // end DOMContentLoaded