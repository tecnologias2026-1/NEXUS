/**
 * ============================================================
 * MÓDULO: datos.js
 * ============================================================
 * Responsabilidad: Punto central de carga y acceso a datos
 *
 * Este módulo se encarga de:
 * - Cargar los archivos JSON de data/ una sola vez (con cache)
 * - Persistir los datos en localStorage para que las modificaciones
 *   del usuario sobrevivan a recargas
 * - Exponer funciones helper que cualquier módulo puede usar
 *   para obtener categorías, usuarios, transacciones, etc.
 *
 * IMPORTANTE: Debe cargarse ANTES que cualquier módulo de datos.
 * El día que el back exista, este es el único archivo que cambia
 * (fetch a /api/... en vez de a /data/*.json).
 * ============================================================
 */

/**
 * Cache en memoria de los datos ya cargados.
 * Cada clave corresponde a un archivo JSON.
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
 * Carga un archivo JSON desde data/, con cache en memoria y
 * persistencia en localStorage para sobrevivir a recargas.
 *
 * Flujo:
 * 1. Si está en _cacheDatos → devuelve esa copia
 * 2. Si está en localStorage → lo hidrata al cache y devuelve
 * 3. Si no → fetch del archivo JSON, guarda en localStorage y cache
 *
 * @param {string} nombre - Nombre del recurso (ej: "categorias", "amigos")
 * @returns {Promise<Object>} Objeto JSON completo del archivo
 */
async function _cargarRecurso(nombre) {
  // 1. Cache en memoria (más rápido)
  if (_cacheDatos[nombre] !== null) {
    return _cacheDatos[nombre];
  }

  // 2. Cache en localStorage
  const guardado = localStorage.getItem(`nexus_${nombre}`);
  if (guardado) {
    try {
      _cacheDatos[nombre] = JSON.parse(guardado);
      return _cacheDatos[nombre];
    } catch (error) {
      console.warn(`⚠️ Cache corrupto para ${nombre}, recargando del JSON`);
    }
  }

  // 3. Fetch del archivo JSON original
  try {
    const respuesta = await fetch(`data/${nombre}.json`);
    if (!respuesta.ok) {
      throw new Error(`HTTP ${respuesta.status} cargando ${nombre}.json`);
    }
    const datos = await respuesta.json();
    _cacheDatos[nombre] = datos;
    localStorage.setItem(`nexus_${nombre}`, JSON.stringify(datos));
    return datos;
  } catch (error) {
    console.error(`❌ Error cargando ${nombre}.json:`, error);
    return null;
  }
}

/**
 * Persiste un recurso actualizado en localStorage y cache.
 * Llamar después de modificar datos (agregar amigo, transacción, etc.)
 *
 * @param {string} nombre - Nombre del recurso
 * @param {Object} datos - Datos actualizados a guardar
 * @returns {void}
 */
function _guardarRecurso(nombre, datos) {
  _cacheDatos[nombre] = datos;
  localStorage.setItem(`nexus_${nombre}`, JSON.stringify(datos));
}


/* ============================================================
   CATEGORÍAS
   ============================================================ */

/**
 * Devuelve todas las categorías (gastos e ingresos)
 * @returns {Promise<Array>}
 */
async function obtenerCategorias() {
  const datos = await _cargarRecurso('categorias');
  return datos?.categorias || [];
}

/**
 * Devuelve una categoría por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
async function obtenerCategoria(id) {
  const categorias = await obtenerCategorias();
  return categorias.find(c => c.id === id) || null;
}


/* ============================================================
   USUARIOS Y SESIÓN
   ============================================================ */

/**
 * Devuelve todos los usuarios registrados (para login)
 * @returns {Promise<Array>}
 */
async function obtenerUsuarios() {
  const datos = await _cargarRecurso('usuarios');
  return datos?.usuarios || [];
}

/**
 * Devuelve el usuario actualmente logueado, o null si no hay sesión
 * @returns {Promise<Object|null>}
 */
async function obtenerUsuarioActual() {
  const datos = await _cargarRecurso('usuarios');
  const idSesion = datos?.sesion_actual?.usuario_id;
  if (!idSesion) return null;
  return datos.usuarios.find(u => u.id === idSesion) || null;
}

