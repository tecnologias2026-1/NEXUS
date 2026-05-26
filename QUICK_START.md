# 🚀 QUICK START - INTEGRACIÓN API NEXUS

## 1️⃣ VERIFICAR QUE TODO CARGÓ CORRECTAMENTE

**Abrir DevTools:** `F12` en cualquier página de Nexus

**Ejecutar en Console:**
```javascript
// Copiar y pegar TODO esto en la consola
console.log('🔍 Validando integración...');
console.assert(typeof API_BASE_URL === 'string', '❌ API_BASE_URL no definido');
console.assert(typeof apiLoginUsuario === 'function', '❌ api-client.js no cargó');
console.assert(typeof obtenerCategorias === 'function', '❌ datos-api.js no cargó');
console.log('✅ Todo cargó correctamente');
```

**Resultado esperado:** ✅ Sin errores en consola

---

## 2️⃣ PROBAR LOGIN CON API

1. Abre **index.html** en navegador
2. Click en "Crear Cuenta"
3. Completa el formulario (datos ficticios)
4. En DevTools → **Network tab** (antes de hacer click en registrar)
5. Click en "Siguiente" y "Registro"
6. **Verifica en Network tab:**
   - Debe haber petición POST a `usuarios/registro.php` ✅
   - Status: **201** (creado)
   - Verifica response en DevTools

**Espera:** Auto-login y redireccionamiento a dashboard.html ✅

---

## 3️⃣ ENTENDER LA ARQUITECTURA

```
┌─ config.js ────────────────┐
│ • API_BASE_URL             │
│ • Constantes globales      │
│ • Helper functions         │
└────────────────────────────┘
           ↓
┌─ api-client.js ────────────┐
│ • apiLoginUsuario()        │
│ • apiCrearTransaccion()    │
│ • apiCrearMeta()           │
│ • etc... (14 funciones)    │
└────────────────────────────┘
           ↓
┌─ datos-api.js ─────────────┐
│ • obtenerTransacciones()   │
│ • crearTransaccion()       │
│ • obtenerMetas()           │
│ • etc... (25 funciones)    │
└────────────────────────────┘
           ↓
┌─ Módulos (dashboard.js, etc)
│ Usan funciones de datos-api.js
└────────────────────────────
```

---

## 4️⃣ CÓMO LLAMAN LOS MÓDULOS A LA API

### Ejemplo 1: Obtener datos
```javascript
// En dashboard.js
const usuario = obtenerUsuarioSesion(); // Sesión
const transacciones = await obtenerTransacciones(); // API

console.log(usuario.nombre);
console.log(transacciones.length + ' transacciones');
```

### Ejemplo 2: Crear transacción
```javascript
// En transacciones.js
const resultado = await crearTransaccion({
  tipo: 'gasto',
  monto: 50000,
  categoria_id: 1,
  descripcion: 'Almuerzo',
  fecha: '2026-05-26'
});

if (resultado) {
  console.log('✅ Creada');
  actualizar_ui();
}
```

### Ejemplo 3: Crear meta
```javascript
// En Metas.js
const resultado = await crearMeta({
  nombre: 'Viaje',
  monto_objetivo: 1000000,
  monto_actual: 0,
  fecha_limite: '2026-12-31'
});

if (resultado) {
  console.log('✅ Meta creada');
}
```

---

## 5️⃣ PRÓXIMOS PASOS - ACTUALIZAR MÓDULOS

### Por cada módulo que está ⏳ PENDIENTE:

#### PASO 1: Leer la guía
Lee la sección correspondiente en: **GUIA_INTEGRACION_API.js**
- Busca el nombre del módulo (ej: "MODULE: dashboard.js")
- Ve el ejemplo de ANTES → DESPUÉS

#### PASO 2: Identificar cambios
Busca en el módulo actual:
```javascript
// ❌ CAMBIAR ESTO:
await obtenerUsuarioActual()        // datos.js antiguo
await iniciarSesion()              // datos.js antiguo
await registrarUsuario()           // datos.js antiguo

// ✅ POR ESTO:
obtenerUsuarioSesion()             // api-client.js
// (Ya está integrado en auth.js)
```

#### PASO 3: Agregar API calls
Para crear/actualizar:
```javascript
// ✅ Nuevo código:
const resultado = await crear_xxxxx({
  usuario_id: usuario.id,
  // resto de parámetros
});

if (!resultado) {
  console.error('Error');
  return;
}

console.log('✅ Éxito');
```

#### PASO 4: Agregar manejo de errores
```javascript
try {
  const resultado = await operacion();
  // ...
} catch (error) {
  debugLog('Error:', error, 'error');
  mostrar_alerta('Error: ' + error.message);
}
```

#### PASO 5: Probar
- Abre DevTools → Network tab
- Realiza la acción
- Verifica que hay petición a API
- Verifica que status es 200 o 201

---

