// services/pushTokenService.ts

interface RegisterTokenPayload {
  deviceToken: string
  username: string
  timestamp: string
  sessionData: {
    username: string
    grupos: string[]
    ou: string | null
    isAuthenticated: boolean
  }
}

interface RegisterTokenResponse {
  success: boolean
  message?: string
  data?: any
}

/**
 * Endpoint del backend para registrar tokens push
 * TODO: Reemplazar con tu URL real cuando esté disponible
 */
const BACKEND_URL = import.meta.env.VITE_PUSH_TOKEN_API_URL || 'https://tu-backend.com/api/push-tokens/register'

/**
 * Registra el token push en el backend
 */
export const registerPushToken = async (payload: RegisterTokenPayload): Promise<RegisterTokenResponse> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      data
    }
  } catch (error) {
    console.warn('⚠️ Error al conectar con el servidor de tokens push:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    }
  }
}
