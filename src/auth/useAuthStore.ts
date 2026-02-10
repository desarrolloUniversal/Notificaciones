// src/auth/useAuthStore.ts
import { create } from 'zustand'
import { AuthService } from './authService'
import type { LoginCredentials } from './authTypes'

interface AuthState {
  // Estado
  token: string | null
  username: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Métodos
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  checkAuth: () => void
  renewToken: (credentials: LoginCredentials) => Promise<void>
  clearError: () => void
  setError: (error: string) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  // Estado inicial
  token: null,
  username: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  // Login del usuario
  login: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null })

      const authToken = await AuthService.login(credentials)

      set({
        token: authToken.accessToken,
        username: authToken.username,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
      set({
        token: null,
        username: null,
        isAuthenticated: false,
        isLoading: false,
        error: errorMessage,
      })
      throw error
    }
  },

  // Logout del usuario
  logout: () => {
    AuthService.logout()
    set({
      token: null,
      username: null,
      isAuthenticated: false,
      error: null,
    })
  },

  // Verificar si hay una sesión activa al cargar la app
  checkAuth: () => {
    try {
      const storedToken = AuthService.getStoredToken()

      if (!storedToken) {
        set({ isAuthenticated: false })
        return
      }

      // Verificar si el token ha expirado
      if (AuthService.isTokenExpired(storedToken)) {
        AuthService.logout()
        set({ isAuthenticated: false })
        return
      }

      // Token válido, restaurar sesión
      set({
        token: storedToken.accessToken,
        username: storedToken.username,
        isAuthenticated: true,
        error: null,
      })
    } catch (error) {
      console.error('[useAuthStore] Error verificando autenticación:', error)
      set({ isAuthenticated: false })
    }
  },

  // Renovar token con nuevas credenciales
  renewToken: async (credentials: LoginCredentials) => {
    try {
      set({ isLoading: true, error: null })

      const authToken = await AuthService.renewToken(credentials)

      set({
        token: authToken.accessToken,
        username: authToken.username,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al renovar token'
      set({
        isLoading: false,
        error: errorMessage,
      })
      throw error
    }
  },

  // Limpiar error
  clearError: () => {
    set({ error: null })
  },

  // Establecer error
  setError: (error: string) => {
    set({ error })
  },
}))
