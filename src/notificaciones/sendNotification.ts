// src/notificaciones/sendNotification.ts
import type { NotificationSendPayload, PendingNotificationFromUrl } from './types/notificacionesTypes'

// TODO: Definir el endpoint real cuando esté disponible
// const SEND_NOTIFICATION_ENDPOINT = 'https://api.eluniversal.com.mx/notifications/send' // PLACEHOLDER

/**
 * Prepara el payload para enviar una notificación
 * @param notification Notificación pendiente a enviar
 * @returns Payload formateado para el endpoint de envío
 */
export const prepareSendPayload = (notification: PendingNotificationFromUrl): NotificationSendPayload => {
  return {
    url: notification.url,
    titulo: notification.titulo,
    thumbnail: notification.thumbnail,
    seccion: notification.seccion,
    // TODO: Agregar más campos según lo requiera el endpoint
  }
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
export const sendNotification = async (_notification: PendingNotificationFromUrl): Promise<{
  success: boolean
  message: string
  sentAt: string
}> => {
  try {
    // TODO: Descomentar y configurar cuando el endpoint esté disponible
    /*
    const payload = prepareSendPayload(_notification)
    
    const response = await fetch(SEND_NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // TODO: Agregar autenticación si es necesaria
        // 'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      message: data.message || 'Notificación enviada correctamente',
      sentAt: new Date().toISOString(),
    }
    */
    
    // MOCK: Simular respuesta exitosa mientras el endpoint se define
    await new Promise(resolve => setTimeout(resolve, 1500)) // Simular latencia de red
    
    return {
      success: true,
      message: 'Notificación enviada correctamente (simulado)',
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
