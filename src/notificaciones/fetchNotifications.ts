// src/notificaciones/fetchNotifications.ts
import type { ApiResponse } from './types/notificacionesTypes'
import { validarRespuestaAPI } from './validarRespuestaAPI'
import { parseDataNotification } from './parseDataNotification'

const API_URL = 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificaciones?site=eluniversal'

export const fetchNotifications = async () => {
  const response = await fetch(API_URL)
  
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
  }
  
  const data: ApiResponse = await response.json()
  
  validarRespuestaAPI(data)
  
  const notificaciones = parseDataNotification(data.Notificaciones)
  
  return notificaciones
}
