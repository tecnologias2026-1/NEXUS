# INTEGRACIÓN API BACKEND - NEXUS FRONTEND

## 🚀 Estado de Integración

### ✅ COMPLETADO
- **config.js** - Configuración centralizada de la API
- **api-client.js** - Cliente HTTP para todos los endpoints
- **datos-api.js** - Capa de datos integrada con backend
- **auth.js** - Autenticación (Login/Registro) funcionando con API
- **index.html** - Scripts cargados en orden correcto
- **dashboard.html** - Scripts actualizados
- **transacciones.html** - Scripts actualizados
- **Metas.html** - Scripts actualizados
- **analisis.html** - Scripts actualizados
- **Amigos.html** - Scripts actualizados

### ⏳ PENDIENTE (Módulos de negocio)
Estos módulos necesitan ser actualizados para usar las funciones de `datos-api.js`:

1. **dashboard.js** - Mostrar datos del usuario
2. **transacciones.js** - Crear/listar transacciones
3. **Metas.js** - Crear/listar/abonar metas
4. **limites.js** - Configurar límites
5. **social.js** - Agregar/eliminar amigos
6. **lista_amigos.js** - Mostrar ranking
7. **analisis.js** - Mostrar análisis financieros

## 📋 ESTRUCTURA DE ARCHIVOS CREADOS

```
js/
├── config.js              ✅ URL base, constantes, helpers
├── api-client.js          ✅ Funciones wrapper de endpoints
├── datos-api.js           ✅ Capa de datos con API
├── auth.js                ✅ Actualizado para usar API
├── GUIA_INTEGRACION_API.js  📖 Documentación detallada
└── (otros módulos)        ⏳ Pendiente de actualización
```

## 🔧 CÓMO USAR LOS NUEVOS MÓDULOS

### 1. Obtener Usuario Actual
```javascript
const usuario = obtenerUsuarioSesion();
if (!usuario) {
  // Redirigir a login
  window.location.href = 'index.html';
  return;
}
console.log(usuario.nombre, usuario.id);
```

### 2. Crear una Transacción
```javascript
const resultado = await crearTransaccion({
  tipo: 'gasto',
  monto: 50000,
  categoria_id: 1,
  descripcion: 'Almuerzo',
  fecha: '2026-05-26'
});

if (resultado) {
  console.log('✅ Transacción creada');
  actualizarUI();
} else {
  console.error('❌ Error al crear transacción');
}
```

### 3. Obtener Transacciones del Usuario
```javascript
const transacciones = await obtenerTransacciones();
transacciones.forEach(t => {
  console.log(`${t.descripcion}: $${t.monto}`);
});
```

### 4. Crear una Meta de Ahorro
```javascript
const resultado = await crearMeta({
  nombre: 'Viaje a Cartagena',
  monto_objetivo: 1000000,
  monto_actual: 0,
  fecha_limite: '2026-12-31'
});

if (resultado) {
  console.log('✅ Meta creada');
}
```

### 5. Abonar a una Meta
```javascript
const resultado = await abonarMeta(meta_id, 100000);

if (resultado) {
  console.log('Meta actualizada');
  if (resultado.completada) {
    console.log('🎉 ¡Meta completada!');
  }
}
```

### 6. Actualizar XP del Usuario
```javascript
const gamificacion = await actualizarXPUsuario(50);

if (gamificacion) {
  console.log(`Nivel: ${gamificacion.nivel}`);
  console.log(`XP: ${gamificacion.xp_actual}/${gamificacion.xp_siguiente_nivel}`);
}
```

### 7. Agregar un Amigo
```javascript
const exito = await agregarAmigo(amigo_id);

if (exito) {
  console.log('✅ Amigo agregado');
  actualizarListaAmigos();
}
```

## ⚙️ CONFIGURACIÓN INICIAL

### 1. Verificar que XAMPP está corriendo
```bash
# En Windows, abrir XAMPP Control Panel
# ✅ Apache debe estar corriendo (puerto 80)
# ✅ MySQL debe estar corriendo (puerto 3306)
```

### 2. Verificar que el Backend existe
La aplicación espera encontrar el backend en:
```
http://localhost/nexus_backend_local/api
```

Los endpoints esperados son:
- `POST /usuarios/registro.php`
- `POST /usuarios/login.php`
- `POST /transacciones/crear.php`
- `GET /transacciones/listar.php?usuario_id=X`
- `DELETE /transacciones/eliminar.php?id=X`
- Y muchos más... (ver GUIA_INTEGRACION_API.js)

### 3. Habilitar CORS en el Backend (si es necesario)
En el archivo principal del backend PHP, agregar:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS, PUT');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## 🧪 TESTING RÁPIDO

### Test 1: Verificar que config cargó
```javascript
// En DevTools Console:
console.log(API_BASE_URL);
// Debe mostrar: "http://localhost/nexus_backend_local/api"
```

### Test 2: Hacer una petición de prueba
```javascript
// En DevTools Console:
await apiListarTransacciones(1);
// Debe aparecer una petición en Network tab
```

### Test 3: Verificar localStorage
```javascript
// En DevTools → Application → Local Storage
// Debe haber entradas como:
// - nexus_usuario_actual: {...}
// - nexus_moneda_preferida: "COP"
```

