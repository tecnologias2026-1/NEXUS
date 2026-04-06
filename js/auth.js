document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('btn-login');
    const registerBtn = document.getElementById('btn-register');
    const closeBtn = document.getElementById('modal-close');
    const backdrop = document.getElementById('modal-backdrop');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const registerStep1 = document.querySelector('.register-step-1');
    const registerStep2 = document.querySelector('.register-step-2');
    const registerNext = document.getElementById('register-next');
    const registerNextStep2 = document.getElementById('register-next-step2');
    const registerPrev = document.getElementById('register-prev');
    const switchBtns = document.querySelectorAll('.link-btn');
    const progressSteps = document.querySelectorAll('.progress-step');

    function updateProgressStep(stepNumber) {
        progressSteps.forEach(step => {
            const step_attr = step.getAttribute('data-step');
            if (step_attr === String(stepNumber)) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    loginBtn.addEventListener('click', () => {
        modal.classList.add('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    });

    registerBtn.addEventListener('click', () => {
        modal.classList.add('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
        registerStep1?.classList.add('active');
        registerStep2?.classList.remove('active');
        updateProgressStep(1);
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
                registerStep1?.classList.add('active');
                registerStep2?.classList.remove('active');
                updateProgressStep(1);
            } else if (target === 'login') {
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            }
        });
    });

    registerNext.addEventListener('click', () => {
        const registrationForm = document.getElementById('register-form-element');
        if (registrationForm.checkValidity()) {
            registerStep1?.classList.remove('active');
            registerStep2?.classList.add('active');
            updateProgressStep(2);
        } else {
            registrationForm.reportValidity();
        }
    });

    registerNextStep2?.addEventListener('click', () => {
        const incomeForm = document.getElementById('register-income-form');
        if (incomeForm.checkValidity()) {
            window.location.href = 'dashboard.html';
        } else {
            incomeForm.reportValidity();
        }
    });

    registerPrev.addEventListener('click', () => {
        registerStep2?.classList.remove('active');
        registerStep1?.classList.add('active');
        updateProgressStep(1);
    });
});