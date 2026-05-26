/**
 * ============================================================
 * MÓDULO: auth.js
 * ============================================================
 * Responsabilidad: Autenticación contra los JSON locales
 *
 * Este módulo se encarga de:
 * - Abrir y cerrar el modal de login/registro
 * - Validar credenciales contra data/usuarios.json (vía datos.js)
 * - Registrar usuarios nuevos en flujo de 2 pasos
 * - Mostrar errores claros si las credenciales fallan o el email ya existe
 * - Guardar sesión de usuario en localStorage
 * - Redirigir al dashboard tras autenticación exitosa
 *
 * Dependencias:
 * - config.js → Configuración global
 * - datos.js → iniciarSesion(), registrarUsuario()
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {

    // ── REFERENCIAS DEL MODAL ──
    const modal         = document.getElementById('auth-modal');
    const loginBtn      = document.getElementById('btn-login');
    const registerBtn   = document.getElementById('btn-register');
    const loginForm     = document.getElementById('login-form');
    const registerForm  = document.getElementById('register-form');
    const closeBtn      = document.getElementById('modal-close');
    const backdrop      = document.getElementById('modal-backdrop');
    const registerIncomeInput = document.getElementById('register-income');

    /**
     * Muestra el formulario indicado dentro del modal
     * @param {'login' | 'register'} formType
     */
    function showAuthForm(formType) {
        if (!loginForm || !registerForm) return;
        if (formType === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
        limpiarErrores();
    }

    function abrirModal(tipo) {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        showAuthForm(tipo);
    }

    function cerrarModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        limpiarErrores();
    }

    // ── EVENTOS ABRIR / CERRAR MODAL ──
    if (loginBtn)    loginBtn.addEventListener('click',    () => abrirModal('login'));
    if (registerBtn) registerBtn.addEventListener('click', () => abrirModal('register'));
    if (closeBtn)    closeBtn.addEventListener('click',    cerrarModal);
    if (backdrop)    backdrop.addEventListener('click',    cerrarModal);

    // ── ENLACES PARA CAMBIAR ENTRE LOGIN Y REGISTRO ──
    document.querySelectorAll('[data-switch-form]').forEach(btn => {
        btn.addEventListener('click', () => {
            const destino = btn.getAttribute('data-switch-form');
            showAuthForm(destino);
            // Si vamos a registro, asegurar que estamos en el paso 1
            if (destino === 'register') volverAPaso1();
        });
    });

    if (registerIncomeInput) {
        registerIncomeInput.addEventListener('input', () => {
            const valorLimpio = limpiarMonto(registerIncomeInput.value);
            registerIncomeInput.dataset.rawValue = valorLimpio;
            registerIncomeInput.value = formatearMiles(valorLimpio);
        });
    }


    // ──────────────────────────────────────────────────────────
    // LOGIN: Valida credenciales contra el Backend API
    // ──────────────────────────────────────────────────────────
    const loginFormElement = document.getElementById('login-form-element');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (event) => {
            event.preventDefault();

            if (!loginFormElement.checkValidity()) {
                loginFormElement.reportValidity();
                return;
            }

            const email    = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;

            // Mostrar estado de carga
            const submitBtn = loginFormElement.querySelector('button[type="submit"]');
            const originalText = submitBtn?.textContent;
            if (submitBtn) submitBtn.disabled = true;
            if (submitBtn) submitBtn.textContent = 'Verificando...';

            try {
                // Validar credenciales contra usuarios.json (datos.js)
                const usuario = await iniciarSesion(email, password);

                if (usuario) {
                    localStorage.setItem('selectedCurrency', usuario.moneda_preferida || 'COP');

                    debugLog(`✅ Login exitoso: ${usuario.nombre}`);
                    console.log('✅ Login exitoso:', usuario);

                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    // Error en autenticación
                    mostrarError(loginFormElement,
                        'Email o contraseña incorrectos. Verifica tus datos.');
                    debugLog('Login fallido', { email }, 'warn');
                }
            } catch (error) {
                mostrarError(loginFormElement,
                    'Error al iniciar sesión. Intenta nuevamente.');
                debugLog('Error en login', error, 'error');
            } finally {
                // Restaurar botón
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            }
        });
    }


    // ──────────────────────────────────────────────────────────
    // REGISTRO PASO 1 → PASO 2
    // ──────────────────────────────────────────────────────────
    // Datos temporales del paso 1 (se combinan con paso 2 al finalizar)
    let datosRegistroPaso1 = null;

    const registerFormElement = document.getElementById('register-form-element');
    const btnNextStep1        = document.getElementById('register-next');
    const btnPrevStep2        = document.getElementById('register-prev');

    if (btnNextStep1 && registerFormElement) {
        btnNextStep1.addEventListener('click', () => {
            if (!registerFormElement.checkValidity()) {
                registerFormElement.reportValidity();
                return;
            }

            const password        = document.getElementById('register-password').value;
            const passwordConfirm = document.getElementById('register-password-confirm').value;

            if (password !== passwordConfirm) {
                mostrarError(registerFormElement,
                    'Las contraseñas no coinciden. Por favor verifica.');
                return;
            }

            // Guardar datos del paso 1 en memoria temporal
            datosRegistroPaso1 = {
                nombre:   document.getElementById('register-name').value.trim(),
                email:    document.getElementById('register-email').value.trim(),
                password: password
            };

            // Avanzar al paso 2 (manejado por la lógica del modal — añadir clases)
            avanzarAPaso2();
        });
    }

    if (btnPrevStep2) {
        btnPrevStep2.addEventListener('click', () => {
            volverAPaso1();
        });
    }


    // ──────────────────────────────────────────────────────────
    // REGISTRO PASO 2 → FINALIZAR (Registro en Backend + auto-login)
    // ──────────────────────────────────────────────────────────
    const btnFinalizar = document.getElementById('register-next-step2');
    if (btnFinalizar) {
        btnFinalizar.addEventListener('click', async () => {
            const incomeForm = document.getElementById('register-income-form');

            if (!incomeForm.checkValidity()) {
                incomeForm.reportValidity();
                return;
            }

            if (!datosRegistroPaso1) {
                mostrarError(incomeForm, 'Datos del paso 1 incompletos. Vuelve atrás.');
                return;
            }

            const frecuencia = document.querySelector('input[name="frequency"]:checked')?.value;
            const moneda     = document.getElementById('register-currency')?.value || 'COP';
            const ingreso    = parseInt(limpiarMonto(document.getElementById('register-income').value), 10) || 0;

            const mapaFrecuencia = {
                'monthly':  'mensual',
                'biweekly': 'quincenal',
                'weekly':   'semanal'
            };

            // Mostrar estado de carga
            const submitBtn = btnFinalizar;
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Registrando...';

            try {
                // Registrar usuario en usuarios.json local (datos.js)
                const usuarioCreado = await registrarUsuario({
                    ...datosRegistroPaso1,
                    frecuencia_ingreso: mapaFrecuencia[frecuencia] || 'mensual',
                    ingreso_base: ingreso,
                    moneda_preferida: moneda
                });

                if (!usuarioCreado) {
                    mostrarError(incomeForm,
                        'Este email ya está registrado. Intenta otro.');
                    debugLog('Registro fallido — email duplicado', datosRegistroPaso1, 'warn');
                    return;
                }

                // Registro exitoso, ahora hacer login automático
                const usuarioLogueado = await iniciarSesion(
                    datosRegistroPaso1.email,
                    datosRegistroPaso1.password
                );

                if (usuarioLogueado) {
                    localStorage.setItem('selectedCurrency', moneda);

                    debugLog(`✅ Registro + login exitoso: ${usuarioLogueado.nombre}`);
                    console.log('✅ Registro + login exitoso:', usuarioLogueado);

                    // Redirigir al dashboard
                    window.location.href = 'dashboard.html';
                } else {
                    mostrarError(incomeForm,
                        'Registro completado, pero error en login automático. Por favor inicia sesión.');
                }
            } catch (error) {
                mostrarError(incomeForm,
                    'Error al registrarse. Intenta nuevamente.');
                debugLog('Error en registro', error, 'error');
            } finally {
                // Restaurar botón
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }


    // ──────────────────────────────────────────────────────────
    // HELPERS: navegación entre pasos de registro
    // ──────────────────────────────────────────────────────────

    function avanzarAPaso2() {
        const step1 = document.querySelector('.register-step-1');
        const step2 = document.querySelector('.register-step-2');
        if (step1) step1.classList.remove('active');
        if (step2) step2.classList.add('active');
        actualizarIndicadorPasos(2);
        limpiarErrores();
    }

    function volverAPaso1() {
        const step1 = document.querySelector('.register-step-1');
        const step2 = document.querySelector('.register-step-2');
        if (step2) step2.classList.remove('active');
        if (step1) step1.classList.add('active');
        actualizarIndicadorPasos(1);
        limpiarErrores();
    }

    function actualizarIndicadorPasos(pasoActivo) {
        document.querySelectorAll('.progress-step').forEach(ind => {
            const numero = parseInt(ind.getAttribute('data-step'), 10);
            ind.classList.toggle('active', numero === pasoActivo);
            ind.classList.toggle('completed', numero < pasoActivo);
        });
    }


    // ──────────────────────────────────────────────────────────
    // HELPERS: mensajes de error
    // ──────────────────────────────────────────────────────────

    /**
     * Muestra un mensaje de error visible bajo el formulario
     * @param {HTMLElement} contenedor - Formulario donde inyectar el error
     * @param {string} mensaje
     */
    function mostrarError(contenedor, mensaje) {
        limpiarErrores();
        const div = document.createElement('div');
        div.className = 'auth-error-message';
        div.setAttribute('role', 'alert');
        div.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>${mensaje}</span>
        `;
        contenedor.insertBefore(div, contenedor.firstChild);
    }

    function limpiarErrores() {
        document.querySelectorAll('.auth-error-message').forEach(el => el.remove());
    }

    function limpiarMonto(valor) {
        return String(valor || '').replace(/\D/g, '');
    }

    function formatearMiles(valor) {
        const limpio = limpiarMonto(valor);
        if (!limpio) return '';
        return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }
});
