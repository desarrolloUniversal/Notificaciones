# Sistema de Autenticación con Tokens

Sistema completo de autenticación con tokens de acceso que se almacenan en localStorage y se renuevan en cada login.

## Arquitectura

### **authTypes.ts**
Define los tipos TypeScript del sistema.

### **authService.ts**
Servicio con toda la lógica de autenticación.

**Métodos principales:**
- `login(credentials)` - Login y generación de token
- `logout()` - Cierra sesión
- `getCurrentUser()` - Obtiene el username del usuario logueado
- `isLoggedIn()` - Verifica si hay sesión activa
- `getAuthHeader()` - Header de autorización para peticiones HTTP
- `getCurrentToken()` - Token actual
- `renewToken(credentials)` - Renueva el token

**Características:**
- Almacenamiento persistente en localStorage (opcional)
- Expiración automática (1 hora)
- Tokens se renuevan en cada login

### **useAuthStore.ts**
Store de Zustand con el estado de autenticación.

**Estado:** `token`, `username`, `isAuthenticated`, `isLoading`, `error`

**Acciones:** `login()`, `logout()`, `checkAuth()`, `renewToken()`, `clearError()`

## Uso

### En componentes React:
```typescript
import { useAuthStore } from './auth/useAuthStore'

const { username, isAuthenticated, login, logout } = useAuthStore()
```

### En servicios/funciones:
```typescript
import { AuthService } from './auth/authService'

const usuario = AuthService.getCurrentUser()  // "email@ejemplo.com" o null
const logueado = AuthService.isLoggedIn()     // true o false
const headers = AuthService.getAuthHeader()   // { 'Authorization': 'Basic <token>' }
```

## Flujo

1. **Login** → Usuario ingresa credenciales → Se genera token → Se guarda en localStorage (opcional)
2. **Sesión guardada** → Al cargar app, `checkAuth()` verifica token → Si es válido, restaura sesión
3. **Peticiones HTTP** → Usan `getAuthHeader()` para incluir token automáticamente
4. **Logout** → Elimina token de localStorage y memoria

## Seguridad

- Tokens almacenados solo si usuario lo autoriza
- Expiración automática (1 hora)
- Credenciales nunca se almacenan
- HTTPS obligatorio
- Tokens en headers (nunca en URL)

## Integración con Backend

Solo necesitas modificar `authService.ts` método `login()`:

**Actual (Basic Auth):**
```typescript
const basicAuth = btoa(`${credentials.email}:${credentials.password}`)
const response = await fetch(AUTH_URL, {
  method: 'GET',
  headers: { 'Authorization': `Basic ${basicAuth}` }
})
```

**Con Backend (JWT):**
```typescript
const response = await fetch(`${AUTH_URL}/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
})
const token = data.token  // Token del servidor
```

**Nota:** No cambies `useAuthStore.ts`, `LoginModal.tsx` ni `App.tsx`.

