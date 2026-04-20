// utils/pushTokenManager.ts

const STORAGE_KEY = 'push-tokens'

export interface PushTokenData {
  token: string
  username: string
  savedAt: string
  lastUpdated: string
}

/**
 * Valida el formato del token push de Expo
 * Formato: ExponentPushToken[código]
 */
export const validatePushToken = (token: string): boolean => {
  const tokenRegex = /^ExponentPushToken\[[a-zA-Z0-9_-]+\]$/
  return tokenRegex.test(token)
}

/**
 * Guarda el token push del usuario en localStorage
 */
export const savePushToken = (username: string, token: string): void => {
  const savedTokens = localStorage.getItem(STORAGE_KEY)
  const tokens = savedTokens ? JSON.parse(savedTokens) : {}
  
  tokens[username] = {
    token,
    username,
    savedAt: tokens[username]?.savedAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

/**
 * Obtiene el token push del usuario desde localStorage
 */
export const getPushToken = (username: string): string | null => {
  const savedTokens = localStorage.getItem(STORAGE_KEY)
  if (!savedTokens) return null
  
  const tokens = JSON.parse(savedTokens)
  return tokens[username]?.token || null
}

/**
 * Elimina el token push del usuario
 */
export const removePushToken = (username: string): void => {
  const savedTokens = localStorage.getItem(STORAGE_KEY)
  if (!savedTokens) return
  
  const tokens = JSON.parse(savedTokens)
  delete tokens[username]
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

/**
 * Obtiene todos los tokens guardados
 */
export const getAllPushTokens = (): Record<string, PushTokenData> => {
  const savedTokens = localStorage.getItem(STORAGE_KEY)
  return savedTokens ? JSON.parse(savedTokens) : {}
}
