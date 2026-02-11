// src/notificaciones/usePendingNotificationsStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { PendingNotificationFromUrl } from './types/notificacionesTypes'

interface PendingNotificationsState {
  // Estado persistente
  pendingNotifications: PendingNotificationFromUrl[]
  
  // Métodos
  addPendingNotification: (notification: PendingNotificationFromUrl) => void
  removePendingNotification: (id: string) => void
  clearPendingNotifications: () => void
  getPendingNotification: (id: string) => PendingNotificationFromUrl | undefined
  getPendingCount: () => number
  removeOldPendingNotifications: (maxAgeMs?: number) => void
}

// Tiempo máximo de vida para notificaciones pendientes (por defecto 7 días)
const DEFAULT_MAX_AGE = 7 * 24 * 60 * 60 * 1000 // 7 días en milisegundos

export const usePendingNotificationsStore = create<PendingNotificationsState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      pendingNotifications: [],

      // Agregar nueva notificación pendiente
      addPendingNotification: (notification) => {
        set((state) => ({
          pendingNotifications: [notification, ...state.pendingNotifications],
        }))
        console.log('✅ [PendingStore] Notificación agregada a pendientes:', notification.id)
      },

      // Eliminar notificación pendiente por ID
      removePendingNotification: (id) => {
        set((state) => ({
          pendingNotifications: state.pendingNotifications.filter((n) => n.id !== id),
        }))
        console.log('🗑️ [PendingStore] Notificación eliminada de pendientes:', id)
      },

      // Limpiar todas las notificaciones pendientes
      clearPendingNotifications: () => {
        set({ pendingNotifications: [] })
        console.log('🧹 [PendingStore] Todas las notificaciones pendientes eliminadas')
      },

      // Obtener notificación pendiente por ID
      getPendingNotification: (id) => {
        return get().pendingNotifications.find((n) => n.id === id)
      },

      // Obtener cantidad de notificaciones pendientes
      getPendingCount: () => {
        return get().pendingNotifications.length
      },

      // Eliminar notificaciones pendientes antiguas
      removeOldPendingNotifications: (maxAgeMs = DEFAULT_MAX_AGE) => {
        const now = Date.now()
        set((state) => {
          const filtered = state.pendingNotifications.filter((notification) => {
            const notificationTime = new Date(notification.timestamp).getTime()
            return now - notificationTime < maxAgeMs
          })
          
          const removedCount = state.pendingNotifications.length - filtered.length
          if (removedCount > 0) {
            console.log(`🧹 [PendingStore] ${removedCount} notificaciones antiguas eliminadas`)
          }
          
          return { pendingNotifications: filtered }
        })
      },
    }),
    {
      name: 'pending-notifications-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Persistir todo el estado
      partialize: (state) => ({
        pendingNotifications: state.pendingNotifications,
      }),

      // Al recargar desde storage, limpiar notificaciones antiguas
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const count = state.pendingNotifications.length
        
        if (count > 0) {
          console.log(`✅ [PendingStore] ${count} notificaciones pendientes restauradas`)
          
          // Limpiar notificaciones antiguas automáticamente
          state.removeOldPendingNotifications()
        } else {
          console.log('📭 [PendingStore] No hay notificaciones pendientes guardadas')
        }
      },

      // Versión del schema (incrementar si cambias la estructura)
      version: 1,
    }
  )
)
