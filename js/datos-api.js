/**
 * ============================================================
 * MÓDULO: datos-api.js
 * ============================================================
 * Capa de acceso a datos integrada con Backend API
 *
 * Este módulo reemplaza la lógica de datos.js original, pero ahora
 * obtiene todos los datos del Backend en lugar de archivos JSON locales.
 *
 * Proporciona funciones cacheadas que:
 * - Obtienen datos del backend en primera llamada
 * - Los guardan en localStorage para acceso rápido posterior
 * - Exponen la misma interfaz que datos.js original
 *
 * Dependencias:
 * - config.js → Configuración global
 * - api-client.js → Funciones de llamada a API
 * ============================================================
 */

const STORAGE_KEYS_EXTRAS = {
  GOALS_OVERLAY: 'nexus_metas_overlay'
};

/**
 * Amigos de demostración cuando la BD está vacía (presentación)
 * @param {number} usuario_id
 * @returns {Array}
 * @private
 */
function _amigosDemoFallback(usuario_id) {
  return [
    { id: 901, usuario_id, nombre: 'Sofía Martínez', nivel: 7, racha: 14, puntos: 2480, tendencia: 'up' },
    { id: 902, usuario_id, nombre: 'Carlos Rueda',   nivel: 6, racha: 9,  puntos: 2210, tendencia: 'up' },
    { id: 903, usuario_id, nombre: 'Laura Pineda',   nivel: 6, racha: 7,  puntos: 1980, tendencia: 'neutral' }
  ];
}

/**
 * Normaliza una meta del backend al formato que espera el frontend
 * @param {Object} meta
 * @returns {Object}
 * @private
 */
function _normalizarMetaApi(meta) {
  if (!meta) return meta;
  return {
    ...meta,
    monto_ahorrado: meta.monto_ahorrado ?? meta.monto_actual ?? 0,
    monto_objetivo: meta.monto_objetivo ?? meta.objetivo ?? 0,
    tipo: meta.tipo || 'personal',
    icono: meta.icono || '⭐',
    color_avatar: meta.color_avatar || 'amber',
    fecha_limite: meta.fecha_limite || meta.fechaLimite || meta.fecha
  };
}

/**
 * Overlay local con campos extra de metas (tipo, icono, colaborativa)
 * @returns {Object}
 * @private
 */
function _obtenerOverlayMetas() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS_EXTRAS.GOALS_OVERLAY) || '{}');
  } catch {
    return {};
  }
}

/**
 * Guarda overlay de metas en localStorage
 * @param {Object} overlay
 * @private
 */
function _guardarOverlayMetas(overlay) {
  localStorage.setItem(STORAGE_KEYS_EXTRAS.GOALS_OVERLAY, JSON.stringify(overlay));
}

/**
 * Cache en memoria de los datos ya cargados
 * @type {Object}
 */
const _cacheDatos = {
  categorias: null,
  usuarios: null,
  transacciones: null,
  limites: null,
  metas: null,
  amigos: null
};

/**
 * ============================================================
 * CATEGORÍAS
 * ============================================================
 */

/**
 * Obtiene todas las categorías (gastos e ingresos)
 * Estas generalmente vienen del backend o son constantes
 * @returns {Promise<Array>}
 */
async function obtenerCategorias() {
  if (_cacheDatos.categorias !== null) {
    return _cacheDatos.categorias;
  }

  try {
    // Intenta cargar desde localStorage primero
    const guardado = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (guardado) {
      const data = JSON.parse(guardado);
      if (Array.isArray(data.categorias)) {
        _cacheDatos.categorias = data.categorias;
        return data.categorias;
      }
    }

    // Fallback: retorna categorías predefinidas localmente
    // En un backend real, esto vendría de un endpoint específico
    _cacheDatos.categorias = await _cargarCategoriasLocales();
    return _cacheDatos.categorias;
  } catch (error) {
    debugLog('Error cargando categorías', error, 'error');
    return await _cargarCategoriasLocales();
  }
}

/**
 * Categorías predefinidas como fallback
 * @returns {Promise<Array>}
 * @private
 */
