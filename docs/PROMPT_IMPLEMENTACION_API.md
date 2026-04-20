# PROMPT: Implementación de Consumo de API de Notificaciones

## Contexto
Actualizar una aplicación React + TypeScript + Vite para reemplazar notificaciones hardcodeadas por el consumo de una API real de AWS, sin romper la UI existente, agregando validaciones exhaustivas, manejo de estados, logs detallados. La implementación debe seguir una **arquitectura modular** con **Screaming Architecture** para el nombrado de archivos.


## Endpoint de la API
```
URL: https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificaciones?site=eluniversal
```

## Estructura de la Respuesta de la API
```json
{
  "status": 0,
  "message": "",
  "Notificaciones": [
    {
      "content": "Guardia Costera de EU incauta otro buque frente a costa de Venezuela...",
      "date": "2026/01/09T14:34:14",
      "timestamp": 1767990854,
      "status": 0,
      "message": "Notificaciones enviadas:37",
      "site": "eluniversal",
      "suscriptores": 37,
      "url": "https://www.eluniversal.com.mx/...",
      "title": "confabulario",
      "idarticulo": "5DUT2TEH4NDB3E2FTPUJEOGCZU"
    }
  ]
}
```

## Arquitectura y Estructura de Archivos

### Screaming Architecture
Los nombres de archivos y carpetas deben reflejar claramente su propósito de negocio:
- Usar nombres descriptivos que indiquen la funcionalidad
- Evitar nombres técnicos genéricos (no usar "utils", "helpers")
- Los nombres deben "gritar" qué hace el código

### Estructura Modular Propuesta
```
src/
├── notificaciones/
│   ├── parseDataNotification.ts     # Transformación de datos de API
│   ├── fetchNotifications.ts        # Lógica de petición HTTP
│   ├── validarRespuestaAPI.ts       # Validaciones de la respuesta
│   ├── useNotificacionesStore.ts    # Store de Zustand con caché
│   └── types/
│       └── notificacionesTypes.ts   # Interfaces TypeScript
├── App.tsx
└── ...
```

## Requisitos de Implementación

### 0. Instalar Zustand
```bash
npm install zustand
```

### 1. Reemplazar datos hardcodeados
Eliminar la carga del archivo `/src/data/notifications.json` y reemplazarlo con el fetch a la API real

### 2. Crear archivo de tipos: `src/notificaciones/types/notificacionesTypes.ts`
Definir todas las interfaces en un archivo separado:
```typescript
// src/notificaciones/types/notificacionesTypes.ts
export interface ApiResponse {
  status: number
  message: string
  Notificaciones: ApiNotification[]
}

export interface ApiNotification {
  content: string
  date: string
  timestamp: number
  status: number
  message: string
  site: string
  suscriptores: number
  url: string
  title: string
  idarticulo: string
}

export interface Notification {
  id: string
  thumbnail: string
  seccion: string
  titulo: string
  subtitulo: string
  fechaEnvio: string
  estadoEnvio: string
  totalEnvios: number
  leidos: number
  totalLeidos: number
  usuarios: string
}
```

### 3. Crear componente de transformación: `src/notificaciones/parseDataNotification.ts`
Este archivo debe contener TODA la lógica de transformación de datos:

```typescript
// src/notificaciones/parseDataNotification.ts
import { ApiNotification, Notification } from './types/notificacionesTypes'

export const parseDataNotification = (apiNotifications: ApiNotification[]): Notification[] => {
  console.log('🔄 Transformando datos de la API...')
  console.log('📊 Total de notificaciones recibidas:', apiNotifications.length)
  
  return apiNotifications.map((apiNotif, index) => {
    console.log(`📝 Transformando notificación ${index + 1}:`, {
      titulo: apiNotif.title,
      contenido: apiNotif.content.substring(0, 50) + '...',
      suscriptores: apiNotif.suscriptores
    })

    return {
      id: apiNotif.idarticulo,
      thumbnail: '', // Se asigna dinámicamente en el componente
      seccion: apiNotif.title,
      titulo: apiNotif.content,
      subtitulo: '', // Extraer de URL si es necesario
      fechaEnvio: apiNotif.date,
      estadoEnvio: apiNotif.status === 0 ? 'Enviado' : 'Pendiente',
      totalEnvios: apiNotif.suscriptores,
      leidos: Math.floor(apiNotif.suscriptores * 0.75), // 75% estimado
      totalLeidos: Math.floor(apiNotif.suscriptores * 0.90), // 90% estimado
      usuarios: apiNotif.site
    }
  })
}
```

