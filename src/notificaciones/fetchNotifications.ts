// src/notificaciones/fetchNotifications.ts
import { validarRespuestaAPI } from './validarRespuestaAPI'
import { parseDataNotification } from './parseDataNotification'

const API_URL = 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificaciones?site=eluniversal'

export const fetchNotifications = async () => {
  // const response = await fetch(API_URL)
  
  // if (!response.ok) {
  //   throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
  // }
  
  // const data: ApiResponse = await response.json()

    try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data= await response.json();

    if (data.status !== 0) {
      throw new Error(data.message || 'Error en respuesta del endpoint');
    }

    validarRespuestaAPI(data)
    
    const notificaciones = parseDataNotification(data.Notificaciones)
    
    return notificaciones

  } catch (error) {
    console.error('[notificationPollingService] Error fetching notifications:', error);
    throw error;
  }

  
}
