/**
 * ARCHIVO: navigation.js
 * FUNCIÓN: Maneja la navegación dentro de la página y cambios de moneda
 *
 * Este script se ejecuta cuando la página está completamente cargada y controla:
 * - Navegación entre formularios de autenticación (login/registro)
 * - Navegación entre pasos del registro
 * - Cambio de moneda en páginas de dashboard (análisis, transacciones)
 */

// ==========================================
// CONSTANTES Y CONFIGURACIÓN
// ==========================================

// Tasas de conversión de moneda (base: COP)
const CURRENCY_RATES = {
    COP: 1,        // Peso colombiano (base)
    USD: 4000,     // 1 USD = 4000 COP
    EUR: 4500      // 1 EUR = 4500 COP
};

// Símbolos de moneda para display
const CURRENCY_SYMBOLS = {
    COP: '$',
    USD: '$',
    EUR: '€'
};

// ==========================================
// ESPERAR A QUE LA PÁGINA CARGUE COMPLETAMENTE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. INICIALIZACIÓN DE NAVEGACIÓN DE AUTENTICACIÓN
    // ==========================================

    // Solo ejecutar si estamos en la página de inicio (index.html) con modal de auth
    if (document.getElementById('auth-modal')) {
        initializeAuthNavigation();
    }

    // ==========================================
    // 2. INICIALIZACIÓN DE CAMBIO DE MONEDA
    // ==========================================

    // Solo ejecutar si hay selector de moneda (páginas de dashboard)
    const currencySelect = document.getElementById('currency-select');
    if (currencySelect) {
        initializeCurrencyChange();
    }

    // ==========================================
    // 3. INICIALIZACIÓN DE LOGOUT EN SIDEBAR
    // ==========================================

    const logoutButtons = document.querySelectorAll('.sidebar-logout-btn');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    });

    // ==========================================
    // 4. INICIALIZACIÓN DE MODAL AGREGAR TRANSACCIÓN
    // ==========================================

    // Solo ejecutar si hay modal de agregar transacción (página transacciones.html)
    if (document.getElementById('add-transaction-modal')) {
        initializeAddTransactionModal();
    }
});

// ==========================================
// FUNCIONES DE NAVEGACIÓN DE AUTENTICACIÓN
// ==========================================

/**
 * Inicializa la navegación entre formularios de autenticación
 * Se ejecuta solo en páginas con modal de auth
 */
function initializeAuthNavigation() {

    // ==========================================
    // OBTENER REFERENCIAS A ELEMENTOS
    // ==========================================

    // Formularios dentro del modal
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Pasos del formulario de registro
    const registerStep1 = document.querySelector('.register-step-1');
    const registerStep2 = document.querySelector('.register-step-2');

    // Botones de navegación en el registro
    const registerNext = document.getElementById('register-next');
    const registerPrev = document.getElementById('register-prev');

    // Botones para cambiar entre formularios
    const switchBtns = document.querySelectorAll('.link-btn');

    // Indicadores visuales de progreso
    const progressSteps = document.querySelectorAll('.progress-step');

    // ==========================================
    // BOTONES DE LA PÁGINA PRINCIPAL (INDEX.HTML)
    // ==========================================

    // Botones de acción en la página principal
    const startFreeBtn = document.getElementById('btn-start-free');           // Primer botón "Comenzar Gratis"
    const startFreeBottomBtn = document.getElementById('btn-start-free-bottom'); // Segundo botón "Comenzar Gratis"
    const viewDemoBtn = document.getElementById('btn-view-demo');             // Botón "Ver Demo"

    // ==========================================
    // FUNCIONES AUXILIARES
    // ==========================================

    /**
     * Actualiza visualmente qué paso está activo en el registro
     * @param {number} stepNumber - Número de paso a marcar como activo (1, 2 o 3)
     */
    function updateProgressStep(stepNumber) {
        progressSteps.forEach(step => {
            const stepAttr = step.getAttribute('data-step');
            if (stepAttr === String(stepNumber)) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }

    // ==========================================
    // EVENTOS DE CAMBIO ENTRE FORMULARIOS
    // ==========================================

    /**
     * Evento: Click en botones de cambio entre login y registro
     * Acción: Alterna entre formulario de login y registro
     */
    switchBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-switch-form');

            if (target === 'register') {
                // Cambiar a registro
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
                registerStep1?.classList.add('active');
                registerStep2?.classList.remove('active');
                updateProgressStep(1);
            } else if (target === 'login') {
                // Cambiar a login
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            }
        });
    });

    // ==========================================
    // EVENTOS DE NAVEGACIÓN EN EL REGISTRO
    // ==========================================

    /**
     * Evento: Click en "Siguiente" del paso 1
     * Acción: Valida y pasa al paso 2
     */
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

    // ==========================================
    // EVENTOS DE BOTONES DE LA PÁGINA PRINCIPAL
    // ==========================================
    // CAMBIO IMPLEMENTADO: Los botones "Comenzar Gratis" ahora abren directamente
    // el modal de registro, mientras que "Ver Demo" lleva al dashboard sin registro.
    // Esto mejora la experiencia del usuario al simplificar el flujo de onboarding.

    /**
     * Evento: Click en botones "Comenzar Gratis"
     * Acción: Abre el modal y muestra el formulario de registro
     */
    if (startFreeBtn) {
        startFreeBtn.addEventListener('click', () => {
            // Abrir modal
            const modal = document.getElementById('auth-modal');
            modal.classList.add('active');

            // Mostrar formulario de registro
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            registerStep1?.classList.add('active');
            registerStep2?.classList.remove('active');
            updateProgressStep(1);
        });
    }

    if (startFreeBottomBtn) {
        startFreeBottomBtn.addEventListener('click', () => {
            // Abrir modal
            const modal = document.getElementById('auth-modal');
            modal.classList.add('active');

            // Mostrar formulario de registro
            loginForm.classList.remove('active');
            registerForm.classList.add('active');
            registerStep1?.classList.add('active');
            registerStep2?.classList.remove('active');
            updateProgressStep(1);
        });
    }

    /**
     * Evento: Click en botón "Ver Demo"
     * Acción: Redirige directamente al dashboard sin abrir el modal
     */
    if (viewDemoBtn) {
        viewDemoBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }

    /**
     * Evento: Click en "Atrás" del paso 2
     * Acción: Regresa al paso 1
     */
    if (registerPrev) {
        registerPrev.addEventListener('click', () => {
            registerStep2?.classList.remove('active');
            registerStep1?.classList.add('active');
            updateProgressStep(1);
        });
    }
}
// ==========================================
// FUNCIONES DE CAMBIO DE MONEDA
// ==========================================

