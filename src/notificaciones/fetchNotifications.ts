// // src/notificaciones/fetchNotifications.ts
// import { validarRespuestaAPI } from './validarRespuestaAPI'
// import { parseDataNotification } from './parseDataNotification'
// import { AuthService } from '../auth/authService'
// import { useAuthStore } from '../auth/useAuthStore'


// // Puedes cambiar entre IP o subdominio según disponibilidad del backend
// const SERVER_URL = 'https://desarrollo.eluniversal.com.mx/notificaciones';
// // const SERVER_URL = 'http://172.16.250.230/notificaciones';

// // Credenciales por defecto para desarrollo (fallback)
// const DEFAULT_USERNAME = 'pruebasdesarrollo';
// const DEFAULT_PASSWORD = 'EUpd2026@@';


// export const fetchNotifications = async () => {
//   try {
//     // Obtener el token del store (fuera de componentes React)
//     const token = useAuthStore.getState().token;
//     let authHeaders = AuthService.getAuthHeader(token);
    
//     // Si no hay token, usar credenciales por defecto
//     if (!authHeaders.Authorization) {
//       const basicAuth = btoa(`${DEFAULT_USERNAME}:${DEFAULT_PASSWORD}`);
//       authHeaders = {
//         'Authorization': `Basic ${basicAuth}`,
//       };
//     }

//     const response = await fetch(SERVER_URL, {
//       method: 'GET',
//       headers: {
//         ...authHeaders,
//       },
//     });

//     if (!response.ok) {
//       if (response.status === 401) {
//         // Token expirado o inválido
//         throw new Error('Sesión expirada. Por favor, inicie sesión nuevamente.');
//       }
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();

//     if (data.status !== 0) {
//       throw new Error(data.message || 'Error en respuesta del endpoint');
//     }

//     validarRespuestaAPI(data);
//     const notificaciones = parseDataNotification(data.Notificaciones);
//     return notificaciones;
//   } catch (error) {
//     console.error('[notificationPollingService] Error fetching notifications:', error);
//     throw error;
//   }


// }
