/**
 * ============================================================
 * MÓDULO: social.js
 * ============================================================
 * Responsabilidad: Coordinador principal de la página Social
 *
 * Este módulo se encarga de:
 * - Inicializar el ranking de amigos al cargar la página
 * - Manejar el modal "Agregar amigo"
 * - Conectar los botones de contactos sugeridos al ranking
 * - Permitir agregar un amigo manualmente desde el botón principal
 * - Gestionar la copia del link de invitación
 *
 * Dependencias de módulos:
 * - amigo.js → Generación de HTML para cada amigo
 * - lista_amigos.js → Gestión del ranking completo
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', async () => {

    // ── INICIALIZAR RANKING DE AMIGOS ──
    if (typeof inicializarListaAmigos === 'function') {
        await inicializarListaAmigos();
    } else {
        console.error('❌ lista_amigos.js no está cargado. Verifica el orden de los scripts.');
    }

    // ── INICIALIZAR METAS COLABORATIVAS DEL USUARIO ──
    if (typeof inicializarMetasColaborativasSocial === 'function') {
        await inicializarMetasColaborativasSocial();
    }

    // ── REFERENCIAS AL MODAL ──
    const modal        = document.getElementById('add-friend-modal');
    const openBtn      = document.querySelector('.btn-add-friend');
    const closeBtn     = document.getElementById('add-friend-close');
    const backBtn      = document.getElementById('add-friend-back');
    const backdrop     = document.getElementById('add-friend-backdrop');

    // ── ABRIR MODAL ──
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    });

    // ── CERRAR MODAL (×, Regresar, backdrop) ──
    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        openBtn.focus(); // devuelve foco al botón que abrió (WCAG 2.4.3)
    }

    closeBtn.addEventListener('click', closeModal);
    backBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);

    // ── CERRAR CON ESCAPE (WCAG 2.1.2) ──
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // ── COPIAR LINK DE INVITACIÓN ──
    const copyBtn    = document.getElementById('copy-invite-link');
    const statusSpan = document.getElementById('invite-link-status');

    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('https://nexus.app/invite/xxxxxxxxxxxxxxx')
            .then(() => {
                statusSpan.textContent = 'Link copiado con éxito';
                setTimeout(() => { statusSpan.textContent = ''; }, 3000);
            });
    });

    // ── AGREGAR AMIGO DESDE CONTACTO SUGERIDO ──
    // Cada botón "+" al lado de un contacto crea un amigo nuevo en el ranking
    document.querySelectorAll('.btn-add-contact').forEach(btn => {
        btn.addEventListener('click', async () => {
            const item   = btn.closest('.contact-item');
            const nombre = item.querySelector('.contact-name').textContent.trim();
            const amigoId = Number(item?.dataset?.userId || btn.dataset.userId || 0);

            await crearAmigoNuevo(nombre, amigoId > 0 ? amigoId : null);
            marcarContactoAgregado(btn);
        });
    });

    // ── SUB-MODAL: AGREGAR AMIGO MANUAL ──
    const manualModal     = document.getElementById('add-friend-manual-modal');
    const manualBackdrop  = document.getElementById('add-friend-manual-backdrop');
    const manualCloseBtn  = document.getElementById('add-friend-manual-close');
    const manualCancelBtn = document.getElementById('add-friend-manual-cancel');
    const manualForm      = document.getElementById('add-friend-manual-form');
    const manualInput     = document.getElementById('add-friend-manual-input');

    function abrirModalManual() {
        manualModal.classList.add('active');
        manualModal.setAttribute('aria-hidden', 'false');
        // Foco automático en el input para escribir de inmediato
        setTimeout(() => manualInput.focus(), 50);
    }

    function cerrarModalManual() {
        manualModal.classList.remove('active');
        manualModal.setAttribute('aria-hidden', 'true');
        manualForm.reset();
    }

    // Botón principal del modal padre abre el sub-modal manual
    const btnAgregarManual = document.querySelector('.btn-add-friend-primary');
    if (btnAgregarManual) {
        btnAgregarManual.addEventListener('click', () => {
            abrirModalManual();
        });
    }

    // Cerrar el sub-modal (×, Cancelar, backdrop)
    manualCloseBtn.addEventListener('click', cerrarModalManual);
    manualCancelBtn.addEventListener('click', cerrarModalManual);
    manualBackdrop.addEventListener('click', cerrarModalManual);

    // Cerrar con Escape (cuando este sub-modal está abierto)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && manualModal.classList.contains('active')) {
            cerrarModalManual();
        }
    });

    // Submit del formulario: crea el amigo y cierra ambos modales
    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = manualInput.value.trim();
        if (!nombre) return;

        await crearAmigoNuevo(nombre);
        cerrarModalManual();
        closeModal(); // también cierra el modal padre para volver al ranking
    });

});

/**
 * Crea un nuevo amigo con valores simulados y lo agrega al ranking
 * @param {string} nombre - Nombre del amigo a agregar
 * @returns {Promise<void>}
 *
 * @example
 * await crearAmigoNuevo("Carlos R.");
 */
