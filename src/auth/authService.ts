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
    console.log('🔐 [Auth] Iniciando login...')
    try {
      // Intentar primero con JSON
      const body = {
        usuario: credentials.email,
        pass: credentials.password
      }
      
      console.log('📤 [Auth] POST →', AUTH_URL)
      console.log('📝 [Auth] Body:', { usuario: credentials.email, pass: '***' })
      
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      console.log('📥 [Auth] Status:', response.status, response.statusText)
      console.log('📄 [Auth] Content-Type:', response.headers.get('content-type'))

      // Obtener y parsear la respuesta
      const responseText = await response.text()
      console.log('📋 [Auth] Response (primeros 300 chars):', responseText.substring(0, 300))
      
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

      console.log('✅ [Auth] Login exitoso:', credentials.email)

      // Crear token basado en las credenciales validadas
      const basicAuth = btoa(`${credentials.email}:${credentials.password}`)
      const expiresIn = 3600 // 1 hora en segundos
      const expiresAt = Date.now() + (expiresIn * 1000)

      const authToken: AuthToken = {
        accessToken: basicAuth,
        expiresAt,
        username: credentials.email,
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
