import './App.css'
import elUniversalLogo from './assets/images/el_universal.png'
import { useEffect, useState } from 'react'
import { useNotificacionesStore } from './notificaciones/useNotificacionesStore'
import { fetchStoryFromUrl } from './notificaciones/fetchStoryFromUrl'
import { parseStoryToNotification } from './notificaciones/parseStoryToNotification'
import { sendNotification, canSendNotification } from './notificaciones/sendNotification'
import { validateArticleUrl, analyzeUrl } from './notificaciones/validateUrl'
import type { PendingNotificationFromUrl } from './notificaciones/types/notificacionesTypes'

const getImageBySectionOrId = (thumbnail: string) => {
    if (thumbnail && thumbnail.startsWith('http')) {
      return thumbnail
    }
    return elUniversalLogo
  }

function App() {
  const { 
    notificaciones: notifications,
    loading,
    error,
    fetchNotifications
  } = useNotificacionesStore()

  const [urlInput, setUrlInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalUrlInput, setModalUrlInput] = useState('')
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [isLoadingNewNotification, setIsLoadingNewNotification] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [pendingNotifications, setPendingNotifications] = useState<PendingNotificationFromUrl[]>([])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleRefresh = () => {
    fetchNotifications(true)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }

  const handleInputClick = () => {
    setModalUrlInput(urlInput)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleModalUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModalUrlInput(e.target.value)
  }

  const handleApplyUrl = async () => {
    const url = modalUrlInput.trim()
    
    // Validación básica
    if (!url) {
      alert('❌ Por favor ingresa una URL')
      return
    }
    
    // Validar formato de URL
    const validation = validateArticleUrl(url)
    if (!validation.valid) {
      alert(`❌ URL inválida\n\n${validation.message}`)
      return
    }
    
    // Analizar URL
    const analysis = analyzeUrl(url)
    console.log('🔍 [handleApplyUrl] Análisis de URL:', analysis)
    
    if (!analysis.isValid) {
      alert(`❌ Error al analizar URL\n\n${analysis.error}`)
      return
    }
    
    setUrlInput(url)
    setIsModalOpen(false)
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    console.log('\n🚀 [handleApplyUrl] Iniciando carga de notificación')
    console.log('📋 URL original:', url)
    console.log('📍 Pathname:', analysis.pathname)
    console.log('🏷️ Sección:', analysis.section)
    
    try {
      // Progreso: 0-30% - Conectando
      setLoadingProgress(10)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoadingProgress(30)
      
      console.log('\n📡 [handleApplyUrl] Llamando a API de stories...')
      
      // Progreso: 30-70% - Obteniendo datos
      const storyData = await fetchStoryFromUrl(url)
      
      console.log('✅ [handleApplyUrl] Respuesta recibida:', {
        id: storyData.idarticulo,
        hasHeadline: !!storyData.headlines_basic,
        hasPromo: !!storyData.promo_items,
        section: storyData.primary_section_path
      })
      
      setLoadingProgress(50)
      await new Promise(resolve => setTimeout(resolve, 200))
      setLoadingProgress(70)
      
      // Progreso: 70-100% - Procesando información
      console.log('\n🔄 [handleApplyUrl] Parseando story a notificación...')
      const notification = parseStoryToNotification(storyData, url)
      
      console.log('✅ [handleApplyUrl] Notificación creada:', {
        id: notification.id,
        titulo: notification.titulo.substring(0, 50) + '...',
        seccion: notification.seccion,
        thumbnail: notification.thumbnail ? 'Sí' : 'No'
      })
      
      setLoadingProgress(90)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Agregar a notificaciones pendientes
      setPendingNotifications(prev => [notification, ...prev])
      
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      console.log('\n✨ [handleApplyUrl] ¡Notificación agregada a pendientes exitosamente!')
      console.log('📊 Total de pendientes:', pendingNotifications.length + 1)
    } catch (error) {
      console.error('\n❌ [handleApplyUrl] ERROR al procesar URL:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
      
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener artículo'
      setLoadingError(errorMessage)
      
      // Mantener el error visible por más tiempo
      await new Promise(resolve => setTimeout(resolve, 4000))
    } finally {
      setIsLoadingNewNotification(false)
      setLoadingProgress(0)
    }
  }

  const handleDiscard = () => {
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDiscard = async () => {
    // Guardar notificación como pendiente desde la API
    const url = modalUrlInput.trim()
    
    if (url) {
      try {
        console.log('🔄 Descartando pero guardando en pendientes:', url)
        const storyData = await fetchStoryFromUrl(url)
        const notification = parseStoryToNotification(storyData, url)
        setPendingNotifications(prev => [notification, ...prev])
        console.log('✅ Notificación guardada en pendientes')
      } catch (error) {
        console.error('❌ Error al guardar notificación pendiente:', error)
        // Fallback: crear notificación básica si falla la API
        const fallbackNotification: PendingNotificationFromUrl = {
          id: Date.now().toString(),
          thumbnail: '',
          seccion: 'Desconocida',
          titulo: `Notificación desde: ${url}`,
          subtitulo: 'Error al obtener datos - Pendiente',
          url: url,
          estadoEnvio: 'Pendiente',
          fechaEnvio: null,
          usuarios: 'Sistema',
          timestamp: new Date().toISOString()
        }
        setPendingNotifications(prev => [fallbackNotification, ...prev])
      }
    }
    
    setModalUrlInput('')
    setIsModalOpen(false)
    setIsConfirmModalOpen(false)
  }

  const handleCancelDiscard = () => {
    setIsConfirmModalOpen(false)
  }

  const handleRemovePending = (id: string) => {
    setPendingNotifications(prev => prev.filter(pending => pending.id !== id))
  }

  const handleApplyPending = async (pending: PendingNotificationFromUrl) => {
    // Validar que la notificación pueda ser enviada
    if (!canSendNotification(pending)) {
      alert('❌ La notificación no puede ser enviada. Verifica que tenga todos los datos necesarios.')
      return
    }
    
    console.log('📤 Iniciando envío de notificación pendiente:', pending)
    
    setUrlInput(pending.url)
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    try {
      setLoadingProgress(30)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Llamar al endpoint de envío
      const result = await sendNotification(pending)
      
      setLoadingProgress(70)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      console.log('✅ Notificación enviada exitosamente:', result)
      
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remover de pendientes después de envío exitoso
      setPendingNotifications(prev => prev.filter(p => p.id !== pending.id))
      
      alert(`✅ Notificación "${pending.titulo}" enviada correctamente.\n\n${result.message}`)
      
      // Refrescar lista de notificaciones
      fetchNotifications(true)
    } catch (error) {
      console.error('❌ Error al enviar notificación:', error)
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      setLoadingError(errorMessage)
      alert(`❌ Error al enviar notificación:\n\n${errorMessage}`)
      await new Promise(resolve => setTimeout(resolve, 2000))
    } finally {
      setIsLoadingNewNotification(false)
      setLoadingProgress(0)
    }
  }

  const formatDate = (dateString: string) => {
    // Convertir formato "2026/01/09T14:34:14" a "2026-01-09T14:34:14"
    const normalizedDate = dateString.replace(/\//g, '-')
    const date = new Date(normalizedDate)
    
    if (isNaN(date.getTime())) {
      return dateString // Retornar el string original si no se puede parsear
    }
    
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'enviado':
        return 'status-sent'
      case 'pendiente':
        return 'status-pending'
      case 'fallido':
        return 'status-failed'
      default:
        return ''
    }
  }

  return (
    <div className="container">
      <div className="header-section">
        <h1 className="page-title">Notificaciones</h1>
        <div className="controls-group">
          <div className="url-input-container">
            <span className="url-icon">🌐</span>
            <input
              type="text"
              className="url-input"
              placeholder="Ingrese la URL del endpoint..."
              value={urlInput}
              onChange={handleUrlChange}
              onClick={handleInputClick}
              disabled={loading}
              readOnly
            />
          </div>
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="refresh-icon">{loading ? '⏳' : '↻'}</span>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {/* Modal de configuración de URL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Configurar Endpoint Personalizado</h2>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body">
              <label className="modal-label">URL del servidor:</label>
              <div className="modal-input-wrapper">
                <span className="modal-input-icon">🌐</span>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="https://..."
                  value={modalUrlInput}
                  onChange={handleModalUrlChange}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-primary" onClick={handleApplyUrl}>
                <span className="btn-icon">✓</span>
                Agregar URL
              </button>
              <button className="modal-btn modal-btn-secondary" onClick={handleDiscard}>
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación al descartar */}
      {isConfirmModalOpen && (
        <div className="modal-overlay" onClick={handleCancelDiscard}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h3 className="confirm-title">Descartar URL</h3>
            <p className="confirm-message">
              La URL quedará pendiente y no se aplicará a las notificaciones.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn confirm-btn-danger" onClick={handleConfirmDiscard}>
                Sí, descartar
              </button>
              <button className="confirm-btn confirm-btn-cancel" onClick={handleCancelDiscard}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de error */}
      {error && (
        <div className="error-banner">
          ❌ Error: {error}
        </div>
      )}

      {/* Estado de carga */}
      {loading && notifications.length === 0 && (
        <div className="loading-message">
          ⏳ Cargando notificaciones...
        </div>
      )}

      {/* Mensaje cuando no hay notificaciones */}
      {!loading && !error && notifications.length === 0 && (
        <div className="empty-message">
          📭 No hay notificaciones disponibles
        </div>
      )}

      {/* Tabla de Notificaciones Pendientes */}
      {pendingNotifications.length > 0 && (
        <div className="pending-section">
          <div className="pending-banner">
            <span className="pending-icon">📌</span>
            <span className="pending-title">NOTIFICACIONES PENDIENTES</span>
            <span className="pending-count">{pendingNotifications.length}</span>
          </div>
          <div className="table-wrapper pending-table-wrapper">
            <table className="notifications-table pending-notifications-table">
              <thead>
                <tr>
                  <th className="center-header">Thumbnail</th>
                  <th className="center-header">Sección</th>
                  <th className="center-header">Título</th>
                  <th className="center-header">Fecha de Envío</th>
                  <th className="center-header">Estado<br />de envío</th>
                  <th className="center-header">Total de envíos</th>
                  <th>Usuarios</th>
                  <th className="center-header">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pendingNotifications.map((pending, index) => (
                  <tr key={pending.id} className={index % 2 === 0 ? 'even-row' : 'odd-row'}>
                    <td>
                      <img 
                        src={getImageBySectionOrId(pending.thumbnail)} 
                        alt={pending.titulo}
                        className="thumbnail"
                      />
                    </td>
                    <td>{pending.seccion}</td>
                    <td className="title-cell">{pending.titulo}</td>
                    <td>{pending.fechaEnvio || 'Sin definir'}</td>
                    <td>
                      <span className="status-badge status-pending-orange">
                        ⏳ {pending.estadoEnvio}
                      </span>
                    </td>
                    <td className="number-cell">0</td>
                    <td>{pending.usuarios}</td>
                    <td className="actions-cell">
                      <button 
                        className="apply-btn"
                        onClick={() => handleApplyPending(pending)}
                        title="Aplicar URL y cargar notificaciones"
                      >
                        ↑
                      </button>
                      <button 
                        className="delete-btn"
                        onClick={() => handleRemovePending(pending.id)}
                        title="Eliminar notificación pendiente"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Card de carga de nueva notificación */}
      {isLoadingNewNotification && (
        <div className="loading-notification-card">
          <div className="loading-card-content">
            <div className="loading-card-icon">{loadingError ? '❌' : '🔄'}</div>
            <div className="loading-card-info">
              <div className="loading-card-title">
                {loadingError 
                  ? 'Error al cargar notificación' 
                  : 'Cargando nueva notificación desde URL personalizada...'}
              </div>
              {!loadingError && (
                <>
                  <div className="loading-progress-bar">
                    <div 
                      className="loading-progress-fill" 
                      style={{ width: `${loadingProgress}%` }}
                    >
                      <span className="loading-progress-text">{loadingProgress}%</span>
                    </div>
                  </div>
                  <div className="loading-card-status">
                    {loadingProgress < 30 && '⏳ Conectando con el servidor...'}
                    {loadingProgress >= 30 && loadingProgress < 70 && '📥 Obteniendo datos...'}
                    {loadingProgress >= 70 && loadingProgress < 100 && '✅ Procesando información...'}
                    {loadingProgress === 100 && '✨ ¡Completado!'}
                  </div>
                </>
              )}
              {loadingError && (
                <div className="error-banner" style={{ marginTop: '10px' }}>
                  {loadingError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de notificaciones */}
      {notifications.length > 0 && (
      <div className="table-wrapper">
        <table className="notifications-table">
          <thead>
            <tr>
              <th className="center-header">Thumbnail</th>
              <th className="center-header">Sección</th>
              <th className="center-header">Título</th>
              <th className="center-header">Fecha de Envío</th>
              <th className="center-header">Estado<br />de envío</th>
              <th className="center-header">Total de envíos</th>
              <th>Usuarios</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td>
                  <img 
                    src={getImageBySectionOrId(notification.thumbnail)} 
                    alt={notification.titulo}
                    className="thumbnail"
                  />
                </td>
                <td>{notification.seccion}</td>
                <td className="title-cell">{notification.titulo}</td>
                <td>{formatDate(notification.fechaEnvio)}</td>
                <td>
                  <span className={`status-badge ${getStatusClass(notification.estadoEnvio)}`}>
                    {notification.estadoEnvio}
                  </span>
                </td>
                <td className="number-cell">{notification.totalEnvios.toLocaleString()}</td>
                <td>{notification.usuarios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  )
}

export default App
