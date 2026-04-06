document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('btn-login');
    const registerBtn = document.getElementById('btn-register');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const switchBtns = document.querySelectorAll('.link-btn');

    loginBtn.addEventListener('click', () => {
        modal.classList.add('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerBtn.addEventListener('click', () => {
        modal.classList.add('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    backdrop.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    switchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-switch-form');
            if (target === 'register') {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            } else if (target === 'login') {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            }
        });
    });
});