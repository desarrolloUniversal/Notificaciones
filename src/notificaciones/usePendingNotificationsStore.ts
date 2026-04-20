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
  updatePendingNotification: (id: string, updates: Partial<PendingNotificationFromUrl>) => void
  updateOldNotificationsUser: () => void
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
          // Actualizar campo usuarios de notificaciones antiguas
          get().updateOldNotificationsUser()
        }
      },

      // Agregar notificación pendiente al usuario actual
      addPendingNotification: (notification) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return

        // Desescapar secuencias literales y normalizar UTF-8 (NFC) antes de almacenar
        const unescapeNFC = (text: string | null | undefined): string => {
          if (!text) return ''
          return text
            .replace(/\\u([0-9a-fA-F]{4})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .split('\\"').join('"')
            .split("\\'").join("'")
            .normalize('NFC')
        }

        const normalized = {
          ...notification,
          titulo:    unescapeNFC(notification.titulo),
          subtitulo: unescapeNFC(notification.subtitulo),
          seccion:   unescapeNFC(notification.seccion),
        }

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: [normalized, ...userNotifications],
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

      // Actualizar notificación pendiente del usuario actual
      updatePendingNotification: (id, updates) => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        set({
          pendingNotificationsByUser: {
            ...pendingNotificationsByUser,
            [currentUser]: userNotifications.map((n) => 
              n.id === id ? { ...n, ...updates } : n
            ),
          }
        })
      },

      // Actualizar el campo usuarios de notificaciones antiguas que tienen "Sistema"
      updateOldNotificationsUser: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return

        const userNotifications = pendingNotificationsByUser[currentUser] || []
        
        // Actualizar notificaciones que tienen "Sistema" al usuario actual
        const updatedNotifications = userNotifications.map((n) => 
          n.usuarios === 'Sistema' ? { ...n, usuarios: currentUser } : n
        )
        
        // Solo actualizar si hubo cambios
        if (JSON.stringify(updatedNotifications) !== JSON.stringify(userNotifications)) {
          set({
            pendingNotificationsByUser: {
              ...pendingNotificationsByUser,
              [currentUser]: updatedNotifications,
            }
          })
        }
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
      // Limpia secuencias de escape residuales (\" → ") en datos ya almacenados
      getPendingNotifications: () => {
        const { currentUser, pendingNotificationsByUser } = get()
        
        if (!currentUser) return []
        
        const raw = pendingNotificationsByUser[currentUser] || []
        const stripOuter = (s: string) => s.split('\\"').join('"').replace(/^"(.*)"$/, '$1')
        return raw.map((n) => ({
          ...n,
          titulo:    stripOuter(n.titulo    || ''),
          subtitulo: stripOuter(n.subtitulo || ''),
          seccion:   stripOuter(n.seccion   || ''),
        }))
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