## 6️⃣ LISTA DE VERIFICACIÓN - CADA MÓDULO

- [ ] Leer guía en GUIA_INTEGRACION_API.js
- [ ] Cambiar imports (✅ ya automático)
- [ ] Reemplazar funciones locales
- [ ] Agregar try/catch
- [ ] Validar usuario: `if (!obtenerUsuarioSesion())`
- [ ] Probar en navegador
- [ ] Verificar Network tab
- [ ] Verificar localStorage
- [ ] Marcar como ✅ COMPLETADO

---

## 7️⃣ MÓDULOS EN ORDEN DE PRIORIDAD

**Prioridad Alta (Afecta a múltiples páginas):**
1. **dashboard.js** - Datos del usuario
2. **transacciones.js** - Crear/listar transacciones

**Prioridad Media:**
3. **limites.js** - Límites de gasto
4. **Metas.js** - Metas de ahorro

**Prioridad Baja:**
5. **social.js** - Red social
6. **lista_amigos.js** - Ranking
7. **analisis.js** - Análisis

---

## 8️⃣ DEBUGGING - COMANDOS ÚTILES

### Ver usuario en sesión:
```javascript
obtenerUsuarioSesion()
// {id: 1, nombre: 'Juan', email: 'juan@...', ...}
```

### Ver URL de API:
```javascript
console.log(API_BASE_URL)
// "http://localhost/nexus_backend_local/api"
```

### Ver todos los datos en localStorage:
```javascript
Object.keys(localStorage).filter(k => k.includes('nexus'))
// ['nexus_usuario_actual', 'nexus_transacciones', ...]
```

### Ver datos de una clave:
```javascript
JSON.parse(localStorage.getItem('nexus_usuario_actual'))
// Mostrará objeto completo del usuario
```

### Habilitar debug mode:
```javascript
// En consola, antes de realizar acciones
localStorage.setItem('DEBUG_MODE', 'true');
// Luego actualizar la página (F5)
// Verás logs detallados de cada petición
```

---

## 9️⃣ PROBLEMAS COMUNES

### ❌ "API_BASE_URL is not defined"
**Causa:** config.js no cargó  
**Solución:** Verificar que config.js es el PRIMER script en HTML

### ❌ "obtenerUsuarioSesion() returns null"
**Causa:** Usuario no ha hecho login  
**Solución:** Hacer login en index.html primero

### ❌ "Peticiones no se envían a la API"
**Causa:** Backend no corre  
**Solución:** 
- Abrir XAMPP
- Iniciar Apache y MySQL
- Verificar que backend existe en: http://localhost/nexus_backend_local

### ❌ "CORS error"
**Causa:** Backend no tiene headers CORS  
**Solución:** Agregar en backend PHP:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

---

## 🔟 VALIDACIÓN FINAL

Después de actualizar todos los módulos:

### ✅ Checklist:
- [ ] Todos los módulos usan `datos-api.js`
- [ ] Ejecutar `VALIDAR_INTEGRACION.js` - Todo ✅
- [ ] Prueba de usuario completo:
  - [ ] Login en index.html
  - [ ] Ver dashboard.html con datos
  - [ ] Crear transacción en transacciones.html
  - [ ] Crear meta en Metas.html
  - [ ] Agregar amigo en Amigos.html
  - [ ] Logout y volver a login
- [ ] Verificar Network tab tiene peticiones a API
- [ ] Verificar localStorage guardó datos

---

## 📚 REFERENCIAS RÁPIDAS

| Documento | Para qué |
|-----------|---------|
| **INTEGRACION_API.md** | Guía general y ejemplos |
| **GUIA_INTEGRACION_API.js** | Detalles técnicos por módulo |
| **VALIDAR_INTEGRACION.js** | Validar que todo cargó |
| **RESUMEN_INTEGRACION.md** | Visión general de qué se hizo |
| **Este archivo** | Quick start rápido |

---

## 🎯 OBJETIVO FINAL

```
┌─────────────────────────────────────┐
│   OBJETIVO COMPLETADO ✅           │
├─────────────────────────────────────┤
│                                     │
│  Frontend ←→ API Backend            │
│                                     │
│  ✅ Login/Registro con API          │
│  ✅ Transacciones con API           │
│  ✅ Metas con API                   │
│  ✅ Límites con API                 │
│  ✅ Amigos con API                  │
│  ✅ XP/Gamificación con API         │
│                                     │
│  → Datos reales del backend         │
│  → Persistencia en BD               │
│  → Multi-usuario funcional          │
│  → Aplicación lista para producción │
│                                     │
└─────────────────────────────────────┘
```

---

**¿Preguntas?** Lee INTEGRACION_API.md o GUIA_INTEGRACION_API.js  
**¿Necesitas validar?** Ejecuta VALIDAR_INTEGRACION.js en DevTools  
**¿Listo para actualizar?** Sigue el paso 5️⃣ para cada módulo

¡Adelante! 🚀
