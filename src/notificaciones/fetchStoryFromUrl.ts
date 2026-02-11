// src/notificaciones/fetchStoryFromUrl.ts
import type { StoryApiResponse } from './types/notificacionesTypes'

// URL directa del servidor de la API de stories
const STORIES_API_BASE_URL = 'https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories'
const WEBSITE = 'eluniversal'

/**
 * Extrae la ruta relativa de una URL completa
 * Ejemplo: https://www.eluniversal.com.mx/espectaculos/articulo → /espectaculos/articulo
 */
export const extractWebsiteUrl = (fullUrl: string): string => {
  try {
    const url = new URL(fullUrl)
    return url.pathname
  } catch {
    // Si no es una URL válida, asumir que ya es la ruta relativa
    return fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`
  }
}

/**
 * Hace fetch a la API de stories para obtener información de un artículo
 * @param fullUrl URL completa o relativa del artículo
 * @returns Respuesta de la API con todos los datos del story
 * @throws Error si la petición falla o la respuesta es inválida
 */
export const fetchStoryFromUrl = async (fullUrl: string): Promise<StoryApiResponse> => {
  try {
    // Extraer la ruta relativa
    const websiteUrl = extractWebsiteUrl(fullUrl)
    
    // Construir URL de la API
    const apiUrl = `${STORIES_API_BASE_URL}?website=${WEBSITE}&website_url=${encodeURIComponent(websiteUrl)}`
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    // Intentar leer el body incluso si hay error
    let responseText = ''
    try {
      responseText = await response.text()
    } catch (textError) {
      console.error('⚠️ [fetchStoryFromUrl] No se pudo leer el body:', textError)
    }
    
    // Manejar errores HTTP con mensajes específicos
    if (!response.ok) {
      let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`
      
      if (response.status === 404) {
        errorMessage = `❌ Artículo no encontrado (404)\n\n` +
          `La URL "${websiteUrl}" no existe en la base de datos.\n\n` +
          `Verifica que:\n` +
          `• La URL sea correcta y esté publicada\n` +
          `• El artículo esté disponible en eluniversal.com.mx\n` +
          `• No haya errores de tipeo en la URL`
      } else if (response.status === 403) {
        errorMessage = `❌ Acceso prohibido (403)\n\nNo tienes permisos para acceder a este recurso`
      } else if (response.status === 500) {
        errorMessage = `❌ Error del servidor (500)\n\nHay un problema con el servidor de la API`
      }
      
      throw new Error(errorMessage)
    }
    
    // Parsear JSON
    let data: StoryApiResponse
    try {
      data = JSON.parse(responseText) as StoryApiResponse
    } catch (parseError) {
      console.error('❌ [fetchStoryFromUrl] Error parseando JSON:', parseError)
      throw new Error(`Error al parsear respuesta JSON: ${parseError instanceof Error ? parseError.message : 'Error desconocido'}`)
    }
    
    // Validar que tenga los campos mínimos necesarios
    if (!data.idarticulo) {
      console.error('❌ [fetchStoryFromUrl] Respuesta sin idarticulo:', data)
      throw new Error('La respuesta no contiene un ID de artículo válido. La API devolvió datos incompletos.')
    }
    
    return data
  } catch (error) {
    console.error('❌ [fetchStoryFromUrl] Error al obtener story:', error)
    throw error instanceof Error ? error : new Error('Error desconocido al obtener story')
  }
}
