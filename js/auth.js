/**
 * ARCHIVO: auth.js
 * FUNCIÓN: Maneja toda la lógica de autenticación (login, registro, navegación entre formularios)
 * 
 * Este script se ejecuta cuando la página está completamente cargada y controla:
 * - Abrir/cerrar modal de autenticación
 * - Mostrar/ocultar formularios de login y registro
 * - Validar formularios antes de enviar
 * - Navegar entre pasos del registro
 */

// ==========================================
// ESPERAR A QUE LA PÁGINA CARGUE COMPLETAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. OBTENER REFERENCIAS A ELEMENTOS DEL HTML
    // ==========================================
    
    // Modal principal de autenticación (contenedor que aparece en pantalla)
    const modal = document.getElementById('auth-modal');
    
    // Botones en el header para abrir el modal
    const loginBtn = document.getElementById('btn-login');         // Botón "Iniciar Sesión"
    const registerBtn = document.getElementById('btn-register');   // Botón "Crear Cuenta"
    
    // Botones para cerrar el modal
    const closeBtn = document.getElementById('modal-close');  // Botón X para cerrar
    const backdrop = document.getElementById('modal-backdrop'); // Fondo oscuro detrás del modal
    
    // Formularios dentro del modal
    const loginForm = document.getElementById('login-form');     // Formulario de login
    const registerForm = document.getElementById('register-form');  // Formulario de registro
    
    // Pasos del formulario de registro (paso 1 = datos básicos, paso 2 = ingresos)
    const registerStep1 = document.querySelector('.register-step-1');
    const registerStep2 = document.querySelector('.register-step-2');
    
    // Botones de navegación en el registro
    const registerNext = document.getElementById('register-next');          // Pasar de paso 1 a 2
    const registerNextStep2 = document.getElementById('register-next-step2'); // Completar registro
    const registerPrev = document.getElementById('register-prev');         // Volver al paso anterior
    
    // Botones de cambio entre formularios (ej: "¿No tienes cuenta? Regístrate aquí")
    const switchBtns = document.querySelectorAll('.link-btn');
    
    // Indicadores visuales de progreso (círculos 1, 2, 3)
    const progressSteps = document.querySelectorAll('.progress-step');

    // ==========================================
    // 2. FUNCIONES AUXILIARES
    // ==========================================

    /**
     * Actualiza visualmente qué paso está activo (resalta el círculo)
     * @param {number} stepNumber - Número de paso a marcar como activo (1, 2 o 3)
     */
    function updateProgressStep(stepNumber) {
        // Recorre cada indicador de paso
        progressSteps.forEach(step => {
            // Obtiene el número del paso del atributo 'data-step'
            const step_attr = step.getAttribute('data-step');
            
            // Si es el paso actual, añade clase 'active'
            if (step_attr === String(stepNumber)) {
                step.classList.add('active');
            } else {
                // Si no es el paso actual, quita la clase 'active'
                step.classList.remove('active');
            }
        });
    }

    // ==========================================
    // 3. EVENTOS DEL MODAL (ABRIR/CERRAR)
    // ==========================================

    /**
     * Evento: Click en botón "Iniciar Sesión"
     * Acción: Abre el modal y muestra el formulario de login
     */
    loginBtn.addEventListener('click', () => {
        modal.classList.add('active');              // Mostrar modal
        loginForm.classList.add('active');         // Mostrar formulario de login
        registerForm.classList.remove('active');   // Ocultar formulario de registro
    });

    /**
     * Evento: Click en botón "Crear Cuenta"
     * Acción: Abre el modal, muestra registro y vuelve al paso 1
     */
    registerBtn.addEventListener('click', () => {
        modal.classList.add('active');                // Mostrar modal
        registerForm.classList.add('active');         // Mostrar formulario de registro
        loginForm.classList.remove('active');         // Ocultar formulario de login
        registerStep1?.classList.add('active');       // Mostrar paso 1 (información básica)
        registerStep2?.classList.remove('active');    // Ocultar paso 2 (ingresos)
        updateProgressStep(1);                        // Marcar paso 1 como activo
    });

    /**
     * Evento: Click en botón de cerrar (X)
     * Acción: Cierra el modal
     */
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    /**
     * Evento: Click en el fondo oscuro (backdrop)
     * Acción: Cierra el modal si se hace click fuera del formulario
     */
    backdrop.addEventListener('click', () => {
        modal.classList.remove('active');
    });

    // ==========================================
    // 4. EVENTOS DE CAMBIO ENTRE FORMULARIOS
    // ==========================================

    /**
     * Evento: Click en botones de cambio (ej: "¿No tienes cuenta? Regístrate")
     * Acción: Alterna entre formulario de login y registro
     */
    switchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Obtiene el atributo que indica a dónde cambiar (login o register)
            const target = btn.getAttribute('data-switch-form');
            
            // Si quiere ir a registro
            if (target === 'register') {
                loginForm.classList.remove('active');         // Ocultar login
                registerForm.classList.add('active');         // Mostrar registro
                registerStep1?.classList.add('active');       // Empezar en paso 1
                registerStep2?.classList.remove('active');    // Ocultar paso 2
                updateProgressStep(1);                        // Actualizar indicador
            } 
            // Si quiere ir a login
            else if (target === 'login') {
                registerForm.classList.remove('active');  // Ocultar registro
                loginForm.classList.add('active');        // Mostrar login
            }
        });
    });

    // ==========================================
    // 5. EVENTOS DE NAVEGACIÓN EN EL REGISTRO
    // ==========================================

    /**
     * Evento: Click en "Siguiente" del paso 1 (información básica)
     * Acción: Valida que los campos estén llenos y pasa al paso 2
     */
    registerNext.addEventListener('click', () => {
        // Obtiene el formulario del paso 1
        const registrationForm = document.getElementById('register-form-element');
        
        // Verifica que TODOS los campos del formulario sean válidos
        if (registrationForm.checkValidity()) {
            // Si es válido, avanza al paso 2
            registerStep1?.classList.remove('active');    // Ocultar paso 1
            registerStep2?.classList.add('active');       // Mostrar paso 2
            updateProgressStep(2);                        // Actualizar indicador a paso 2
        } else {
            // Si no es válido, muestra mensajes de error
            registrationForm.reportValidity();
        }
    });

    /**
     * Evento: Click en "Siguiente" del paso 2 (ingresos)
     * Acción: Valida ingresos y redirige al dashboard si todo es correcto
     */
    registerNextStep2?.addEventListener('click', () => {
        // Obtiene el formulario del paso 2
        const incomeForm = document.getElementById('register-income-form');
        
        // Verifica que los campos del paso 2 sean válidos
        if (incomeForm.checkValidity()) {
            // Si es válido, redirige a la página del dashboard (panel principal)
            window.location.href = 'dashboard.html';
        } else {
            // Si no es válido, muestra mensajes de error
            incomeForm.reportValidity();
        }
    });

    /**
     * Evento: Click en "Atrás" del paso 2
     * Acción: Regresa al paso 1 del registro
     */
    registerPrev.addEventListener('click', () => {
        registerStep2?.classList.remove('active');  // Ocultar paso 2
        registerStep1?.classList.add('active');     // Mostrar paso 1
        updateProgressStep(1);                      // Actualizar indicador a paso 1
    });
});