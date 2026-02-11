# 🔒 Solución al Problema de CORS

## ❌ Problema: "Solicitud de origen cruzado bloqueada"

### Error Completo
```
Solicitud de origen cruzado bloqueada: La política de mismo origen no permite 
la lectura de recursos remotos en https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories
(Razón: Solicitud CORS sin éxito). Código de estado: (null).
```

### ¿Qué es CORS?

**CORS** (Cross-Origin Resource Sharing) es una política de seguridad del navegador que **bloquea peticiones** de un dominio a otro por defecto.

**En tu caso:**
- Tu app corre en: `http://localhost:5173` (desarrollo)
- La API está en: `https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com`
- El navegador **bloquea** la petición porque son dominios diferentes

---

## ✅ Solución Implementada (Desarrollo)

### 🔧 Proxy de Vite

He configurado un **proxy** en el servidor de desarrollo que reenvía las peticiones:

```
Tu App (localhost:5173)
    ↓
Proxy de Vite (localhost:5173/api/stories)
    ↓
API de Stories (wy1k8mgsuc.execute-api.us-east-1.amazonaws.com)
```

**Ventajas:**
- ✅ Evita CORS en desarrollo
- ✅ No requiere cambios en el backend
- ✅ Funciona inmediatamente

### 📁 Archivos Modificados

#### 1. [vite.config.ts](vite.config.ts)

```typescript
server: {
  proxy: {
    '/api/stories': {
      target: 'https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/stories/, '/stories')
    }
  }
}
```

#### 2. [src/notificaciones/fetchStoryFromUrl.ts](src/notificaciones/fetchStoryFromUrl.ts)

```typescript
const isDevelopment = import.meta.env.DEV
const STORIES_API_BASE_URL = isDevelopment 
  ? '/api/stories'              // Desarrollo: Usa proxy
  : 'https://wy1k8mgsuc...'     // Producción: URL directa
```

#### 3. [src/notificaciones/useNotificacionesStore.ts](src/notificaciones/useNotificacionesStore.ts)

```typescript
const isDevelopment = import.meta.env.DEV
const API_URL = isDevelopment
  ? '/api/notifications?site=eluniversal'  // Desarrollo: Usa proxy
  : 'https://voaq9ne5bf...'                 // Producción: URL directa
```

---

## 🚀 Cómo Usar la Solución

### Paso 1: Reiniciar el Servidor de Desarrollo

```powershell
# Detener el servidor actual (Ctrl+C)
# Luego reiniciar:
npm run dev
```

### Paso 2: Verificar que el Proxy Funcione

Abre la consola del navegador y deberías ver:

```
🔧 [fetchStoryFromUrl] Modo: Desarrollo (con proxy)
🔧 [fetchStoryFromUrl] API URL base: /api/stories
```

### Paso 3: Probar una URL

Ingresa cualquier URL de El Universal y debería funcionar sin errores CORS.

---

## 📊 Cómo Funciona el Proxy

### Sin Proxy (❌ CORS Error)

```
Navegador (localhost:5173)
    ↓ [fetch]
API (wy1k8mgsuc.execute-api.us-east-1.amazonaws.com)
    ↓
❌ CORS BLOQUEADO por el navegador
```

### Con Proxy (✅ Funciona)

```
Navegador (localhost:5173)
    ↓ [fetch a /api/stories]
Servidor Vite (localhost:5173) - mismo origen
    ↓ [proxy interno]
API (wy1k8mgsuc.execute-api.us-east-1.amazonaws.com)
    ↓
✅ SIN ERROR - El servidor hace la petición, no el navegador
```

---

## 🏭 Solución para Producción

### ⚠️ El Proxy Solo Funciona en Desarrollo

En producción (build), **no hay servidor Vite**, por lo que el proxy no existe.

### Opciones para Producción:

#### Opción 1: ✅ **Configurar CORS en la API (RECOMENDADO)**

El backend debe agregar estas cabeceras en API Gateway:

```
Access-Control-Allow-Origin: https://www.eluniversal.com.mx
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

**Contactar a Backend con:**
- API afectada: `https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories`
- Dominio permitido: `https://www.eluniversal.com.mx`
- Métodos necesarios: `GET`

