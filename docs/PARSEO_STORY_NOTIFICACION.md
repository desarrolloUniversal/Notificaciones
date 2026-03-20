# Parseo de datos: StoryApiResponse → PendingNotificationFromUrl

**Archivo:** `src/notificaciones/parseStoryToNotification.ts`  
**Endpoint fuente:** `GET /storie?website=eluniversal&website_url={path}`

---

## Flujo general

```
URL del usuario
    ↓
fetchStoryFromUrl()       → consulta la API y devuelve StoryApiResponse
    ↓
parseStoryToNotification() → transforma los datos en PendingNotificationFromUrl
    ↓
Notificación en cola con estado 'Pendiente'
```

---

## Campos mapeados

| Campo en API (`StoryApiResponse`) | Campo en notificación | Función responsable |
|---|---|---|
| `idarticulo` | `id` | directo |
| `promo_items` | `thumbnail` | `extractThumbnail()` |
| `taxonomy` + `primary_section_path` | `seccion` | `extractSeccion()` |
| `headlines_basic` | `titulo` | `extractTitulo()` |
| `subheadlines_basic` | `subtitulo` | `extractSubtitulo()` |
| `canonical_url` | `url` | construcción inline |
| — (sesión activa) | `usuarios` | `useAuthStore` |

---

## Descripción de cada extractor

### `safeJsonParse<T>(jsonString, defaultValue)`

Función base usada por todos los extractores. Normaliza el formato de los campos de la API, que pueden venir en tres formas según la versión del endpoint:

| Formato de entrada | Comportamiento |
|---|---|
| Objeto JS (`typeof === 'object'`) | Lo devuelve directo sin parsear |
| String JSON válido (`'{"basic": "..."}'"`) | Hace `JSON.parse()` y devuelve el objeto |
| Texto plano (`'FGR incorpora...'`) | Falla el parse y devuelve `defaultValue` |

> El endpoint `/storie` devuelve los campos como **texto plano** (tercer caso).  
> El endpoint anterior `/stories` los devolvía como **JSON string** (segundo caso).

---

### `extractThumbnail(promo_items)`

Extrae la imagen de portada del artículo.

**Prioridad de extracción:**
1. `promo_items.basic.url` → URL completa directa
2. `promo_items.basic.additional_properties.fullSizeResizeUrl` → ruta relativa, se prefija con `https://www.eluniversal.com.mx`
3. `promo_items.basic.additional_properties.resizeUrl` → ruta relativa, mismo prefijo
4. Si ninguna existe → retorna `''`

---

### `extractSeccion(taxonomy, primary_section_path)`

Extrae el nombre de la sección editorial del artículo.

**Estrategia (en orden de prioridad):**
1. `taxonomy.primary_section.name` → nombre legible directo
2. Mapa de rutas conocidas a partir de `primary_section_path`:

| Path | Sección |
|---|---|
| `/nacion` | Nación |
| `/deportes` | Deportes |
| `/estados` | Estados |
| `/mundo` | Mundo |
| `/opinion` | Opinión |
| `/cultura` | Cultura |
| `/cartera` | Cartera |
| `/techbit` | Techbit |
| `/espectaculos` | Espectáculos |

3. Fallback: capitaliza el path eliminando el `/` inicial

---

### `extractTitulo(headlines_basic)`

Extrae el título principal del artículo.

**Formatos manejados:**
- `'FGR incorpora...'` → texto plano, se usa directamente ✅
- `'{"basic": "FGR incorpora..."}'` → JSON string, extrae `.basic` ✅
- `{ basic: 'FGR incorpora...' }` → objeto, `safeJsonParse` lo devuelve entero ⚠️

> ⚠️ **Riesgo conocido:** si el campo llega como objeto JS, `safeJsonParse` lo devuelve completo y `normalizeAndCapitalize` produciría `"[object Object]"` en la UI.  
> Mitigación: el endpoint `/storie` devuelve siempre texto plano, por lo que este caso no ocurre actualmente.

---

### `extractSubtitulo(subheadlines_basic)`

Misma lógica que `extractTitulo`. Aplica para el campo `subheadlines_basic`.

---

### Construcción de la URL final

```ts
// Se valida que canonical_url empiece con '/' para evitar open redirect
const safePath = canonical_url.startsWith('/')
  ? canonical_url
  : `/${canonical_url}`
fullUrl = `https://www.eluniversal.com.mx${safePath}`
```

Si `canonical_url` no existe, se usa la URL original que ingresó el usuario.

**¿Por qué la validación del `/`?**  
Sin validación, un valor como `//malicious.com/phishing` generaría una URL que los navegadores interpretan como redirección a un dominio externo (open redirect). Forzar el `/` inicial lo convierte en una ruta relativa a `eluniversal.com.mx`.

---

### Normalización de texto (`normalizeAndCapitalize`)

Todos los campos de texto (título, subtítulo, sección) pasan por esta función antes de asignarse:

1. `text.normalize('NFC')` → normaliza caracteres UTF-8 con acentos (ej. `é`, `ñ`)
2. `charAt(0).toUpperCase()` → capitaliza la primera letra

---

## Estado de la notificación creada

| Campo | Valor inicial |
|---|---|
| `estadoEnvio` | `'Pendiente'` |
| `fechaEnvio` | `null` |
| `usuarios` | usuario de la sesión activa (`useAuthStore`) |
| `timestamp` | fecha ISO del momento de creación |
| `isResend` | no definido (undefined) |
| `isUrgent` | no definido (undefined) |
