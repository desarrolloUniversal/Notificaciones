// 🧪 MOCKS Y EJEMPLOS DE TESTING
// Este archivo contiene datos de prueba para el desarrollo y testing del sistema de notificaciones

import type { 
  StoryApiResponse, 
  PendingNotificationFromUrl,
  NotificationSendPayload 
} from './src/notificaciones/types/notificacionesTypes'

// ============================================================================
// MOCK: Respuesta completa de la API de Stories
// ============================================================================

export const MOCK_STORY_API_RESPONSE: StoryApiResponse = {
  canonical_url: "/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/",
  content_elements: JSON.stringify([
    {
      _id: "RLKXNIRCS5GGRPBQYKHCQH7OLA",
      type: "text",
      content: "<b>Eduardo \"Lalo\" Salazar</b> confirma que está dándose una nueva oportunidad en el amor..."
    },
    {
      _id: "3CAPX7FEVFAWFMY4LZR3PFJYFI",
      type: "text",
      content: "La tarde de ayer, 5 de noviembre, diferentes medios de comunicación publicaron las imágenes..."
    }
  ]),
  content_restrictions: JSON.stringify({ content_code: "libre" }),
  created_date: "2025-11-06T16:21:48.84Z",
  credits: JSON.stringify({
    by: [{
      name: "Mariana Lebrija Clavel",
      image: {
        url: "https://s3.amazonaws.com/arc-authors/eluniversal/08e76263-9b1d-403d-ac6e-30ef68b4ddc6.png"
      },
      _id: "mariana-lebrija-clavel"
    }]
  }),
  display_date: "2025-11-06T16:41:45.393Z",
  first_publish_date: "2025-11-06T16:41:45.393Z",
  headlines_basic: "\"Tras ser captado besando a una joven, Lalo Salazar confirma que se trata de su nueva relación: \\\"una mujer extraordinaria\\\"\"",
  idarticulo: "U5AYXLEIPRFSTCUBNEUSNDOQQA",
  primary_section_path: "/espectaculos",
  promo_items: JSON.stringify({
    basic: {
      url: "https://cloudfront-us-east-1.images.arcpublishing.com/eluniversal/AFQ3EEEOKZCDFFYPJPZFC4SMAQ.png",
      caption: "Lalo Salazar, conductor de noticias de Televisa.\nFotos: Instagram, vía @somos_fox",
      additional_properties: {
        fullSizeResizeUrl: "/resizer/v2/AFQ3EEEOKZCDFFYPJPZFC4SMAQ.png?auth=1d8059968f8216848af4e0684de114bfbf4b69f5e8f2a20d697e2c6405e548c3",
        resizeUrl: "/resizer/v2/AFQ3EEEOKZCDFFYPJPZFC4SMAQ.png?auth=1d8059968f8216848af4e0684de114bfbf4b69f5e8f2a20d697e2c6405e548c3"
      }
    }
  }),
  publish_date: "2025-11-06T16:41:45.393Z",
  site: "eluniversal",
  subheadlines_basic: "\"El presentador de noticias pide que no se hable más del noviazgo que sostuvo con Laura Flores\"",
  taxonomy: JSON.stringify({
    primary_section: {
      name: "Espectáculos",
      path: "/espectaculos",
      _id: "/espectaculos"
    }
  })
}

// ============================================================================
// MOCK: Notificación pendiente parseada
// ============================================================================

export const MOCK_PENDING_NOTIFICATION: PendingNotificationFromUrl = {
  id: "U5AYXLEIPRFSTCUBNEUSNDOQQA",
  thumbnail: "https://cloudfront-us-east-1.images.arcpublishing.com/eluniversal/AFQ3EEEOKZCDFFYPJPZFC4SMAQ.png",
  seccion: "Espectáculos",
  titulo: "Tras ser captado besando a una joven, Lalo Salazar confirma que se trata de su nueva relación: \"una mujer extraordinaria\"",
  subtitulo: "El presentador de noticias pide que no se hable más del noviazgo que sostuvo con Laura Flores",
  url: "https://www.eluniversal.com.mx/espectaculos/tras-ser-captado-besando-a-una-joven-lalo-salazar-confirma-que-se-trata-de-su-nueva-relacion-una-mujer-extraordinaria/",
  estadoEnvio: "Pendiente",
  fechaEnvio: null,
  usuarios: "Sistema",
  timestamp: "2026-02-10T14:30:45.123Z"
}

