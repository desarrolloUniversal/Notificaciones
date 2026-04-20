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
  grupos: string[]
  ou: string | null
  
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

// Estado persistente en localStorage para sesiones permanentes
const PERSISTENT_STORAGE_KEY = 'auth-storage'
const SESSION_ACTIVE_KEY = 'auth-session-active'

// Marcar la sesión como activa en sessionStorage
// Este valor se pierde al cerrar el navegador
const markSessionActive = () => {
  sessionStorage.setItem(SESSION_ACTIVE_KEY, 'true')
}

// Verificar si la sesión estaba activa (si existe en sessionStorage)
const wasSessionActive = () => {
  return sessionStorage.getItem(SESSION_ACTIVE_KEY) === 'true'
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
      grupos: [],
      ou: null,
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
            expiresAt: authToken.expiresAt,
            rememberMe: credentials.rememberMe || false,
            grupos: authToken.grupos || [],
            ou: authToken.ou || null,
            isLoading: false,
            error: null,
          })
          
          // Marcar sesión como activa
          markSessionActive()
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Error al iniciar sesión'
          set({
            token: null,
            username: null,
            isAuthenticated: false,
            expiresAt: null,
            grupos: [],
            ou: null,
            isLoading: false,
            error: errorMessage,
          })
          throw error
        }
      },

      // Logout del usuario
      logout: () => {
        set({
          token: null,
          username: null,
          isAuthenticated: false,
          expiresAt: null,
          rememberMe: false,
          grupos: [],
          ou: null,
          error: null,
        })
        // Limpiar localStorage y sessionStorage
        localStorage.removeItem(PERSISTENT_STORAGE_KEY)
        sessionStorage.removeItem(SESSION_ACTIVE_KEY)
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
            grupos: authToken.grupos || [],
            ou: authToken.ou || null,
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
      name: PERSISTENT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      
      // Solo persistir datos de autenticación, no estados temporales
      partialize: (state) => ({
        token: state.token,
        username: state.username,
        isAuthenticated: state.isAuthenticated,
        expiresAt: state.expiresAt,
        rememberMe: state.rememberMe,
        grupos: state.grupos,
        ou: state.ou,
        // NO persistir: isLoading, error (son temporales)
      }),

      // Validar token al rehidratar desde storage
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Si rememberMe es false y el navegador se cerró (sessionStorage vacío),
        // limpiar la sesión
        if (state.rememberMe === false && !wasSessionActive()) {
          state.token = null
          state.username = null
          state.isAuthenticated = false
          state.expiresAt = null
          state.grupos = []
          state.ou = null
          localStorage.removeItem(PERSISTENT_STORAGE_KEY)
          return
        }

        // Si llegamos aquí, la sesión sigue activa
        // Marcar sesión como activa para futuras recargas
        if (state.isAuthenticated) {
          markSessionActive()
        }

        // Verificar si el token ha expirado
        if (state.expiresAt && Date.now() >= state.expiresAt) {
          // Limpiar estado y storage
          state.token = null
          state.username = null
          state.isAuthenticated = false
          state.expiresAt = null
          state.rememberMe = false
          state.grupos = []
          state.ou = null
          localStorage.removeItem(PERSISTENT_STORAGE_KEY)
          sessionStorage.removeItem(SESSION_ACTIVE_KEY)
        }
      },

      // Migración de versiones (por si cambias la estructura en el futuro)
      version: 1,
    }
  )
)
