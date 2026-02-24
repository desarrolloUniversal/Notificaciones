# Manejo de roles para login

## Objetivos

- **Segmentar funcionalidades** según el tipo de usuario.
- **Mostrar solo las opciones relevantes** para cada rol.
- **Asegurar el acceso correcto** a herramientas de testeo y gestión de notificaciones.

---

## Definición de Roles

### 1. Rol: Tester (TI)

- **Definición:**  
  - El usuario es "Tester (TI)" si en la data de OU el valor es exactamente `"TI"`.

- **Permisos:**
  - Acceso a la gestión de notificaciones push.
  - Acceso a funciones de testeo y debug.
  - Visualiza el bloque "Tester (TI)" en el modal de bienvenida.

---

### 2. Rol: Notificaciones Push

- **Definición:**  
  - El usuario es "Notificaciones Push" si en la data de OU el valor es `null`, `undefined` **o cualquier otro valor distinto de `"TI"`**.

- **Permisos:**
  - Acceso a la gestión de notificaciones push.
  - Visualiza el bloque "Notificaciones Push" en el modal de bienvenida.
  - **No** tiene acceso a funciones de testeo o debug.

---

## Esquema Visual de Roles

```mermaid
flowchart TD
    A[Usuario inicia sesión]
    A -->|OU = "TI"| B[Tester (TI)]
    A -->|OU = null, undefined o distinto de "TI"| C[Notificaciones Push]
    B --> D[Notificaciones Push, Testeo/Debug, Bloque Tester (TI)]
    C --> E[Notificaciones Push, Bloque Notificaciones Push]
```

---

## Resumen

- **Solo usuarios con OU = "TI"** acceden a funciones de testeo y debug.
- **Usuarios con OU = null, undefined o distinto de "TI"** solo pueden gestionar notificaciones push.
