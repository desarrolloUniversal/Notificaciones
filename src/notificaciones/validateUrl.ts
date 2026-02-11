// src/notificaciones/validateUrl.ts

/**
 * Valida si una URL es de El Universal
 */
export const isElUniversalUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.includes('eluniversal.com.mx')
  } catch {
    // Si no es una URL válida, asumimos que es una ruta relativa válida
    return url.startsWith('/')
  }
}

/**
 * Valida el formato básico de una URL para artículos de El Universal
 */
export const validateArticleUrl = (url: string): { valid: boolean; message?: string } => {
  if (!url || url.trim().length === 0) {
    return {
      valid: false,
      message: 'La URL no puede estar vacía'
    }
  }

  const trimmedUrl = url.trim()

  // Verificar si es una URL completa o relativa
  if (!trimmedUrl.startsWith('http') && !trimmedUrl.startsWith('/')) {
    return {
      valid: false,
      message: 'La URL debe empezar con "https://" o "/" para rutas relativas'
    }
  }

  // Si es una URL completa, verificar que sea de El Universal
  if (trimmedUrl.startsWith('http')) {
    if (!isElUniversalUrl(trimmedUrl)) {
      return {
        valid: false,
        message: 'La URL debe ser de eluniversal.com.mx'
      }
    }
  }

  // Verificar que no sea solo el dominio
  if (trimmedUrl === 'https://www.eluniversal.com.mx' || 
      trimmedUrl === 'https://www.eluniversal.com.mx/' ||
      trimmedUrl === '/') {
    return {
      valid: false,
      message: 'Debes ingresar la URL completa de un artículo específico'
    }
  }

  return { valid: true }
}

/**
 * Extrae información de una URL antes de enviarla a la API
 */
export const analyzeUrl = (url: string): {
  isValid: boolean
  originalUrl: string
  pathname: string
  section: string | null
  error?: string
} => {
  try {
    const trimmedUrl = url.trim()
    
    let pathname = ''
    if (trimmedUrl.startsWith('http')) {
      const urlObj = new URL(trimmedUrl)
      pathname = urlObj.pathname
    } else {
      pathname = trimmedUrl.startsWith('/') ? trimmedUrl : `/${trimmedUrl}`
    }

    // Extraer sección del pathname
    const pathParts = pathname.split('/').filter(p => p.length > 0)
    const section = pathParts.length > 0 ? pathParts[0] : null

    return {
      isValid: true,
      originalUrl: trimmedUrl,
      pathname,
      section
    }
  } catch (error) {
    return {
      isValid: false,
      originalUrl: url,
      pathname: '',
      section: null,
      error: error instanceof Error ? error.message : 'Error al analizar URL'
    }
  }
}

/**
 * Sugerencias de URLs para testing
 */
export const SUGGESTED_URLS = [
  {
    label: 'Espectáculos',
    url: 'https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/'
  },
  {
    label: 'Estados',
    url: 'https://www.eluniversal.com.mx/estados/explota-ducto-de-pemex-en-oaxaca-reportan-tres-muertos-y-seis-lesionados/'
  },
  {
    label: 'Deportes',
    url: 'https://www.eluniversal.com.mx/deportes/donovan-carrillo-clasifica-a-la-final-del-campeonato-mundial-en-boston/'
  }
]
