# 📚 Documentación del Flujo de Notificaciones desde URL

## 🎯 Objetivo

Implementar un sistema que permita crear notificaciones desde URLs de artículos de El Universal, consultando la API de stories, parseando la información y dejándola en estado "Pendiente" para su posterior envío.

---

## 🏗️ Arquitectura del Sistema

### 📁 Estructura de Archivos

```
src/
├── notificaciones/
│   ├── types/
│   │   └── notificacionesTypes.ts          # Tipos y interfaces
│   ├── fetchStoryFromUrl.ts                # Fetch a API de stories
│   ├── parseStoryToNotification.ts         # Parseo de story a notificación
│   ├── sendNotification.ts                 # Envío de notificaciones (endpoint por definir)
│   ├── fetchNotifications.ts               # Fetch de notificaciones existentes
│   ├── parseDataNotification.ts            # Parseo de notificaciones existentes
│   ├── useNotificacionesStore.ts           # Store Zustand
│   └── validarRespuestaAPI.ts              # Validaciones
├── utils/
│   └── parseNotificacion                   # Parser complejo de artículos (parseNotaA)
└── App.tsx                                  # Componente principal
```

---

## 📊 Tipos y Interfaces

### `StoryApiResponse` (Respuesta de API de Stories)

```typescript
interface StoryApiResponse {
  canonical_url: string                      // URL canónica del artículo
  content_elements: string                   // JSON string de elementos de contenido
  content_restrictions: string               // JSON string de restricciones
  created_date: string                       // Fecha de creación ISO 8601
  credits: string                            // JSON string de autores
  display_date: string                       // Fecha de publicación a mostrar
  first_publish_date: string                 // Primera fecha de publicación
  headlines_basic: string                    // JSON string con título
  idarticulo: string                         // ID único del artículo
  primary_section_path: string               // Path de la sección (/espectaculos, /deportes, etc.)
  promo_items: string                        // JSON string con imagen principal
  publish_date: string                       // Fecha de publicación
  site: string                               // Sitio (eluniversal)
  subheadlines_basic: string                 // JSON string con subtítulo
  taxonomy: string                           // JSON string con metadatos de sección
}
```

### `PendingNotificationFromUrl` (Notificación Pendiente)

```typescript
interface PendingNotificationFromUrl {
  id: string                                 // ID único del artículo
  thumbnail: string                          // URL de imagen principal
  seccion: string                            // Nombre de sección (normalizado UTF-8, capitalizado)
  titulo: string                             // Título (normalizado UTF-8, capitalizado)
  subtitulo: string                          // Subtítulo (normalizado UTF-8, capitalizado)
  url: string                                // URL completa del artículo
  estadoEnvio: 'Pendiente'                   // Estado fijo: Pendiente
  fechaEnvio: null                           // Fecha de envío (null hasta confirmar)
  usuarios: string                           // Usuario que creó (por ahora "Sistema")
  timestamp: string                          // ISO 8601 de cuando se agregó a pendientes
}
```

### `NotificationSendPayload` (Payload para Envío)

```typescript
interface NotificationSendPayload {
  url: string                                // URL del artículo
  titulo: string                             // Título de la notificación
  thumbnail: string                          // URL de la imagen
  seccion: string                            // Sección del artículo
  // TODO: Agregar más campos según requirements del endpoint
}
```

---

## 🔧 Funciones Principales

### 1. `fetchStoryFromUrl(fullUrl: string): Promise<StoryApiResponse>`

**Ubicación:** `src/notificaciones/fetchStoryFromUrl.ts`

**Descripción:** Consulta la API de stories para obtener información de un artículo.

**Parámetros:**
- `fullUrl`: URL completa o relativa del artículo

**Retorna:** Promesa con la respuesta de la API

**Ejemplo:**

```typescript
import { fetchStoryFromUrl } from './notificaciones/fetchStoryFromUrl'

// Con URL completa
const story = await fetchStoryFromUrl(
  'https://www.eluniversal.com.mx/espectaculos/articulo-de-ejemplo/'
)

// Con URL relativa
const story = await fetchStoryFromUrl('/espectaculos/articulo-de-ejemplo/')

console.log('ID del artículo:', story.idarticulo)
console.log('Título:', JSON.parse(story.headlines_basic))
```

**API Endpoint:**
```
GET https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories?website=eluniversal&website_url=/espectaculos/articulo
```

**Errores:**
- Lanza `Error` si la petición HTTP falla
- Lanza `Error` si la respuesta no tiene `idarticulo`

