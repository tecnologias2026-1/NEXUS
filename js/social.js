document.addEventListener('DOMContentLoaded', () => {

    const modal        = document.getElementById('add-friend-modal');
    const openBtn      = document.querySelector('.btn-add-friend');
    const closeBtn     = document.getElementById('add-friend-close');
    const backBtn      = document.getElementById('add-friend-back');
    const backdrop     = document.getElementById('add-friend-backdrop');

    // ── ABRIR ──
    openBtn.addEventListener('click', () => {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    });

    // ── CERRAR (×, Regresar, backdrop) ──
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

});