**Mapeo de campos:**
- `idarticulo` → `id`
- `title` → `seccion`
- `content` → `titulo`
- `url` → `subtitulo` (vacío o extraer)
- `date` → `fechaEnvio`
- `status` (0 = "Enviado") → `estadoEnvio`
- `suscriptores` → `totalEnvios`
- Calcular `leidos` (75%) y `totalLeidos` (90%)
- `site` → `usuarios`

### 4. Crear archivo de validaciones: `src/notificaciones/validarRespuestaAPI.ts`
```typescript
// src/notificaciones/validarRespuestaAPI.ts
import { ApiResponse } from './types/notificacionesTypes'

export const validarRespuestaAPI = (data: ApiResponse): void => {
  console.log('🔍 Validando respuesta de la API...')
  
  if (data.status !== 0 && data.status !== undefined) {
    console.warn('⚠️ API retornó status diferente de 0:', data.status)
  }

  if (!data.Notificaciones || !Array.isArray(data.Notificaciones)) {
    throw new Error('La respuesta no contiene un array de Notificaciones válido')
  }

  if (data.Notificaciones.length === 0) {
    console.warn('⚠️ No se recibieron notificaciones')
  }
  
  console.log('✅ Validación completada')
}
```

**Validaciones a implementar:**
- Validar que la respuesta HTTP sea exitosa (`response.ok`)
- Validar que `data.Notificaciones` existe y es un array
- Validar que el array no esté vacío
- Validar el `status` de la respuesta de la API
- Manejar errores con try-catch

### 5. Crear archivo de petición: `src/notificaciones/fetchNotifications.ts`
```typescript
// src/notificaciones/fetchNotifications.ts
import { ApiResponse } from './types/notificacionesTypes'
import { validarRespuestaAPI } from './validarRespuestaAPI'
import { parseDataNotification } from './parseDataNotification'

const API_URL = 'https://voaq9ne5bf.execute-api.us-east-1.amazonaws.com/notificaciones?site=eluniversal'

export const fetchNotifications = async () => {
  console.log('🚀 Iniciando carga de notificaciones...')
  console.log('🔌 Conectando con método GET...')
  console.log('📡 Haciendo petición GET a:', API_URL)
  
  const response = await fetch(API_URL, { method: 'GET' })
  
  if (!response.ok) {
    throw new Error(`Error HTTP: ${response.status} ${response.statusText}`)
  }
  
  console.log('✅ Respuesta HTTP recibida:', response.status)
  
  const data: ApiResponse = await response.json()
  
  console.log('📦 Datos recibidos:', {
    status: data.status,
    message: data.message,
    totalNotificaciones: data.Notificaciones?.length || 0
  })
  console.log('📋 Datos completos de la API:', JSON.stringify(data, null, 2))
  
  // Validar respuesta
  validarRespuestaAPI(data)
  
  // Transformar datos
  const notificaciones = parseDataNotification(data.Notificaciones)
  
  console.log('✅ Notificaciones cargadas exitosamente')
  return notificaciones
}
```