---

### 2. `parseStoryToNotification(storyData: StoryApiResponse, originalUrl: string): PendingNotificationFromUrl`

**Ubicación:** `src/notificaciones/parseStoryToNotification.ts`

**Descripción:** Transforma la respuesta de la API de stories en una notificación pendiente, normalizando UTF-8 y capitalizando.

**Parámetros:**
- `storyData`: Respuesta de la API de stories
- `originalUrl`: URL original ingresada por el usuario

**Retorna:** Notificación pendiente lista para mostrar o enviar

**Ejemplo:**

```typescript
import { fetchStoryFromUrl } from './notificaciones/fetchStoryFromUrl'
import { parseStoryToNotification } from './notificaciones/parseStoryToNotification'

const url = '/espectaculos/lalo-salazar-nueva-relacion/'
const story = await fetchStoryFromUrl(url)
const notification = parseStoryToNotification(story, url)

console.log('Notificación creada:', {
  id: notification.id,
  titulo: notification.titulo,
  seccion: notification.seccion,
  estadoEnvio: notification.estadoEnvio,  // 'Pendiente'
  fechaEnvio: notification.fechaEnvio,    // null
})
```

**Normalización:**
- UTF-8: Usa `String.normalize('NFC')` para composición canónica
- Capitalización: Primera letra en mayúscula

---

### 3. `sendNotification(notification: PendingNotificationFromUrl): Promise<{ success: boolean, message: string, sentAt: string }>`

**Ubicación:** `src/notificaciones/sendNotification.ts`

**Descripción:** Envía una notificación al endpoint de envío (actualmente simulado).

**Parámetros:**
- `notification`: Notificación pendiente a enviar

**Retorna:** Promesa con resultado del envío

**Ejemplo:**

```typescript
import { sendNotification, canSendNotification } from './notificaciones/sendNotification'

// Validar antes de enviar
if (canSendNotification(notification)) {
  try {
    const result = await sendNotification(notification)
    console.log('✅ Enviado:', result.message)
    console.log('Hora de envío:', result.sentAt)
  } catch (error) {
    console.error('❌ Error:', error)
  }
}
```

**Estado Actual:** 
- ⚠️ **MOCK**: Simula envío exitoso con delay de 1.5s
- 🚧 **TODO**: Definir endpoint real y configurar autenticación

**Configuración del Endpoint Real:**

```typescript
// En sendNotification.ts, descomentar y configurar:

const SEND_NOTIFICATION_ENDPOINT = 'https://api.eluniversal.com.mx/notifications/send'

const response = await fetch(SEND_NOTIFICATION_ENDPOINT, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,  // Agregar token si es necesario
  },
  body: JSON.stringify(payload),
})
```

---

### 4. `canSendNotification(notification: PendingNotificationFromUrl): boolean`

**Ubicación:** `src/notificaciones/sendNotification.ts`

**Descripción:** Valida si una notificación está lista para ser enviada.

**Validaciones:**
- Tiene `url` y `titulo` no vacíos
- Estado es `'Pendiente'`

**Ejemplo:**

```typescript
if (!canSendNotification(notification)) {
  console.error('Notificación incompleta o ya enviada')
  return
}
```

---

## 🔄 Flujo Completo

### 1. Usuario Ingresa URL

```typescript
// En App.tsx
const handleApplyUrl = async () => {
  const url = modalUrlInput.trim()
  
  // Validar URL
  if (!url) {
    alert('Por favor ingresa una URL válida')
    return
  }
```

### 2. Fetch de Story desde API

```typescript
  setIsLoadingNewNotification(true)
  setLoadingProgress(30)
  
  const storyData = await fetchStoryFromUrl(url)
  setLoadingProgress(70)
```

### 3. Parseo a Notificación Pendiente

```typescript
  const notification = parseStoryToNotification(storyData, url)
  
  // notification = {
  //   id: 'U5AYXLEIPRFSTCUBNEUSNDOQQA',
  //   thumbnail: 'https://www.eluniversal.com.mx/resizer/v2/...',
  //   seccion: 'Espectáculos',
  //   titulo: 'Tras ser captado besando a una joven, Lalo Salazar confirma...',
  //   subtitulo: 'El presentador de noticias pide que no se hable más...',
  //   url: 'https://www.eluniversal.com.mx/espectaculos/...',
  //   estadoEnvio: 'Pendiente',
  //   fechaEnvio: null,
  //   usuarios: 'Sistema',
  //   timestamp: '2026-02-10T14:30:45.123Z'
  // }
```

