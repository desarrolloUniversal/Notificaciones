// src/auth/authService.ts
import type { LoginCredentials, AuthToken } from './authTypes'

const AUTH_URL = 'https://asistente.eluniversal.com.mx/service/?do=ldpa'

/**
 * Servicio de autenticación que maneja login y renovación de tokens
 * Nota: El almacenamiento se maneja automáticamente por Zustand persist middleware
 */
export class AuthService {
  /**
   * Realiza el login con credenciales y obtiene un token de acceso
   */
  static async login(credentials: LoginCredentials): Promise<AuthToken> {
    try {
      // Intentar primero con JSON
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

      // Obtener y parsear la respuesta
      const responseText = await response.text()
      
      // Verificar si la respuesta es HTML (error del servidor)
      if (responseText.trim().startsWith('<')) {
        console.error('❌ [Auth] La API devolvió HTML en lugar de JSON')
        throw new Error('El servidor no responde correctamente. Contacte al administrador.')
      }

      // Parsear JSON
      let data
      try {
        data = JSON.parse(responseText)
      } catch (e) {
        console.error('❌ [Auth] Respuesta no es JSON válido:', responseText.substring(0, 200))
        throw new Error('Error al procesar la respuesta del servidor')
      }

      // Validar respuesta
      if (!data) {
        throw new Error('Respuesta inválida del servidor')
      }

      // La API retorna {status: 0} para éxito, {status: 1} para error
      if (data.status !== undefined && data.status !== 0) {
        console.warn('⚠️ [Auth] Login rechazado:', data.message || 'Credenciales inválidas')
        throw new Error(data.message || 'Credenciales inválidas')
      }

      // Crear token basado en las credenciales validadas
      const basicAuth = btoa(`${credentials.username}:${credentials.password}`)
      const expiresIn = 3600 // 1 hora en segundos
      const expiresAt = Date.now() + (expiresIn * 1000)

      const authToken: AuthToken = {
        accessToken: basicAuth,
        expiresAt,
        username: credentials.username,
      }

      // El token se guarda automáticamente por Zustand persist
      return authToken
    } catch (error) {
      console.error('❌ [Auth] Error en login:', error instanceof Error ? error.message : error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('Error al iniciar sesión. Por favor intente nuevamente.')
    }
  }

  /**
   * Renueva el token haciendo un nuevo login
   */
  static async renewToken(credentials: LoginCredentials): Promise<AuthToken> {
    return this.login(credentials)
  }

  /**
   * Obtiene el header de autorización para requests HTTP
   * @param token Token de autenticación
   */
  static getAuthHeader(token: string | null): Record<string, string> {
    if (!token) {
      return {}
    }
    return {
      'Authorization': `Basic ${token}`,
    }
  }
}
