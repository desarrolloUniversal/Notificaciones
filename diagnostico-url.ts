// 🔧 HERRAMIENTA DE DIAGNÓSTICO DE URLs
// Usar en la consola del navegador para debuggear problemas con URLs

/**
 * Prueba una URL contra la API de stories y muestra información detallada
 * 
 * USO EN CONSOLA:
 * 
 * import { testUrl } from './diagnostico-url.ts'
 * await testUrl('https://www.eluniversal.com.mx/espectaculos/articulo/')
 */

const STORIES_API_BASE_URL = 'https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories'
const WEBSITE = 'eluniversal'

export const testUrl = async (fullUrl: string) => {
  console.log('═══════════════════════════════════════')
  console.log('🔧 DIAGNÓSTICO DE URL')
  console.log('═══════════════════════════════════════')
  console.log('')
  
  // 1. Analizar URL
  console.log('📋 1. ANÁLISIS DE URL')
  console.log('─────────────────────')
  console.log('URL original:', fullUrl)
  
  let pathname = ''
  try {
    if (fullUrl.startsWith('http')) {
      const url = new URL(fullUrl)
      pathname = url.pathname
      console.log('✅ URL válida')
      console.log('   Hostname:', url.hostname)
      console.log('   Pathname:', pathname)
    } else {
      pathname = fullUrl.startsWith('/') ? fullUrl : `/${fullUrl}`
      console.log('✅ Ruta relativa detectada')
      console.log('   Pathname:', pathname)
    }
  } catch (error) {
    console.error('❌ Error parseando URL:', error)
    return
  }
  
  console.log('')
  
  // 2. Construir URL de API
  console.log('📋 2. CONSTRUCCIÓN DE URL DE API')
  console.log('─────────────────────')
  const apiUrl = `${STORIES_API_BASE_URL}?website=${WEBSITE}&website_url=${encodeURIComponent(pathname)}`
  console.log('URL de API:', apiUrl)
  console.log('Parámetros:')
  console.log('   website:', WEBSITE)
  console.log('   website_url:', pathname)
  console.log('   website_url (encoded):', encodeURIComponent(pathname))
  console.log('')
  
  // 3. Hacer fetch
  console.log('📋 3. LLAMADA A API')
  console.log('─────────────────────')
  console.log('Enviando petición...')
  
  try {
    const startTime = Date.now()
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('')
    console.log('📡 RESPUESTA RECIBIDA')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok)
    console.log('   Duración:', duration + 'ms')
    console.log('   Headers:')
    response.headers.forEach((value, key) => {
      console.log(`      ${key}: ${value}`)
    })
    
    console.log('')
    
    // 4. Leer body
    console.log('📋 4. CONTENIDO DE RESPUESTA')
    console.log('─────────────────────')
    
    const text = await response.text()
    
    if (response.ok) {
      console.log('✅ RESPUESTA EXITOSA')
      
      try {
        const data = JSON.parse(text)
        console.log('')
        console.log('📊 DATOS PARSEADOS:')
        console.log('   ID Artículo:', data.idarticulo || '❌ NO ENCONTRADO')
        console.log('   Título:', data.headlines_basic ? JSON.parse(data.headlines_basic).substring(0, 60) + '...' : '❌ NO ENCONTRADO')
        console.log('   Sección:', data.primary_section_path || '❌ NO ENCONTRADO')
        console.log('   Fecha:', data.display_date || '❌ NO ENCONTRADO')
        console.log('   Thumbnail:', data.promo_items ? '✅ Sí' : '❌ No')
        console.log('')
        console.log('🔍 OBJETO COMPLETO:')
        console.log(data)
        
        return { success: true, data }
      } catch (parseError) {
        console.error('❌ ERROR PARSEANDO JSON:', parseError)
        console.log('Raw text:', text)
        return { success: false, error: 'Error parseando JSON' }
      }
    } else {
      console.log('❌ RESPUESTA CON ERROR')
      console.log('')
      console.log('Body de error:', text || '(vacío)')
      
      if (response.status === 404) {
        console.log('')
        console.log('💡 POSIBLES CAUSAS DEL ERROR 404:')
        console.log('   1. La URL no existe en la base de datos')
        console.log('   2. El artículo no está publicado todavía')
        console.log('   3. Hay un error de tipeo en la URL')
        console.log('   4. El artículo fue eliminado o despublicado')
        console.log('')
        console.log('🔧 QUÉ HACER:')
        console.log('   • Verifica la URL en un navegador')
        console.log('   • Asegúrate de que el artículo esté visible públicamente')
        console.log('   • Intenta con otra URL que sepas que funciona')
        console.log('   • Contacta al equipo de backend si el problema persiste')
      }
      
      return { success: false, error: `HTTP ${response.status}`, body: text }
    }
  } catch (error) {
    console.log('')
    console.error('❌ ERROR EN LA PETICIÓN:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' }
  } finally {
    console.log('')
    console.log('═══════════════════════════════════════')
  }
}