## 📝 PASOS PARA ACTUALIZAR CADA MÓDULO

### Ejemplo: Actualizar dashboard.js

**ANTES:**
```javascript
async function inicializarDashboard() {
  const usuario = await obtenerUsuarioActual(); // ❌ Desde datos.js local
  const transacciones = await obtenerTransacciones(); // ❌ Desde JSON local
  // ...
}
```

**DESPUÉS:**
```javascript
async function inicializarDashboard() {
  const usuario = obtenerUsuarioSesion(); // ✅ Desde sesión
  if (!usuario) {
    window.location.href = 'index.html';
    return;
  }
  
  const transacciones = await obtenerTransacciones(); // ✅ Desde API
  if (!transacciones) {
    console.error('Error cargando transacciones');
    return;
  }
  // ...
}
```

### Cosas que cambiar en CADA módulo:

1. **Reemplazar estas funciones:**
   - ❌ `obtenerUsuarioActual()` → ✅ `obtenerUsuarioSesion()`
   - ❌ `iniciarSesion()` → ✅ Usar `apiLoginUsuario()` (ya hecho en auth.js)
   - ❌ `registrarUsuario()` → ✅ Usar `apiRegistroUsuario()` (ya hecho en auth.js)

2. **Mantener igual (cambio transparente):**
   - ✅ `obtenerCategorias()` (ahora desde `datos-api.js`)
   - ✅ `obtenerTransacciones()` (ahora desde `datos-api.js`)
   - ✅ `obtenerMetas()` (ahora desde `datos-api.js`)
   - ✅ `obtenerLimites()` (ahora desde `datos-api.js`)

3. **Agregar validaciones:**
   - ✅ Validar que usuario existe antes de usarlo
   - ✅ Agregar try/catch en llamadas async
   - ✅ Mostrar toast/alerta con errores del servidor

## 🐛 DEBUGGING

### Ver todos los logs de API
```javascript
// En DevTools Console:
localStorage.setItem('nexus_debug', 'true');
// Luego recargar la página
// Ahora verás logs detallados de cada petición
```

### Ver respuestas de la API
```javascript
// En DevTools → Network tab
// Filtrar por "nexus_backend_local"
// Click en cada petición para ver:
// - Headers enviados
// - Request Body
// - Response completa
```

### Verificar que los datos se guardan localmente
```javascript
// En DevTools → Application → Local Storage
// Buscar claves que empiezan con "nexus_"
// Cada transacción/meta debe estar guardada localmente
```

## 📚 DOCUMENTACIÓN ADICIONAL

- **GUIA_INTEGRACION_API.js** - Documentación técnica detallada
- **MAPA_ENDPOINTS.md** - Especificaciones de todos los endpoints

## ❓ PREGUNTAS FRECUENTES

### P: ¿Por qué necesito config.js, api-client.js y datos-api.js?

R: Arquitectura por capas:
- **config.js** = Configuración centralizada (URL base, constantes)
- **api-client.js** = Comunicación HTTP (bajo nivel, peticiones)
- **datos-api.js** = Lógica de datos (alto nivel, negocio)
- **dashboard.js, etc** = UI y presentación (más alto nivel)

Esto hace el código:
- ✅ Escalable (cambiar URL solo en un lugar)
- ✅ Mantenible (lógica clara y separada)
- ✅ Testeable (cada capa independiente)
- ✅ Reutilizable (evita duplicar código)

### P: ¿Qué pasa si el usuario no está logueado?

R: Usa `obtenerUsuarioSesion()` que devuelve `null` si no hay sesión:
```javascript
const usuario = obtenerUsuarioSesion();
if (!usuario) {
  // Redirigir a login
  window.location.href = 'index.html';
  return;
}
```

### P: ¿Cómo manejo errores de la API?

R: Siempre verifica la respuesta:
```javascript
try {
  const resultado = await crearTransaccion({...});
  
  if (!resultado) {
    console.error('Error desconocido');
    return;
  }
  
  if (resultado.error) {
    console.error('Error del servidor:', resultado.error);
    return;
  }
  
  // Éxito
  console.log('✅ Operación completada');
} catch (error) {
  console.error('Error de conexión:', error);
}
```

### P: ¿Cómo sé que la API está funcionando?

R: Verifica en DevTools → Network:
1. Haz una acción (crear transacción, meta, etc.)
2. En Network tab, busca peticiones a "nexus_backend_local"
3. Debe haber al menos una petición
4. Status debe ser 200 o 201 (éxito)

## 🎯 PRÓXIMOS PASOS

1. **Actualizar los 7 módulos** pendientes usando la GUIA_INTEGRACION_API.js como referencia
2. **Probar** cada módulo en el navegador verificando Network tab
3. **Ajustar** errores que aparezcan (CORS, validaciones, etc.)
4. **Documentar** cualquier cambio que haya que hacer en el backend
5. **Optimizar** cachés y rendimiento según sea necesario

---

**Última actualización:** 26 de Mayo de 2026  
**Versión:** 1.0 - Integración API Backend  
**Desarrollador:** Senior Frontend Engineer - NEXUS  
