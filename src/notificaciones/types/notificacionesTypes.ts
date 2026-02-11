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
  estadoEnvio: 'Pendiente'
  fechaEnvio: null
  usuarios: string
  timestamp: string // Timestamp de cuándo se agregó a pendientes
}

/**
 * Datos necesarios para enviar una notificación
 * (Endpoint por definirse)
 */
export interface NotificationSendPayload {
  url: string
  titulo: string
  thumbnail: string
  seccion: string
  // Agregar más campos cuando se defina el endpoint
}