### 6. Crear store de Zustand: `src/notificaciones/useNotificacionesStore.ts`
```typescript
// src/notificaciones/useNotificacionesStore.ts
import { create } from 'zustand'
import { Notification } from './types/notificacionesTypes'

interface NotificacionesState {
  // Estado
  notificaciones: Notification[]
  loading: boolean
  error: string | null
  lastFetch: number | null
  
  // Métodos
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

export const useNotificacionesStore = create<NotificacionesState>((set, get) => ({
  // Estado inicial
  notificaciones: [],
  loading: false,
  error: null,
  lastFetch: null,

  // Establecer notificaciones y actualizar timestamp de caché
  setNotificaciones: (notificaciones) => {
    console.log('💾 Guardando notificaciones en store:', notificaciones.length)
    set({ 
      notificaciones, 
      lastFetch: Date.now(),
      error: null 
    })
  },

  // Establecer estado de carga
  setLoading: (loading) => {
    console.log('⏳ Actualizando estado de carga:', loading)
    set({ loading })
  },

  // Establecer error
  setError: (error) => {
    console.log('❌ Guardando error en store:', error)
    set({ error, loading: false })
  },

  // Limpiar notificaciones del caché
  clearNotificaciones: () => {
    console.log('🗑️ Limpiando caché de notificaciones')
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
      console.log('🔄 No hay caché, se debe hacer fetch')
      return true
    }
    const timeSinceLastFetch = Date.now() - lastFetch
    const shouldRefetch = timeSinceLastFetch > cacheTimeMs
    console.log('🕐 Tiempo desde último fetch:', timeSinceLastFetch + 'ms')
    console.log('🔄 ¿Refetch necesario?:', shouldRefetch)
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
```

**Funcionalidades del Store:**
- ✅ Caché de notificaciones en memoria
- ✅ Control de tiempo de caché (5 minutos por defecto)
- ✅ Métodos para establecer/limpiar notificaciones
- ✅ Manejo de estados de loading y error
- ✅ Métodos de utilidad (filtrar por estado, buscar por ID, total)
- ✅ Logs en consola para debugging

### 7. Actualizar `App.tsx` para usar arquitectura modular con Zustand
```typescript
// src/App.tsx
import { useEffect } from 'react'
import { fetchNotifications } from './notificaciones/fetchNotifications'
import { useNotificacionesStore } from './notificaciones/useNotificacionesStore'
import './App.css'

function App() {
  // Usar Zustand store en lugar de useState local
  const { 
    notificaciones: notifications,
    loading,
    error,
    setNotificaciones,
    setLoading,
    setError,
    clearError,
    shouldRefetch,
    getTotalNotificaciones
  } = useNotificacionesStore()

  const loadNotifications = async (forceRefresh = false) => {
    try {
      // Verificar si necesitamos hacer refetch basado en caché
      if (!forceRefresh && !shouldRefetch()) {
        console.log('📦 Usando notificaciones desde caché')
        console.log('📊 Total en caché:', getTotalNotificaciones())
        return
      }

      setLoading(true)
      clearError()
      
      const data = await fetchNotifications()
      setNotificaciones(data)
      
      console.log('🏁 Proceso de carga finalizado')
      console.log('💾 Notificaciones guardadas en store')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      console.error('❌ Error al cargar notificaciones:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const handleRefresh = () => {
    console.log('🔄 Refrescando notificaciones (forzado)...')
    loadNotifications(true) // Forzar refresh ignorando caché
  }

  // Resto del componente...
}
```

**Manejo de estados con Zustand:**
- Estado global `loading` para mostrar indicador de carga
- Estado global `error` para mostrar mensajes de error
- Estado global `notificaciones` con caché de 5 minutos
- Estado global `lastFetch` para control de tiempo de caché
- Métodos de utilidad expuestos por el store
- Deshabilitar botón "Actualizar" durante la carga
- Mostrar texto "Cargando..." en el botón
- Usar caché automáticamente si no ha expirado

### 8. Mejorar la UI
- Mostrar un mensaje de "Cargando notificaciones..." mientras se hace el fetch
- Mostrar un banner de error (rojo) si falla la petición
- Mostrar mensaje "No hay notificaciones disponibles" si el array está vacío
- Solo mostrar la tabla cuando hay datos y no está cargando

### 9. Función handleRefresh
Actualizar para que fuerce un refresh ignorando el caché: `loadNotifications(true)`

## Código Actual
El archivo `App.tsx` actualmente carga datos de `/src/data/notifications.json` en la función `loadNotifications()` dentro de un `useEffect` que depende de `refreshKey`.

## Resultado Esperado

### Estructura de Archivos Creada
```
src/
├── notificaciones/
│   ├── parseDataNotification.ts
│   ├── fetchNotifications.ts
│   ├── validarRespuestaAPI.ts
│   ├── useNotificacionesStore.ts
│   └── types/
│       └── notificacionesTypes.ts
└── App.tsx (modificado)
```

