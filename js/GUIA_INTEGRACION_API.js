/**
 * ============================================================
 * GUÍA DE INTEGRACIÓN API - NEXUS FRONTEND
 * ============================================================
 * 
 * Este documento proporciona instrucciones detalladas para 
 * integrar cada módulo del frontend con los endpoints del backend.
 * 
 * ARQUITECTURA ACTUAL:
 * ✅ config.js       - Constantes globales y URL base
 * ✅ api-client.js   - Cliente API centralizado
 * ✅ datos-api.js    - Capa de datos que usa API + localStorage
 * ✅ auth.js         - Autenticación (LOGIN/REGISTRO) ✅ COMPLETADO
 * 
 * PENDIENTE DE ACTUALIZAR:
 * ⏳ dashboard.js    - Mostrar datos del usuario + balance
 * ⏳ transacciones.js - Crear/listar transacciones
 * ⏳ Metas.js        - Crear/listar/abonar metas
 * ⏳ limites.js      - Configurar límites por categoría
 * ⏳ social.js       - Agregar/eliminar amigos
 * ⏳ lista_amigos.js - Mostrar ranking de amigos
 * 
 * ============================================================
 */

/**
 * PATRONES GENERALES
 * ==================
 * 
 * 1. OBTENER DATOS:
 *    const usuario = obtenerUsuarioSesion();
 *    if (!usuario) { redirigir a login; return; }
 *    
 *    const datos = await obtenerXXX();
 *    if (!datos) { mostrar error; return; }
 * 
 * 2. CREAR/ACTUALIZAR:
 *    const usuario = obtenerUsuarioSesion();
 *    const resultado = await crearXXX({ usuario_id: usuario.id, ...datos });
 *    if (!resultado) { mostrar error; return; }
 *    mostrar confirmación;
 * 
 * 3. ELIMINAR:
 *    const exito = await eliminarXXX(id);
 *    if (!exito) { mostrar error; return; }
 *    actualizar UI;
 * 
 * 4. MANEJO DE ERRORES:
 *    try {
 *      const resultado = await apiLlamada();
 *    } catch (error) {
 *      debugLog('Error en operación', error, 'error');
 *      mostrarToast('Error al procesar tu solicitud', 'error');
 *    }
 */

/**
 * ============================================================
 * MODULE: dashboard.js
 * ============================================================
 * 
 * OBJETIVO:
 * Renderizar el header del usuario, balance, gamificación,
 * fondo de emergencia y métricas clave.
 * 
 * CAMBIOS REQUERIDOS:
 * 
 * 1. EN inicializarDashboard():
 *    - Cambiar de obtenerUsuarioActual() (datos.js) a 
 *      obtenerUsuarioSesion() (api-client.js)
 *    - Cambiar de obtenerTransacciones() local a obtenerTransacciones() (datos-api.js)
 * 
 * 2. EN renderizarHeader():
 *    Usuario ya viene desde sesión con datos de gamificación:
 *    - usuario.nivel
 *    - usuario.xp_actual
 *    - usuario.xp_siguiente_nivel
 *    - usuario.puntos_ranking
 *    - usuario.racha_dias
 * 
 * 3. EN actualizarXP (cuando usuario realiza acciones):
 *    ANTES (con datos.js):
 *    ❌ No había actualización de XP
 *    
 *    AHORA (con api-client.js):
 *    ✅ const resultado = await actualizarXPUsuario(xp_ganada);
 *    ✅ if (resultado.subio_nivel) { mostrar celebración(); }
 * 
 * EJEMPLO DE ACTUALIZACIÓN:
 * 
 * async function inicializarDashboard() {
 *   try {
 *     const usuario = obtenerUsuarioSesion();
 *     if (!usuario) {
 *       window.location.href = 'index.html';
 *       return;
 *     }
 *     
 *     renderizarHeader(usuario);
 *     
 *     const transacciones = await obtenerTransacciones();
 *     const balance = calcularBalance(transacciones);
 *     renderizarBalance(balance);
 *     
 *   } catch (error) {
 *     debugLog('Error inicializando dashboard', error, 'error');
 *   }
 * }
 */