/**
 * Inicializa el cambio de moneda en páginas de dashboard
 * Se ejecuta si hay un selector o un botón de moneda.
 */
function initializeCurrencyChange() {
    const currencySelect = document.getElementById('currency-select');
    const currencyButton = document.querySelector('.sidebar-currency-btn');
    const currencyValue = document.querySelector('.sidebar-currency-value');

    const savedCurrency = localStorage.getItem('selectedCurrency') || 'COP';

    const updateCurrencyUI = (currency) => {
        if (currencySelect) {
            currencySelect.value = currency;
        }
        if (currencyValue) {
            currencyValue.textContent = currency;
        }
        if (currencyButton) {
            currencyButton.setAttribute('aria-label', `Cambiar moneda. Moneda actual: ${currency}`);
        }
    };

    const changeCurrency = (targetCurrency) => {
        if (!targetCurrency || !CURRENCY_RATES[targetCurrency]) {
            return;
        }

        localStorage.setItem('selectedCurrency', targetCurrency);
        updateCurrencyUI(targetCurrency);
        updateAllMonetaryValues(targetCurrency);
    };

    if (currencySelect) {
        currencySelect.addEventListener('change', (event) => {
            changeCurrency(event.target.value);
        });
    }

    if (currencyButton) {
        currencyButton.addEventListener('click', () => {
            const currencies = Object.keys(CURRENCY_RATES);
            const current = currencyValue ? currencyValue.textContent.trim() : 'COP';
            const index = currencies.indexOf(current);
            const nextCurrency = currencies[(index + 1) % currencies.length];
            changeCurrency(nextCurrency);
        });
    }

    updateCurrencyUI(savedCurrency);
    updateAllMonetaryValues(savedCurrency);
}

/**
 * Actualiza todos los valores monetarios en la página
 * @param {string} targetCurrency - Moneda objetivo (COP, USD, EUR)
 */
function updateAllMonetaryValues(targetCurrency) {
    const monetaryElements = document.querySelectorAll(
        '.metric-value, .balance-card-amount, .balance-stat-value, .health-value, .projection-value, .limit-category-balance, .limit-remaining, .transaction-amount'
    );

    monetaryElements.forEach(element => {
        updateMonetaryText(element, targetCurrency);
    });
}

/**
 * Actualiza el texto de un elemento monetario
 * @param {Element} element - Elemento HTML con texto monetario
 * @param {string} targetCurrency - Moneda objetivo
 */
function updateMonetaryText(element, targetCurrency) {
    const text = element.textContent;
    if (!text.includes('$') && !text.includes('€')) {
        return;
    }

    const currentCurrencyMatch = text.match(/\b(COP|USD|EUR)\b/);
    const fromCurrency = currentCurrencyMatch ? currentCurrencyMatch[1] : 'COP';

    const newText = text.replace(/([+-]?)([€$])([0-9,]+)/g, (match, sign, symbol, digits) => {
        const amount = parseInt(digits.replace(/,/g, ''), 10);
        const converted = convertCurrency(amount, fromCurrency, targetCurrency);
        return sign + formatCurrency(converted, targetCurrency);
    });

    element.textContent = newText.replace(/\b(COP|USD|EUR)\b/g, targetCurrency);
}

/**
 * Extrae el valor numérico de un texto monetario
 * @param {string} text - Texto como "$1,200"
 * @returns {number|null} - Valor numérico o null si no se encuentra
 */
