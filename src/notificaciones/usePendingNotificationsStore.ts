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
  clearPendingNotifications: () => void
  clearAllUsersPendingNotifications: () => void
  getPendingNotification: (id: string) => PendingNotificationFromUrl | undefined
  getPendingCount: () => number
  getPendingNotifications: () => PendingNotificationFromUrl[]
  removeOldPendingNotifications: (maxAgeMs?: number) => void
}

// Tiempo máximo de vida para notificaciones pendientes (por defecto 7 días)
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días en milisegundos

export const usePendingNotificationsStore = create<PendingNotificationsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      pendingNotificationsByUser: {},
      currentUser: null,

      // Establecer usuario actual
      setCurrentUser: (username) => {
        set({ currentUser: username })
        if (username) {
          console.log(`👤 [PendingStore] Usuario cambiado a: ${username}`)
          // Limpiar notificaciones antiguas del usuario actual
          get().removeOldPendingNotifications()
        } else {
          console.log('👤 [PendingStore] Usuario cerró sesión')
        }
      },

      // Agregar nueva notificación pendiente para el usuario actual
      addPendingNotification: (notification) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) {
          console.warn('⚠️ [PendingStore] No hay usuario autenticado, no se puede agregar notificación')
          return
        }

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: [notification, ...userNotifications],
          }
        })
        
        console.log(`✅ [PendingStore] Notificación agregada para ${currentUser}:`, notification.id)
      },

      // Eliminar notificación pendiente por ID del usuario actual
      removePendingNotification: (id) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) {
          console.warn('⚠️ [PendingStore] No hay usuario autenticado')
          return
        }

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: userNotifications.filter((n) => n.id !== id),
          }
        })
        
        console.log(`🗑️ [PendingStore] Notificación eliminada para ${currentUser}:`, id)
      },

      // Limpiar todas las notificaciones pendientes del usuario actual
      clearPendingNotifications: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) {
          console.warn('⚠️ [PendingStore] No hay usuario autenticado')
          return
        }

        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: [],
          }
        })
        
        console.log(`🧹 [PendingStore] Notificaciones pendientes eliminadas para ${currentUser}`)
      },

      // Limpiar notificaciones de todos los usuarios (admin)
      clearAllUsersPendingNotifications: () => {
        set({ pendingNotificationsByUser: {} })
        console.log('🧹 [PendingStore] Todas las notificaciones de todos los usuarios eliminadas')
      },

      // Obtener notificación pendiente por ID del usuario actual
      getPendingNotification: (id) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return undefined
        
        const userNotifications = pendingNotificationsByUser[currentUser] || []
        return userNotifications.find((n) => n.id === id)
      },

      // Obtener cantidad de notificaciones pendientes del usuario actual
      getPendingCount: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return 0
        
        const userNotifications = pendingNotificationsByUser[currentUser] || []
        return userNotifications.length
      },

      // Obtener todas las notificaciones pendientes del usuario actual
      getPendingNotifications: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return []
        
        return pendingNotificationsByUser[currentUser] || []
      },

      // Eliminar notificaciones pendientes antiguas del usuario actual
      removeOldPendingNotifications: (maxAgeMs = DEFAULT_MAX_AGE) => {
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
          console.log(`🧹 [PendingStore] ${removedCount} notificaciones antiguas eliminadas para ${currentUser}`)
        }
      },
    }),
    {
      name: 'pending-notifications-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Persistir estado por usuario
      partialize: (state) => ({
        pendingNotificationsByUser: state.pendingNotificationsByUser,
        currentUser: state.currentUser,
      }),

      // Al recargar desde storage
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const { currentUser, pendingNotificationsByUser } = state
        
        if (currentUser && pendingNotificationsByUser[currentUser]) {
          const count = pendingNotificationsByUser[currentUser].length
          console.log(`✅ [PendingStore] ${count} notificaciones pendientes restauradas para ${currentUser}`)
          
          // Limpiar notificaciones antiguas automáticamente
          state.removeOldPendingNotifications()
        } else if (currentUser) {
          console.log(`📭 [PendingStore] No hay notificaciones pendientes para ${currentUser}`)
        } else {
          console.log('📭 [PendingStore] No hay sesión activa')
        }
      },

      // Versión del schema
      version: 2, // Incrementada por cambio de estructura
    }
  )
)