/**
 * ============================================================
 * MODULE: transacciones.js
 * ============================================================
 * 
 * OBJETIVO:
 * Coordinar la creación de transacciones (ingresos/gastos)
 * y mostrar el historial.
 * 
 * CAMBIOS REQUERIDOS:
 * 
 * 1. EN inicializarTransacciones():
 *    ✅ Ya usa obtenerCategorias() que viene de datos-api.js
 *    ✅ Mantener igual
 * 
 * 2. EN guardarTransaccion() [Nueva función o actualizar]:
 *    ANTES:
 *    ❌ const transacciones = await obtenerTransacciones();
 *    ❌ transacciones.push(nuevaTransaccion);
 *    ❌ guardarEnLocalStorage(transacciones);
 *    
 *    AHORA:
 *    ✅ const resultado = await crearTransaccion({
 *         tipo: 'ingreso' | 'gasto',
 *         monto: parseFloat(montoInput.value),
 *         categoria_id: categoriaSelect.value,
 *         descripcion: descripcionInput.value,
 *         fecha: fechaInput.value
 *       });
 *    ✅ if (resultado) { 
 *         mostrarConfirmacion('Transacción registrada');
 *         actualizarHistorial();
 *       }
 * 
 * 3. EN eliminarTransaccion():
 *    ANTES:
 *    ❌ const transacciones = obtenerDelLocalStorage();
 *    ❌ transacciones = transacciones.filter(t => t.id !== id);
 *    ❌ guardarEnLocalStorage(transacciones);
 *    
 *    AHORA:
 *    ✅ const exito = await eliminarTransaccion(id);
 *    ✅ if (exito) { actualizarHistorial(); }
 * 
 * EJEMPLO DE FUNCIÓN ACTUALIZADA:
 * 
 * async function guardarTransaccion(evento) {
 *   evento.preventDefault();
 *   
 *   const usuario = obtenerUsuarioSesion();
 *   if (!usuario) return;
 *   
 *   try {
 *     const resultado = await crearTransaccion({
 *       tipo: document.querySelector('input[name="type"]:checked').value,
 *       monto: parseFloat(document.querySelector('#monto').value),
 *       categoria_id: document.querySelector('#categoria').value,
 *       descripcion: document.querySelector('#descripcion').value,
 *       fecha: document.querySelector('#fecha').value
 *     });
 *     
 *     if (resultado) {
 *       mostrarConfirmacionTransaccion('Transacción registrada exitosamente');
 *       limpiarFormulario();
 *       await actualizarHistorialEnUI();
 *       
 *       // Intentar ganar XP
 *       await actualizarXPUsuario(10);
 *     }
 *   } catch (error) {
 *     mostrarConfirmacionTransaccion('Error al registrar transacción', 'error');
 *     debugLog('Error guardando transacción', error, 'error');
 *   }
 * }
 */

/**
 * ============================================================
 * MODULE: limites.js
 * ============================================================
 * 
 * OBJETIVO:
 * Configurar y mostrar límites de gasto por categoría.
 * 
 * CAMBIOS REQUERIDOS:
 * 
 * 1. EN inicializarLimites():
 *    ANTES:
 *    ❌ const limites = await obtenerLimites(); (datos.js local)
 *    
 *    AHORA:
 *    ✅ const limites = await obtenerLimites(); (datos-api.js con API)
 *    ✅ El resto del código sigue igual, cambio transparente
 * 
 * 2. EN guardarLimite() [Nueva función]:
 *    ✅ const exito = await guardarLimite(categoria_id, monto_limite);
 *    ✅ if (exito) { actualizarLimitesEnUI(); }
 * 
 * EJEMPLO:
 * 
 * async function guardarLimite(evento) {
 *   evento.preventDefault();
 *   
 *   const categoriaId = document.querySelector('#categoria').value;
 *   const monto = parseFloat(document.querySelector('#monto').value);
 *   
 *   const exito = await guardarLimite(categoriaId, monto);
 *   
 *   if (exito) {
 *     mostrarToast('Límite actualizado exitosamente');
 *     await inicializarLimites();
 *   } else {
 *     mostrarToast('Error al guardar límite', 'error');
 *   }
 * }
 */

