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
  } catch (error) {
    // Si no es una URL válida, usar el valor original
  }
  
  // Detectar si el título fue editado
  const tituloEditado = notification.isResend && 
                        notification.originalTitulo && 
                        notification.titulo !== notification.originalTitulo
  
  // Construir payload base
  const payload: NotificationSendPayload = {
    site: 'eluniversal',
    link: 'a Nota',
    userid: username,
    url: urlPath,
    content: notification.titulo  // Usa el título (puede estar modificado por el usuario)
  }
  
  // Si es reenvío, agregar campo forward
  if (notification.isResend) {
    payload.forward = true
  }
  
  // Si el título NO fue editado, incluir title e idarticulo
  if (!tituloEditado) {
    payload.title = notification.seccion
    // Usar originalId si existe (reenvío), sino usar id normal
    //payload.idarticulo = notification.originalId || notification.id
  }
  
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
    const payload = prepareSendPayload(notification)
    
    // Obtener headers de autenticación
    const token = useAuthStore.getState().token
    const authHeaders = AuthService.getAuthHeader(token)
    
    console.log('\n═══════════════════════════════════════════════════════')
    console.log('📡 DATOS QUE SE SUBEN AL API:')
    console.log('═══════════════════════════════════════════════════════')
    console.table({
      'Site': payload.site,
      'Link': payload.link,
      'Usuario': payload.userid,
      'URL (path)': payload.url,
      'Title (sección)': payload.title,
      'Content (título)': payload.content,
      'Forward': payload.forward
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
      await response.text()
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return {
      success: true,
      message: data.message || 'Notificación enviada correctamente',
      sentAt: new Date().toISOString(),
    }
  } catch (error) {
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
    return false
  }
  
  // Validar que esté en estado pendiente
  if (notification.estadoEnvio !== 'Pendiente') {
    return false
  }
  
  return true
}
