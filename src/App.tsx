import './App.css'
import elUniversalLogo from './assets/images/el_universal.png'
import { useEffect, useState } from 'react'
import { useNotificacionesStore } from './notificaciones/useNotificacionesStore'
import { fetchStoryFromUrl } from './notificaciones/fetchStoryFromUrl'
import { parseStoryToNotification } from './notificaciones/parseStoryToNotification'
import { sendNotification, canSendNotification } from './notificaciones/sendNotification'
import { validateArticleUrl, analyzeUrl } from './notificaciones/validateUrl'
import type { PendingNotificationFromUrl } from './notificaciones/types/notificacionesTypes'
import { useAuthStore } from './auth/useAuthStore'
import { usePendingNotificationsStore } from './notificaciones/usePendingNotificationsStore'
import { LoginModal } from './components/LoginModal'

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

  const { 
    isAuthenticated, 
    username, 
    logout
  } = useAuthStore()

  const {
    getPendingNotifications,
    addPendingNotification,
    removePendingNotification,
    updatePendingNotification,
    setCurrentUser
  } = usePendingNotificationsStore()

  // Sincronizar usuario actual con store de notificaciones pendientes
  useEffect(() => {
    setCurrentUser(isAuthenticated ? username : null)
  }, [isAuthenticated, username, setCurrentUser])

  // Obtener notificaciones del usuario actual
  const pendingNotifications = getPendingNotifications()

  const [urlInput, setUrlInput] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalUrlInput, setModalUrlInput] = useState('')
  const [isLoadingNewNotification, setIsLoadingNewNotification] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [showSuccessAlert, setShowSuccessAlert] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set())
  const [isDateFilterModalOpen, setIsDateFilterModalOpen] = useState(false)
  const [selectedDateRanges, setSelectedDateRanges] = useState<Set<string>>(new Set())
  const [isCustomRangeModalOpen, setIsCustomRangeModalOpen] = useState(false)
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [dateError, setDateError] = useState('')
  const [showCalendar, setShowCalendar] = useState<'start' | 'end' | null>(null)
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null)
  const [editingTitleValue, setEditingTitleValue] = useState('')

  // Cargar notificaciones al iniciar
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleRefresh = async () => {
    try {
      await fetchNotifications(true)
      // Mostrar alerta de éxito
      setShowSuccessAlert(true)
      // Ocultar después de 3 segundos
      setTimeout(() => {
        setShowSuccessAlert(false)
      }, 3000)
    } catch (error) {
      // El error ya se maneja en el store
      console.error('Error al actualizar:', error)
    }
  }

  const handleLoginClick = () => {
    if (isAuthenticated) {
      // Si ya está autenticado, hacer logout
      logout()
    } else {
      // Si no está autenticado, abrir modal de login
      setIsLoginModalOpen(true)
    }
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleLoginSuccess = () => {
    // Refrescar notificaciones después del login
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
    // ✅ Limpiar ambos campos al cerrar sin guardar (descartar)
    setModalUrlInput('')
    setUrlInput('')
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
    
    if (!analysis.isValid) {
      alert(`❌ Error al analizar URL\n\n${analysis.error}`)
      return
    }
    
    setUrlInput(url)
    setIsModalOpen(false)
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    try {
      // Progreso: 0-30% - Conectando
      setLoadingProgress(10)
      await new Promise(resolve => setTimeout(resolve, 300))
      setLoadingProgress(30)
      
      // Progreso: 30-70% - Obteniendo datos
      const storyData = await fetchStoryFromUrl(url)
      
      setLoadingProgress(50)
      await new Promise(resolve => setTimeout(resolve, 200))
      setLoadingProgress(70)
      
      // Progreso: 70-100% - Procesando información
      const notification = parseStoryToNotification(storyData, url)
      
      setLoadingProgress(90)
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Agregar a notificaciones pendientes del usuario actual
      addPendingNotification(notification)
      
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // ✅ Limpiar campos después de agregar exitosamente
      setUrlInput('')
      setModalUrlInput('')
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

  const handleRemovePending = (id: string) => {
    removePendingNotification(id)
  }

  const handleStartEditTitle = (id: string, currentTitle: string) => {
    setEditingTitleId(id)
    setEditingTitleValue(currentTitle)
  }

  const handleSaveTitle = (id: string) => {
    if (editingTitleValue.trim()) {
      console.log('✏️ [handleSaveTitle] Guardando título modificado:', {
        id,
        tituloAnterior: pendingNotifications.find(p => p.id === id)?.titulo,
        tituloNuevo: editingTitleValue.trim()
      })
      updatePendingNotification(id, { titulo: editingTitleValue.trim() })
      console.log('✅ [handleSaveTitle] Título actualizado correctamente')
    }
    setEditingTitleId(null)
    setEditingTitleValue('')
  }

  const handleCancelEditTitle = () => {
    setEditingTitleId(null)
    setEditingTitleValue('')
  }

  const handleApplyPending = async (pending: PendingNotificationFromUrl) => {
    console.log('\n🔔 [handleApplyPending] Aplicando notificación pendiente:', pending)
    
    // Validar que la notificación pueda ser enviada
    if (!canSendNotification(pending)) {
      console.error('❌ [handleApplyPending] Validación fallida')
      alert('❌ La notificación no puede ser enviada. Verifica que tenga todos los datos necesarios.')
      return
    }
    
    console.log('✅ [handleApplyPending] Validación exitosa, iniciando envío...')
    
    setUrlInput(pending.url)
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    try {
      setLoadingProgress(30)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Llamar al endpoint de envío
      console.log('🚀 [handleApplyPending] Llamando a sendNotification...')
      const result = await sendNotification(pending)
      
      setLoadingProgress(70)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remover de pendientes después de envío exitoso
      removePendingNotification(pending.id)
      
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

  // Funciones de filtrado por sección
  const getSectionStats = () => {
    const sectionCounts = new Map<string, number>()
    notifications.forEach(notification => {
      const section = notification.seccion
      sectionCounts.set(section, (sectionCounts.get(section) || 0) + 1)
    })
    return Array.from(sectionCounts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([section, count]) => ({ section, count }))
  }

  const handleOpenFilterModal = () => {
    setIsFilterModalOpen(true)
  }

  const handleCloseFilterModal = () => {
    setIsFilterModalOpen(false)
  }

  const handleToggleAllSections = () => {
    if (selectedSections.size === getSectionStats().length) {
      // Si ya están todas seleccionadas, deseleccionar todas
      setSelectedSections(new Set())
    } else {
      // Seleccionar todas
      const allSections = getSectionStats().map(stat => stat.section)
      setSelectedSections(new Set(allSections))
    }
  }

  const handleToggleSection = (section: string) => {
    const newSelected = new Set(selectedSections)
    if (newSelected.has(section)) {
      newSelected.delete(section)
    } else {
      newSelected.add(section)
    }
    setSelectedSections(newSelected)
  }

  const handleApplyFilter = () => {
    setIsFilterModalOpen(false)
  }

  const handleClearFilter = () => {
    setSelectedSections(new Set())
  }

  // Funciones para filtro por fecha
  const getDateRangeStats = () => {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    const recentCount = notifications.filter(n => {
      const notifDate = new Date(n.fechaEnvio.replace(/\//g, '-'))
      return notifDate >= threeDaysAgo
    }).length
    
    const olderCount = notifications.filter(n => {
      const notifDate = new Date(n.fechaEnvio.replace(/\//g, '-'))
      return notifDate < threeDaysAgo
    }).length
    
    return [
      { range: 'recent', label: 'Más recientes', count: recentCount },
      { range: 'older', label: 'Anteriores', count: olderCount }
    ]
  }

  const handleOpenDateFilterModal = () => {
    setIsDateFilterModalOpen(true)
  }

  const handleCloseDateFilterModal = () => {
    setIsDateFilterModalOpen(false)
  }

  const handleToggleAllDateRanges = () => {
    if (selectedDateRanges.size === getDateRangeStats().length) {
      setSelectedDateRanges(new Set())
    } else {
      const allRanges = getDateRangeStats().map(stat => stat.range)
      setSelectedDateRanges(new Set(allRanges))
    }
  }

  const handleToggleDateRange = (range: string) => {
    const newSelected = new Set(selectedDateRanges)
    if (newSelected.has(range)) {
      newSelected.delete(range)
    } else {
      newSelected.add(range)
    }
    setSelectedDateRanges(newSelected)
  }

  const handleApplyDateFilter = () => {
    setIsDateFilterModalOpen(false)
  }

  const handleClearDateFilter = () => {
    setSelectedDateRanges(new Set())
    setCustomStartDate('')
    setCustomEndDate('')
  }

  const validateDateFormat = (dateString: string): boolean => {
    // Validar formato DD/MM/AAAA
    const dateRegex = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/
    if (!dateRegex.test(dateString)) return false
    
    // Validar que sea una fecha real
    const [day, month, year] = dateString.split('/').map(Number)
    const date = new Date(year, month - 1, day)
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  }

  const sanitizeDateInput = (value: string): string => {
    // Permitir solo números y /
    return value.replace(/[^0-9/]/g, '')
  }

  const syncCalendarWithDate = (dateString: string, inputType: 'start' | 'end') => {
    // Intentar parsear la fecha mientras se escribe
    const parts = dateString.split('/')
    if (parts.length >= 2) {
      const month = parseInt(parts[1])
      const year = parts.length === 3 ? parseInt(parts[2]) : new Date().getFullYear()
      
      // Si el mes es válido (1-12) y el año tiene al menos 4 dígitos
      if (month >= 1 && month <= 12 && year >= 1000) {
        const newDate = new Date(year, month - 1, 1)
        setCalendarDate(newDate)
        // Abrir el calendario correspondiente
        setShowCalendar(inputType)
      } else if (month >= 1 && month <= 12 && parts[2] && parts[2].length > 0) {
        // Si el mes es válido pero el año aún no está completo, usar el año actual
        const currentYear = new Date().getFullYear()
        const newDate = new Date(currentYear, month - 1, 1)
        setCalendarDate(newDate)
        setShowCalendar(inputType)
      }
    }
  }

  const handleOpenCustomRangeModal = () => {
    setIsCustomRangeModalOpen(true)
    setIsDateFilterModalOpen(false)
    setDateError('')
  }

  const handleCloseCustomRangeModal = () => {
    setIsCustomRangeModalOpen(false)
    setShowCalendar(null)
    setDateError('')
  }

  const handleCustomRangeApply = () => {
    if (!customStartDate || !customEndDate) {
      setDateError('Por favor completa ambas fechas')
      return
    }

    // Validar formato de ambas fechas
    if (!validateDateFormat(customStartDate)) {
      setDateError('Formato incorrecto en "Desde". Use DD/MM/AAAA (ej: 01/02/2026)')
      return
    }

    if (!validateDateFormat(customEndDate)) {
      setDateError('Formato incorrecto en "Hasta". Use DD/MM/AAAA (ej: 31/12/2026)')
      return
    }

    // Validar que la fecha de inicio sea menor o igual a la fecha final
    const startDate = new Date(customStartDate.split('/').reverse().join('-'))
    const endDate = new Date(customEndDate.split('/').reverse().join('-'))
    
    if (startDate > endDate) {
      setDateError('La fecha "Desde" debe ser anterior o igual a "Hasta"')
      return
    }

    // Todo válido, aplicar filtro
    setDateError('')
    setSelectedDateRanges(new Set(['custom']))
    setIsCustomRangeModalOpen(false)
    setShowCalendar(null)
  }

  const handleDateSelect = (date: Date) => {
    const formatted = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
    
    if (showCalendar === 'start') {
      setCustomStartDate(formatted)
      setCustomEndDate(formatted) // Auto-completar
      setShowCalendar(null)
    } else if (showCalendar === 'end') {
      setCustomEndDate(formatted)
      setShowCalendar(null)
    }
  }

  const handlePrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  }

  const renderCalendar = () => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-empty"></div>)
    }
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(
        <button
          key={day}
          className="calendar-day"
          onClick={() => handleDateSelect(new Date(year, month, day))}
        >
          {day}
        </button>
      )
    }
    return days
  }

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  // Filtrar notificaciones según secciones y fechas seleccionadas
  let filteredNotifications = notifications

  // Filtrar por sección
  if (selectedSections.size > 0) {
    filteredNotifications = filteredNotifications.filter(notification => 
      selectedSections.has(notification.seccion)
    )
  }

  // Filtrar por fecha
  if (selectedDateRanges.size > 0) {
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    filteredNotifications = filteredNotifications.filter(notification => {
      const notifDate = new Date(notification.fechaEnvio.replace(/\//g, '-'))
      
      if (selectedDateRanges.has('recent')) {
        return notifDate >= threeDaysAgo
      }
      if (selectedDateRanges.has('older')) {
        return notifDate < threeDaysAgo
      }
      if (selectedDateRanges.has('custom') && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate.split('/').reverse().join('-'))
        const endDate = new Date(customEndDate.split('/').reverse().join('-'))
        return notifDate >= startDate && notifDate <= endDate
      }
      return false
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
          {isAuthenticated && (
            <div className="url-input-container">
              <span className="url-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </span>
              <input
                type="text"
                className="url-input"
                placeholder="Ingrese la URL"
                value={urlInput}
                onChange={handleUrlChange}
                onClick={handleInputClick}
                disabled={loading}
                readOnly
              />
            </div>
          )}
          <button 
            className="refresh-btn" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <span className="refresh-icon">{loading ? '⏳' : '↻'}</span>
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          <button 
            className="login-btn"
            onClick={handleLoginClick}
            title={isAuthenticated ? `Cerrar sesión de ${username}` : 'Iniciar sesión'}
          >
            <svg className="login-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#2c3e50"/>
              <path d="M12 14C6.47715 14 2 18.4772 2 24H22C22 18.4772 17.5228 14 12 14Z" fill="#2c3e50"/>
            </svg>
            {isAuthenticated ? (
              <span>
                {username} <span style={{ fontSize: '0.9em', opacity: 0.8 }}>(Salir)</span>
              </span>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </div>
      </div>

      {/* Modal de configuración de URL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Configurar Endpoint Personalizado</h2>
              <button className="modal-close-btn" onClick={handleModalClose}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body">
              <label className="modal-label">URL del servidor:</label>
              <div className="modal-input-wrapper">
                <span className="modal-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="2" y1="12" x2="22" y2="12"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                  </svg>
                </span>
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
            </div>
          </div>
        </div>
      )}

      {/* Modal de filtro por sección */}
      {isFilterModalOpen && (
        <div className="modal-overlay" onClick={handleCloseFilterModal}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3 className="filter-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
                  <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Filtrar por Sección
              </h3>
              <button className="modal-close-btn" onClick={handleCloseFilterModal}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="filter-modal-body">
              {/* Checkbox "Todas las secciones" */}
              <label className="filter-checkbox-item filter-checkbox-all">
                <input
                  type="checkbox"
                  checked={selectedSections.size === getSectionStats().length && getSectionStats().length > 0}
                  onChange={handleToggleAllSections}
                />
                <span className="filter-checkbox-label">Todas las secciones</span>
              </label>
              <div className="filter-divider"></div>
              
              {/* Lista de secciones dinámicas */}
              {getSectionStats().map(({ section, count }) => (
                <label key={section} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedSections.has(section)}
                    onChange={() => handleToggleSection(section)}
                  />
                  <span className="filter-checkbox-label">{section}</span>
                  <span className="filter-count">({count})</span>
                </label>
              ))}
              
              {/* Indicador de selección */}
              <div className="filter-selection-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 2 10 8 10 12C10 14.2091 11.7909 16 14 16C16.2091 16 18 14.2091 18 12C18 8 16 2 16 2C15 4 12 4 12 2Z" fill="#f39c12"/>
                  <path d="M9 16C7.34315 16 6 17.3431 6 19C6 20.6569 7.34315 22 9 22H15C16.6569 22 18 20.6569 18 19C18 17.3431 16.6569 16 15 16H9Z" fill="#f39c12"/>
                </svg>
                {selectedSections.size} {selectedSections.size === 1 ? 'sección seleccionada' : 'secciones seleccionadas'}
              </div>
            </div>
            <div className="filter-modal-footer">
              <button className="filter-btn filter-btn-clear" onClick={handleClearFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12C4 7.58172 7.58172 4 12 4C14.5264 4 16.7792 5.17108 18.2454 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 12C20 16.4183 16.4183 20 12 20C9.47362 20 7.22082 18.8289 5.75463 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 3V7H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 21V17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Limpiar
              </button>
              <button className="filter-btn filter-btn-apply" onClick={handleApplyFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Aplicar filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de filtro por fecha */}
      {isDateFilterModalOpen && (
        <div className="modal-overlay" onClick={handleCloseDateFilterModal}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3 className="filter-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Filtrar por Fecha
              </h3>
              <button className="modal-close-btn" onClick={handleCloseDateFilterModal}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="filter-modal-body">
              {/* Checkbox "Todas las fechas" */}
              <label className="filter-checkbox-item filter-checkbox-all">
                <input
                  type="checkbox"
                  checked={selectedDateRanges.size === getDateRangeStats().length && getDateRangeStats().length > 0}
                  onChange={handleToggleAllDateRanges}
                />
                <span className="filter-checkbox-label">Todas las fechas</span>
              </label>
              <div className="filter-divider"></div>
              
              {/* Lista de rangos de fecha */}
              {getDateRangeStats().map(({ range, label, count }) => (
                <label key={range} className="filter-checkbox-item">
                  <input
                    type="checkbox"
                    checked={selectedDateRanges.has(range)}
                    onChange={() => handleToggleDateRange(range)}
                  />
                  <span className="filter-checkbox-label">{label}</span>
                  <span className="filter-count">({count})</span>
                </label>
              ))}
              
              <div className="filter-divider"></div>
              
              {/* Botón de rango personalizado */}
              <button className="filter-custom-range-btn" onClick={handleOpenCustomRangeModal}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Rango personalizado...
              </button>
              
              {/* Indicador de selección */}
              <div className="filter-selection-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C12 2 10 8 10 12C10 14.2091 11.7909 16 14 16C16.2091 16 18 14.2091 18 12C18 8 16 2 16 2C15 4 12 4 12 2Z" fill="#f39c12"/>
                  <path d="M9 16C7.34315 16 6 17.3431 6 19C6 20.6569 7.34315 22 9 22H15C16.6569 22 18 20.6569 18 19C18 17.3431 16.6569 16 15 16H9Z" fill="#f39c12"/>
                </svg>
                {selectedDateRanges.size} {selectedDateRanges.size === 1 ? 'rango seleccionado' : 'rangos seleccionados'}
              </div>
            </div>
            <div className="filter-modal-footer">
              <button className="filter-btn filter-btn-clear" onClick={handleClearDateFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 12C4 7.58172 7.58172 4 12 4C14.5264 4 16.7792 5.17108 18.2454 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M20 12C20 16.4183 16.4183 20 12 20C9.47362 20 7.22082 18.8289 5.75463 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M18 3V7H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6 21V17H10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Limpiar
              </button>
              <button className="filter-btn filter-btn-apply" onClick={handleApplyDateFilter}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Aplicar filtro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de rango personalizado */}
      {isCustomRangeModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCustomRangeModal}>
          <div className="custom-range-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3 className="filter-modal-title">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="6" width="18" height="15" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M16 3V7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Seleccionar Periodo
              </h3>
              <button className="modal-close-btn" onClick={handleCloseCustomRangeModal}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="custom-range-body">
              {/* Campo Desde */}
              <div className="date-input-group">
                <label className="date-input-label">Desde esta fecha:</label>
                <div className="date-input-wrapper">
                  <input
                    type="text"
                    className={`date-input ${dateError && customStartDate && !validateDateFormat(customStartDate) ? 'error' : ''}`}
                    placeholder="DD/MM/AAAA"
                    value={customStartDate}
                    onChange={(e) => {
                      const sanitized = sanitizeDateInput(e.target.value)
                      setCustomStartDate(sanitized)
                      setDateError('')
                      // Sincronizar calendario mientras escribe
                      syncCalendarWithDate(sanitized, 'start')
                    }}
                    onFocus={() => {
                      if (customStartDate) {
                        syncCalendarWithDate(customStartDate, 'start')
                      } else {
                        setShowCalendar('start')
                      }
                    }}
                    maxLength={10}
                  />
                  <button 
                    className="calendar-icon-btn"
                    onClick={() => setShowCalendar(showCalendar === 'start' ? null : 'start')}
                    title="Abrir calendario"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="6" width="18" height="15" rx="2" stroke="#ffffff" strokeWidth="2"/>
                      <path d="M3 10H21" stroke="#ffffff" strokeWidth="2"/>
                      <path d="M8 3V7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 3V7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  
                  {/* Mini Calendario Desde */}
                  {showCalendar === 'start' && (
                    <div className="mini-calendar">
                      <div className="calendar-header">
                        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                          ‹
                        </button>
                        <span className="calendar-month-year">
                          {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                        </span>
                        <button className="calendar-nav-btn" onClick={handleNextMonth}>
                          ›
                        </button>
                      </div>
                      <div className="calendar-weekdays">
                        <div>L</div>
                        <div>M</div>
                        <div>M</div>
                        <div>J</div>
                        <div>V</div>
                        <div>S</div>
                        <div>D</div>
                      </div>
                      <div className="calendar-days">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Campo Hasta */}
              <div className="date-input-group">
                <label className="date-input-label">Hasta esta fecha:</label>
                <div className="date-input-wrapper">
                  <input
                    type="text"
                    className={`date-input ${dateError && customEndDate && !validateDateFormat(customEndDate) ? 'error' : ''}`}
                    placeholder="DD/MM/AAAA"
                    value={customEndDate}
                    onChange={(e) => {
                      const sanitized = sanitizeDateInput(e.target.value)
                      setCustomEndDate(sanitized)
                      setDateError('')
                      // Sincronizar calendario mientras escribe
                      syncCalendarWithDate(sanitized, 'end')
                    }}
                    onFocus={() => {
                      if (customEndDate) {
                        syncCalendarWithDate(customEndDate, 'end')
                      } else {
                        setShowCalendar('end')
                      }
                    }}
                    maxLength={10}
                  />
                  <button 
                    className="calendar-icon-btn"
                    onClick={() => setShowCalendar(showCalendar === 'end' ? null : 'end')}
                    title="Abrir calendario"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="6" width="18" height="15" rx="2" stroke="#ffffff" strokeWidth="2"/>
                      <path d="M3 10H21" stroke="#ffffff" strokeWidth="2"/>
                      <path d="M8 3V7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                      <path d="M16 3V7" stroke="#ffffff" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                  
                  {/* Mini Calendario Hasta */}
                  {showCalendar === 'end' && (
                    <div className="mini-calendar">
                      <div className="calendar-header">
                        <button className="calendar-nav-btn" onClick={handlePrevMonth}>
                          ‹
                        </button>
                        <span className="calendar-month-year">
                          {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                        </span>
                        <button className="calendar-nav-btn" onClick={handleNextMonth}>
                          ›
                        </button>
                      </div>
                      <div className="calendar-weekdays">
                        <div>L</div>
                        <div>M</div>
                        <div>M</div>
                        <div>J</div>
                        <div>V</div>
                        <div>S</div>
                        <div>D</div>
                      </div>
                      <div className="calendar-days">
                        {renderCalendar()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mensaje de error */}
              {dateError && (
                <div className="date-error-message">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="#e74c3c" opacity="0.1"/>
                    <path d="M12 8V12" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
                    <circle cx="12" cy="16" r="1" fill="#e74c3c"/>
                  </svg>
                  {dateError}
                </div>
              )}
            </div>
            <div className="modal-divider"></div>
            <div className="filter-modal-footer">
              <button className="filter-btn filter-btn-clear" onClick={handleCloseCustomRangeModal}>
                Cancelar
              </button>
              <button className="filter-btn filter-btn-apply" onClick={handleCustomRangeApply}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 13L9 17L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Aplicar Rango
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de éxito */}
      {showSuccessAlert && (
        <div className="success-alert">
          <span className="success-icon">✅</span>
          <span className="success-message">Notificaciones actualizadas correctamente</span>
          <button 
            className="success-close-btn"
            onClick={() => setShowSuccessAlert(false)}
            title="Cerrar"
          >
            ✕
          </button>
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
                      {pending.url ? (
                        <a 
                          href={pending.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          title="Ver nota completa"
                        >
                          <img 
                            src={getImageBySectionOrId(pending.thumbnail)} 
                            alt={pending.titulo}
                            className="thumbnail"
                            style={{ cursor: 'pointer' }}
                          />
                        </a>
                      ) : (
                        <img 
                          src={getImageBySectionOrId(pending.thumbnail)} 
                          alt={pending.titulo}
                          className="thumbnail"
                        />
                      )}
                    </td>
                    <td>{pending.seccion}</td>
                    <td className="title-cell editable-title-cell">
                      {editingTitleId === pending.id ? (
                        <div className="title-edit-container">
                          <input
                            type="text"
                            className="title-edit-input"
                            value={editingTitleValue}
                            onChange={(e) => setEditingTitleValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveTitle(pending.id)
                              if (e.key === 'Escape') handleCancelEditTitle()
                            }}
                            autoFocus
                          />
                          <div className="title-edit-actions">
                            <button
                              className="title-save-btn"
                              onClick={() => handleSaveTitle(pending.id)}
                              title="Guardar"
                            >
                              ✓
                            </button>
                            <button
                              className="title-cancel-btn"
                              onClick={handleCancelEditTitle}
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="title-display-container">
                          <span className="title-text">{pending.titulo}</span>
                          <button
                            className="title-edit-btn"
                            onClick={() => handleStartEditTitle(pending.id, pending.titulo)}
                            title="Editar título"
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </td>
                    <td>{pending.fechaEnvio || '-'}</td>
                    <td>
                      <span className="status-badge status-pending-orange">
                        {pending.estadoEnvio}
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
              <th className="center-header">
                <div className="filter-header">
                  <span>Sección</span>
                  <button 
                    className="filter-dropdown-btn" 
                    onClick={handleOpenFilterModal}
                    title="Filtrar por sección"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10H7Z" fill="#f39c12"/>
                    </svg>
                  </button>
                  {selectedSections.size > 0 && (
                    <span className="filter-badge">{selectedSections.size}</span>
                  )}
                </div>
              </th>
              <th className="center-header">Título</th>
              <th className="center-header">
                <div className="filter-header">
                  <span>Fecha de Envío</span>
                  <button 
                    className="filter-dropdown-btn" 
                    onClick={handleOpenDateFilterModal}
                    title="Filtrar por fecha"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M7 10L12 15L17 10H7Z" fill="#f39c12"/>
                    </svg>
                  </button>
                  {selectedDateRanges.size > 0 && (
                    <span className="filter-badge">{selectedDateRanges.size}</span>
                  )}
                </div>
              </th>
              <th className="center-header">Estado<br />de envío</th>
              <th className="center-header">Total de envíos</th>
              <th>Usuarios</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotifications.map((notification) => (
              <tr key={notification.id}>
                <td>
                  {notification.url ? (
                    <a 
                      href={notification.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      title="Ver nota completa"
                    >
                      <img 
                        src={getImageBySectionOrId(notification.thumbnail)} 
                        alt={notification.titulo}
                        className="thumbnail"
                        style={{ cursor: 'pointer' }}
                      />
                    </a>
                  ) : (
                    <img 
                      src={getImageBySectionOrId(notification.thumbnail)} 
                      alt={notification.titulo}
                      className="thumbnail"
                    />
                  )}
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

      {/* Modal de Inicio de Sesión */}
      {isLoginModalOpen && (
        <LoginModal 
          onClose={handleCloseLoginModal}
          onSuccess={handleLoginSuccess}
        />
      )}
    </div>
  )
}

export default App