### 4. Agregar a Pendientes (Sin Descartar)

```typescript
  setPendingNotifications(prev => [notification, ...prev])
  setLoadingProgress(100)
  
  console.log('✅ Notificación agregada a pendientes')
}
```

### 5. Confirmar Envío (Botón "↑" en Tabla)

```typescript
const handleApplyPending = async (pending: PendingNotificationFromUrl) => {
  // Validar
  if (!canSendNotification(pending)) {
    alert('❌ La notificación no puede ser enviada')
    return
  }
  
  // Enviar
  const result = await sendNotification(pending)
  
  // Remover de pendientes
  setPendingNotifications(prev => prev.filter(p => p.id !== pending.id))
  
  alert(`✅ Notificación enviada: ${result.message}`)
}
```

---

## 🎨 Mockups y Ejemplos

### Ejemplo 1: URL de Espectáculos

**Input:**
```
https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/
```

**Output (Notificación Pendiente):**
```json
{
  "id": "U5AYXLEIPRFSTCUBNEUSNDOQQA",
  "thumbnail": "https://cloudfront-us-east-1.images.arcpublishing.com/eluniversal/AFQ3EEEOKZCDFFYPJPZFC4SMAQ.png",
  "seccion": "Espectáculos",
  "titulo": "Tras ser captado besando a una joven, Lalo Salazar confirma que se trata de su nueva relación: \"una mujer extraordinaria\"",
  "subtitulo": "El presentador de noticias pide que no se hable más del noviazgo que sostuvo con Laura Flores",
  "url": "https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/",
  "estadoEnvio": "Pendiente",
  "fechaEnvio": null,
  "usuarios": "Sistema",
  "timestamp": "2026-02-10T14:30:45.123Z"
}
```

---

### Ejemplo 2: URL Relativa de Deportes

**Input:**
```
/deportes/futbol/liga-mx/cruz-azul-campeon-apertura-2024/
```

**Output (Notificación Pendiente):**
```json
{
  "id": "ABC123XYZ789",
  "thumbnail": "https://www.eluniversal.com.mx/resizer/v2/SAMPLE.jpg",
  "seccion": "Deportes",
  "titulo": "Cruz azul campeón del apertura 2024",
  "subtitulo": "La máquina celeste se corona tras vencer en la final",
  "url": "https://www.eluniversal.com.mx/deportes/futbol/liga-mx/cruz-azul-campeon-apertura-2024/",
  "estadoEnvio": "Pendiente",
  "fechaEnvio": null,
  "usuarios": "Sistema",
  "timestamp": "2026-02-10T15:00:00.000Z"
}
```

---

### Ejemplo 3: Respuesta de API de Stories (Sample)

```json
{
  "canonical_url": "/espectaculos/articulo-ejemplo/",
  "content_elements": "[{\"type\": \"text\", \"content\": \"Lorem ipsum...\"}]",
  "content_restrictions": "{\"content_code\": \"libre\"}",
  "created_date": "2025-11-06T16:21:48.84Z",
  "credits": "{\"by\": [{\"name\": \"Juan Pérez\"}]}",
  "display_date": "2025-11-06T16:41:45.393Z",
  "first_publish_date": "2025-11-06T16:41:45.393Z",
  "headlines_basic": "\"Título del artículo ejemplo\"",
  "idarticulo": "U5AYXLEIPRFSTCUBNEUSNDOQQA",
  "primary_section_path": "/espectaculos",
  "promo_items": "{\"basic\": {\"url\": \"https://example.com/image.jpg\"}}",
  "publish_date": "2025-11-06T16:41:45.393Z",
  "site": "eluniversal",
  "subheadlines_basic": "\"Subtítulo del artículo\"",
  "taxonomy": "{\"primary_section\": {\"name\": \"Espectáculos\"}}"
}
```

---

## ⚙️ Configuración y TODOs

### 🔴 Pendientes Críticos

1. **Endpoint de Envío de Notificaciones**
   - Archivo: `src/notificaciones/sendNotification.ts`
   - Línea: 5
   - Acción: Definir URL real del endpoint
   - Actual: `'https://api.eluniversal.com.mx/notifications/send'` (PLACEHOLDER)

2. **Autenticación para Envío**
   - Archivo: `src/notificaciones/sendNotification.ts`
   - Línea: 62
   - Acción: Agregar token o autenticación básica
   - Ejemplo: `'Authorization': 'Bearer ${token}'`