/**
 * Inicia sesión: valida email + password y guarda usuario_id en sesión
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object|null>} Usuario logueado o null si credenciales inválidas
 */
async function iniciarSesion(email, password) {
  const datos = await _cargarRecurso('usuarios');
  if (!datos) return null;

  const usuario = datos.usuarios.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );

  if (!usuario) return null;

  datos.sesion_actual = { usuario_id: usuario.id };
  _guardarRecurso('usuarios', datos);
  return usuario;
}

/**
 * Cierra la sesión actual
 * @returns {Promise<void>}
 */
async function cerrarSesion() {
  const datos = await _cargarRecurso('usuarios');
  if (!datos) return;
  datos.sesion_actual = { usuario_id: null };
  _guardarRecurso('usuarios', datos);
}

/**
 * Registra un usuario nuevo (sin loguearlo automáticamente)
 * @param {Object} nuevoUsuario - { nombre, email, password, ingreso_base, frecuencia_ingreso }
 * @returns {Promise<Object|null>} Usuario creado o null si el email ya existe
 */
async function registrarUsuario(nuevoUsuario) {
  const datos = await _cargarRecurso('usuarios');
  if (!datos) return null;

  // Evitar emails duplicados
  if (datos.usuarios.some(u => u.email.toLowerCase() === nuevoUsuario.email.toLowerCase())) {
    return null;
  }

  const usuarioCompleto = {
    id: Date.now(),
    nombre: nuevoUsuario.nombre,
    email: nuevoUsuario.email,
    password: nuevoUsuario.password,
    fecha_registro: new Date().toISOString().split('T')[0],
    frecuencia_ingreso: nuevoUsuario.frecuencia_ingreso || 'mensual',
    ingreso_base: nuevoUsuario.ingreso_base || 0,
    moneda_preferida: 'COP',
    gamificacion: {
      nivel: 1,
      xp_actual: 0,
      xp_siguiente_nivel: 100,
      racha_dias: 0,
      puntos_ranking: 0
    }
  };

  datos.usuarios.push(usuarioCompleto);
  _guardarRecurso('usuarios', datos);
  return usuarioCompleto;
}


/* ============================================================
   TRANSACCIONES (con enriquecimiento de categoría)
   ============================================================ */

/**
 * Devuelve todas las transacciones del usuario actual,
 * cada una enriquecida con su objeto categoría completo.
 *
 * @returns {Promise<Array>} Transacciones con campo .categoria como objeto
 */
async function obtenerTransacciones() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const datos = await _cargarRecurso('transacciones');
  const categorias = await obtenerCategorias();

  const transacciones = (datos?.transacciones || [])
    .filter(t => t.usuario_id === usuario.id);

  // Enriquecer cada transacción con su categoría completa
  return transacciones.map(t => ({
    ...t,
    categoria: categorias.find(c => c.id === t.categoria_id) || null
  }));
}

/**
 * Agrega una transacción nueva al storage
 * @param {Object} nuevaTransaccion - Debe incluir categoria_id, no categoria
 * @returns {Promise<void>}
 */
async function agregarTransaccionDatos(nuevaTransaccion) {
  const datos = await _cargarRecurso('transacciones');
  if (!datos) return;

  datos.transacciones.push(nuevaTransaccion);
  _guardarRecurso('transacciones', datos);
}


/* ============================================================
   AMIGOS (con "Yo" insertado desde usuarios.json)
   ============================================================ */

/**
 * Devuelve los amigos del usuario actual MÁS el usuario mismo
 * en formato de amigo (para que aparezca en el ranking).
 *
 * @returns {Promise<Array>}
 */
async function obtenerAmigosConYo() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const datos = await _cargarRecurso('amigos');
  const amigosOriginales = (datos?.amigos || [])
    .filter(a => a.usuario_id === usuario.id)
    .map(a => ({ ...a, esUsuarioActual: false }));

  // Insertar el usuario actual como un "amigo" más
  const yo = {
    id: 0,
    nombre: 'Yo',
    nivel: usuario.gamificacion.nivel,
    racha: usuario.gamificacion.racha_dias,
    puntos: usuario.gamificacion.puntos_ranking,
    tendencia: 'up',
    esUsuarioActual: true
  };

  return [...amigosOriginales, yo];
}