function extractNumericValue(text) {
    // Buscar patrón de número con comas
    const match = text.match(/\$([0-9,]+)/);
    if (match) {
        return parseInt(match[1].replace(/,/g, ''));
    }
    return null;
}

/**
 * Extrae todos los números de un texto
 * @param {string} text - Texto a analizar
 * @returns {number[]} - Array de números encontrados
 */
function extractAllNumbers(text) {
    const matches = text.match(/\$([0-9,]+)/g);
    if (matches) {
        return matches.map(match => {
            const numStr = match.replace('$', '').replace(/,/g, '');
            return parseInt(numStr);
        });
    }
    return [];
}

/**
 * Convierte un valor de una moneda a otra
 * @param {number} amount - Cantidad a convertir
 * @param {string} fromCurrency - Moneda origen
 * @param {string} toCurrency - Moneda destino
 * @returns {number} - Valor convertido
 */
function convertCurrency(amount, fromCurrency, toCurrency) {
    // Convertir a COP primero
    const amountInCOP = amount * CURRENCY_RATES[fromCurrency];

    // Convertir a moneda destino
    const amountInTarget = amountInCOP / CURRENCY_RATES[toCurrency];

    return Math.round(amountInTarget);
}

/**
 * Formatea un valor monetario con el símbolo apropiado
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda
 * @returns {string} - Valor formateado
 */
function formatCurrency(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    return symbol + amount.toLocaleString();
}

// ==========================================
// FUNCIONES DE MODAL AGREGAR TRANSACCIÓN
// ==========================================

/**
 * Inicializa el modal para agregar nuevas transacciones
 * Se ejecuta solo en la página transacciones.html
 */
function initializeAddTransactionModal() {
    // Obtener referencias a elementos del modal
    const modal = document.getElementById('add-transaction-modal');
    const addTransactionBtn = document.getElementById('btn-add-transaction');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const addTransactionForm = document.getElementById('add-transaction-form');

    // Botones toggle de tipo de transacción
    const typeToggleBtns = document.querySelectorAll('.form-toggle-btn');

    /**
     * Abre el modal de agregar transacción
     */
    function openModal() {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // Prevenir scroll de la página
        addTransactionForm.reset(); // Limpiar el formulario
        // Resetear tipo a "Ingreso" por defecto
        typeToggleBtns[0].classList.add('form-toggle-btn--active');
        typeToggleBtns[0].setAttribute('aria-pressed', 'true');
        typeToggleBtns[1].classList.remove('form-toggle-btn--active');
        typeToggleBtns[1].setAttribute('aria-pressed', 'false');
    }

    /**
     * Cierra el modal de agregar transacción
     */
    function closeModal() {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = 'auto'; // Restaurar scroll
    }

    /**
     * Maneja los clics en los botones toggle de tipo
     */
    typeToggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos los botones
            typeToggleBtns.forEach(b => {
                b.classList.remove('form-toggle-btn--active');
                b.setAttribute('aria-pressed', 'false');
            });
            // Agregar clase active al botón clickeado
            btn.classList.add('form-toggle-btn--active');
            btn.setAttribute('aria-pressed', 'true');
        });
    });

    /**
     * Evento: Click en botón "Agregar Transacción"
     * Acción: Abre el modal
     */
    addTransactionBtn.addEventListener('click', openModal);

    /**
     * Evento: Click en botón cerrar (X)
     * Acción: Cierra el modal
     */
    modalCloseBtn.addEventListener('click', closeModal);

    /**
     * Evento: Click en botón "Cancelar"
     * Acción: Cierra el modal
     */
    modalCancelBtn.addEventListener('click', closeModal);

    /**
     * Evento: Envío del formulario
     * Acción: Valida y envía los datos (por ahora solo mostramos un mensaje)
     */
    addTransactionForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Obtener datos del formulario
        const transactionType = document.querySelector('.form-toggle-btn--active').getAttribute('data-type');
        const category = document.getElementById('transaction-category').value;
        const amount = document.getElementById('transaction-amount').value;
        const description = document.getElementById('transaction-description').value;
        const isRecurring = document.getElementById('transaction-recurring').checked;
        const isFixed = document.getElementById('transaction-fixed').checked;

        // Aquí iría la lógica para guardar la transacción
        console.log('Transacción a guardar:', {
            type: transactionType,
            category: category,
            amount: amount,
            description: description,
            recurring: isRecurring,
            fixed: isFixed
        });

        // Cerrar el modal
        closeModal();

        // Aquí podrías mostrar un mensaje de éxito, actualizar la lista, etc.
        alert('Transacción guardada exitosamente');
    });

    /**
     * Evento: Clic fuera del modal (en el overlay)
     * Acción: Cierra el modal si se hace clic en el fondo
     */
    modal.addEventListener('click', (event) => {
        // Solo cerrar si se hace clic directamente en el modal (no en el contenido)
        if (event.target === modal) {
            closeModal();
        }
    });
}