async function _cargarCategoriasLocales() {
  return [
    // Gastos
    { id: 1, nombre: 'Estudios', tipo: 'gasto', icono: '📚', color: '#3B82F6' },
    { id: 2, nombre: 'Entretenimiento', tipo: 'gasto', icono: '🎬', color: '#EC4899' },
    { id: 3, nombre: 'Alimentación', tipo: 'gasto', icono: '🍔', color: '#F59E0B' },
    { id: 4, nombre: 'Transporte', tipo: 'gasto', icono: '🚌', color: '#10B981' },
    { id: 5, nombre: 'Ropa', tipo: 'gasto', icono: '👕', color: '#8B5CF6' },
    { id: 6, nombre: 'Servicios', tipo: 'gasto', icono: '⚡', color: '#06B6D4' },
    { id: 7, nombre: 'Salud', tipo: 'gasto', icono: '💊', color: '#EF4444' },
    { id: 8, nombre: 'Otros', tipo: 'gasto', icono: '📦', color: '#6B7280' },
    // Ingresos
    { id: 9, nombre: 'Salario', tipo: 'ingreso', icono: '💼', color: '#10B981' },
    { id: 10, nombre: 'Freelancia', tipo: 'ingreso', icono: '💻', color: '#3B82F6' },
    { id: 11, nombre: 'Bonificación', tipo: 'ingreso', icono: '⭐', color: '#F59E0B' },
    { id: 12, nombre: 'Inversión', tipo: 'ingreso', icono: '📈', color: '#EC4899' },
    { id: 13, nombre: 'Devolución', tipo: 'ingreso', icono: '↩️', color: '#10B981' },
    { id: 14, nombre: 'Otros ingresos', tipo: 'ingreso', icono: '💰', color: '#6B7280' },
    // Categorías de sistema (creadas automáticamente)
    { id: 15, nombre: 'Ahorro', tipo: 'ingreso', icono: '🏦', color: '#06B6D4', sistema: true },
    { id: 16, nombre: 'Retiro a meta', tipo: 'gasto', icono: '🎯', color: '#8B5CF6', sistema: true }
  ];
}

/**
 * Obtiene una categoría por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function obtenerCategoria(id) {
  const categorias = await obtenerCategorias();
  return categorias.find(c => c.id === id) || null;
}

/**
 * ============================================================
 * USUARIOS Y SESIÓN
 * ============================================================
 */

/**
 * Obtiene el usuario actualmente logueado desde localStorage
 * @returns {Promise<Object|null>}
 */
async function obtenerUsuarioActual() {
  return obtenerUsuarioSesion();
}

/**
 * Registra un usuario en el backend
 * @param {Object} datosUsuario
 * @returns {Promise<Object|null>}
 */
async function registrarUsuario(datosUsuario) {
  try {
    const respuesta = await apiRegistroUsuario(datosUsuario);
    if (respuesta.ok && respuesta.usuario) {
      return respuesta.usuario;
    }
    debugLog('Error registrando usuario', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en registrarUsuario', error, 'error');
    return null;
  }
}

/**
 * Inicia sesión contra el backend
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object|null>}
 */
async function iniciarSesion(email, password) {
  try {
    const respuesta = await apiLoginUsuario(email, password);
    if (respuesta.ok && respuesta.usuario) {
      guardarUsuarioSesion(respuesta.usuario);
      return respuesta.usuario;
    }
    debugLog('Credenciales inválidas', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en iniciarSesion', error, 'error');
    return null;
  }
}

/**
 * Cierra la sesión del usuario
 * @returns {Promise<void>}
 */
async function cerrarSesion() {
  limpiarUsuarioSesion();
}

/**
 * ============================================================
 * TRANSACCIONES
 * ============================================================
 */

/**
 * Obtiene todas las transacciones del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerTransacciones() {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para obtener transacciones', null, 'warn');
      return [];
    }

    // Intenta cargar desde localStorage primero
    const guardado = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (guardado) {
      const data = JSON.parse(guardado);
      if (Array.isArray(data)) {
        return data;
      }
    }

    // Llamar a la API
    const respuesta = await apiListarTransacciones(usuario.id);
    if (respuesta.ok && Array.isArray(respuesta.transacciones)) {
      // Guardar en cache local
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(respuesta.transacciones));
      return respuesta.transacciones;
    }

    debugLog('Error obteniendo transacciones', respuesta, 'warn');
    return [];
  } catch (error) {
    debugLog('Error en obtenerTransacciones', error, 'error');
    return [];
  }
}

/**
 * Crea una nueva transacción
 * @param {Object} transaccion - Datos de la transacción
 * @returns {Promise<Object|null>}
 */
async function crearTransaccion(transaccion) {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para crear transacción', null, 'warn');
      return null;
    }

    const respuesta = await apiCrearTransaccion({
      usuario_id: usuario.id,
      ...transaccion
    });

    if (respuesta.ok) {
      // Limpiar cache local para que se recargue
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      debugLog('Transacción creada exitosamente', respuesta);
      return respuesta.transaccion || { success: true };
    }

    debugLog('Error creando transacción', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en crearTransaccion', error, 'error');
    return null;
  }
}

/**
 * Elimina una transacción
 * @param {number} id - ID de la transacción
 * @returns {Promise<boolean>}
 */
async function eliminarTransaccion(id) {
  try {
    const respuesta = await apiEliminarTransaccion(id);
    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      debugLog('Transacción eliminada exitosamente');
      return true;
    }

    debugLog('Error eliminando transacción', respuesta, 'warn');
    return false;
  } catch (error) {
    debugLog('Error en eliminarTransaccion', error, 'error');
    return false;
  }
}