/**
 * Prueba múltiples URLs en batch
 */
export const testMultipleUrls = async (urls: string[]) => {
  console.log('🧪 Probando', urls.length, 'URLs...')
  console.log('')
  
  const results = []
  
  for (let i = 0; i < urls.length; i++) {
    console.log(`\n[${i + 1}/${urls.length}]`)
    const result = await testUrl(urls[i])
    results.push({ url: urls[i], ...result })
    
    // Delay entre peticiones para no sobrecargar la API
    if (i < urls.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  console.log('\n\n📊 RESUMEN DE PRUEBAS')
  console.log('═══════════════════════════════════════')
  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length
  
  console.log(`✅ Exitosas: ${successful}`)
  console.log(`❌ Fallidas: ${failed}`)
  console.log('')
  
  if (failed > 0) {
    console.log('URLs fallidas:')
    results.filter(r => !r.success).forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.url}`)
      console.log(`      Error: ${r.error}`)
    })
  }
  
  return results
}

/**
 * Verifica la disponibilidad de la API
 */
export const checkApiHealth = async () => {
  console.log('🏥 Verificando salud de la API...')
  console.log('')
  
  const testUrls = [
    'https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/',
    'https://www.eluniversal.com.mx/deportes/donovan-carrillo-clasifica-a-la-final-del-campeonato-mundial-en-boston/',
    'https://www.eluniversal.com.mx/estados/explota-ducto-de-pemex-en-oaxaca-reportan-tres-muertos-y-seis-lesionados/'
  ]
  
  const results = await testMultipleUrls(testUrls)
  
  const allSuccessful = results.every(r => r.success)
  
  if (allSuccessful) {
    console.log('\n✅ API funcionando correctamente')
  } else {
    console.log('\n⚠️ Hay problemas con la API')
  }
  
  return { healthy: allSuccessful, results }
}

/**
 * Comparar pathname de diferentes formatos de URL
 */
export const compareUrlFormats = (url: string) => {
  console.log('🔍 COMPARACIÓN DE FORMATOS DE URL')
  console.log('═══════════════════════════════════════')
  console.log('URL original:', url)
  console.log('')
  
  const formats = [
    { name: 'Original', url: url },
    { name: 'Sin trailing slash', url: url.replace(/\/$/, '') },
    { name: 'Con trailing slash', url: url.endsWith('/') ? url : url + '/' },
  ]
  
  formats.forEach(format => {
    try {
      const urlObj = new URL(format.url)
      console.log(`${format.name}:`)
      console.log('   URL completa:', format.url)
      console.log('   Pathname:', urlObj.pathname)
      console.log('   Pathname encoded:', encodeURIComponent(urlObj.pathname))
      console.log('')
    } catch (error) {
      console.log(`${format.name}: ❌ URL inválida`)
    }
  })
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  (window as any).testUrl = testUrl
  (window as any).testMultipleUrls = testMultipleUrls
  (window as any).checkApiHealth = checkApiHealth
  (window as any).compareUrlFormats = compareUrlFormats
  
  console.log('🔧 Herramientas de diagnóstico cargadas:')
  console.log('   • testUrl(url)')
  console.log('   • testMultipleUrls([url1, url2, ...])')
  console.log('   • checkApiHealth()')
  console.log('   • compareUrlFormats(url)')
}

export default {
  testUrl,
  testMultipleUrls,
  checkApiHealth,
  compareUrlFormats
}
