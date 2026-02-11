// 🚀 SCRIPT DE PRUEBA RÁPIDA - Copiar y pegar en la consola del navegador
// Este script probará tu URL específica y te dirá exactamente qué está pasando

(async function testUrlProblematica() {
  console.clear()
  console.log('%c🔧 DIAGNÓSTICO RÁPIDO DE URL', 'font-size: 20px; font-weight: bold; color: #4CAF50')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  
  // Tu URL problemática
  const urlProblematica = 'https://www.eluniversal.com.mx/estados/privan-de-la-libertad-a-seis-personas-en-carretera-de-sinaloa-una-mujer-fue-liberada-y-abandonada-con-lesiones/'
  
  console.log('📋 URL a probar:', urlProblematica)
  console.log('')
  
  // Extraer pathname
  let pathname = ''
  try {
    const url = new URL(urlProblematica)
    pathname = url.pathname
    console.log('✅ URL parseada correctamente')
    console.log('   Hostname:', url.hostname)
    console.log('   Pathname:', pathname)
  } catch (error) {
    console.error('❌ Error parseando URL:', error)
    return
  }
  
  console.log('')
  console.log('─────────────────────────────────────────────────────────')
  console.log('')
  
  // Construir URL de API
  const STORIES_API_BASE_URL = 'https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories'
  const WEBSITE = 'eluniversal'
  const apiUrl = `${STORIES_API_BASE_URL}?website=${WEBSITE}&website_url=${encodeURIComponent(pathname)}`
  
  console.log('🌐 URL de API construida:')
  console.log(apiUrl)
  console.log('')
  console.log('📦 Parámetros:')
  console.log('   website:', WEBSITE)
  console.log('   website_url:', pathname)
  console.log('   website_url (encoded):', encodeURIComponent(pathname))
  console.log('')
  console.log('─────────────────────────────────────────────────────────')
  console.log('')
  console.log('⏳ Enviando petición a la API...')
  
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
    console.log('%c📡 RESPUESTA RECIBIDA', 'font-size: 16px; font-weight: bold')
    console.log('   Status:', response.status, response.statusText)
    console.log('   OK:', response.ok ? '✅' : '❌')
    console.log('   Duración:', duration + 'ms')
    console.log('')
    
    const text = await response.text()
    
    if (response.ok) {
      // ✅ ÉXITO
      console.log('%c✅ ¡ÉXITO! La API devolvió el artículo', 'font-size: 16px; font-weight: bold; color: #4CAF50')
      console.log('')
      
      const data = JSON.parse(text)
      console.log('📊 INFORMACIÓN DEL ARTÍCULO:')
      console.log('   ID:', data.idarticulo)
      console.log('   Título:', data.headlines_basic ? JSON.parse(data.headlines_basic).substring(0, 100) : 'Sin título')
      console.log('   Sección:', data.primary_section_path)
      console.log('   Fecha:', data.display_date)
      console.log('')
      console.log('🎉 El artículo existe en la base de datos')
      console.log('💡 Si aún tienes problemas, el error puede estar en el parsing')
      console.log('')
      console.log('🔍 Datos completos:')
      console.log(data)
      
    } else if (response.status === 404) {
      // ❌ ERROR 404
      console.log('%c❌ ERROR 404 - ARTÍCULO NO ENCONTRADO', 'font-size: 16px; font-weight: bold; color: #f44336')
      console.log('')
      console.log('Body de respuesta:', text || '(vacío)')
      console.log('')
      console.log('%c💡 POSIBLES CAUSAS:', 'font-weight: bold')
      console.log('')
      console.log('1️⃣  El artículo aún no ha sido indexado en el sistema')
      console.log('    → Espera unos minutos y vuelve a intentar')
      console.log('')
      console.log('2️⃣  El artículo no está publicado todavía')
      console.log('    → Verifica que el artículo sea accesible públicamente')
      console.log('')
      console.log('3️⃣  Hay un error de tipeo en la URL')
      console.log('    → Copia la URL directamente desde el navegador')
      console.log('')
      console.log('4️⃣  El artículo fue despublicado o eliminado')
      console.log('    → Contacta al equipo de contenido')
      console.log('')
      console.log('%c🔧 QUÉ HACER AHORA:', 'font-weight: bold')
      console.log('')
      console.log('✅ Abre la URL en una pestaña nueva:')
      console.log(`   ${urlProblematica}`)
      console.log('')
      console.log('✅ Verifica que el artículo cargue correctamente')
      console.log('')
      console.log('✅ Si el artículo carga pero sigue dando 404:')
      console.log('   → El artículo no está en la base de datos de la API')
      console.log('   → Contacta al equipo de backend')
      console.log('')
      
      // Probar con una URL conocida
      console.log('─────────────────────────────────────────────────────────')
      console.log('')
      console.log('🧪 Probando con una URL conocida para verificar que la API funcione...')
      console.log('')
      
      const urlPrueba = 'https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/'
      const pathnamePrueba = new URL(urlPrueba).pathname
      const apiUrlPrueba = `${STORIES_API_BASE_URL}?website=${WEBSITE}&website_url=${encodeURIComponent(pathnamePrueba)}`
      
      const responsePrueba = await fetch(apiUrlPrueba)
      
      if (responsePrueba.ok) {
        console.log('%c✅ La API funciona correctamente con otras URLs', 'font-weight: bold; color: #4CAF50')
        console.log('')
        console.log('📌 CONCLUSIÓN:')
        console.log('   → El problema es específico de tu URL')
        console.log('   → El artículo no está en la base de datos')
        console.log('   → Espera a que sea indexado o contacta a backend')
      } else {
        console.log('%c❌ La API también falla con URLs conocidas', 'font-weight: bold; color: #f44336')
        console.log('')
        console.log('📌 CONCLUSIÓN:')
        console.log('   → Hay un problema general con la API')
        console.log('   → Contacta inmediatamente al equipo de backend')
      }
      
    } else {
      // ❌ OTRO ERROR
      console.log(`%c❌ ERROR HTTP ${response.status}`, 'font-size: 16px; font-weight: bold; color: #f44336')
      console.log('')
      console.log('Body de respuesta:', text)
      console.log('')
      console.log('💡 Contacta al equipo de backend con esta información')
    }
    
  } catch (error) {
    console.log('')
    console.error('%c❌ ERROR EN LA PETICIÓN', 'font-size: 16px; font-weight: bold; color: #f44336')
    console.error(error)
    console.log('')
    console.log('💡 Posibles causas:')
    console.log('   • Problemas de red')
    console.log('   • CORS bloqueado')
    console.log('   • API no disponible')
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log('📚 Más información:')
  console.log('   • Ver TROUBLESHOOTING_404.md')
  console.log('   • Ejecutar: checkApiHealth()')
  console.log('')
})()
