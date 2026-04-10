# Implementación: Flujo de datos del modal de Promociones

> Estado actual: **implementado** en `src/App.tsx`.  
> El flujo de Promociones es independiente del flujo Editorial — no reutiliza `handleApplyUrl`.

---

## Diferencias clave vs. flujo Editorial

| Aspecto | Editorial | Promociones |
|---|---|---|
| `area` en el objeto | No aplica | `'promociones'` (fijo) |
| `categoria` | No aplica | No aplica (eliminado) |
| `idarticulo` | Lo devuelve la API | Lo ingresa el usuario manualmente (solo números) |
| Validación de URL | `validateArticleUrl()` | `new URL()` nativo — verifica formato http/https |
| Validación de ID | No aplica | Requerido + solo dígitos (`/^\d+$/`) |
| Errores de validación | Modal propio | Reutiliza `isUrgentValidationModalOpen` |
| Fetch a Stories API | `fetchStoryFromUrl` | No se usa — objeto construido con valores fijos |
| Función de envío | `sendNotification` | Misma función — sin cambios |

---

## Implementación actual — `handleApplyPromocion()`

**Archivo:** `src/App.tsx`

```ts
const handleApplyPromocion = () => {
  const url = promocionesUrlInput.trim()
  const idArticulo = promocionesIdArticulo.trim()

  // Validar URL presente
  if (!url) {
    setUrgentValidationMessage('Por favor ingresa una URL.')
    setIsUrgentValidationModalOpen(true)
    return
  }

  // Validar formato de URL (debe comenzar con http:// o https://)
  try {
    new URL(url)
  } catch {
    setUrgentValidationMessage('La URL no es válida.\n\nDebe comenzar con http:// o https://')
    setIsUrgentValidationModalOpen(true)
    return
  }

  // Validar ID presente
  if (!idArticulo) {
    setUrgentValidationMessage('Por favor ingresa el ID del artículo.')
    setIsUrgentValidationModalOpen(true)
    return
  }

  // Validar que el ID sea solo números
  if (!/^\d+$/.test(idArticulo)) {
    setUrgentValidationMessage('El ID del artículo debe contener solo números.')
    setIsUrgentValidationModalOpen(true)
    return
  }

  // Construir notificación con valores fijos
  // La url corresponde a data.url del futuro endpoint del backend
  const notification: PendingNotificationFromUrl = {
    id: idArticulo,
    thumbnail: '',
    seccion: '',
    titulo: '',
    subtitulo: '',
    url,
    estadoEnvio: 'Pendiente',
    fechaEnvio: null,
    usuarios: username || 'Todos',
    timestamp: new Date().toISOString(),
    area: 'promociones',
  }

  console.log('[Promociones] Payload a enviar:', notification)
  addPendingNotification(notification)
  setIsPromocionesModalOpen(false)
  setPromocionesUrlInput('')
  setPromocionesIdArticulo('')
}
```

---

## Input del ID de artículo — restricción en tiempo real

El campo de ID tiene doble protección:

```tsx
<input
  type="text"
  inputMode="numeric"         // Muestra teclado numérico en móviles
  value={promocionesIdArticulo}
  // Solo permite dígitos (0-9). Bloquea letras, espacios y símbolos en tiempo real.
  onChange={(e) => { if (/^\d*$/.test(e.target.value)) setPromocionesIdArticulo(e.target.value) }}
/>
```

- **En tiempo real**: el `onChange` bloquea cualquier carácter no numérico antes de actualizar el estado.
- **Al enviar**: el handler valida con `/^\d+$/` como segunda barrera (útil si se pega texto con el portapapeles en un contexto donde el filtro del onChange no actúe).

---

## Estados usados

| Estado | Tipo | Descripción |
|---|---|---|
| `isPromocionesModalOpen` | `boolean` | Controla visibilidad del modal |
| `promocionesUrlInput` | `string` | Valor del campo URL |
| `promocionesIdArticulo` | `string` | Valor del campo ID (solo dígitos) |
| `isUrgentValidationModalOpen` | `boolean` | Modal de error reutilizado para validaciones |
| `urgentValidationMessage` | `string` | Mensaje de error a mostrar |

---

## Badge visual en tabla de pendientes

El badge se muestra debajo del thumbnail cuando `pending.area` tiene valor:

```tsx
{pending.area && (
  <span style={{
    background: pending.area === 'promociones' ? '#e8f8f0' : '#fef9e7',
    color:      pending.area === 'promociones' ? '#27ae60' : '#d4a017',
    border:     `1px solid ${pending.area === 'promociones' ? '#a9dfbf' : '#f9e4a0'}`,
  }}>
    {pending.area === 'promociones' ? 'Promociones' : 'Editorial'}
  </span>
)}
```

Las filas de Promociones tienen fondo verde (`#e8f8f0`) y la zona de acción usa `actions-zone-green`.

---

## Diagrama del flujo actual

```
Usuario hace clic en [PROMOCIONES]
        │
        ▼
Modal abre → usuario llena URL + ID artículo
        │         (ID: solo números — bloqueado en tiempo real)
        ▼
handleApplyPromocion()
        │
        ├─ URL vacía?         → modal de error + return
        ├─ URL inválida?      → modal de error + return  (new URL() nativo)
        ├─ ID vacío?          → modal de error + return
        ├─ ID no numérico?    → modal de error + return  (/^\d+$/)
        │
        ▼
Construye PendingNotificationFromUrl
        │  id        = idArticulo (manual)
        │  url       = url ingresada
        │  area      = 'promociones'
        │  thumbnail, seccion, titulo = '' (vacíos — pendientes de completar)
        │
        ▼
console.log('[Promociones] Payload a enviar:', notification)
        │
        ▼
addPendingNotification(notification)
        │  → persiste en localStorage
        │
        ▼
Badge "Promociones" (verde) aparece debajo del thumbnail
Fila con fondo verde en la tabla de pendientes
        │
        ▼
Usuario hace clic en [↑ Enviar]
        │
        ▼
prepareSendPayload(notification)
        │  idarticulo = notification.id = idArticulo
        │
        ▼
POST ${VITE_SEND_NOTIFICATION_URL}
```

---

## Pendiente — integración con endpoint de backend

Cuando el endpoint de Promociones esté disponible, el flujo deberá:

1. Hacer `fetch` al endpoint → extraer `response.data.url` y posiblemente `response.data.id`
2. Reemplazar la URL ingresada manualmente por la que devuelva el endpoint
3. Evaluar si el ID también vendrá del endpoint o sigue siendo manual

Por ahora los campos `thumbnail`, `seccion` y `titulo` se dejan vacíos y deben completarse manualmente en la tabla antes de enviar.

---

## Archivos modificados

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | `handleApplyPromocion()` implementado + modal conectado |
| `src/notificaciones/types/notificacionesTypes.ts` | `area?: 'editorial' \| 'promociones'` en `PendingNotificationFromUrl` y `Notification` |
| `src/App.css` | `.promociones-row`, `.actions-zone-green`, `.actions-zone-red`, `.actions-zone-yellow` |
