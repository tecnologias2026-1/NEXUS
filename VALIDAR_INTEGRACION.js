/**
 * ============================================================
 * VALIDACIÓN DE INTEGRACIÓN API
 * ============================================================
 * 
 * Ejecutar esto en DevTools Console para validar que la
 * integración está correctamente configurada.
 * 
 * Copiar y pegar TODO el contenido en DevTools → Console
 * ============================================================
 */

console.log('🔍 Iniciando validación de integración API...\n');

// 1. Validar que config.js cargó
console.log('1️⃣ Validando config.js...');
try {
  console.assert(typeof API_BASE_URL === 'string', 'API_BASE_URL no está definido');
  console.assert(API_BASE_URL === 'http://localhost/nexus_backend_local/api', 'URL incorrecta');
  console.assert(API_TIMEOUT > 0, 'API_TIMEOUT debe ser > 0');
  console.assert(typeof DEBUG_MODE === 'boolean', 'DEBUG_MODE no está definido');
  console.log('   ✅ config.js cargado correctamente\n');
} catch (e) {
  console.error('   ❌ Error en config.js:', e.message, '\n');
}

// 2. Validar que api-client.js cargó
console.log('2️⃣ Validando api-client.js...');
try {
  console.assert(typeof apiLoginUsuario === 'function', 'apiLoginUsuario no existe');
  console.assert(typeof apiRegistroUsuario === 'function', 'apiRegistroUsuario no existe');
  console.assert(typeof apiCrearTransaccion === 'function', 'apiCrearTransaccion no existe');
  console.assert(typeof apiListarTransacciones === 'function', 'apiListarTransacciones no existe');
  console.assert(typeof apiCrearMeta === 'function', 'apiCrearMeta no existe');
  console.assert(typeof guardarUsuarioSesion === 'function', 'guardarUsuarioSesion no existe');
  console.assert(typeof obtenerUsuarioSesion === 'function', 'obtenerUsuarioSesion no existe');
  console.log('   ✅ api-client.js cargado correctamente\n');
} catch (e) {
  console.error('   ❌ Error en api-client.js:', e.message, '\n');
}

// 3. Validar que datos-api.js cargó
console.log('3️⃣ Validando datos-api.js...');
try {
  console.assert(typeof obtenerCategorias === 'function', 'obtenerCategorias no existe');
  console.assert(typeof obtenerTransacciones === 'function', 'obtenerTransacciones no existe');
  console.assert(typeof crearTransaccion === 'function', 'crearTransaccion no existe');
  console.assert(typeof obtenerMetas === 'function', 'obtenerMetas no existe');
  console.assert(typeof crearMeta === 'function', 'crearMeta no existe');
  console.assert(typeof abonarMeta === 'function', 'abonarMeta no existe');
  console.assert(typeof obtenerAmigos === 'function', 'obtenerAmigos no existe');
  console.log('   ✅ datos-api.js cargado correctamente\n');
} catch (e) {
  console.error('   ❌ Error en datos-api.js:', e.message, '\n');
}

// 4. Validar STORAGE_KEYS
console.log('4️⃣ Validando STORAGE_KEYS...');
try {
  console.assert(typeof STORAGE_KEYS === 'object', 'STORAGE_KEYS no está definido');
  console.assert(STORAGE_KEYS.USER, 'STORAGE_KEYS.USER no existe');
  console.assert(STORAGE_KEYS.TOKEN, 'STORAGE_KEYS.TOKEN no existe');
  console.assert(STORAGE_KEYS.TRANSACTIONS, 'STORAGE_KEYS.TRANSACTIONS no existe');
  console.log('   ✅ STORAGE_KEYS definidas correctamente\n');
} catch (e) {
  console.error('   ❌ Error con STORAGE_KEYS:', e.message, '\n');
}

// 5. Verificar si hay usuario en sesión
console.log('5️⃣ Verificando sesión de usuario...');
const usuario = obtenerUsuarioSesion();
if (usuario) {
  console.log('   ✅ Usuario en sesión:');
  console.log('      • ID:', usuario.id);
  console.log('      • Nombre:', usuario.nombre);
  console.log('      • Email:', usuario.email);
  if (usuario.nivel) console.log('      • Nivel:', usuario.nivel);
  if (usuario.xp_actual) console.log('      • XP:', usuario.xp_actual);
} else {
  console.log('   ℹ️  No hay usuario en sesión (esperado en index.html)\n');
}

// 6. Test de petición a API
console.log('\n6️⃣ Probando conexión a la API...');
console.log('   Enviando petición de prueba a:', API_BASE_URL + '/usuarios/login.php');
fetch(`${API_BASE_URL}/usuarios/login.php`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'test@test.com', password: 'test' })
})
.then(r => r.json())
.then(data => {
  console.log('   ✅ API responde correctamente');
  console.log('   Respuesta de prueba:', data);
})
.catch(e => {
  console.error('   ❌ Error conectando a la API:', e.message);
  console.error('   Verifica que:');
  console.error('      1. XAMPP está corriendo');
  console.error('      2. El backend existe en http://localhost/nexus_backend_local/api');
  console.error('      3. Los headers CORS están configurados en el backend');
});

// 7. Información de localStorage
console.log('\n7️⃣ Estado de localStorage:');
const keys = Object.keys(localStorage).filter(k => k.includes('nexus'));
if (keys.length > 0) {
  console.log('   Claves guardadas:');
  keys.forEach(k => {
    const size = new Blob([localStorage.getItem(k)]).size;
    console.log(`   • ${k} (${size} bytes)`);
  });
} else {
  console.log('   ℹ️  Sin datos en localStorage (esperado en página de login)');
}

console.log('\n✅ Validación completada');
console.log('\n📚 Próximos pasos:');
console.log('   1. Si todo está ✅, la integración está lista');
console.log('   2. Si hay ❌, revisa los errores arriba');
console.log('   3. Lee INTEGRACION_API.md para más detalles');
console.log('   4. Revisa GUIA_INTEGRACION_API.js para ejemplos de uso');