/**
 * ============================================================
 * LÍMITES/PRESUPUESTOS
 * ============================================================
 */

/**
 * Obtiene todos los límites del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerLimites() {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para obtener límites', null, 'warn');
      return [];
    }

    // Intenta cargar desde localStorage primero
    const guardado = localStorage.getItem(STORAGE_KEYS.LIMITS);
    if (guardado) {
      const data = JSON.parse(guardado);
      if (Array.isArray(data)) {
        return data;
      }
    }

    // Llamar a la API
    const respuesta = await apiListarLimites(usuario.id);
    if (respuesta.ok && Array.isArray(respuesta.limites)) {
      // Guardar en cache local
      localStorage.setItem(STORAGE_KEYS.LIMITS, JSON.stringify(respuesta.limites));
      return respuesta.limites;
    }

    debugLog('Error obteniendo límites', respuesta, 'warn');
    return [];
  } catch (error) {
    debugLog('Error en obtenerLimites', error, 'error');
    return [];
  }
}

/**
 * Guarda o actualiza un límite por categoría
 * @param {number} categoria_id
 * @param {number} monto_limite
 * @returns {Promise<boolean>}
 */
async function guardarLimite(categoria_id, monto_limite) {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para guardar límite', null, 'warn');
      return false;
    }

    const respuesta = await apiGuardarLimite({
      usuario_id: usuario.id,
      categoria_id,
      monto_limite
    });

    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.LIMITS);
      debugLog('Límite guardado exitosamente');
      return true;
    }

    debugLog('Error guardando límite', respuesta, 'warn');
    return false;
  } catch (error) {
    debugLog('Error en guardarLimite', error, 'error');
    return false;
  }
}

/**
 * ============================================================
 * METAS DE AHORRO
 * ============================================================
 */

/**
 * Obtiene todas las metas del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerMetas() {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para obtener metas', null, 'warn');
      return [];
    }

    const overlay = _obtenerOverlayMetas();

    const respuesta = await apiListarMetas(usuario.id);
    if (respuesta.ok && Array.isArray(respuesta.metas)) {
      const idsApi = new Set(respuesta.metas.map(m => m.id));
      const metasApi = respuesta.metas.map(m => {
        const extra = overlay[m.id] || {};
        return _normalizarMetaApi({ ...extra, ...m });
      });

      const metasLocales = Object.values(overlay).filter(o => o.id && !idsApi.has(o.id));
      const metas = [...metasApi, ...metasLocales.map(_normalizarMetaApi)];

      localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(metas));
      return metas;
    }

    debugLog('Error obteniendo metas', respuesta, 'warn');
  } catch (error) {
    debugLog('Error en obtenerMetas', error, 'error');
  }

  const guardado = localStorage.getItem(STORAGE_KEYS.GOALS);
  if (guardado) {
    try {
      return JSON.parse(guardado).map(_normalizarMetaApi);
    } catch { /* continuar */ }
  }

  return [];
}

/**
 * Crea una nueva meta de ahorro
 * @param {Object} meta - Datos de la meta
 * @returns {Promise<Object|null>}
 */
async function crearMeta(meta) {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para crear meta', null, 'warn');
      return null;
    }

    const respuesta = await apiCrearMeta({
      usuario_id: usuario.id,
      ...meta
    });

    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      debugLog('Meta creada exitosamente');
      return respuesta.meta || { success: true };
    }

    debugLog('Error creando meta', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en crearMeta', error, 'error');
    return null;
  }
}

