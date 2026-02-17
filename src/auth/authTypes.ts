// src/auth/authTypes.ts

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface AuthToken {
  accessToken: string
  refreshToken?: string
  expiresAt: number
  username: string
  grupos?: string[]
}

export interface AuthResponse {
  status: number
  message?: string
  token: string
  expiresIn?: number // en segundos
  username: string
  grupos?: string[] // Grupos del usuario
}

export interface AuthState {
  token: string | null
  username: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}
