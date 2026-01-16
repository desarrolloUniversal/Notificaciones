// src/notificaciones/useNotificacionesStore.ts
import { create } from 'zustand'
import type { Notification, ApiResponse } from './types/notificacionesTypes'
import { validarRespuestaAPI } from './validarRespuestaAPI'
import { parseDataNotification } from './parseDataNotification'

interface NotificacionesState {
  // Estado
  notificaciones: Notification[]
  loading: boolean
  error: string | null
  lastFetch: number | null
  
  // Métodos
  fetchNotifications: (forceRefresh?: boolean) => Promise<void>
  setNotificaciones: (notificaciones: Notification[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearNotificaciones: () => void
  clearError: () => void
  shouldRefetch: (cacheTimeMs?: number) => boolean
  getTotalNotificaciones: () => number
  getNotificacionesPorEstado: (estado: string) => Notification[]
  getNotificacionPorId: (id: string) => Notification | undefined
}

const CACHE_TIME_DEFAULT = 5 * 60 * 1000 // 5 minutos
const API_URL = 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificaciones?site=eluniversal'

export const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
  // Estado inicial
  notificaciones: [],
  loading: false,
  error: null,
  lastFetch: null,

  // Fetch notificaciones desde API
  fetchNotifications: async (forceRefresh = false) => {
    try {
      const { shouldRefetch } = get()
      
      if (!forceRefresh && !shouldRefetch()) {
        return
      }

      set({ loading: true, error: null })
      
      const response = await fetch(API_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
      }
      
      const data: ApiResponse = await response.json()
      
      validarRespuestaAPI(data)
      
      const notificaciones = parseDataNotification(data.Notificaciones)
      
      set({ 
        notificaciones, 
        lastFetch: Date.now(),
        error: null,
        loading: false
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      set({ error: errorMessage, loading: false })
    }
  },

  // Establecer notificaciones y actualizar timestamp de caché
  setNotificaciones: (notificaciones) => {
    set({ 
      notificaciones, 
      lastFetch: Date.now(),
      error: null 
    })
  },

  // Establecer estado de carga
  setLoading: (loading) => {
    set({ loading })
  },

  // Establecer error
  setError: (error) => {
    set({ error, loading: false })
  },

  // Limpiar notificaciones del caché
  clearNotificaciones: () => {
    set({ notificaciones: [], lastFetch: null })
  },

  // Limpiar error
  clearError: () => {
    set({ error: null })
  },

  // Verificar si se debe refetch basado en tiempo de caché
  shouldRefetch: (cacheTimeMs = CACHE_TIME_DEFAULT) => {
    const { lastFetch } = get()
    if (!lastFetch) {
      return true
    }
    const timeSinceLastFetch = Date.now() - lastFetch
    const shouldRefetch = timeSinceLastFetch > cacheTimeMs
    return shouldRefetch
  },

  // Obtener total de notificaciones
  getTotalNotificaciones: () => {
    return get().notificaciones.length
  },

  // Filtrar notificaciones por estado
  getNotificacionesPorEstado: (estado) => {
    return get().notificaciones.filter(n => n.estadoEnvio === estado)
  },

  // Obtener notificación por ID
  getNotificacionPorId: (id) => {
    return get().notificaciones.find(n => n.id === id)
  },
}))
