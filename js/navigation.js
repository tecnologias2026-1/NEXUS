/**
 * ============================================================
 * MÓDULO: navigation.js
 * ============================================================
 * Responsabilidad: Navegación global compartida entre páginas
 *
 * Este módulo se encarga de:
 * - Botones de la página principal (Comenzar Gratis, Ver Demo)
 * - Logout funcional (cerrarSesion + redirect)
 * - Cambio de moneda (COP / USD / EUR)
 *
 * Lo que NO maneja:
 * - Login / registro / pasos del modal → eso lo hace auth.js
 * - Modal "Agregar transacción" → eso lo hace transacciones.js
 * - Modal "Agregar amigo" → eso lo hace social.js
 * ============================================================
 */

// Tasas de conversión (base: COP)
const CURRENCY_RATES = {
    COP: 1,
    USD: 4000,
    EUR: 4500
};

const CURRENCY_SYMBOLS = {
    COP: '$',
    USD: '$',
    EUR: '€'
};

document.addEventListener('DOMContentLoaded', () => {

    // ── 1. BOTONES DE LA HOME (abren modal de registro) ──
    if (document.getElementById('auth-modal')) {
        initializeHomeButtons();
    }

    // ── 2. CAMBIO DE MONEDA ──
    if (document.getElementById('currency-select') || document.querySelector('.sidebar-currency-btn')) {
        initializeCurrencyChange();
    }

    // ── 3. LOGOUT FUNCIONAL ──
    document.querySelectorAll('.sidebar-logout-btn').forEach(boton => {
        boton.addEventListener('click', async () => {
            try {
                if (typeof cerrarSesion === 'function') {
                    await cerrarSesion();
                }
            } finally {
                window.location.href = 'index.html';
            }
        });
    });
});


/* ============================================================
   BOTONES DE LA HOME (index.html)
   ============================================================ */

/**
 * Conecta los CTA de la página principal con el modal de auth.
 * "Comenzar Gratis" abre el modal en modo registro.
 * "Ver Demo" entra directo al dashboard (modo demo).
 */
function initializeHomeButtons() {
    const modal              = document.getElementById('auth-modal');
    const loginForm          = document.getElementById('login-form');
    const registerForm       = document.getElementById('register-form');
    const registerStep1      = document.querySelector('.register-step-1');
    const registerStep2      = document.querySelector('.register-step-2');
    const startFreeBtn       = document.getElementById('btn-start-free');
    const startFreeBottomBtn = document.getElementById('btn-start-free-bottom');
    const viewDemoBtn        = document.getElementById('btn-view-demo');

    function abrirModalRegistro() {
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        loginForm?.classList.remove('active');
        registerForm?.classList.add('active');
        registerStep1?.classList.add('active');
        registerStep2?.classList.remove('active');

        // Reset visual del indicador de progreso
        document.querySelectorAll('.progress-step').forEach(ind => {
            const numero = parseInt(ind.getAttribute('data-step'), 10);
            ind.classList.toggle('active', numero === 1);
            ind.classList.remove('completed');
        });
    }

    if (startFreeBtn)       startFreeBtn.addEventListener('click',       abrirModalRegistro);
    if (startFreeBottomBtn) startFreeBottomBtn.addEventListener('click', abrirModalRegistro);

    if (viewDemoBtn) {
        viewDemoBtn.addEventListener('click', () => {
            window.location.href = 'dashboard.html';
        });
    }
}


/* ============================================================
   CAMBIO DE MONEDA
   ============================================================ */

function initializeCurrencyChange() {
    const currencySelect = document.getElementById('currency-select');
    const currencyButton = document.querySelector('.sidebar-currency-btn');
    const currencyValue  = document.querySelector('.sidebar-currency-value');

    const savedCurrency = localStorage.getItem('selectedCurrency') || 'COP';

    const updateCurrencyUI = (currency) => {
        if (currencySelect) currencySelect.value = currency;
        if (currencyValue)  currencyValue.textContent = currency;
        if (currencyButton) currencyButton.setAttribute('aria-label', `Cambiar moneda. Moneda actual: ${currency}`);
    };

    const changeCurrency = (targetCurrency) => {
        if (!targetCurrency || !CURRENCY_RATES[targetCurrency]) return;
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

function updateAllMonetaryValues(targetCurrency) {
    const monetaryElements = document.querySelectorAll(
        '.metric-value, .balance-card-amount, .balance-stat-value, .health-value, .projection-value, .limit-category-balance, .limit-remaining, .transaction-amount'
    );
    monetaryElements.forEach(element => updateMonetaryText(element, targetCurrency));
}

function updateMonetaryText(element, targetCurrency) {
    const text = element.textContent;
    if (!text.includes('$') && !text.includes('€')) return;

    const currentCurrencyMatch = text.match(/\b(COP|USD|EUR)\b/);
    const fromCurrency = currentCurrencyMatch ? currentCurrencyMatch[1] : 'COP';

    const newText = text.replace(/([+-]?)([€$])([0-9,]+)/g, (match, sign, symbol, digits) => {
        const amount = parseInt(digits.replace(/,/g, ''), 10);
        const converted = convertCurrency(amount, fromCurrency, targetCurrency);
        return sign + formatCurrency(converted, targetCurrency);
    });

    element.textContent = newText.replace(/\b(COP|USD|EUR)\b/g, targetCurrency);
}

function convertCurrency(amount, fromCurrency, toCurrency) {
    const amountInCOP = amount * CURRENCY_RATES[fromCurrency];
    const amountInTarget = amountInCOP / CURRENCY_RATES[toCurrency];
    return Math.round(amountInTarget);
}

function formatCurrency(amount, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    return symbol + amount.toLocaleString();
}
