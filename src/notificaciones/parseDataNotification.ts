// src/notificaciones/parseDataNotification.ts
import type { ApiNotification, Notification } from './types/notificacionesTypes'

export const parseDataNotification = (apiNotifications: ApiNotification[]): Notification[] => {
  const transformedNotifications = apiNotifications.map((apiNotif) => {
    return {
      id: apiNotif.idarticulo,
      thumbnail: apiNotif.imageurl || '',
      seccion: apiNotif.title,
      titulo: apiNotif.content,
      subtitulo: '',
      fechaEnvio: apiNotif.date,
      estadoEnvio: apiNotif.status === 0 ? 'Enviado' : 'Pendiente',
      totalEnvios: apiNotif.suscriptores,
      leidos: Math.floor(apiNotif.suscriptores * 0.75),
      totalLeidos: Math.floor(apiNotif.suscriptores * 0.90),
      usuarios: apiNotif.userid,
      url: apiNotif.url || ''
    }
  })

  // Ordenar por fecha de envío, más recientes primero
  return transformedNotifications.sort((a, b) => {
    const normalizedDateA = a.fechaEnvio.replace(/\//g, '-')
    const normalizedDateB = b.fechaEnvio.replace(/\//g, '-')
    const dateA = new Date(normalizedDateA).getTime()
    const dateB = new Date(normalizedDateB).getTime()
    return dateB - dateA
  })
}
