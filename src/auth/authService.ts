// src/auth/authService.ts
import type { LoginCredentials, AuthToken } from './authTypes'

const AUTH_URL = 'https://desarrollo.eluniversal.com.mx/notificaciones'
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
    try {
      // Crear autenticación básica con las credenciales del usuario
      const basicAuth = btoa(`${credentials.email}:${credentials.password}`)
      
      const response = await fetch(AUTH_URL, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Credenciales inválidas')
        }
        throw new Error(`Error de autenticación: ${response.status}`)
      }

      const data = await response.json()

      if (data.status !== 0) {
        throw new Error(data.message || 'Error en la autenticación')
      }

      // Generar token basado en las credenciales
      // En producción, el servidor debería devolver el token
      const token = basicAuth
      const expiresIn = 3600 // 1 hora en segundos
      const expiresAt = Date.now() + (expiresIn * 1000)

      const authToken: AuthToken = {
        accessToken: token,
        expiresAt,
        username: credentials.email,
      }

      // Guardar token en localStorage si el usuario quiere mantener la sesión
      if (credentials.rememberMe) {
        this.saveToken(authToken)
      }

      return authToken
    } catch (error) {
      console.error('[AuthService] Error en login:', error)
      throw error
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
      console.error('[AuthService] Error guardando token:', error)
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
      console.error('[AuthService] Error obteniendo token:', error)
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
    } catch (error) {
      console.error('[AuthService] Error en logout:', error)
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
