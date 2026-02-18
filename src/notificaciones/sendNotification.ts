// src/notificaciones/sendNotification.ts
import type { NotificationSendPayload, PendingNotificationFromUrl } from './types/notificacionesTypes'
import { useAuthStore } from '../auth/useAuthStore'
import { AuthService } from '../auth/authService'

const SEND_NOTIFICATION_ENDPOINT = 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificacion/url'

/**
 * Prepara el payload para enviar una notificación
 * @param notification Notificación pendiente a enviar
 * @returns Payload formateado para el endpoint de envío según especificación de la API
 */
export const prepareSendPayload = (notification: PendingNotificationFromUrl): NotificationSendPayload => {
  const username = useAuthStore.getState().username || ''
  
  // Extraer solo el pathname de la URL (sin dominio)
  let urlPath = notification.url
  try {
    const urlObj = new URL(notification.url)
    urlPath = urlObj.pathname
    console.log('🔗 [prepareSendPayload] URL original:', notification.url)
    console.log('📍 [prepareSendPayload] Path extraído:', urlPath)
  } catch (error) {
    // Si no es una URL válida, usar el valor original
    console.warn('⚠️ [prepareSendPayload] URL no válida, usando valor original:', notification.url)
  }
  
  // Detectar si es un reenvío (ID empieza con 'resend-')
  const isResend = notification.id.startsWith('resend-')
  const linkType = isResend ? 'Reenviar' : 'a Nota'
  
  const payload = {
    site: 'eluniversal',
    idarticulo: notification.id,
    link: linkType,
    userid: username,
    // Campos opcionales
    url: urlPath,
    title: notification.seccion,
    content: notification.titulo  // Usa el título (puede estar modificado por el usuario)
    // id: 'ExponentPushToken[...]' // opcional: descomentar para enviar a usuario específico
  }

  console.log('\n📦 [prepareSendPayload] Payload preparado:', payload)
  console.log('🔄 [prepareSendPayload] Tipo de acción:', linkType)
  
  return payload
}

/**
 * Envía una notificación al endpoint de envío
 * 
 * @param _notification Notificación pendiente a enviar (parámetro usado cuando se habilite el endpoint)
 * @returns Promise que se resuelve cuando el envío es exitoso
 * @throws Error si el envío falla
 * 
 * @example
 * ```ts
 * try {
 *   const result = await sendNotification(pendingNotification)
 * } catch (error) {
 *   // Manejar error
 * }
 * ```
 */
export const sendNotification = async (notification: PendingNotificationFromUrl): Promise<{
  success: boolean
  message: string
  sentAt: string
}> => {
  try {
    console.log('\n🚀 [sendNotification] Iniciando envío de notificación...')
    console.log('📋 [sendNotification] Datos de la notificación:', {
      id: notification.id,
      titulo: notification.titulo,
      seccion: notification.seccion,
      url: notification.url,
      subtitulo: notification.subtitulo
    })
    
    const payload = prepareSendPayload(notification)
    
    // Obtener headers de autenticación
    const token = useAuthStore.getState().token
    const authHeaders = AuthService.getAuthHeader(token)
    
    console.log('🔑 [sendNotification] Headers de autenticación:', authHeaders)
    console.log('🎯 [sendNotification] Endpoint:', SEND_NOTIFICATION_ENDPOINT)
    console.log('📤 [sendNotification] Enviando payload:', JSON.stringify(payload, null, 2))
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('📡 DATOS QUE SE SUBEN AL API:')
    console.log('═══════════════════════════════════════════════════════')
    console.table({
      'Site': payload.site,
      'ID Artículo': payload.idarticulo,
      'Link': payload.link,
      'Usuario': payload.userid,
      'URL (path)': payload.url,
      'Title (sección)': payload.title,
      'Content (título)': payload.content
    })
    console.log('JSON completo:', payload)
    console.log('═══════════════════════════════════════════════════════\n')
    
    const response = await fetch(SEND_NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ [sendNotification] Error en respuesta:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('✅ [sendNotification] Respuesta exitosa:', data)
    
    return {
      success: true,
      message: data.message || 'Notificación enviada correctamente',
      sentAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('❌ [sendNotification] Error al enviar notificación:', error)
    throw error instanceof Error ? error : new Error('Error desconocido al enviar notificación')
  }
}

/**
 * Valida si una notificación está lista para ser enviada
 * @param notification Notificación a validar
 * @returns true si la notificación puede ser enviada
 */
export const canSendNotification = (notification: PendingNotificationFromUrl): boolean => {
  // Validar que tenga los campos mínimos necesarios
  if (!notification.url || !notification.titulo) {
    console.warn('⚠️ [canSendNotification] Notificación incompleta:', notification)
    return false
  }
  
  // Validar que esté en estado pendiente
  if (notification.estadoEnvio !== 'Pendiente') {
    console.warn('⚠️ [canSendNotification] Notificación no está en estado pendiente')
    return false
  }
  
  return true
}