3. **Sistema de Login de Usuarios**
   - Archivo: `src/notificaciones/parseStoryToNotification.ts`
   - Línea: 111
   - Acción: Integrar con sistema de autenticación
   - Actual: Hardcoded como `'Sistema'`

4. **Campos Adicionales en Payload**
   - Archivo: `src/notificaciones/types/notificacionesTypes.ts`
   - Línea: 70
   - Acción: Agregar campos requeridos por el endpoint de envío

---

### 🟡 Mejoras Sugeridas

1. **Persistencia de Notificaciones Pendientes**
   - Guardar en `localStorage` o base de datos
   - Recuperar al recargar la página

2. **Validación de URLs**
   - Regex para validar formato de URLs de El Universal
   - Prevenir URLs de otros sitios

3. **Manejo de Imágenes Faltantes**
   - Placeholder por defecto si `thumbnail` está vacío
   - Fallback a logo de El Universal

4. **Logs y Telemetría**
   - Track de éxito/error en envíos
   - Métricas de tiempo de respuesta

5. **Rate Limiting**
   - Evitar spam de peticiones a la API

---

## 🧪 Testing

### Test Manual 1: Crear Notificación Pendiente

1. Abrir aplicación
2. Click en input de URL
3. Ingresar: `https://www.eluniversal.com.mx/espectaculos/articulo-prueba/`
4. Click en "Agregar URL"
5. ✅ **Esperado:** 
   - Loading card aparece
   - Progreso 0% → 30% → 70% → 100%
   - Notificación aparece en tabla de pendientes
   - Estado: "Pendiente"
   - Fecha: "Sin definir"

### Test Manual 2: Enviar Notificación Pendiente

1. En tabla de pendientes, click botón "↑" (flecha arriba)
2. ✅ **Esperado:**
   - Loading card aparece
   - Llamada a `sendNotification()`
   - Alert "Notificación enviada correctamente (simulado)"
   - Notificación desaparece de pendientes

### Test Manual 3: Error en API

1. Ingresar URL inválida: `https://ejemplo.com/articulo`
2. Click en "Agregar URL"
3. ✅ **Esperado:**
   - Error visible en loading card
   - Notificación no se agrega a pendientes
   - Error en consola con detalles

---

## 📝 Notas de Implementación

### Normalización UTF-8

La función `normalizeAndCapitalize()` usa:
- `String.normalize('NFC')`: Composición canónica Unicode
- Maneja correctamente: á, é, í, ó, ú, ñ, ü, etc.
- Capitaliza primera letra preservando acentos

**Ejemplo:**
```typescript
normalizeAndCapitalize('é́spèctáculos')
// Output: 'É́spèctáculos'
```

### Mapeo de Secciones

Si `taxonomy.primary_section.name` no existe, se usa `primary_section_path`:

```typescript
const pathToName: { [key: string]: string } = {
  '/nacion': 'Nación',
  '/deportes': 'Deportes',
  '/estados': 'Estados',
  '/mundo': 'Mundo',
  '/opinion': 'Opinión',
  '/cultura': 'Cultura',
  '/cartera': 'Cartera',
  '/techbit': 'Techbit',
  '/espectaculos': 'Espectáculos',
}
```

### JSON Parsing Seguro

Todos los campos que son JSON strings se parsean con `safeJsonParse()`:
- Si es objeto, retorna directamente
- Si es string, intenta `JSON.parse()`
- Si falla, retorna valor por defecto

---

## 🐛 Troubleshooting

### Error: "La respuesta no contiene un ID de artículo válido"

**Causa:** La URL no está en la base de datos de El Universal
**Solución:** Verifica que la URL sea correcta y el artículo esté publicado

### Error: "Error HTTP: 404"

**Causa:** URL no encontrada en la API
**Solución:** Verifica el formato de la URL y que el artículo exista

### Notificación con campos vacíos

**Causa:** Campos JSON mal formados en la respuesta de la API
**Solución:** Revisa la consola para ver warnings de `safeJsonParse()`

### Loading infinito

**Causa:** Error no capturado en `try/catch`
**Solución:** Revisa la consola del navegador, verifica conexión a internet

---

## 📞 Contacto y Soporte

Para dudas sobre la implementación:
- Revisa logs en consola con prefijos: `🔍`, `📤`, `✅`, `❌`
- Todos los errores incluyen stack trace completo
- Los estados de carga se reflejan en la UI con iconos

---

**Última actualización:** 2026-02-10
**Versión:** 1.0.0
**Estado:** ✅ Implementación completa (endpoint de envío pendiente)