### Funcionalidad
- La aplicación debe consumir la API real de AWS
- **Store de Zustand con caché de 5 minutos**
- **Sistema de caché inteligente** que evita peticiones innecesarias
- **Métodos expuestos** para manipular y consultar notificaciones
- Arquitectura modular con separación de responsabilidades
- Screaming Architecture: nombres descriptivos del dominio
- Transformación de datos SOLO en `parseDataNotification.ts`
- Los datos deben mostrarse en la misma tabla actual sin cambios visuales
- La consola debe mostrar logs detallados con emojis en cada paso del proceso
- Los errores deben manejarse gracefully con mensajes claros al usuario
- El botón de actualizar debe funcionar correctamente y forzar recarga ignorando caché

## Validaciones Críticas que NO deben olvidarse
1. **Instalar Zustand**: `npm install zustand`
2. **Crear 5 archivos separados** siguiendo Screaming Architecture
3. **Toda transformación de datos SOLO en `parseDataNotification.ts`**
4. **Store de Zustand con caché de 5 minutos**
5. **Métodos del store expuestos y funcionales**
6. Usar método GET para la petición
7. Verificar que `response.ok` antes de parsear JSON
8. Verificar que `data.Notificaciones` es un array válido
9. Capturar cualquier error en try-catch
10. Imprimir todos los datos en consola para debugging
11. Mostrar estados de loading y error al usuario desde Zustand
12. Mantener separación de responsabilidades:
   - `fetchNotifications.ts` → Solo peticiones HTTP
   - `validarRespuestaAPI.ts` → Solo validaciones
   - `parseDataNotification.ts` → Solo transformación
   - `useNotificacionesStore.ts` → Solo estado global y caché
   - `notificacionesTypes.ts` → Solo tipos
## VALIDACIONES FINALES (ANTES DE TERMINAR)

✅ Zustand instalado: `npm install zustand`

✅ Carpeta `src/notificaciones/` creada

✅ Archivo `parseDataNotification.ts` creado con transformación

✅ Archivo `fetchNotifications.ts` creado con petición

✅ Archivo `validarRespuestaAPI.ts` creado con validaciones

✅ Archivo `useNotificacionesStore.ts` creado con store de Zustand

✅ Archivo `types/notificacionesTypes.ts` creado con interfaces

✅ Store expone todos los métodos necesarios

✅ Caché de 5 minutos implementado

✅ Método `shouldRefetch()` funcional

✅ Logs de caché visibles en consola

✅ App.tsx usa el store en lugar de useState local

✅ Método GET implementado

✅ response.ok validado

✅ data.Notificaciones es array

✅ try/catch implementado

✅ Logs visibles en consola

✅ Sin errores TypeScript

✅ UI intacta

✅ Screaming Architecture aplicada

✅ Separación de responsabilidades correcta

🛑 REGLA FINAL PARA COPILOT

Si el contexto del proyecto no es suficiente, NO IMPLEMENTES.
Agrega un comentario solicitando la información faltante.


## RECOMENDACIONES EXTRA

### Orden de Creación Sugerido:
1. **Instalar Zustand**: `npm install zustand`
2. Crear carpeta `src/notificaciones/types/`
3. Crear `notificacionesTypes.ts` con todas las interfaces
4. Crear `useNotificacionesStore.ts` con el store de Zustand
5. Crear `parseDataNotification.ts` con lógica de transformación
6. Crear `validarRespuestaAPI.ts` con validaciones
7. Crear `fetchNotifications.ts` que use los 3 anteriores
8. Modificar `App.tsx` para importar y usar el store + `fetchNotifications`

### Buenas Prácticas:
- Haz commits pequeños por cada archivo creado
- Cada archivo debe tener UNA sola responsabilidad
- Los nombres deben ser del dominio de negocio, no técnicos
- Usa exports nombrados, no default exports
- Mantén los console.logs distribuidos en cada módulo
- El store de Zustand debe ser la ÚNICA fuente de verdad para el estado
- No usar useState para estados que ya están en Zustand
- Los métodos del store deben tener nombres descriptivos del dominio
- El tiempo de caché (5 min) puede ser ajustable como parámetro
---

**Este prompt contiene todas las instrucciones necesarias para implementar el consumo de la API correctamente con método GET, siguiendo una arquitectura modular y Screaming Architecture.**
