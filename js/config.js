/**
 * ============================================================
 * MÓDULO: config.js
 * ============================================================
 * Configuración centralizada de la aplicación
 *
 * Este módulo expone:
 * - Constantes globales (URLs, timeouts, etc.)
 * - Configuración de la API Backend
 * - Variables de entorno
 *
 * IMPORTANTE: Este archivo debe ser el PRIMERO en cargarse
 * en el HTML antes que cualquier otro script.
 * ============================================================
 */

/**
 * URL base de la API Backend
 * Apunta a XAMPP local con el servidor PHP
 * @type {string}
 */
const API_BASE_URL = "http://localhost/nexus_backend_local/api";

/**
 * Timeout global para las peticiones fetch (en milisegundos)
 * @type {number}
 */
const API_TIMEOUT = 30000; // 30 segundos

/**
 * Modo de depuración: muestra logs detallados en consola
 * @type {boolean}
 */
const DEBUG_MODE = true;

/**
 * Claves de localStorage para persistencia de datos
 * @type {Object<string, string>}
 */
const STORAGE_KEYS = {
  USER: 'nexus_usuario_actual',
  TOKEN: 'nexus_auth_token',
  CURRENCY: 'nexus_moneda_preferida',
  TRANSACTIONS: 'nexus_transacciones',
  GOALS: 'nexus_metas',
  LIMITS: 'nexus_limites',
  FRIENDS: 'nexus_amigos'
};

/**
 * Códigos HTTP esperados
 * @type {Object<string, number>}
 */
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

/**
 * Log helper: solo muestra en consola si DEBUG_MODE está activado
 * @param {string} message - Mensaje a mostrar
 * @param {*} data - Datos opcionales
 * @param {string} level - Nivel: 'log', 'warn', 'error'
 */
function debugLog(message, data = null, level = 'log') {
  if (!DEBUG_MODE) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const prefix = `[${timestamp}] NEXUS API →`;
  
  if (data !== null) {
    console[level](`${prefix} ${message}`, data);
  } else {
    console[level](`${prefix} ${message}`);
  }
}

/**
 * Helper: Construir URL completa de endpoint
 * @param {string} endpoint - Ruta relativa del endpoint (ej: "usuarios/login.php")
 * @returns {string} URL completa del endpoint
 * @example
 * buildEndpointURL("usuarios/login.php")
 * // → "http://localhost/nexus_backend_local/api/usuarios/login.php"
 */
function buildEndpointURL(endpoint) {
  return `${API_BASE_URL}/${endpoint}`;
}

/**
 * Helper: Manejar respuesta JSON con validación
 * @param {Response} response - Respuesta del fetch
 * @returns {Promise<Object>} Datos parseados o estructura de error
 */
async function parseJSONResponse(response) {
  try {
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new Error('Respuesta no es JSON válido');
    }
    return await response.json();
  } catch (error) {
    debugLog(`Error parseando respuesta JSON: ${error.message}`, null, 'error');
    return { success: false, error: 'Error al procesar respuesta del servidor' };
  }
}
