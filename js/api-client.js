/**
 * ============================================================
 * MÓDULO: api-client.js
 * ============================================================
 * Cliente centralizado para todas las peticiones a la API Backend
 *
 * Proporciona funciones wrapper para cada endpoint del backend.
 * Ventajas:
 * - Manejo centralizado de errores y timeouts
 * - Logging consistente de todas las peticiones
 * - Fácil de mantener y actualizar endpoints
 * - Separación clara entre lógica de UI y comunicación API
 *
 * Dependencias:
 * - config.js (debe cargarse ANTES que este archivo)
 * ============================================================
 */

/**
 * Función auxiliar para hacer peticiones fetch con timeout
 * @param {string} url - URL completa del endpoint
 * @param {Object} options - Opciones de fetch (method, headers, body, etc.)
 * @returns {Promise<Object>} Respuesta parseada o estructura de error
 * @private
 */
async function _fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT);

  try {
    debugLog(`${options.method || 'GET'} ${url}`, options.body ? JSON.parse(options.body) : null);

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await parseJSONResponse(response);

    if (!response.ok) {
      debugLog(`Error HTTP ${response.status}`, data, 'warn');
    } else {
      debugLog(`Respuesta exitosa (${response.status})`, data);
    }

    return {
      status: response.status,
      ok: response.ok,
      ...data
    };
  } catch (error) {
    clearTimeout(timeout);

    if (error.name === 'AbortError') {
      debugLog(`Timeout en petición a ${url}`, null, 'error');
      return { success: false, error: 'Tiempo de espera agotado. Intenta de nuevo.' };
    }

    debugLog(`Error en petición a ${url}: ${error.message}`, error, 'error');
    return { success: false, error: error.message };
  }
}

/**
 * ============================================================
 * MÓDULO DE AUTENTICACIÓN - USUARIOS
 * ============================================================
 */

/**
 * Registra un nuevo usuario en el backend
 * @param {Object} datosUsuario - Datos del nuevo usuario
 * @param {string} datosUsuario.nombre - Nombre completo
 * @param {string} datosUsuario.email - Email único
 * @param {string} datosUsuario.password - Contraseña
 * @param {number} datosUsuario.ingreso_base - Ingreso base mensual
 * @param {string} datosUsuario.frecuencia_ingreso - Frecuencia (semanal, mensual, etc.)
 * @param {string} datosUsuario.moneda_preferida - Moneda (COP, USD, etc.)
 * @returns {Promise<Object>} { success, message, usuario?, error? }
 */
async function apiRegistroUsuario(datosUsuario) {
  const url = buildEndpointURL('usuarios/registro.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(datosUsuario)
  });
}

/**
 * Inicia sesión del usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<Object>} { success, usuario?, nivel, xp_actual, xp_siguiente_nivel, puntos_ranking, racha_dias, error? }
 */
async function apiLoginUsuario(email, password) {
  const url = buildEndpointURL('usuarios/login.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

/**
 * ============================================================
 * MÓDULO DE TRANSACCIONES
 * ============================================================
 */

/**
 * Crea una nueva transacción (ingreso o gasto)
 * @param {Object} transaccion - Datos de la transacción
 * @param {number} transaccion.usuario_id - ID del usuario propietario
 * @param {string} transaccion.tipo - 'ingreso' o 'gasto'
 * @param {number} transaccion.monto - Monto de la transacción
 * @param {number} transaccion.categoria_id - ID de la categoría
 * @param {string} transaccion.descripcion - Descripción/concepto
 * @param {string} transaccion.fecha - Fecha ISO (YYYY-MM-DD)
 * @returns {Promise<Object>} { success, message, transaccion?, error? }
 */
async function apiCrearTransaccion(transaccion) {
  const url = buildEndpointURL('transacciones/crear.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(transaccion)
  });
}

/**
 * Obtiene el historial de transacciones de un usuario
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<Object>} { success, transacciones?, error? }
 */
async function apiListarTransacciones(usuario_id) {
  const url = buildEndpointURL(`transacciones/listar.php?usuario_id=${usuario_id}`);
  return _fetchWithTimeout(url, { method: 'GET' });
}

/**
 * Elimina una transacción
 * @param {number} id - ID de la transacción a eliminar
 * @returns {Promise<Object>} { success, message, error? }
 */
async function apiEliminarTransaccion(id) {
  const url = buildEndpointURL(`transacciones/eliminar.php?id=${id}`);
  return _fetchWithTimeout(url, { method: 'DELETE' });
}

/**
 * ============================================================
 * MÓDULO DE PRESUPUESTOS Y LÍMITES
 * ============================================================
 */

/**
 * Guarda o actualiza un límite de gasto por categoría
 * @param {Object} limite - Datos del límite
 * @param {number} limite.usuario_id - ID del usuario propietario
 * @param {number} limite.categoria_id - ID de la categoría
 * @param {number} limite.monto_limite - Monto límite
 * @returns {Promise<Object>} { success, message, error? }
 */
async function apiGuardarLimite(limite) {
  const url = buildEndpointURL('limites/guardar.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(limite)
  });
}

/**
 * Obtiene todos los límites de un usuario
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<Object>} { success, limites?, error? }
 */
async function apiListarLimites(usuario_id) {
  const url = buildEndpointURL(`limites/listar.php?usuario_id=${usuario_id}`);
  return _fetchWithTimeout(url, { method: 'GET' });
}

/**
 * ============================================================
 * MÓDULO DE METAS DE AHORRO
 * ============================================================
 */

