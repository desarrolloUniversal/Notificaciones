// src/auth/authService.ts
import type { LoginCredentials, AuthToken } from './authTypes'

const AUTH_URL = 'https://asistente.eluniversal.com.mx/service/?do=ldpa'
const TOKEN_STORAGE_KEY = 'auth_token'
const USERNAME_STORAGE_KEY = 'auth_username'
const EXPIRES_AT_STORAGE_KEY = 'auth_expires_at'

/**
 * Servicio de autenticación que maneja login, tokens y renovación
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

      // Guardar token en localStorage si el usuario quiere mantener la sesión
      if (credentials.rememberMe) {
        this.saveToken(authToken)
      }

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
   * Guarda el token en localStorage
   */
  static saveToken(authToken: AuthToken): void {
    try {
      localStorage.setItem(TOKEN_STORAGE_KEY, authToken.accessToken)
      localStorage.setItem(USERNAME_STORAGE_KEY, authToken.username)
      localStorage.setItem(EXPIRES_AT_STORAGE_KEY, authToken.expiresAt.toString())
    } catch (error) {
      console.error('❌ [Auth] Error guardando token')
    }
  }

  /**
   * Obtiene el token almacenado de localStorage
   */
  static getStoredToken(): AuthToken | null {
    try {
      const accessToken = localStorage.getItem(TOKEN_STORAGE_KEY)
      const username = localStorage.getItem(USERNAME_STORAGE_KEY)
      const expiresAt = localStorage.getItem(EXPIRES_AT_STORAGE_KEY)

      if (!accessToken || !username || !expiresAt) {
        return null
      }

      return {
        accessToken,
        username,
        expiresAt: parseInt(expiresAt, 10),
      }
    } catch (error) {
      console.error('❌ [Auth] Error obteniendo token')
      return null
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  static isTokenExpired(authToken: AuthToken): boolean {
    return Date.now() >= authToken.expiresAt
  }

  /**
   * Verifica si hay un token válido almacenado
   */
  static hasValidToken(): boolean {
    const token = this.getStoredToken()
    if (!token) {
      return false
    }
    return !this.isTokenExpired(token)
  }

  /**
   * Renueva el token haciendo un nuevo login
   */
  static async renewToken(credentials: LoginCredentials): Promise<AuthToken> {
    return this.login(credentials)
  }

  /**
   * Cierra sesión eliminando el token almacenado
   */
  static logout(): void {
    try {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
      localStorage.removeItem(USERNAME_STORAGE_KEY)
      localStorage.removeItem(EXPIRES_AT_STORAGE_KEY)
      console.log('👋 [Auth] Sesión cerrada')
    } catch (error) {
      console.error('❌ [Auth] Error en logout')
    }
  }

  /**
   * Obtiene el token actual (desde memoria o localStorage)
   */
  static getCurrentToken(): string | null {
    const token = this.getStoredToken()
    return token?.accessToken || null
  }

  /**
   * Obtiene el header de autorización para requests
   */
  static getAuthHeader(): Record<string, string> {
    const token = this.getCurrentToken()
    if (!token) {
      return {}
    }
    return {
      'Authorization': `Basic ${token}`,
    }
  }

  /**
   * Obtiene el username del usuario actualmente logueado
   * @returns El username (email) o null si no hay sesión
   */
  static getCurrentUser(): string | null {
    const token = this.getStoredToken()
    return token?.username || null
  }

  /**
   * Verifica si hay un usuario logueado actualmente
   * @returns true si hay un usuario autenticado
   */
  static isLoggedIn(): boolean {
    return this.hasValidToken()
  }
}