// ============================================================================
// MOCK: Múltiples notificaciones pendientes
// ============================================================================

export const MOCK_PENDING_NOTIFICATIONS: PendingNotificationFromUrl[] = [
  {
    id: "NOTIF001",
    thumbnail: "https://example.com/image1.jpg",
    seccion: "Deportes",
    titulo: "Cruz azul campeón del apertura 2024",
    subtitulo: "La máquina celeste se corona tras vencer en la final",
    url: "https://www.eluniversal.com.mx/deportes/cruz-azul-campeon/",
    estadoEnvio: "Pendiente",
    fechaEnvio: null,
    usuarios: "Sistema",
    timestamp: "2026-02-10T10:00:00.000Z"
  },
  {
    id: "NOTIF002",
    thumbnail: "https://example.com/image2.jpg",
    seccion: "Cultura",
    titulo: "Nuevo museo abre sus puertas en la ciudad de méxico",
    subtitulo: "Exhibición incluye obras de artistas contemporáneos",
    url: "https://www.eluniversal.com.mx/cultura/nuevo-museo/",
    estadoEnvio: "Pendiente",
    fechaEnvio: null,
    usuarios: "Sistema",
    timestamp: "2026-02-10T11:30:00.000Z"
  },
  {
    id: "NOTIF003",
    thumbnail: "https://example.com/image3.jpg",
    seccion: "Mundo",
    titulo: "Cumbre internacional aborda cambio climático",
    subtitulo: "Líderes mundiales se reúnen para acordar nuevas políticas",
    url: "https://www.eluniversal.com.mx/mundo/cumbre-climatica/",
    estadoEnvio: "Pendiente",
    fechaEnvio: null,
    usuarios: "Sistema",
    timestamp: "2026-02-10T13:00:00.000Z"
  }
]

// ============================================================================
// MOCK: Payload de envío
// ============================================================================

export const MOCK_SEND_PAYLOAD: NotificationSendPayload = {
  url: "https://www.eluniversal.com.mx/espectaculos/articulo-ejemplo/",
  titulo: "Título de la notificación",
  thumbnail: "https://example.com/image.jpg",
  seccion: "Espectáculos"
}

// ============================================================================
// MOCK: Respuesta exitosa de envío
// ============================================================================

export const MOCK_SEND_SUCCESS_RESPONSE = {
  success: true,
  message: "Notificación enviada correctamente",
  sentAt: "2026-02-10T14:30:45.123Z",
  notificationId: "NOTIF_12345",
  recipientsCount: 15000
}

// ============================================================================
// MOCK: Respuesta de error de envío
// ============================================================================

export const MOCK_SEND_ERROR_RESPONSE = {
  success: false,
  message: "Error al enviar notificación: límite de envíos alcanzado",
  errorCode: "RATE_LIMIT_EXCEEDED",
  retryAfter: 60
}

// ============================================================================
// FUNCIONES HELPER PARA TESTING
// ============================================================================

/**
 * Simula un delay asíncrono (útil para testing de UI)
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Genera una notificación pendiente de prueba con datos aleatorios
 */
