/**
 * ============================================================
 * MÓDULO: api-client.js  (DESACTIVADO)
 * ============================================================
 * El proyecto ya no usa backend remoto.
 * Todos los datos se leen desde data/*.json a través de datos.js.
 *
 * Este archivo se conserva como stub para que cualquier página
 * cacheada que aún lo referencie no rompa, pero NINGUNA función
 * aquí hace peticiones de red.
 * ============================================================
 */

const _respuestaBackendDeshabilitado = Object.freeze({
  ok: false,
  status: 0,
  success: false,
  error: 'Backend deshabilitado — usar datos.js'
});

function _noop() { return Promise.resolve(_respuestaBackendDeshabilitado); }

const apiRegistroUsuario    = _noop;
const apiLoginUsuario       = _noop;
const apiCrearTransaccion   = _noop;
const apiListarTransacciones = _noop;
const apiEliminarTransaccion = _noop;
const apiGuardarLimite      = _noop;
const apiListarLimites      = _noop;
const apiCrearMeta          = _noop;
const apiListarMetas        = _noop;
const apiAbonarMeta         = _noop;
const apiEliminarMeta       = _noop;
const apiActualizarXP       = _noop;
const apiAgregarAmigo       = _noop;
const apiListarAmigos       = _noop;
const apiEliminarAmigo      = _noop;

function guardarUsuarioSesion(usuario) {
  if (!usuario) return;
  localStorage.setItem('nexus_usuario_actual', JSON.stringify(usuario));
  if (usuario.moneda_preferida) {
    localStorage.setItem('nexus_moneda_preferida', usuario.moneda_preferida);
  }
}

function obtenerUsuarioSesion() {
  const stored = localStorage.getItem('nexus_usuario_actual');
  return stored ? JSON.parse(stored) : null;
}

function limpiarUsuarioSesion() {
  localStorage.removeItem('nexus_usuario_actual');
  localStorage.removeItem('nexus_auth_token');
}

function obtenerMonedaPreferida() {
  return localStorage.getItem('nexus_moneda_preferida') || 'COP';
}
