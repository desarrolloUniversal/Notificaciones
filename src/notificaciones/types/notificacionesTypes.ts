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