export const generateMockNotification = (overrides?: Partial<PendingNotificationFromUrl>): PendingNotificationFromUrl => {
  const secciones = ['Deportes', 'Cultura', 'Mundo', 'Nación', 'Espectáculos', 'Cartera', 'Estados']
  const randomSeccion = secciones[Math.floor(Math.random() * secciones.length)]
  
  return {
    id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    thumbnail: `https://picsum.photos/seed/${Date.now()}/400/300`,
    seccion: randomSeccion,
    titulo: `Título de prueba generado automáticamente - ${new Date().toLocaleTimeString()}`,
    subtitulo: `Subtítulo de prueba generado automáticamente`,
    url: `https://www.eluniversal.com.mx/${randomSeccion.toLowerCase()}/articulo-${Date.now()}/`,
    estadoEnvio: "Pendiente",
    fechaEnvio: null,
    usuarios: "Sistema",
    timestamp: new Date().toISOString(),
    ...overrides
  }
}

/**
 * Simula una llamada a la API de stories con delay
 */
export const mockFetchStoryFromUrl = async (url: string, shouldFail: boolean = false): Promise<StoryApiResponse> => {
  await delay(1000) // Simular latencia de red
  
  if (shouldFail) {
    throw new Error(`Error al obtener story desde URL: ${url}`)
  }
  
  return MOCK_STORY_API_RESPONSE
}

/**
 * Simula el envío de una notificación con delay
 */
export const mockSendNotification = async (
  notification: PendingNotificationFromUrl, 
  shouldFail: boolean = false
): Promise<typeof MOCK_SEND_SUCCESS_RESPONSE> => {
  await delay(1500) // Simular latencia de red
  
  if (shouldFail) {
    throw new Error(MOCK_SEND_ERROR_RESPONSE.message)
  }
  
  return MOCK_SEND_SUCCESS_RESPONSE
}

// ============================================================================
// ESCENARIOS DE TESTING
// ============================================================================

/**
 * Escenario 1: Flujo completo exitoso
 * 
 * 1. Usuario ingresa URL
 * 2. Se obtiene story desde API
 * 3. Se parsea a notificación pendiente
 * 4. Se agrega a lista de pendientes
 * 5. Usuario confirma envío
 * 6. Se envía notificación exitosamente
 */
export const testScenario1_HappyPath = async () => {
  console.log('🧪 [Test Scenario 1] Iniciando flujo completo exitoso')
  
  // Paso 1: Fetch story
  const url = 'https://www.eluniversal.com.mx/espectaculos/articulo-ejemplo/'
  console.log('1️⃣ Obteniendo story desde URL:', url)
  const story = await mockFetchStoryFromUrl(url)
  console.log('✅ Story obtenido:', story.idarticulo)
  
  // Paso 2: Parsear a notificación
  console.log('2️⃣ Parseando a notificación pendiente')
  const notification = MOCK_PENDING_NOTIFICATION
  console.log('✅ Notificación creada:', notification.id)
  
  // Paso 3: Confirmar envío
  console.log('3️⃣ Enviando notificación')
  const result = await mockSendNotification(notification)
  console.log('✅ Notificación enviada:', result.message)
  
  console.log('✨ [Test Scenario 1] Flujo completo exitoso')
}

/**
 * Escenario 2: Error al obtener story
 */
export const testScenario2_FetchError = async () => {
  console.log('🧪 [Test Scenario 2] Error al obtener story')
  
  try {
    const url = 'https://www.eluniversal.com.mx/invalid-url/'
    console.log('1️⃣ Obteniendo story desde URL inválida:', url)
    await mockFetchStoryFromUrl(url, true)
  } catch (error) {
    console.error('❌ Error esperado:', error)
    console.log('✅ [Test Scenario 2] Error manejado correctamente')
  }
}

/**
 * Escenario 3: Error al enviar notificación
 */
export const testScenario3_SendError = async () => {
  console.log('🧪 [Test Scenario 3] Error al enviar notificación')
  
  const notification = MOCK_PENDING_NOTIFICATION
  
  try {
    console.log('1️⃣ Intentando enviar notificación:', notification.id)
    await mockSendNotification(notification, true)
  } catch (error) {
    console.error('❌ Error esperado:', error)
    console.log('✅ [Test Scenario 3] Error manejado correctamente')
  }
}