/**
 * Registra un abono a una meta
 * @param {number} meta_id - ID de la meta
 * @param {number} monto_abono - Monto a abonar
 * @returns {Promise<Object|null>} Meta actualizada y bandera completada
 */
async function abonarMeta(meta_id, monto_abono) {
  try {
    const respuesta = await apiAbonarMeta({
      meta_id,
      monto_abono
    });

    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      debugLog('Abono a meta registrado exitosamente');
      return {
        meta_actualizada: respuesta.meta_actualizada,
        completada: respuesta.completada
      };
    }

    debugLog('Error abonando meta', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en abonarMeta', error, 'error');
    return null;
  }
}

/**
 * Elimina una meta
 * @param {number} id - ID de la meta
 * @returns {Promise<boolean>}
 */
async function eliminarMeta(id) {
  try {
    const respuesta = await apiEliminarMeta(id);
    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.GOALS);
      debugLog('Meta eliminada exitosamente');
      return true;
    }

    debugLog('Error eliminando meta', respuesta, 'warn');
    return false;
  } catch (error) {
    debugLog('Error en eliminarMeta', error, 'error');
    return false;
  }
}

/**
 * ============================================================
 * AMIGOS Y COMUNIDAD
 * ============================================================
 */

/**
 * Obtiene la lista de amigos del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerAmigos() {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para obtener amigos', null, 'warn');
      return [];
    }

    const respuesta = await apiListarAmigos(usuario.id);

    if (respuesta.ok && Array.isArray(respuesta.amigos)) {
      let amigos = respuesta.amigos;

      if (amigos.length === 0) {
        debugLog('BD sin amigos — usando datos demo para la presentación');
        amigos = _amigosDemoFallback(usuario.id);
      }

      localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(amigos));
      return amigos;
    }

    debugLog('Error obteniendo amigos desde API', respuesta, 'warn');
  } catch (error) {
    debugLog('Error en obtenerAmigos', error, 'error');
  }

  const guardado = localStorage.getItem(STORAGE_KEYS.FRIENDS);
  if (guardado) {
    try {
      const data = JSON.parse(guardado);
      if (Array.isArray(data) && data.length > 0) return data;
    } catch { /* continuar */ }
  }

  const usuario = obtenerUsuarioSesion();
  return usuario ? _amigosDemoFallback(usuario.id) : [];
}

/**
 * Agrega un nuevo amigo
 * @param {number} amigo_id - ID del usuario a agregar como amigo
 * @returns {Promise<boolean>}
 */
async function agregarAmigo(amigo_id) {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para agregar amigo', null, 'warn');
      return false;
    }

    const respuesta = await apiAgregarAmigo({
      usuario_id: usuario.id,
      amigo_id
    });

    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.FRIENDS);
      debugLog('Amigo agregado exitosamente');
      return true;
    }

    debugLog('Error agregando amigo', respuesta, 'warn');
    return false;
  } catch (error) {
    debugLog('Error en agregarAmigo', error, 'error');
    return false;
  }
}

/**
 * Elimina un amigo
 * @param {number} id - ID de la relación de amistad
 * @returns {Promise<boolean>}
 */
async function eliminarAmigo(id) {
  try {
    const respuesta = await apiEliminarAmigo(id);
    if (respuesta.ok) {
      // Limpiar cache local
      localStorage.removeItem(STORAGE_KEYS.FRIENDS);
      debugLog('Amigo eliminado exitosamente');
      return true;
    }

    debugLog('Error eliminando amigo', respuesta, 'warn');
    return false;
  } catch (error) {
    debugLog('Error en eliminarAmigo', error, 'error');
    return false;
  }
}

/**
 * ============================================================
 * GAMIFICACIÓN
 * ============================================================
 */

/**
 * Actualiza XP del usuario
 * @param {number} xp_ganada - XP a sumar
 * @returns {Promise<Object|null>} Datos actualizados de gamificación
 */
async function actualizarXPUsuario(xp_ganada) {
  try {
    const usuario = obtenerUsuarioSesion();
    if (!usuario) {
      debugLog('No hay usuario en sesión para actualizar XP', null, 'warn');
      return null;
    }

    const respuesta = await apiActualizarXP({
      usuario_id: usuario.id,
      xp_ganada
    });

    if (respuesta.ok && respuesta.gamificacion) {
      // Actualizar datos de usuario en sesión
      const usuarioActualizado = {
        ...usuario,
        ...respuesta.gamificacion
      };
      guardarUsuarioSesion(usuarioActualizado);
      debugLog('XP actualizado', respuesta.gamificacion);
      return respuesta.gamificacion;
    }

    debugLog('Error actualizando XP', respuesta, 'warn');
    return null;
  } catch (error) {
    debugLog('Error en actualizarXPUsuario', error, 'error');
    return null;
  }
}

