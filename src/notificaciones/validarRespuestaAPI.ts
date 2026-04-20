// src/notificaciones/validarRespuestaAPI.ts
import type { ApiResponse } from './types/notificacionesTypes'

export const validarRespuestaAPI = (data: ApiResponse): void => {
  if (data.status !== 0 && data.status !== undefined) {
    console.warn('⚠️ API retornó status diferente de 0:', data.status)
  }

  if (!data.Notificaciones || !Array.isArray(data.Notificaciones)) {
    throw new Error('La respuesta no contiene un array de Notificaciones válido')
  }

  if (data.Notificaciones.length === 0) {
    console.warn('⚠️ No se recibieron notificaciones')
  }
}