/**
 * Crea una nueva meta de ahorro
 * @param {Object} meta - Datos de la meta
 * @param {number} meta.usuario_id - ID del usuario propietario
 * @param {string} meta.nombre - Nombre de la meta
 * @param {number} meta.monto_objetivo - Monto objetivo
 * @param {number} meta.monto_actual - Monto actual (por defecto 0)
 * @param {string} meta.fecha_limite - Fecha límite (YYYY-MM-DD)
 * @returns {Promise<Object>} { success, message, meta?, error? }
 */
async function apiCrearMeta(meta) {
  const url = buildEndpointURL('metas/crear.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(meta)
  });
}

/**
 * Obtiene todas las metas de un usuario (ordenadas por vencimiento)
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<Object>} { success, metas?, error? }
 */
async function apiListarMetas(usuario_id) {
  const url = buildEndpointURL(`metas/listar.php?usuario_id=${usuario_id}`);
  return _fetchWithTimeout(url, { method: 'GET' });
}

/**
 * Registra un abono/pago a una meta (suma dinámicamente)
 * @param {Object} abono - Datos del abono
 * @param {number} abono.meta_id - ID de la meta
 * @param {number} abono.monto_abono - Monto a sumar
 * @returns {Promise<Object>} { success, message, meta_actualizada?, completada?, error? }
 */
async function apiAbonarMeta(abono) {
  const url = buildEndpointURL('metas/abonar.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(abono)
  });
}

/**
 * Elimina una meta
 * @param {number} id - ID de la meta a eliminar
 * @returns {Promise<Object>} { success, message, error? }
 */
async function apiEliminarMeta(id) {
  const url = buildEndpointURL(`metas/eliminar.php?id=${id}`);
  return _fetchWithTimeout(url, { method: 'DELETE' });
}

/**
 * ============================================================
 * MÓDULO DE GAMIFICACIÓN
 * ============================================================
 */

/**
 * Actualiza XP del usuario y maneja level up automático
 * @param {Object} datos - Datos para actualizar XP
 * @param {number} datos.usuario_id - ID del usuario
 * @param {number} datos.xp_ganada - XP a sumar
 * @returns {Promise<Object>} { success, gamificacion?, subio_nivel?, error? }
 *                             gamificacion: { nivel, xp_actual, xp_siguiente_nivel, puntos_ranking }
 */
async function apiActualizarXP(datos) {
  const url = buildEndpointURL('gamificacion/actualizar_xp.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

/**
 * ============================================================
 * MÓDULO SOCIAL Y COMUNIDAD - AMIGOS
 * ============================================================
 */

/**
 * Agrega un nuevo amigo (con validación de existencia y duplicados)
 * @param {Object} datos - Datos de la amistad
 * @param {number} datos.usuario_id - ID del usuario actual
 * @param {number} datos.amigo_id - ID del usuario a agregar como amigo
 * @returns {Promise<Object>} { success, message, amigo?, error? }
 */
async function apiAgregarAmigo(datos) {
  const url = buildEndpointURL('amigos/agregar.php');
  return _fetchWithTimeout(url, {
    method: 'POST',
    body: JSON.stringify(datos)
  });
}

/**
 * Obtiene la lista de amigos de un usuario (con datos de gamificación)
 * @param {number} usuario_id - ID del usuario
 * @returns {Promise<Object>} { success, amigos?, error? }
 */
async function apiListarAmigos(usuario_id) {
  const url = buildEndpointURL(`amigos/listar.php?usuario_id=${usuario_id}`);
  return _fetchWithTimeout(url, { method: 'GET' });
}

/**
 * Elimina/desvincula un amigo
 * @param {number} id - ID de la relación de amistad (from tabla relacional)
 * @returns {Promise<Object>} { success, message, error? }
 */
async function apiEliminarAmigo(id) {
  const url = buildEndpointURL(`amigos/eliminar.php?id=${id}`);
  return _fetchWithTimeout(url, { method: 'DELETE' });
}

/**
 * ============================================================
 * FUNCIONES AUXILIARES PARA MANEJO DE SESIÓN
 * ============================================================
 */

/**
 * Guarda los datos del usuario autenticado en localStorage
 * @param {Object} usuario - Objeto usuario con todos sus datos
 * @returns {void}
 */
function guardarUsuarioSesion(usuario) {
  if (!usuario) return;
  
  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(usuario));
  
  // También guardar moneda preferida para acceso rápido
  if (usuario.moneda_preferida) {
    localStorage.setItem(STORAGE_KEYS.CURRENCY, usuario.moneda_preferida);
  }
  
  debugLog('Sesión de usuario guardada', { usuario_id: usuario.id, nombre: usuario.nombre });
}

/**
 * Obtiene el usuario autenticado desde localStorage
 * @returns {Object|null} Datos del usuario o null si no hay sesión
 */
function obtenerUsuarioSesion() {
  const stored = localStorage.getItem(STORAGE_KEYS.USER);
  return stored ? JSON.parse(stored) : null;
}

/**
 * Limpia la sesión del usuario (logout)
 * @returns {void}
 */
function limpiarUsuarioSesion() {
  localStorage.removeItem(STORAGE_KEYS.USER);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  debugLog('Sesión de usuario limpiada');
}

/**
 * Obtiene la moneda preferida del usuario
 * @returns {string} Código de moneda (ej: "COP", "USD")
 */
function obtenerMonedaPreferida() {
  return localStorage.getItem(STORAGE_KEYS.CURRENCY) || 'COP';
}