/**
 * ============================================================
 * COMPATIBILIDAD CON datos.js (Metas.js, lista_amigos.js, etc.)
 * ============================================================
 */

/**
 * Amigos del usuario + "Yo" para el ranking
 * @returns {Promise<Array>}
 */
async function obtenerAmigosConYo() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const amigosOriginales = (await obtenerAmigos()).map(a => ({ ...a, esUsuarioActual: false }));
  const gam = usuario.gamificacion || {};

  const yo = {
    id: 0,
    nombre: 'Yo',
    nivel: gam.nivel ?? 1,
    racha: gam.racha_dias ?? 0,
    puntos: gam.puntos_ranking ?? 0,
    tendencia: 'up',
    esUsuarioActual: true
  };

  return [...amigosOriginales, yo];
}

/**
 * Agrega un amigo (API si hay amigo_id real, siempre actualiza cache local)
 * @param {Object} nuevoAmigo
 * @returns {Promise<void>}
 */
async function agregarAmigoDatos(nuevoAmigo) {
  const usuario = obtenerUsuarioSesion();
  if (!usuario) return;

  if (nuevoAmigo.amigo_id && nuevoAmigo.amigo_id > 100) {
    await apiAgregarAmigo({
      usuario_id: usuario.id,
      amigo_id: nuevoAmigo.amigo_id
    });
  }

  const lista = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS) || '[]');
  nuevoAmigo.usuario_id = usuario.id;
  nuevoAmigo.id = nuevoAmigo.id || Date.now();
  nuevoAmigo.fecha_agregado = nuevoAmigo.fecha_agregado || new Date().toISOString().split('T')[0];
  lista.push(nuevoAmigo);
  localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(lista));
}

/**
 * Elimina un amigo por ID de usuario amigo
 * @param {number|string} amigoId
 * @returns {Promise<boolean>}
 */
async function eliminarAmigoDatos(amigoId) {
  if (String(amigoId) === '0') return false;

  const lista = JSON.parse(localStorage.getItem(STORAGE_KEYS.FRIENDS) || '[]');
  const amigo = lista.find(item => String(item.id) === String(amigoId));

  if (amigo?.relacion_id) {
    await apiEliminarAmigo(amigo.relacion_id);
  }

  const filtrados = lista.filter(item => String(item.id) !== String(amigoId));
  const eliminado = filtrados.length !== lista.length;

  if (eliminado) {
    localStorage.setItem(STORAGE_KEYS.FRIENDS, JSON.stringify(filtrados));
  }

  return eliminado;
}

/**
 * Crea una meta vía API y guarda campos extra del frontend localmente
 * @param {Object} nuevaMeta
 * @returns {Promise<void>}
 */
async function agregarMetaDatos(nuevaMeta) {
  const usuario = obtenerUsuarioSesion();
  if (!usuario) return;

  const payload = {
    usuario_id: usuario.id,
    nombre: nuevaMeta.nombre,
    monto_objetivo: nuevaMeta.monto_objetivo,
    monto_actual: nuevaMeta.monto_ahorrado || 0,
    fecha_limite: nuevaMeta.fecha_limite
  };

  const respuesta = await apiCrearMeta(payload);
  const overlay = _obtenerOverlayMetas();

  if (respuesta.ok && respuesta.success !== false) {
    nuevaMeta.id = respuesta.meta_id || respuesta.meta?.id || nuevaMeta.id;
    overlay[nuevaMeta.id] = { ...nuevaMeta, monto_ahorrado: nuevaMeta.monto_ahorrado || 0 };
    _guardarOverlayMetas(overlay);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    debugLog('Meta creada via API', nuevaMeta);
    return;
  }

  debugLog('API crear meta falló — guardando localmente', respuesta, 'warn');
  nuevaMeta.id = nuevaMeta.id || Date.now();
  overlay[nuevaMeta.id] = nuevaMeta;
  _guardarOverlayMetas(overlay);

  const metas = await obtenerMetas();
  if (!metas.find(m => String(m.id) === String(nuevaMeta.id))) {
    metas.push(_normalizarMetaApi(nuevaMeta));
    localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(metas));
  }
}

