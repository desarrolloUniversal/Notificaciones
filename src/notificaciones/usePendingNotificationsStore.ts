// src/notificaciones/usePendingNotificationsStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PendingNotificationFromUrl } from './types/notificacionesTypes'

interface PendingNotificationsState {
  // Estado persistente - organizado por usuario
  pendingNotificationsByUser: Record<string, PendingNotificationFromUrl[]>
  currentUser: string | null
  
  // Métodos
  setCurrentUser: (username: string | null) => void
  addPendingNotification: (notification: PendingNotificationFromUrl) => void
  removePendingNotification: (id: string) => void
  clearCurrentUserNotifications: () => void
  clearAllNotifications: () => void
  getPendingNotifications: () => PendingNotificationFromUrl[]
  getPendingCount: () => number
  removeOldNotifications: (maxAgeMs?: number) => void
}

// Tiempo máximo de vida para notificaciones pendientes (7 días)
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000

export const usePendingNotificationsStore = create<PendingNotificationsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      pendingNotificationsByUser: {},
      currentUser: null,

      // Establecer usuario actual (se sincroniza con el login)
      setCurrentUser: (username) => {
        set({ currentUser: username })
        if (username) {
          // Limpiar notificaciones antiguas al cambiar de usuario
          get().removeOldNotifications()
        }
      },

      // Agregar notificación pendiente al usuario actual
      addPendingNotification: (notification) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) {
          console.warn('⚠️ [PendingStore] No hay usuario autenticado')
          return
        }

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: [notification, ...userNotifications],
          }
        })
      },

      // Eliminar notificación pendiente del usuario actual
      removePendingNotification: (id) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: userNotifications.filter((n) => n.id !== id),
          }
        })
      },

      // Limpiar notificaciones del usuario actual
      clearCurrentUserNotifications: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return

        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: [],
          }
        })
      },

      // Limpiar todas las notificaciones de todos los usuarios
      clearAllNotifications: () => {
        set({ pendingNotificationsByUser: {} })
      },

      // Obtener notificaciones del usuario actual
      getPendingNotifications: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return []
        
        return pendingNotificationsByUser[currentUser] || []
      },

      // Obtener cantidad de notificaciones del usuario actual
      getPendingCount: () => {
        return get().getPendingNotifications().length
      },

      // Eliminar notificaciones antiguas del usuario actual
      removeOldNotifications: (maxAgeMs = DEFAULT_MAX_AGE) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return
        
        const userNotifications = pendingNotificationsByUser[currentUser] || []
        const now = Date.now()
        
        const filtered = userNotifications.filter((notification) => {
          const notificationTime = new Date(notification.timestamp).getTime()
          return now - notificationTime < maxAgeMs
        })
        
        const removedCount = userNotifications.length - filtered.length
        
        if (removedCount > 0) {
          set({
            pendingNotificationsByUser: {
              ...pendingNotificationsByUser,
              [currentUser]: filtered,
            }
          })
        }
      },
    }),
    {
      name: 'pending-notifications-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Persistir estado completo
      partialize: (state) => ({
        pendingNotificationsByUser: state.pendingNotificationsByUser,
        currentUser: state.currentUser,
      }),

      // Al recargar desde storage
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const { currentUser, pendingNotificationsByUser } = state
        
        if (currentUser && pendingNotificationsByUser[currentUser]) {
          // Limpiar notificaciones antiguas
          state.removeOldNotifications()
        }
      },

      // Versión del schema
      version: 2,
    }
  )
)