/**
 * ============================================================
 * MODULE: Metas.js
 * ============================================================
 * 
 * OBJETIVO:
 * Crear, listar, abonar y eliminar metas de ahorro.
 * 
 * CAMBIOS REQUERIDOS:
 * 
 * 1. EN inicializarMetasPersonales():
 *    ANTES:
 *    ❌ const metas = await obtenerMetas(); (datos.js local)
 *    
 *    AHORA:
 *    ✅ const metas = await obtenerMetas(); (datos-api.js con API)
 *    ✅ renderizar lista igual
 * 
 * 2. EN crearMeta():
 *    ANTES:
 *    ❌ Se agregaba localmente al JSON
 *    
 *    AHORA:
 *    ✅ const resultado = await crearMeta({
 *         nombre: inputNombre.value,
 *         monto_objetivo: parseFloat(inputObjetivo.value),
 *         monto_actual: 0,
 *         fecha_limite: inputFecha.value
 *       });
 *    ✅ if (resultado) { actualizarMetasEnUI(); }
 * 
 * 3. EN abonarMeta():
 *    ANTES:
 *    ❌ Se actualizaba localmente el monto_ahorrado
 *    
 *    AHORA:
 *    ✅ const resultado = await abonarMeta(meta_id, monto_abono);
 *    ✅ if (resultado.completada) { mostrarCelebracion(); }
 * 
 * 4. EN eliminarMeta():
 *    ✅ const exito = await eliminarMeta(id);
 *    ✅ if (exito) { actualizarMetasEnUI(); }
 * 
 * EJEMPLO COMPLETO:
 * 
 * async function crearMetaDesdeFormulario(evento) {
 *   evento.preventDefault();
 *   
 *   const usuario = obtenerUsuarioSesion();
 *   if (!usuario) return;
 *   
 *   try {
 *     const resultado = await crearMeta({
 *       nombre: document.querySelector('#meta-nombre').value,
 *       monto_objetivo: parseFloat(document.querySelector('#meta-objetivo').value),
 *       monto_actual: 0,
 *       fecha_limite: document.querySelector('#meta-fecha').value
 *     });
 *     
 *     if (resultado) {
 *       mostrarToast('Meta creada exitosamente');
 *       cerrarModal();
 *       await inicializarMetasPersonales();
 *       await actualizarXPUsuario(20); // Ganar XP por crear meta
 *     }
 *   } catch (error) {
 *     mostrarToast('Error al crear meta', 'error');
 *     debugLog('Error en crearMeta', error, 'error');
 *   }
 * }
 * 
 * async function abonarMetaDesdeUI(metaId, monto) {
 *   try {
 *     const resultado = await abonarMeta(metaId, monto);
 *     
 *     if (resultado) {
 *       mostrarToast('Abono registrado');
 *       
 *       if (resultado.completada) {
 *         mostrarCelebracion('¡Meta completada!');
 *         await actualizarXPUsuario(50); // Bonus XP por completar meta
 *       }
 *       
 *       await inicializarMetasPersonales();
 *     }
 *   } catch (error) {
 *     mostrarToast('Error al abonar meta', 'error');
 *   }
 * }
 */

