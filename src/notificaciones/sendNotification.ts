// src/notificaciones/sendNotification.ts
import type { NotificationSendPayload, PendingNotificationFromUrl } from './types/notificacionesTypes'
import { useAuthStore } from '../auth/useAuthStore'
import { AuthService } from '../auth/authService'
import { getPushToken } from '../utils/pushTokenManager'

const SEND_NOTIFICATION_ENDPOINT = import.meta.env.VITE_SEND_NOTIFICATION_URL as string

/**
 * Prepara el payload para enviar una notificación
 * @param notification Notificación pendiente a enviar
 * @returns Payload formateado para el endpoint de envío según especificación de la API
 */
export const prepareSendPayload = (notification: PendingNotificationFromUrl): NotificationSendPayload => {
  const username = useAuthStore.getState().username || ''
  
  // Para notificaciones urgentes y manuales, manejar diferente (sin URL real)
  if (notification.isUrgent || notification.isManual) {
    const payload: NotificationSendPayload = {
      site: 'eluniversal',
      link: 'a Nota',
      userid: username,
      url: notification.isManual ? '/' : '/urgente',
      content: notification.titulo,
      title: notification.seccion,
      forward: "false",
      idarticulo: notification.id
    }
    
    // Obtener token push del usuario (si existe)
    const pushToken = getPushToken(username)
    if (pushToken) {
      payload.id = pushToken // id = ExponentPushToken para enviar solo a este dispositivo
    }
    
    if (notification.isManual) {
      console.log('📝 [Manual "/"] Payload que se enviará:', JSON.stringify(payload, null, 2))
    }
    
    return payload
  }
  
  // Para notificaciones normales (desde URL)
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
  
  // Generar idarticulo único para cada envío
  // Si es reenvío, crear nuevo ID basado en timestamp para evitar duplicados
  let idArticulo: string
  
  if (notification.isResend) {
    // ESTRATEGIA: Generar nuevo idarticulo para reenvíos
    // El backend rechaza duplicados, así que creamos uno único
    const timestamp = Date.now()
    const urlHash = urlPath.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20)
    idArticulo = `${urlHash}-resend-${timestamp}`
  } else {
    // Para notificaciones nuevas, usar el ID existente
    idArticulo = notification.id
  }
  
  const payload: NotificationSendPayload = {
    site: 'eluniversal',
    link: 'a Nota',
    userid: username,
    url: urlPath,
    content: notification.titulo,  // Usa el título (puede estar modificado por el usuario)
    forward: "false",  // Siempre "false" - cada envío es tratado como nuevo
    idarticulo: idArticulo  // ID único para cada envío
  }
  
  // Obtener token push del usuario (si existe)
  const pushToken = getPushToken(username)
  if (pushToken) {
    payload.id = pushToken // id = ExponentPushToken para enviar solo a este dispositivo
  }
  
  // Incluir sección (title) si el título no fue editado O si es un reenvío
  // Para reenvíos, siempre incluir la sección para que llegue completa
  if (!tituloEditado || notification.isResend) {
    payload.title = notification.seccion
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
    
    console.log('📦 Payload generado para envío:', JSON.stringify(payload, null, 2))
    
    // Obtener headers de autenticación
    const token = useAuthStore.getState().token
    const authHeaders = AuthService.getAuthHeader(token)
    
    const response = await fetch(SEND_NOTIFICATION_ENDPOINT, {
      method: 'POST',
      headers: {
        ...authHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('📨 Respuesta del servidor:', data)
    
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
  // Validación para notificaciones urgentes y manuales (sin URL real)
  if (notification.isUrgent || notification.isManual) {
    // Solo necesitan sección y título
    if (!notification.seccion || notification.seccion.trim() === '') {
      return false
    }
    if (!notification.titulo || notification.titulo.trim() === '') {
      return false
    }
  } else {
    // Para notificaciones normales, URL y título son obligatorios
    if (!notification.url || notification.url.trim() === '') {
      return false
    }
    if (!notification.titulo || notification.titulo.trim() === '') {
      return false
    }
  }
  
  // Validar que esté en un estado válido para envío/reenvío
  if (notification.estadoEnvio !== 'Pendiente' && 
      notification.estadoEnvio !== 'Enviada' && 
      notification.estadoEnvio !== 'Reenviada') {
    return false
  }
  
  return true
}
