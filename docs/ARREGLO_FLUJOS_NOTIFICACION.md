# Arreglo de flujos de notificación (restaurar + separar Promociones)

## Contexto

El commit `7b431be` ("fix: Ajustar payload según especificación API Trivia") aplicó los valores de
Promociones/Trivia a los 3 flujos de envío de forma incorrecta. Se realizaron los siguientes cambios:

1. Restaurar URGENTE y MANUAL a su estado original.
2. Restaurar NORMAL (incluyendo reenvíos) a su estado original.
3. Agregar una rama separada para **Promociones** con payload completamente controlado por el usuario.
4. Actualizar el tipo `forward` en `notificacionesTypes.ts`.
5. Agregar validaciones y edición automática en `App.tsx` para el flujo Promociones.

---

## Archivo: `src/notificaciones/sendNotification.ts`

### `prepareSendPayload` — 3 ramas independientes

```typescript
export const prepareSendPayload = (notification: PendingNotificationFromUrl): NotificationSendPayload => {
  const username = useAuthStore.getState().username || ''

  // ─── FLUJO PROMOCIONES ───────────────────────────────────────────────
  // Todos los valores vienen del usuario. link y forward son los únicos fijos.
  if (notification.area === 'promociones') {
    const payload: NotificationSendPayload = {
      site: 'eluniversal',
      idarticulo: notification.id,    // usuario escribe en el modal (ej. TRIVIASOMOSMEXICO)
      url: notification.url,          // usuario ingresa en el modal
      title: notification.seccion,    // usuario llena en tabla de pendientes
      content: notification.titulo,   // usuario llena en tabla de pendientes
      userid: username,
      link: 'a URL',                  // fijo
      forward: 'True',                // fijo
    }
    const pushToken = getPushToken(username)
    if (pushToken) payload.id = pushToken
    return payload
  }

  // ─── FLUJO URGENTE / MANUAL ─────────────────────────────────────────
  // link 'a Nota', forward 'false', idarticulo = notification.id (dinámico)
  if (notification.isUrgent || notification.isManual) {
    const payload: NotificationSendPayload = {
      site: 'eluniversal',
      link: 'a Nota',
      userid: username,
      url: notification.isManual ? '/' : '/urgente',
      content: notification.titulo,
      title: notification.seccion,
      forward: 'false',
      idarticulo: notification.id
    }
    const pushToken = getPushToken(username)
    if (pushToken) payload.id = pushToken
    if (notification.isManual) {
      console.log('📝 [Manual "/"] Payload que se enviará:', JSON.stringify(payload, null, 2))
    }
    return payload
  }

  // ─── FLUJO NORMAL / REENVÍO ─────────────────────────────────────────
  // link 'a Nota', forward 'false', solo pathname, idarticulo dinámico
  let urlPath = notification.url
  try {
    urlPath = new URL(notification.url).pathname
  } catch { /* usar valor original si la URL no es válida */ }

  let idArticulo: string
  if (notification.isResend) {
    // ID único para reenvíos: evita que el backend rechace duplicados
    const urlHash = urlPath.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
    idArticulo = `${urlHash}-resend-${Date.now()}`
  } else {
    idArticulo = notification.id
  }

  const tituloEditado = notification.isResend &&
                        notification.originalTitulo &&
                        notification.titulo !== notification.originalTitulo

  const payload: NotificationSendPayload = {
    site: 'eluniversal',
    link: 'a Nota',
    userid: username,
    url: urlPath,
    content: notification.titulo,
    forward: 'false',
    idarticulo: idArticulo
  }
  const pushToken = getPushToken(username)
  if (pushToken) payload.id = pushToken
  if (!tituloEditado || notification.isResend) payload.title = notification.seccion

  return payload
}
```

### `canSendNotification` — nueva validación para Promociones

```typescript
// Promociones requiere url (modal) + seccion (title) + titulo (content)
if (notification.area === 'promociones') {
  if (!notification.url || notification.url.trim() === '') return false
  if (!notification.seccion || notification.seccion.trim() === '') return false
  if (!notification.titulo || notification.titulo.trim() === '') return false
}
```

---

## Archivo: `src/notificaciones/types/notificacionesTypes.ts`

```typescript
// ANTES
forward: "True" | "false"

// DESPUÉS
forward: "True" | "true" | "false"
// Promociones usa "True", Urgente/Manual/Normal usan "false"
```

---

## Archivo: `src/App.tsx`

### `handleApplyPromocion` — edición automática al agregar

Al confirmar el modal de Promociones, se activan automáticamente los campos de edición de
`seccion` (→ `title`) y `titulo` (→ `content`) en la tabla de pendientes, y se hace scroll
a esa sección para que el usuario los complete antes del envío.

```typescript
setEditingSectionId(notification.id)
setEditingSectionValue('')
setEditingTitleId(notification.id)
setEditingTitleValue('')
setTimeout(() => pendingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300)
```

### `handleApplyPending` — validaciones para Promociones (antes de enviar)

```typescript
// Verifica edición activa
if (pending.area === 'promociones' && (editingSectionId === pending.id || editingTitleId === pending.id)) { ... }

// Valida campos requeridos
if (pending.area === 'promociones') {
  if (!pending.seccion) → "Debe ingresar el Título de la notificación antes de enviar."
  if (!pending.titulo)  → "Debe ingresar el Contenido de la notificación antes de enviar."
}
```

### `handleOpenTokenModal` — mismas validaciones para flujo debug/test

Verifica edición activa y campos requeridos (`seccion` y `titulo`) antes de abrir el modal
de token push para notificaciones de tipo Promociones.

---

## Resumen de cambios

### `sendNotification.ts` — campos por flujo

| Campo | URGENTE / MANUAL | NORMAL / REENVÍO | PROMOCIONES |
|-------|-----------------|-----------------|-------------|
| `link` | `'a Nota'` | `'a Nota'` | `'a URL'` |
| `forward` | `'false'` | `'false'` | `'True'` |
| `url` | `/urgente` o `/` | solo `pathname` | URL completa (del modal) |
| `idarticulo` | `notification.id` | dinámico (hash+timestamp en reenvíos) | `notification.id` (el usuario escribe el valor) |
| `title` | `notification.seccion` | `notification.seccion` (condicional) | `notification.seccion` (llenado en pendientes) |
| `content` | `notification.titulo` | `notification.titulo` | `notification.titulo` (llenado en pendientes) |

### Flujo completo de Promociones

1. Usuario abre modal → ingresa **URL** + escribe el **ID** (ej. `TRIVIASOMOSMEXICO`)
2. Al confirmar, la fila aparece en pendientes con edición activa automáticamente
3. Usuario llena **Sección** (→ `title`) y **Título** (→ `content`) en la tabla
4. Al enviar / hacer test, se valida que ambos campos estén completos
5. El payload se construye con todos los valores del usuario + `link: 'a URL'` y `forward: 'True'` fijos
