// src/notificaciones/parseStoryToNotification.ts
import type { StoryApiResponse, PendingNotificationFromUrl } from './types/notificacionesTypes'
import { useAuthStore } from '../auth/useAuthStore'

/**
 * Normaliza texto UTF-8 y capitaliza la primera letra
 * Maneja caracteres especiales y acentos correctamente
 */
const normalizeAndCapitalize = (text: string): string => {
  if (!text) return ''
  
  // Desescapar secuencias literales \uXXXX (doble escapado de la API)
  const unescaped = text.replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
  
  // Limpiar secuencias de escape literales que la API devuelve sin parsear
  const cleaned = unescaped
    .split('\\"').join('"')  // \" → "
    .split("\\'").join("'")  // \' → '
    .split('\\\\').join('\\') // \\\\ → \\
    .split('\\n').join(' ')   // \n literal → espacio
    .split('\\t').join(' ')   // \t literal → espacio

  // Quitar comillas externas que envuelven todo el texto (ej. "título completo")
  const trimmed = cleaned.replace(/^"(.*)"$/, '$1')

  // Normalizar UTF-8 (NFC para componer)
  const normalized = trimmed.normalize('NFC')
  
  // Capitalizar primera letra
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

/**
 * Parsea un JSON string de forma segura
 * Retorna el objeto parseado o el valor original si falla
 */
const safeJsonParse = <T = any>(jsonString: string | object, defaultValue: T = {} as T): T => {
  if (typeof jsonString === 'object') {
    return jsonString as T
  }
  
  try {
    return JSON.parse(jsonString) as T
  } catch (error) {
    console.warn('⚠️ [parseStoryToNotification] Error parseando JSON:', error)
    return defaultValue
  }
}

/**
 * Extrae la URL del thumbnail desde promo_items.basic
 */
const extractThumbnail = (promoItemsString: string): string => {
  const promoItems = safeJsonParse<any>(promoItemsString)
  
  if (!promoItems?.basic) {
    return ''
  }
  
  const basic = promoItems.basic
  
  // Intentar obtener URL completa o construir desde resizeUrl
  if (basic.url) {
    return basic.url
  }
  
  if (basic.additional_properties?.fullSizeResizeUrl) {
    return `https://www.eluniversal.com.mx${basic.additional_properties.fullSizeResizeUrl}`
  }
  
  if (basic.additional_properties?.resizeUrl) {
    return `https://www.eluniversal.com.mx${basic.additional_properties.resizeUrl}`
  }
  
  return ''
}

/**
 * Extrae la sección desde taxonomy.primary_section.name o primary_section_path
 */
const extractSeccion = (taxonomyString: string, primarySectionPath: string): string => {
  const taxonomy = safeJsonParse<any>(taxonomyString)
  
  // Intentar obtener desde taxonomy.primary_section.name
  if (taxonomy?.primary_section?.name) {
    return normalizeAndCapitalize(taxonomy.primary_section.name)
  }
  
  // Fallback: mapear desde primary_section_path
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
  
  // Fallback: eliminar la / inicial, tomar el primer segmento y capitalizar
  const cleanPath = primarySectionPath.replace(/^\//, '').split('/')[0]
  return pathToName[primarySectionPath] || (cleanPath ? normalizeAndCapitalize(cleanPath) : 'General')
}

/**
 * Extrae el título desde headlines_basic
 */
const extractTitulo = (headlinesBasicString: string): string => {
  return normalizeAndCapitalize(headlinesBasicString)
}

/**
 * Extrae el subtítulo desde subheadlines_basic
 */
const extractSubtitulo = (subheadlinesBasicString: string): string => {
  return normalizeAndCapitalize(subheadlinesBasicString)
}

/**
 * Parsea una respuesta de StoryApiResponse a PendingNotificationFromUrl
 * Normaliza UTF-8 y capitaliza primera letra de todos los campos
 * 
 * @param storyData Respuesta de la API de stories
 * @param originalUrl URL original ingresada por el usuario
 * @returns Notificación pendiente lista para enviar
 */
export const parseStoryToNotification = (
  storyData: StoryApiResponse, 
  originalUrl: string
): PendingNotificationFromUrl => {
  const thumbnail = extractThumbnail(storyData.promo_items || '{}')
  const seccion = extractSeccion(storyData.taxonomy || '{}', storyData.primary_section_path || '')
  const titulo = extractTitulo(storyData.headlines_basic || '')
  const subtitulo = extractSubtitulo(storyData.subheadlines_basic || '')
  
  // Construir URL completa si es necesaria
  const baseUrl = 'https://www.eluniversal.com.mx'
  const fullUrl = storyData.canonical_url 
    ? `${baseUrl}${storyData.canonical_url}` 
    : originalUrl
  
  // Obtener usuario actual de la sesión
  const currentUser = useAuthStore.getState().username || 'Sistema'
  
  const notification: PendingNotificationFromUrl = {
    id: storyData.idarticulo,
    thumbnail,
    seccion,
    titulo,
    subtitulo,
    url: fullUrl,
    estadoEnvio: 'Pendiente',
    fechaEnvio: null,
    usuarios: currentUser,
    timestamp: new Date().toISOString(),
  }
  
  return notification
}
