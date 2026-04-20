# 🚨 Guía de Troubleshooting - Error 404 al Cargar Notificaciones desde URL

## ❌ Problema: Error 404 al consultar API de Stories

### Síntomas
- Al ingresar una URL en el modal, aparece error 404
- El loading card muestra: "Error al cargar notificación"
- En la consola se ve: `Error HTTP 404: Not Found`

---

## 🔍 Diagnóstico Rápido

### 1. Abrir la Consola del Navegador
- **Chrome/Edge:** `F12` o `Ctrl + Shift + I`
- **Firefox:** `F12` o `Ctrl + Shift + K`
- Ve a la pestaña **Console**

### 2. Revisar los Logs Detallados
Busca estos mensajes en la consola:

```
🔍 [fetchStoryFromUrl] Extrayendo story desde URL: https://...
📍 [fetchStoryFromUrl] Ruta relativa extraída: /estados/articulo/
🌐 [fetchStoryFromUrl] Llamando a API: https://wy1k8mgsuc...
📡 [fetchStoryFromUrl] Respuesta HTTP: { status: 404, ... }
```

### 3. Usar la Herramienta de Diagnóstico

En la consola del navegador, ejecuta:

```javascript
// Probar la URL que está fallando
testUrl('https://www.eluniversal.com.mx/estados/privan-de-la-libertad-a-seis-personas-en-carretera-de-sinaloa-una-mujer-fue-liberada-y-abandonada-con-lesiones/')
```

Esto mostrará información detallada sobre qué está pasando.

---

## 💡 Causas Comunes del Error 404

### ✅ 1. **El artículo no existe en la base de datos**

**Síntoma:** La URL es correcta pero la API devuelve 404

**Posibles razones:**
- El artículo aún no ha sido indexado en el sistema
- El artículo fue despublicado o eliminado
- Hay un retraso entre la publicación y la indexación

**Solución:**
1. Verifica que el artículo sea accesible en `https://www.eluniversal.com.mx/...`
2. Espera unos minutos y vuelve a intentar
3. Contacta al equipo de backend si el problema persiste

---

### ✅ 2. **Error de tipeo en la URL**

**Síntoma:** La URL tiene caracteres incorrectos o falta alguna parte

**Ejemplos de errores comunes:**
```
❌ /estados/privan-de-la-libertad-a-seis-persona/  (falta "s")
❌ /estadso/privan-de-la-libertad-...  (typo en "estados")
❌ /estados/privan-de-la-libertad  (falta el trailing slash /)
```

**Solución:**
1. Copia la URL directamente desde el navegador
2. Asegúrate de copiar la URL completa
3. Verifica que no haya espacios extras

---

### ✅ 3. **URL sin trailing slash**

**Síntoma:** La URL funciona en el navegador pero falla en la API

**Ejemplo:**
```
❌ /estados/articulo-ejemplo
✅ /estados/articulo-ejemplo/
```

**Solución:**
Asegúrate de que la URL termine con `/`

---

### ✅ 4. **Artículo en staging o preview**

**Síntoma:** El artículo existe pero está en modo preview/staging

**Solución:**
La API solo funciona con artículos **publicados**. Espera a que el artículo sea publicado públicamente.

---

## 🛠️ Herramientas de Diagnóstico

### Opción 1: Herramienta en Consola

Abre la consola del navegador y ejecuta:

```javascript
// Probar una URL específica
await testUrl('URL_AQUÍ')

// Verificar la salud de la API con URLs de prueba
await checkApiHealth()

// Comparar diferentes formatos de la misma URL
compareUrlFormats('URL_AQUÍ')
```

### Opción 2: cURL en Terminal

```bash
# Probar directamente la API
curl "https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories?website=eluniversal&website_url=/estados/articulo-ejemplo/"

# Si devuelve 404, el artículo no está en la base de datos
# Si devuelve 200, el problema está en el código
```

### Opción 3: Logs Detallados

El código ya incluye logging extensivo. Revisa la consola para ver:

```
🔍 URL original
📍 Pathname extraído
🌐 URL de API construida
📡 Status de respuesta
📄 Body de respuesta
```

---

## ✅ URLs de Prueba que Funcionan

Usa estas URLs para verificar que el sistema funcione correctamente:

### **Espectáculos:**
```
https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/
```

### **Estados:**
```
https://www.eluniversal.com.mx/estados/explota-ducto-de-pemex-en-oaxaca-reportan-tres-muertos-y-seis-lesionados/
```

### **Deportes:**
```
https://www.eluniversal.com.mx/deportes/donovan-carrillo-clasifica-a-la-final-del-campeonato-mundial-en-boston/
```

---

## 🔧 Pasos de Resolución

### Paso 1: Verificar la URL en el Navegador
1. Abre la URL en una nueva pestaña
2. Asegúrate de que el artículo cargue correctamente
3. Copia la URL completa desde la barra de direcciones

### Paso 2: Revisar la Consola
1. Abre la consola del navegador (`F12`)
2. Busca mensajes con emoji 🔍📡❌
3. Identifica el status code exacto

### Paso 3: Usar la Herramienta de Diagnóstico
```javascript
await testUrl('TU_URL_AQUÍ')
```

### Paso 4: Interpretar el Resultado

#### Si obtienes 200 ✅
- El artículo existe
- El problema puede estar en el parsing
- Revisa los logs de `parseStoryToNotification`

#### Si obtienes 404 ❌
- El artículo no está en la base de datos
- Verifica que la URL sea correcta
- Prueba con una URL que sepas que funciona

#### Si obtienes 500 ❌
- Error del servidor
- Contacta al equipo de backend
- Intenta de nuevo más tarde

---

## 📞 Cuándo Contactar a Backend

Contacta al equipo de backend si:
- ✅ La URL funciona en el navegador
- ✅ Has probado con múltiples URLs
- ✅ Otras URLs de prueba también fallan
- ✅ El problema persiste después de 30 minutos

**Información a proveer:**
1. URL que está fallando
2. Logs de la consola (copia completa)
3. Resultado de `testUrl()`
4. Timestamp de cuando empezó el problema

---

## 🔄 Workaround Temporal (Si aplica)

Si necesitas continuar trabajando mientras se resuelve un problema de backend:

1. Usa las URLs de prueba que sabes que funcionan
2. Guarda las URLs problemáticas en una lista
3. Intenta de nuevo más tarde cuando el artículo esté indexado

---

## 📋 Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] La URL funciona en el navegador
- [ ] La URL termina con `/`
- [ ] No hay espacios o caracteres raros
- [ ] El artículo está publicado (no en preview)
- [ ] Has revisado los logs de la consola
- [ ] Has probado con una URL de prueba conocida
- [ ] Has usado `testUrl()` para diagnóstico
- [ ] El problema persiste después de 5 minutos

---

## 🎯 Ejemplo Completo de Diagnóstico

```javascript
// 1. Probar URL problemática
console.log('=== DIAGNÓSTICO DE URL ===')
const result = await testUrl('https://www.eluniversal.com.mx/estados/privan-de-la-libertad-a-seis-personas-en-carretera-de-sinaloa-una-mujer-fue-liberada-y-abandonada-con-lesiones/')

// 2. Si falla, probar URL conocida
if (!result.success) {
  console.log('\n=== PROBANDO URL CONOCIDA ===')
  const testResult = await testUrl('https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/')
  
  if (testResult.success) {
    console.log('✅ El sistema funciona, la URL original no está en la BD')
  } else {
    console.log('❌ Hay un problema general con la API')
  }
}

// 3. Verificar salud general de la API
console.log('\n=== VERIFICANDO SALUD DE API ===')
await checkApiHealth()
```

---

## 📚 Recursos Adicionales

- **Documentación completa:** [FLUJO_NOTIFICACIONES_URL.md](FLUJO_NOTIFICACIONES_URL.md)
- **Mocks para testing:** [mocks-y-ejemplos.ts](mocks-y-ejemplos.ts)
- **Código de fetch:** [src/notificaciones/fetchStoryFromUrl.ts](src/notificaciones/fetchStoryFromUrl.ts)
- **Validación de URLs:** [src/notificaciones/validateUrl.ts](src/notificaciones/validateUrl.ts)

---

**Última actualización:** 2026-02-10  
**Mantenido por:** Equipo de Desarrollo  
**Versión:** 1.0.0
