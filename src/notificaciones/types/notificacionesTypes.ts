// src/notificaciones/types/notificacionesTypes.ts
export interface ApiResponse {
  status: number
  message: string
  Notificaciones: ApiNotification[]
}

export interface ApiNotification {
  content: string
  date: string
  timestamp: number
  status: number
  message: string
  site: string
  suscriptores: number
  url: string
  title: string
  idarticulo: string
  userid: string
  imageurl: string
}

export interface Notification {
  id: string
  thumbnail: string
  seccion: string
  titulo: string
  subtitulo: string
  fechaEnvio: string
  estadoEnvio: string
  totalEnvios: number
  leidos: number
  totalLeidos: number
  usuarios: string
  url: string
}

// ========================================
// Tipos para la API de Stories
// ========================================

/**
 * Respuesta de la API de stories al consultar por URL
 * GET https://wy1k8mgsuc.execute-api.us-east-1.amazonaws.com/stories?website=eluniversal&website_url={url}
 */
export interface StoryApiResponse {
  canonical_url: string
  content_elements: string // JSON string de array de content elements
  content_restrictions: string // JSON string
  created_date: string
  credits: string // JSON string
  display_date: string
  first_publish_date: string
  headlines_basic: string // JSON string con el título
  idarticulo: string
  primary_section_path: string
  promo_items: string // JSON string con imagen y metadata
  publish_date: string
  site: string
  subheadlines_basic: string // JSON string con el subtítulo
  taxonomy: string // JSON string con sección y metadata
}

/**
 * Notificación creada desde URL personalizada
 * Estado: Pendiente, sin fecha de envío definida
 */
export interface PendingNotificationFromUrl {
  id: string
  thumbnail: string
  seccion: string
  titulo: string
  subtitulo: string
  url: string
  estadoEnvio: 'Pendiente' | 'Enviada' | 'Reenviada' // Permite múltiples estados para reenvíos
  fechaEnvio: string | null // null o fecha ISO después del envío
  usuarios: string
  timestamp: string // Timestamp de cuándo se agregó a pendientes
  isResend?: boolean // Indica si viene del botón de reenviar
  originalTitulo?: string // Título original para detectar ediciones
  originalId?: string // ID original del artículo (sin prefijo 'resend-')
  isUrgent?: boolean // Indica si fue creada con botón Urgente
  isManual?: boolean // Indica si fue creada con '/' (sin URL real, edición manual)
  resendCount?: number // Contador de reenvíos (opcional)
  area?: 'editorial' | 'trivia' // Área de origen de la notificación
}

/**
 * Datos necesarios para enviar una notificación push
 * Endpoint: https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificacion/url
 */
export interface NotificationSendPayload {
  site: string
  idarticulo: string // requerido: ID del artículo para identificarlo en el backend
  link: string
  userid: string
  id?: string        // opcional: ExponentPushToken del usuario - Se incluye automáticamente si el usuario guardó su token, enviando la notificación solo a su dispositivo. Si se omite, se envía a todos los suscriptores.
  url?: string       // opcional: URL del artículo
  title?: string     // opcional: Título de la notificación (sección)
  content?: string   // opcional: Contenido de la notificación (título del artículo)
  forward: "true" | "false"   // requerido: "true" si es reenvío, "false" si es notificación nueva (string)
}