async function crearAmigoNuevo(nombre, amigoId = null) {
    // Genera valores aleatorios para simular un usuario nuevo en el ranking
    const tendencias = ['up', 'down', 'neutral'];
    const nuevoAmigo = {
        id: Date.now(),
        amigo_id: amigoId,
        nombre: nombre,
        nivel: Math.floor(Math.random() * 5) + 1,        // entre 1 y 5
        racha: Math.floor(Math.random() * 10),           // entre 0 y 9
        puntos: Math.floor(Math.random() * 1500) + 200,  // entre 200 y 1700
        tendencia: tendencias[Math.floor(Math.random() * tendencias.length)],
        esUsuarioActual: false
    };
    // Si viene amigo_id real, agregarAmigo() lo envía al backend (amigos/agregar.php).
    // Si no viene, se guarda localmente para no romper la demo.
    if (amigoId && typeof agregarAmigo === 'function') {
        const exito = await agregarAmigo(amigoId);
        if (!exito) {
            await agregarAmigoDatos(nuevoAmigo);
        }
    } else {
        await agregarAmigoDatos(nuevoAmigo);
    }

    // Resaltar visualmente al recién agregado en el ranking
    resaltarNuevoAmigo(nuevoAmigo.id);

    // Mostrar notificación tipo toast
    mostrarToast(
        '¡Amigo agregado!',
        `${nombre} se unió a tu círculo`
    );

    console.log(`✅ Amigo "${nombre}" agregado al ranking`);
}

/**
 * Aplica una animación de entrada al ítem recién agregado al ranking
 * @param {number} amigoId - ID del amigo recién agregado
 * @returns {void}
 */
function resaltarNuevoAmigo(amigoId) {
    const item = document.querySelector(`[data-amigo-id="${amigoId}"]`);
    if (!item) return;

    item.classList.add('ranking-item--new');

    // Hace scroll suave hasta el nuevo amigo si está fuera de vista
    item.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Quita el highlight después de unos segundos
    setTimeout(() => {
        item.classList.remove('ranking-item--new');
    }, 2200);
}

/**
 * Muestra una notificación tipo toast en la esquina inferior derecha
 * @param {string} titulo - Título principal del toast
 * @param {string} mensaje - Texto descriptivo
 * @returns {void}
 *
 * @example
 * mostrarToast('¡Amigo agregado!', 'Carlos se unió a tu círculo');
 */
function mostrarToast(titulo, mensaje) {
    // Crea el contenedor de toasts si no existe (solo una vez)
    let contenedor = document.querySelector('.toast-container');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.className = 'toast-container';
        contenedor.setAttribute('aria-live', 'polite');
        contenedor.setAttribute('aria-atomic', 'true');
        document.body.appendChild(contenedor);
    }

    // Crea el toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML = `
        <div class="toast-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2.5"
                 stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
            </svg>
        </div>
        <div class="toast-body">
            <span class="toast-title">${titulo}</span>
            <span class="toast-message">${mensaje}</span>
        </div>
    `;

    contenedor.appendChild(toast);

    // Auto-cierre después de 3.2 segundos
    setTimeout(() => {
        toast.classList.add('toast--leaving');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    }, 3200);
}

/**
 * Marca visualmente un contacto sugerido como "ya agregado"
 * Cambia el icono "+" por un check y deshabilita el botón
 *
 * @param {HTMLButtonElement} btn - Botón del contacto que se acaba de agregar
 * @returns {void}
 */
function marcarContactoAgregado(btn) {
    btn.disabled = true;
    btn.setAttribute('aria-label', 'Contacto ya agregado');
    btn.innerHTML = `
        <svg aria-hidden="true" focusable="false"
             width="18" height="18" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2.5"
             stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
    `;
    btn.classList.add('btn-add-contact--added');
}
