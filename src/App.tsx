import './App.css'
import elUniversalLogo from './assets/images/el_universal.png'
import { useEffect, useState } from 'react'
import { useNotificacionesStore } from './notificaciones/useNotificacionesStore'

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

  const handleApplyUrl = () => {
    setUrlInput(modalUrlInput)
    setIsModalOpen(false)
    
    // Iniciar simulación de carga
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    
    // Simular progreso de carga
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            setIsLoadingNewNotification(false)
            fetchNotifications(true)
          }, 500)
          return 100
        }
        return prev + 10
      })
    }, 300)
  }

  const handleDiscard = () => {
    setIsConfirmModalOpen(true)
  }

  const handleConfirmDiscard = () => {
    setModalUrlInput('')
    setIsModalOpen(false)
    setIsConfirmModalOpen(false)
  }

  const handleCancelDiscard = () => {
    setIsConfirmModalOpen(false)
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

      {/* Card de carga de nueva notificación */}
      {isLoadingNewNotification && (
        <div className="loading-notification-card">
          <div className="loading-card-content">
            <div className="loading-card-icon">🔄</div>
            <div className="loading-card-info">
              <div className="loading-card-title">Cargando nueva notificación desde URL personalizada...</div>
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