#### Opción 2: Proxy en el Servidor de Producción

Si tu app está en un servidor Express/Node.js, configura el proxy ahí también.

#### Opción 3: BFF (Backend for Frontend)

Crear un endpoint en tu backend que haga la petición a la API de stories.

---

## 🧪 Verificar que Funcione

### Test 1: Logs del Proxy

En la consola del servidor Vite, deberías ver:

```bash
📤 [Proxy Request] GET /api/stories?website=eluniversal&website_url=/nacion/...
📥 [Proxy Response] 200 /api/stories?website=eluniversal&website_url=/nacion/...
```

### Test 2: Network Tab

En las DevTools del navegador:
1. Ve a la pestaña **Network**
2. Filtra por `stories`
3. Deberías ver peticiones a `http://localhost:5173/api/stories` ✅
4. **NO** deberías ver peticiones a `https://wy1k8mgsuc...` ❌

### Test 3: Funcional

Ingresa una URL en la app y:
- ✅ Debería cargar sin errores CORS
- ✅ Debería mostrar la notificación pendiente
- ✅ La consola debe mostrar "Modo: Desarrollo (con proxy)"

---

## 🐛 Troubleshooting

### Problema: Sigo viendo error CORS

**Causa:** No reiniciaste el servidor de Vite

**Solución:**
```powershell
# Detener el servidor (Ctrl+C)
npm run dev
```

---

### Problema: Error 404 con el proxy

**Causa:** El rewrite del proxy no está funcionando

**Verificar en vite.config.ts:**
```typescript
rewrite: (path) => path.replace(/^\/api\/stories/, '/stories')
```

**Debug:**
```powershell
# En la terminal del servidor Vite, deberías ver:
📤 [Proxy Request] GET /api/stories?website=...
```

---

### Problema: Funciona en desarrollo pero no en producción

**Causa:** El proxy solo existe en desarrollo

**Solución:** Contactar a backend para configurar CORS (ver Opción 1 arriba)

---

## 📋 Checklist de Implementación

- [x] ✅ Configurar proxy en `vite.config.ts`
- [x] ✅ Actualizar `fetchStoryFromUrl.ts` para usar proxy
- [x] ✅ Actualizar `useNotificacionesStore.ts` para usar proxy
- [x] ✅ Reiniciar servidor de desarrollo
- [ ] 🔲 Probar con URL real
- [ ] 🔲 Verificar logs del proxy
- [ ] 🔲 Solicitar configuración CORS a backend (para producción)

---

## 📞 Contactar a Backend para Producción

**Asunto:** Configurar CORS en API de Stories

**Mensaje:**

```
Hola equipo de backend,

Necesitamos configurar CORS en la API de stories para permitir 
peticiones desde nuestro dominio de producción.

API: https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories

Dominios permitidos:
- https://www.eluniversal.com.mx
- https://desarrollo.eluniversal.com.mx (si aplica)

Métodos necesarios: GET

Headers necesarios:
- Access-Control-Allow-Origin: https://www.eluniversal.com.mx
- Access-Control-Allow-Methods: GET, OPTIONS
- Access-Control-Allow-Headers: Content-Type

En desarrollo estamos usando un proxy local, pero en producción 
necesitamos que la API tenga CORS configurado.

Gracias!
```

---

## 📚 Recursos Adicionales

- **MDN - CORS:** https://developer.mozilla.org/es/docs/Web/HTTP/CORS
- **Vite Proxy:** https://vitejs.dev/config/server-options.html#server-proxy
- **AWS API Gateway CORS:** https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html

---

## 🎯 Resumen

| Entorno | Solución | Estado |
|---------|----------|--------|
| **Desarrollo** | Proxy de Vite | ✅ Implementado |
| **Producción** | CORS en API Gateway | 🔲 Pendiente (contactar backend) |

**Próximos pasos:**
1. ✅ Reiniciar `npm run dev`
2. ✅ Probar ingresando una URL
3. 🔲 Contactar a backend para CORS en producción

---

**Última actualización:** 2026-02-10  
**Mantenido por:** Equipo de Desarrollo  
**Versión:** 1.0.0
