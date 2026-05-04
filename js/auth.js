/**
 * ARCHIVO: auth.js
 * FUNCIÓN: Maneja la lógica de autenticación (apertura de modal, validación de formularios)
 * 
 * Este script se ejecuta cuando la página está completamente cargada y controla:
 * - Abrir/cerrar modal de autenticación
 * - Validar formularios antes de enviar
 * - Redireccionar después del registro exitoso
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

    // Formularios dentro del modal
    const loginForm = document.getElementById('login-form');       // Contenedor del formulario de login
    const registerForm = document.getElementById('register-form'); // Contenedor del formulario de registro
    
    // Botones para cerrar el modal
    const closeBtn = document.getElementById('modal-close');  // Botón X para cerrar
    const backdrop = document.getElementById('modal-backdrop'); // Fondo oscuro detrás del modal
    
    // ==========================================
    // 2. EVENTOS DEL MODAL (ABRIR/CERRAR)
    // ==========================================

    /**
     * Muestra el formulario de autenticación correcto y actualiza los estados
     * @param {'login' | 'register'} formType
     */
    function showAuthForm(formType) {
        if (!loginForm || !registerForm) {
            return;
        }

        if (formType === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }

    /**
     * Evento: Click en botón "Iniciar Sesión"
     * Acción: Abre el modal y muestra el formulario de login
     */
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            modal.classList.add('active');              // Mostrar modal
            showAuthForm('login');                      // Forzar login
        });
    }

    /**
     * Evento: Click en botón "Crear Cuenta"
     * Acción: Abre el modal y muestra el formulario de registro
     */
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            modal.classList.add('active');              // Mostrar modal
            showAuthForm('register');                   // Forzar registro
        });
    }

    /**
     * Evento: Click en botón de cerrar (X)
     * Acción: Cierra el modal
     */
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    /**
     * Evento: Click en el fondo oscuro (backdrop)
     * Acción: Cierra el modal si se hace click fuera del formulario
     */
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // ==========================================
    // 3. VALIDACIÓN Y ENVÍO DE FORMULARIOS
    // ==========================================

    /**
     * Evento: Envío del formulario de login
     * Acción: Valida y procesa el login (simulado)
     */
    const loginFormElement = document.getElementById('login-form-element');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', (event) => {
            event.preventDefault(); // Evitar envío real
            
            if (loginFormElement.checkValidity()) {
                // Aquí iría la lógica real de autenticación
                console.log('Login válido - redirigiendo...');
                window.location.href = 'dashboard.html';
            } else {
                loginFormElement.reportValidity();
            }
        });
    }

    /**
     * Evento: Envío del formulario de ingresos (paso 2 del registro)
     * Acción: Valida ingresos y redirige al dashboard si todo es correcto
     */
    const registerNextStep2 = document.getElementById('register-next-step2');
    if (registerNextStep2) {
        registerNextStep2.addEventListener('click', () => {
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
    }
});