/**
 * Devuelve solo los amigos (sin "Yo"), para operaciones internas
 * @returns {Promise<Array>}
 */
async function obtenerAmigos() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const datos = await _cargarRecurso('amigos');
  return (datos?.amigos || []).filter(a => a.usuario_id === usuario.id);
}

/**
 * Devuelve la lista de contactos sugeridos para agregar
 * @returns {Promise<Array>}
 */
async function obtenerContactosSugeridos() {
  const datos = await _cargarRecurso('amigos');
  return datos?.contactos_sugeridos || [];
}

/**
 * Agrega un amigo nuevo al storage
 * @param {Object} nuevoAmigo
 * @returns {Promise<void>}
 */
async function agregarAmigoDatos(nuevoAmigo) {
  const datos = await _cargarRecurso('amigos');
  if (!datos) return;

  datos.amigos.push(nuevoAmigo);
  _guardarRecurso('amigos', datos);
}


/* ============================================================
   LÍMITES Y METAS (lectura por ahora; escritura cuando se implementen)
   ============================================================ */

/**
 * Devuelve los límites mensuales del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerLimites() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const datos = await _cargarRecurso('limites');
  return (datos?.limites || []).filter(l => l.usuario_id === usuario.id);
}

/**
 * Devuelve las metas del usuario actual
 * @returns {Promise<Array>}
 */
async function obtenerMetas() {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) return [];

  const datos = await _cargarRecurso('metas');
  return (datos?.metas || []).filter(m => m.usuario_id === usuario.id);
}


/* ============================================================
   UTILIDADES DE DESARROLLO
   ============================================================ */

/**
 * Limpia todo el cache (localStorage + memoria) y fuerza recarga
 * desde los JSON originales. Útil cuando los JSON se modifican
 * manualmente en disco y queremos ver los cambios.
 *
 * Llamar desde la consola: nexusResetDatos()
 */
function resetearDatos() {
  ['categorias', 'usuarios', 'transacciones', 'limites', 'metas', 'amigos'].forEach(nombre => {
    localStorage.removeItem(`nexus_${nombre}`);
    _cacheDatos[nombre] = null;
  });
  // Limpiar también las claves viejas que pudieran haber quedado
  localStorage.removeItem('transacciones');
  localStorage.removeItem('amigos');
  console.log('✅ Cache reseteado. Recarga la página.');
}

// Exponer en window para uso desde consola del navegador
if (typeof window !== 'undefined') {
  window.nexusResetDatos = resetearDatos;
}


/* ============================================================
   INICIALIZACIÓN DE SESIÓN
   ============================================================
   En páginas internas (dashboard, transacciones, amigos, etc.)
   se necesita un usuario activo para cargar datos. Si no hay sesión
   activa y NO estamos en la página de auth (index.html), se hace
   auto-login como David — fallback de demo para no romper el flujo
   si el usuario abre directamente una página interior.

   En la página de auth (donde existe #auth-modal), NO se auto-loguea,
   para que el formulario de login funcione normalmente.

   Las páginas deben hacer `await window.nexusReady` antes de pedir
   datos, para asegurar que la sesión ya fue inicializada.
*/
window.nexusReady = (async function inicializarSesion() {
  if (typeof window === 'undefined') return;

  // Si estamos en la página de auth (tiene #auth-modal), no auto-login
  const enPaginaDeAuth = !!document.getElementById('auth-modal');
  if (enPaginaDeAuth) return;

  const usuarioActivo = await obtenerUsuarioActual();
  if (!usuarioActivo) {
    const usuario = await iniciarSesion('david@nexus.app', 'demo123');
    if (usuario) {
      console.log(`🔐 Fallback demo: sesión iniciada como ${usuario.nombre}`);
    } else {
      console.warn('⚠️ No se pudo iniciar sesión. Redirigiendo a index...');
      window.location.href = 'index.html';
    }
  }
})();
