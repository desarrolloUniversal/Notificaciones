// src/auth/authService.ts
import type { LoginCredentials, AuthToken } from './authTypes'

const AUTH_URL = 'https://asistente.eluniversal.com.mx/service/?do=ldpa'

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      const body = {
        usuario: credentials.username,
        pass: credentials.password
      }
      
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const responseText = await response.text()
      
      if (responseText.trim().startsWith('<')) {
        throw new Error('El servidor no responde correctamente. Contacte al administrador.')
      }

      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        throw new Error('Error al procesar la respuesta del servidor')
      }

      if (!data || typeof data !== 'object') {
        throw new Error('Respuesta inválida del servidor')
      }

      // Validar respuesta: status=0 O debe tener usuario/nombre
      if (data.status !== undefined) {
        if (data.status !== 0) {
          throw new Error(data.message || 'Credenciales inválidas')
        }
      } else if (!data.usuario && !data.nombre) {
        throw new Error('Respuesta inválida del servidor')
      }

      // Validar que el usuario tenga el grupo "Notificaciones Push"
      if (data.grupos && Array.isArray(data.grupos)) {
        const hasNotificationsPushGroup = data.grupos.includes('Notificaciones Push')
        if (!hasNotificationsPushGroup) {
          throw new Error('No tienes permisos para acceder a esta aplicación.\n\nSolo usuarios autorizados pueden mandar notificaciones.')
        }
      } else {
        // Si no viene el campo grupos, rechazar por seguridad
        throw new Error('No se pudo verificar tus permisos. Contacta al administrador.')
      }

      const basicAuth = btoa(`${credentials.username}:${credentials.password}`)
      const expiresIn = 3600 // 1 hora
      const expiresAt = Date.now() + (expiresIn * 1000)

      return {
        accessToken: basicAuth,
        expiresAt,
        username: credentials.username,
        grupos: data.grupos || [],
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error al iniciar sesión. Por favor intente nuevamente.')
    }
  }

  static async renewToken(credentials: LoginCredentials): Promise<AuthToken> {
    return this.login(credentials)
  }

  static getAuthHeader(token: string | null): Record<string, string> {
    if (!token) {
      return {}
    }
    return {
      'Authorization': `Basic ${token}`,
    }
  }
}