/**
 * Elimina una meta por ID
 * @param {number|string} metaId
 * @returns {Promise<void>}
 */
async function eliminarMetaDatos(metaId) {
  await eliminarMeta(metaId);

  const overlay = _obtenerOverlayMetas();
  delete overlay[metaId];
  _guardarOverlayMetas(overlay);
  localStorage.removeItem(STORAGE_KEYS.GOALS);
}

/**
 * Indica si una meta puede retirarse
 * @param {Object} meta
 * @returns {boolean}
 */
function puedeRetirarseMeta(meta) {
  if (!meta) return false;

  const ahorrado = Number(meta.monto_ahorrado ?? meta.monto_actual) || 0;
  const objetivo = Number(meta.monto_objetivo) || 0;

  if (objetivo > 0 && ahorrado >= objetivo) return true;

  if (meta.fecha_limite) {
    const [year, month, day] = String(meta.fecha_limite).split('-').map(Number);
    if (year && month && day) {
      const limite = new Date(year, month - 1, day);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      limite.setHours(0, 0, 0, 0);
      if (hoy >= limite) return true;
    }
  }

  return false;
}

/**
 * Registra un aporte a una meta vía API
 * @param {number|string} metaId
 * @param {number} monto
 * @returns {Promise<{exito: boolean, mensaje?: string}>}
 */
async function aportarAMeta(metaId, monto) {
  const montoNumerico = Number(monto);
  if (!montoNumerico || montoNumerico <= 0) {
    return { exito: false, mensaje: 'El monto debe ser mayor a 0.' };
  }

  const usuario = await obtenerUsuarioActual();
  if (!usuario) return { exito: false, mensaje: 'Sin sesión activa.' };

  const metas = await obtenerMetas();
  const meta = metas.find(m => String(m.id) === String(metaId));
  if (!meta) return { exito: false, mensaje: 'Meta no encontrada.' };

  const ahorrado = Number(meta.monto_ahorrado ?? meta.monto_actual) || 0;
  const objetivo = Number(meta.monto_objetivo) || 0;
  const restante = Math.max(0, objetivo - ahorrado);

  if (objetivo > 0 && montoNumerico > restante) {
    if (restante === 0) {
      return {
        exito: false,
        mensaje: 'Esta meta ya alcanzó el monto objetivo. Puedes retirar los ahorros.'
      };
    }
    return {
      exito: false,
      mensaje: `Solo puedes aportar hasta $${restante.toLocaleString('es-CO')} COP para alcanzar el objetivo.`
    };
  }

  const resultado = await abonarMeta(metaId, montoNumerico);
  if (resultado) {
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    return { exito: true };
  }

  return { exito: false, mensaje: 'No se pudo registrar el aporte.' };
}

/**
 * Retira el ahorro de una meta cumplida y la elimina
 * @param {number|string} metaId
 * @returns {Promise<{exito: boolean, mensaje?: string, monto?: number}>}
 */
async function retirarDeMeta(metaId) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return { exito: false, mensaje: 'Sin sesión activa.' };

  const metas = await obtenerMetas();
  const meta = metas.find(m => String(m.id) === String(metaId));
  if (!meta) return { exito: false, mensaje: 'Meta no encontrada.' };

  if (!puedeRetirarseMeta(meta)) {
    return {
      exito: false,
      mensaje: 'Esta meta todavía no se puede retirar (no llegó al objetivo ni venció la fecha).'
    };
  }

  const montoRetirar = Number(meta.monto_ahorrado ?? meta.monto_actual) || 0;
  const ok = await eliminarMeta(metaId);

  if (ok) {
    const overlay = _obtenerOverlayMetas();
    delete overlay[metaId];
    _guardarOverlayMetas(overlay);
    localStorage.removeItem(STORAGE_KEYS.GOALS);
    return { exito: true, monto: montoRetirar };
  }

  return { exito: false, mensaje: 'No se pudo retirar la meta.' };
}

/**
 * Inicialización de sesión — redirige a login si no hay usuario
 */
window.nexusReady = (async function inicializarSesion() {
  if (typeof window === 'undefined') return;

  const enPaginaDeAuth = !!document.getElementById('auth-modal');
  if (enPaginaDeAuth) return;

  const usuarioActivo = await obtenerUsuarioActual();
  if (!usuarioActivo) {
    console.warn('⚠️ Sin sesión activa. Redirigiendo a login...');
    window.location.href = 'index.html';
  }
})();