/**
 * ============================================================
 * MODULE: social.js y lista_amigos.js
 * ============================================================
 * 
 * OBJETIVO:
 * Agregar/eliminar amigos y mostrar ranking.
 * 
 * CAMBIOS REQUERIDOS:
 * 
 * 1. EN agregarAmigo():
 *    ANTES:
 *    ❌ Operación local en amigos.json
 *    
 *    AHORA:
 *    ✅ const exito = await agregarAmigo(amigo_id);
 *    ✅ if (exito) { actualizarListaAmigos(); }
 * 
 * 2. EN eliminarAmigo():
 *    ✅ const exito = await eliminarAmigo(id_relacion);
 *    ✅ if (exito) { actualizarListaAmigos(); }
 * 
 * 3. EN inicializarListaAmigos():
 *    ✅ const amigos = await obtenerAmigos(); (datos-api.js)
 *    ✅ Renderizar con datos reales del backend
 * 
 * EJEMPLO:
 * 
 * async function agregarAmigoDesdeUI(amigoId) {
 *   try {
 *     const exito = await agregarAmigo(amigoId);
 *     
 *     if (exito) {
 *       mostrarToast('Amigo agregado exitosamente');
 *       await inicializarListaAmigos();
 *       await actualizarXPUsuario(5); // Bonus XP
 *     }
 *   } catch (error) {
 *     mostrarToast('Error al agregar amigo', 'error');
 *   }
 * }
 * 
 * async function eliminarAmigoDesdeUI(amigoId) {
 *   if (!confirm('¿Desvincularte de este amigo?')) return;
 *   
 *   try {
 *     const exito = await eliminarAmigo(amigoId);
 *     
 *     if (exito) {
 *       mostrarToast('Amigo eliminado');
 *       await inicializarListaAmigos();
 *     }
 *   } catch (error) {
 *     mostrarToast('Error al eliminar amigo', 'error');
 *   }
 * }
 */

/**
 * ============================================================
 * TESTING DE LA INTEGRACIÓN
 * ============================================================
 * 
 * 1. VERIFICAR EN BROWSER CONSOLE:
 *    • API_BASE_URL debe existir y ser: 
 *      "http://localhost/nexus_backend_local/api"
 *    • debugLog() debe mostrar los logs de cada operación
 *    • obtenerUsuarioSesion() debe devolver datos del usuario
 * 
 * 2. PROBAR FLUJO DE AUTENTICACIÓN:
 *    • Ir a index.html
 *    • Hacer click en "Crear Cuenta"
 *    • Completar registro → Debe hacer POST a /api/usuarios/registro.php
 *    • Auto-login → Debe hacer POST a /api/usuarios/login.php
 *    • Redirigir a dashboard.html
 * 
 * 3. PROBAR TRANSACCIONES:
 *    • En dashboard o transacciones.html, crear una transacción
 *    • Debe hacer POST a /api/transacciones/crear.php
 *    • Debe actualizar localStorage
 *    • Debe mostrar confirmación visual
 * 
 * 4. VERIFICAR ERRORS:
 *    • Abrir Developer Tools → Network tab
 *    • Todas las peticiones deben ir a http://localhost/nexus_backend_local/api/*
 *    • Status codes esperados: 200, 201 para éxito; 400, 401 para errores
 * 
 * 5. CACHE LOCAL:
 *    • Abrir DevTools → Application → LocalStorage
 *    • Debe haber entradas con clave "nexus_*"
 *    • Incluye: usuario_actual, transacciones, metas, etc.
 */

/**
 * ============================================================
 * SOLUCIÓN DE PROBLEMAS
 * ============================================================
 * 
 * P: "Error: API_BASE_URL is not defined"
 * R: config.js no se está cargando. Verifica el orden de 
 *    <script> tags en el HTML. config.js DEBE ser el primero.
 * 
 * P: "obtenerUsuarioSesion() returns null"
 * R: El usuario no ha iniciado sesión. Asegúrate de que:
 *    1. El login fue exitoso (revisa Network tab)
 *    2. El backend devolvió usuario en la respuesta
 *    3. guardarUsuarioSesion() fue llamado
 * 
 * P: "Peticiones a la API no se envían"
 * R: Verifica en DevTools → Network:
 *    1. Las URLs están correctas (http://localhost/nexus_backend_local/api/...)
 *    2. Headers incluyen 'Content-Type: application/json'
 *    3. El backend está corriendo en XAMPP
 * 
 * P: "CORS error from backend"
 * R: El backend PHP debe incluir headers CORS:
 *    header('Access-Control-Allow-Origin: *');
 *    header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
 *    header('Access-Control-Allow-Headers: Content-Type');
 * 
 * P: "Datos no se guardan en localStorage"
 * R: Verifica que:
 *    1. localStorage no esté deshabilitado en el navegador
 *    2. STORAGE_KEYS.* están definidas en config.js
 *    3. Los datos tienen tamaño < 5MB
 */
