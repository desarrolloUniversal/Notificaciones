// src/notificaciones/fetchNotifications.ts
import { validarRespuestaAPI } from './validarRespuestaAPI'
import { parseDataNotification } from './parseDataNotification'


// Puedes cambiar entre IP o subdominio según disponibilidad del backend
const SERVER_URL = 'https://desarrollo.eluniversal.com.mx/notificaciones';
// const SERVER_URL = 'http://172.16.250.230/notificaciones';

const USERNAME = 'pruebasdesarrollo';
const PASSWORD = 'EUpd2026@@';


export const fetchNotifications = async () => {
  try {
    // Autenticación básica
    const basicAuth = btoa(`${USERNAME}:${PASSWORD}`);
    const response = await fetch(SERVER_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 0) {
      throw new Error(data.message || 'Error en respuesta del endpoint');
    }

    validarRespuestaAPI(data);
    const notificaciones = parseDataNotification(data.Notificaciones);
    return notificaciones;
  } catch (error) {
    console.error('[notificationPollingService] Error fetching notifications:', error);
    throw error;
  }


}
