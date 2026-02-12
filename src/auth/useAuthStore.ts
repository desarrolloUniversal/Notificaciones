// src/auth/useAuthStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { AuthService } from './authService'
import type { LoginCredentials } from './authTypes'

interface AuthState {
  // Estado persistente
  token: string | null
  username: string | null
  isAuthenticated: boolean
  expiresAt: number | null
  rememberMe: boolean
  
  // Estado temporal (no se persiste)
  isLoading: boolean
  error: string | null

  // Métodos
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => void
  renewToken: (credentials: LoginCredentials) => Promise<void>
  clearError: () => void
  setError: (error: string) => void
}

// Función para determinar qué storage usar
const getStorage = () => {
  // Verificar si rememberMe está guardado en localStorage
  const rememberMe = localStorage.getItem('auth-remember-me')
  return rememberMe === 'true' ? localStorage : sessionStorage
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Estado inicial
      token: null,
      username: null,
      isAuthenticated: false,
      expiresAt: null,
      rememberMe: false,
      isLoading: false,
      error: null,

      // Login del usuario
      login: async (credentials: LoginCredentials) => {
        try {
          set({ isLoading: true, error: null })

          const authToken = await AuthService.login(credentials)

          // Guardar preferencia de rememberMe
          if (credentials.rememberMe) {
            localStorage.setItem('auth-remember-me', 'true')
          } else {
            localStorage.removeItem('auth-remember-me')
          }

          set({
            token: authToken.accessToken,
            username: authToken.username,
            isAuthenticated: true,
            expiresAt: authToken.expiresAt,
            rememberMe: credentials.rememberMe || false,
            isLoading: false,
            error: null,
          })
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
          set({
            token: null,
            username: null,
            isAuthenticated: false,
            expiresAt: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      // Logout del usuario
      logout: () => {
        // Limpiar preferencia de rememberMe
        localStorage.removeItem('auth-remember-me')
        
        set({
          token: null,
          username: null,
          isAuthenticated: false,
          expiresAt: null,
          rememberMe: false,
          error: null,
        })
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
            expiresAt: authToken.expiresAt,
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
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(getStorage),
      
      // Solo persistir datos de autenticación, no estados temporales
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
        rememberMe: state.rememberMe,
        // NO persistir: isLoading, error (son temporales)
      }),

      // Validar token al rehidratar desde storage
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Verificar si el token ha expirado
        if (state.expiresAt && Date.now() >= state.expiresAt) {
          // Limpiar estado y storage
          state.token = null
          state.username = null
          state.isAuthenticated = false
          state.expiresAt = null
          state.rememberMe = false
          localStorage.removeItem('auth-remember-me')
        }
      },

      // Migración de versiones (por si cambias la estructura en el futuro)
      version: 1,
    }
  )
)
