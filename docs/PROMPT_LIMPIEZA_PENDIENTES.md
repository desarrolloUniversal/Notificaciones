# PROMPT — Limpieza de notificaciones pendientes tras envío exitoso

## Contexto

- `usePendingNotificationsStore` persiste notificaciones en `localStorage` por usuario.
- `useNotificacionesStore` mantiene las notificaciones ya enviadas (fuente de verdad del servidor).
- El flujo de conexiones, autenticación y envío ya están resueltos y funcionando correctamente.

## Problema

Al enviar o reenviar una notificación exitosamente, la entrada quedaba en la lista de
pendientes con estado `"Enviada"` en lugar de eliminarse. Esto causaba que el componente
de notificaciones pendientes mostrara elementos que ya habían sido enviados.

## Solución aplicada (mínima, no destructiva)

### Cambio 1 — `src/App.tsx` · handler `handleSendPending`

En el bloque de éxito del envío, reemplazar:

```ts
// ANTES
const now = new Date().toISOString()
const nuevoEstado = 'Enviada'
const nuevoContador = (pending.resendCount || 0) + 1
updatePendingNotification(pending.id, {
  estadoEnvio: nuevoEstado,
  fechaEnvio: now,
  resendCount: nuevoContador
})
```

```ts
// DESPUÉS
removePendingNotification(pending.id)
```

### ~~Cambio 2 — `useEffect` de sincronización~~ ❌ DESCARTADO

> **Por qué se descartó:** Un `useEffect` que cruza URLs de pendientes con la lista general
> es demasiado agresivo. Borra pendientes que el usuario dejó intencionalmente aunque su URL
> ya exista en el historial (enviadas previamente por otro usuario o en otra sesión).
> Solo debe borrarse la notificación que **en ese momento** acaba de enviarse exitosamente.
> Eso ya lo cubre el Cambio 1.

## Restricciones aplicadas

- **No modificar:** `sendNotification.ts`, `useNotificacionesStore.ts`, `usePendingNotificationsStore.ts`
- **No modificar:** flujos de autenticación ni conexiones con la API
- **No agregar** lógica nueva en los stores ni nuevos métodos
- Solo cambios quirúrgicos en `App.tsx`: bloque de éxito del handler + un `useEffect`

## Cobertura

| Caso | Resultado |
|---|---|
| Envío normal exitoso | Notificación eliminada de pendientes |
| Reenvío exitoso | Notificación eliminada de pendientes |
| Refresh manual (botón actualizar) | Pendientes **no** se tocan (el usuario las controla) |
| Error al enviar | Notificación permanece en pendientes (sin cambios) |
| Urgente enviada | Eliminada de pendientes (misma lógica) |
