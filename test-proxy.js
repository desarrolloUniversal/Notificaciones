// 🧪 TEST RÁPIDO DEL PROXY - Ejecutar en la consola del navegador
// Este script verifica que el proxy de Vite esté funcionando correctamente

(async function testProxy() {
  console.clear()
  console.log('%c🧪 VERIFICACIÓN DEL PROXY DE VITE', 'font-size: 20px; font-weight: bold; color: #2196F3')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  
  // 1. Verificar entorno
  console.log('📋 1. VERIFICACIÓN DE ENTORNO')
  console.log('─────────────────────────────────────')
  const isDev = import.meta.env.DEV
  const mode = import.meta.env.MODE
  
  console.log('Modo:', mode)
  console.log('Es desarrollo:', isDev ? '✅ Sí' : '❌ No')
  console.log('')
  
  if (!isDev) {
    console.log('%c⚠️ ADVERTENCIA: No estás en modo desarrollo', 'font-weight: bold; color: #ff9800')
    console.log('El proxy solo funciona con npm run dev')
    console.log('')
    return
  }
  
  // 2. Probar URL local (proxy)
  console.log('📋 2. PROBANDO PROXY LOCAL')
  console.log('─────────────────────────────────────')
  
  const urlLocal = '/api/stories?website=eluniversal&website_url=/nacion/entre-protestas-reforma-de-40-horas-light-avanza-en-comisiones-del-senado-iniciativa-no-contempla-dos-dias-de-descanso/'
  
  console.log('URL de prueba (proxy):', urlLocal)
  console.log('⏳ Enviando petición...')
  console.log('')
  
  try {
    const startTime = Date.now()
    const response = await fetch(urlLocal)
    const duration = Date.now() - startTime
    
    console.log('%c✅ RESPUESTA RECIBIDA', 'font-weight: bold; color: #4CAF50')
    console.log('Status:', response.status, response.statusText)
    console.log('OK:', response.ok)
    console.log('Duración:', duration + 'ms')
    console.log('URL final:', response.url)
    console.log('')
    
    // Verificar que sea localhost (proxy funcionando)
    if (response.url.includes('localhost') || response.url.includes('127.0.0.1')) {
      console.log('%c✅ PROXY FUNCIONANDO CORRECTAMENTE', 'font-size: 16px; font-weight: bold; color: #4CAF50')
      console.log('La petición pasó por el proxy de Vite')
    } else {
      console.log('%c⚠️ POSIBLE PROBLEMA', 'font-weight: bold; color: #ff9800')
      console.log('La petición no pasó por localhost')
      console.log('URL de respuesta:', response.url)
    }
    
    console.log('')
    console.log('Headers de respuesta:')
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`)
    })
    
    console.log('')
    
    if (response.ok) {
      const text = await response.text()
      
      try {
        const data = JSON.parse(text)
        console.log('%c📊 DATOS DEL ARTÍCULO', 'font-weight: bold')
        console.log('ID:', data.idarticulo || '❌ No encontrado')
        console.log('Título:', data.headlines_basic ? JSON.parse(data.headlines_basic).substring(0, 80) + '...' : '❌ No encontrado')
        console.log('Sección:', data.primary_section_path || '❌ No encontrado')
        console.log('')
        console.log('✅ El proxy está funcionando y la API responde correctamente')
      } catch (parseError) {
        console.log('Body de respuesta:', text.substring(0, 200))
      }
    } else {
      const text = await response.text()
      console.log('%c❌ ERROR EN LA RESPUESTA', 'font-weight: bold; color: #f44336')
      console.log('Body:', text)
      console.log('')
      
      if (response.status === 404) {
        console.log('💡 El proxy funciona, pero el artículo no existe en la BD')
      }
    }
    
  } catch (error) {
    console.log('')
    console.error('%c❌ ERROR EN LA PETICIÓN', 'font-size: 16px; font-weight: bold; color: #f44336')
    console.error(error)
    console.log('')
    
    if (error.message && error.message.includes('CORS')) {
      console.log('%c🔴 PROBLEMA: Todavía hay error CORS', 'font-weight: bold; color: #f44336')
      console.log('')
      console.log('Posibles causas:')
      console.log('1. No reiniciaste el servidor de Vite')
      console.log('   → Detener (Ctrl+C) y ejecutar: npm run dev')
      console.log('')
      console.log('2. La configuración del proxy no tomó efecto')
      console.log('   → Verifica vite.config.ts')
    } else {
      console.log('Error inesperado:', error.message)
    }
  }
  
  console.log('')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('')
  console.log('📚 Más información: Ver SOLUCION_CORS.md')
  console.log('')
  
})()