/**
 * Escenario 4: Múltiples notificaciones pendientes
 */
export const testScenario4_MultiplePending = () => {
  console.log('🧪 [Test Scenario 4] Múltiples notificaciones pendientes')
  
  console.log('📋 Generando 5 notificaciones de prueba:')
  const notifications = Array.from({ length: 5 }, (_, i) => 
    generateMockNotification({
      id: `TEST_NOTIF_${i + 1}`
    })
  )
  
  notifications.forEach((notif, index) => {
    console.log(`${index + 1}. ${notif.titulo} - ${notif.seccion}`)
  })
  
  console.log('✅ [Test Scenario 4] Notificaciones generadas correctamente')
  return notifications
}

// ============================================================================
// EJEMPLOS DE USO EN DESARROLLO
// ============================================================================

/**
 * Ejemplo 1: Testear normalización UTF-8
 */
export const exampleNormalizationTest = () => {
  const testStrings = [
    'é́spèctáculos',
    'DEPORTES',
    'ñoño',
    'árbitro',
    'méxico'
  ]
  
  console.log('📝 Testing normalización UTF-8:')
  testStrings.forEach(str => {
    const normalized = str.normalize('NFC')
    const capitalized = normalized.charAt(0).toUpperCase() + normalized.slice(1)
    console.log(`"${str}" → "${capitalized}"`)
  })
}

/**
 * Ejemplo 2: Simular carga con progreso
 */
export const exampleProgressSimulation = async () => {
  const steps = [
    { progress: 10, message: '⏳ Conectando con el servidor...' },
    { progress: 30, message: '📥 Obteniendo datos...' },
    { progress: 50, message: '🔄 Procesando información...' },
    { progress: 70, message: '✅ Validando respuesta...' },
    { progress: 90, message: '📊 Preparando notificación...' },
    { progress: 100, message: '✨ ¡Completado!' }
  ]
  
  console.log('🔄 Simulando carga con progreso:')
  
  for (const step of steps) {
    await delay(300)
    console.log(`[${step.progress}%] ${step.message}`)
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  // Mocks
  MOCK_STORY_API_RESPONSE,
  MOCK_PENDING_NOTIFICATION,
  MOCK_PENDING_NOTIFICATIONS,
  MOCK_SEND_PAYLOAD,
  MOCK_SEND_SUCCESS_RESPONSE,
  MOCK_SEND_ERROR_RESPONSE,
  
  // Helpers
  delay,
  generateMockNotification,
  mockFetchStoryFromUrl,
  mockSendNotification,
  
  // Scenarios
  testScenario1_HappyPath,
  testScenario2_FetchError,
  testScenario3_SendError,
  testScenario4_MultiplePending,
  
  // Examples
  exampleNormalizationTest,
  exampleProgressSimulation
}

// ============================================================================
// CÓMO USAR ESTE ARCHIVO
// ============================================================================

/*
 * 1. En la consola del navegador:
 * 
 * import mocks from './mocks-y-ejemplos.ts'
 * 
 * // Ejecutar escenario de prueba
 * await mocks.testScenario1_HappyPath()
 * 
 * // Generar notificación de prueba
 * const notif = mocks.generateMockNotification()
 * console.log(notif)
 * 
 * 
 * 2. En componentes React para desarrollo:
 * 
 * import { MOCK_PENDING_NOTIFICATIONS } from './mocks-y-ejemplos'
 * 
 * const [pendingNotifications, setPendingNotifications] = useState(MOCK_PENDING_NOTIFICATIONS)
 * 
 * 
 * 3. Para testing de funciones:
 * 
 * import { mockFetchStoryFromUrl } from './mocks-y-ejemplos'
 * 
 * test('should handle fetch error', async () => {
 *   await expect(mockFetchStoryFromUrl('invalid', true)).rejects.toThrow()
 * })
 */
