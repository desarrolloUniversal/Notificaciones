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
import { validatePushToken, getPushToken } from './utils/pushTokenManager'
import { NuevaNotificacionCard } from './components/NuevaNotificacionCard'

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
    ou,
    grupos,
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
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [editingSectionValue, setEditingSectionValue] = useState('')
    // Edición de sección
    const handleStartEditSection = (id: string, currentSection: string) => {
      setEditingSectionId(id)
      setEditingSectionValue(currentSection)
    }

    const handleSaveSection = (id: string) => {
      if (editingSectionValue.trim()) {
        updatePendingNotification(id, { seccion: editingSectionValue.trim() })
      }
      setEditingSectionId(null)
      setEditingSectionValue('')
    }

    const handleCancelEditSection = () => {
      setEditingSectionId(null)
      setEditingSectionValue('')
    }
  const [isEditWarningModalOpen, setIsEditWarningModalOpen] = useState(false)
  const [isResendErrorModalOpen, setIsResendErrorModalOpen] = useState(false)
  const [isResendSuccessModalOpen, setIsResendSuccessModalOpen] = useState(false)
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false)
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false)
  const [showUrgentForm, setShowUrgentForm] = useState(false)

  // Cargar token guardado del usuario al abrir el modal
  useEffect(() => {
    if (isTokenModalOpen && username) {
      const userToken = getPushToken(username)
      if (userToken) {
        setTokenInput(userToken)
      }
    }
  }, [isTokenModalOpen, username])

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
    // Mostrar modal de bienvenida con información de grupos
    setIsWelcomeModalOpen(true)
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlInput(e.target.value)
  }

  const handleInputClick = () => {
    setModalUrlInput(urlInput)
    setIsModalOpen(true)
  }

  const handleUrgentNotificationClick = () => {
    if (!isAuthenticated) {
      alert('❌ Debes iniciar sesión para crear una notificación urgente')
      return
    }
    setShowUrgentForm(!showUrgentForm)
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

  // Verificar si el usuario tiene permisos para testeo (solo Tester TI)
  // Verificar si el usuario tiene permisos para testeo (solo Tester TI)
  const hasTestingPermissions = (): boolean => {
    if (!isAuthenticated) return false;
    return ou === 'TI';
  }

  const handleOpenTokenModal = (notificationId: string) => {
    // Validar permisos antes de abrir el modal
    if (!hasTestingPermissions()) {
      alert('❌ Acceso denegado\n\nNo tienes permisos para acceder a esta funcionalidad de testeo.\n\nSi consideras que deberías tener acceso, por favor contacta al administrador.')
      return
    }

    setSelectedNotificationId(notificationId)
    setTokenInput('')
    setIsTokenModalOpen(true)
  }

  const handleCloseTokenModal = () => {
    setIsTokenModalOpen(false)
    setTokenInput('')
    setSelectedNotificationId(null)
    setIsInstructionsExpanded(false)
  }

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTokenInput(e.target.value)
  }

  const handleSendToken = () => {
    const token = tokenInput.trim()
    if (!token) {
      alert('Por favor ingrese un token válido')
      return
    }
    if (!username) {
      alert('Error: No se pudo obtener el usuario. Por favor inicia sesión nuevamente.')
      return
    }
        // Validar formato del token: ExponentPushToken[...]
        if (!validatePushToken(token)) {
          alert('❌ Token inválido\n\nEl token debe tener el formato:\nExponentPushToken[TxQ9iZBVR5OEnNml20seN2]')
          return
        }
        // Enviar notificación de test solo a este token
        const pending = getPendingNotifications().find(n => n.id === selectedNotificationId)
        if (!pending) {
          alert('No se encontró la notificación pendiente para enviar.')
          handleCloseTokenModal()
          return
        }
        // Construir el payload personalizado
        const payload = { ...pending, id: token }
        sendNotification(payload)
        alert('✅ Notificación enviada solo a este token\n\nUsuario: ' + username + '\n\nLa notificación de test se envió únicamente a tu dispositivo.')
        handleCloseTokenModal()
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
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener artículo'
      setLoadingError(errorMessage)
      
      // ❌ Alerta de error
      alert(`❌ Error al cargar la URL\n\n${errorMessage}\n\nVerifica que la URL sea válida y que el artículo exista.`)
      
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
      updatePendingNotification(id, { titulo: editingTitleValue.trim() })
    }
    setEditingTitleId(null)
    setEditingTitleValue('')
  }

  const handleCancelEditTitle = () => {
    setEditingTitleId(null)
    setEditingTitleValue('')
  }

  const handleApplyPending = async (pending: PendingNotificationFromUrl) => {
    // Verificar si hay una edición de título en curso
    if (editingTitleId !== null) {
      setIsEditWarningModalOpen(true)
      return
    }
    
    // Validar que la notificación pueda ser enviada
    if (!canSendNotification(pending)) {
      alert('❌ La notificación no puede ser enviada. Verifica que tenga todos los datos necesarios.')
      return
    }
    
    setUrlInput(pending.url)
    setIsLoadingNewNotification(true)
    setLoadingProgress(0)
    setLoadingError(null)
    
    try {
      setLoadingProgress(30)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Llamar al endpoint de envío
      await sendNotification(pending)
      
      setLoadingProgress(70)
      await new Promise(resolve => setTimeout(resolve, 300))
      
      setLoadingProgress(100)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Remover de pendientes después de envío exitoso
      removePendingNotification(pending.id)
      
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

  const handleResend = (notification: typeof notifications[0]) => {
    if (!isAuthenticated || !username) {
      setIsResendErrorModalOpen(true)
      return
    }

    const pendingNotification: PendingNotificationFromUrl = {
      id: `${notification.id}-${Date.now()}`,
      thumbnail: notification.thumbnail,
      seccion: notification.seccion,
      titulo: notification.titulo,
      subtitulo: notification.subtitulo,
      url: notification.url,
      estadoEnvio: 'Pendiente',
      fechaEnvio: null,
      usuarios: username,
      timestamp: new Date().toISOString(),
      isResend: true,  // Marcar como reenvío
      originalTitulo: notification.titulo,  // Guardar título original
      originalId: notification.id  // Guardar ID original del artículo
    }
    
    addPendingNotification(pendingNotification)
    setIsResendSuccessModalOpen(true)
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
            <button
              className="urgente-btn"
              type="button"
              onClick={handleUrgentNotificationClick}
              style={{ marginRight: '2px' }}
            >
              Notificación urgente
            </button>
          )}
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

      {/* Modal de URL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleModalClose}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ingresar URL del artículo</h2>
              <button className="modal-close-btn" onClick={handleModalClose}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body">
              <label className="modal-label">Ingresa la URL del artículo:</label>
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
                  placeholder="https://www.eluniversal.com.mx/..."
                  value={modalUrlInput}
                  onChange={handleModalUrlChange}
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-secondary" onClick={handleModalClose}>
                Cancelar
              </button>
              <button className="modal-btn modal-btn-primary" onClick={handleApplyUrl}>
                Aplicar URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Token Push */}
      {isTokenModalOpen && (
        <div className="modal-overlay" onClick={handleCloseTokenModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Envío de notificación personalizado</h2>
              <button className="modal-close-btn" onClick={handleCloseTokenModal}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body">
              <label className="modal-label">Ingresa tu token para recibir notificaciones solo en tu dispositivo:</label>
              <div className="modal-input-wrapper">
                <span className="modal-input-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#9b59b6">
                    <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-4 4v3c0 .22-.03.47-.07.7l-.1.65-.37.65c-.72 1.24-2.04 2-3.46 2s-2.74-.77-3.46-2l-.37-.64-.1-.65C8.03 15.47 8 15.22 8 15v-4c0-.23.03-.48.07-.7l.1-.65.37-.65c.3-.52.72-.97 1.21-1.31l.57-.39.68-.19c.3-.08.62-.11.95-.11.22 0 .43.02.65.06l.68.19.57.39c.49.35.91.79 1.21 1.31l.37.65.1.65c.04.22.07.47.07.7v1zm-6 2h4v2h-4v-2zm0-4h4v2h-4v-2z"/>
                  </svg>
                </span>
                <input
                  type="text"
                  className="modal-input"
                  placeholder="ExponentPushToken[TxQ9iZBVR5OEnNml20seN2]"
                  value={tokenInput}
                  onChange={handleTokenChange}
                  autoFocus
                />
              </div>
              {tokenInput && (
                <div style={{ marginTop: '0.5rem', padding: '0.6rem', background: '#e8f5e9', borderRadius: '6px', fontSize: '0.8rem', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#4caf50">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Token cargado - Se guardará en tu perfil
                </div>
              )}
              <div className="modal-info" style={{ marginTop: '1rem', padding: '0.8rem', background: '#f3e5f5', borderRadius: '8px', fontSize: '0.85rem', color: '#7d3c98' }}>
                <strong>Formato requerido:</strong> ExponentPushToken[código]
              </div>
              <div className="modal-instructions" style={{ marginTop: '0.8rem', padding: '1rem', background: '#ffffff', border: '2px solid #e8daef', borderRadius: '8px' }}>
                <div 
                  onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
                  style={{ 
                    fontSize: '0.95rem', 
                    fontWeight: '600', 
                    color: '#8e44ad', 
                    marginBottom: isInstructionsExpanded ? '0.5rem' : '0', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#8e44ad">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  ¿Cómo funciona el envío personalizado?
                  <span style={{ marginLeft: 'auto', fontSize: '1rem' }}>
                    {isInstructionsExpanded ? '▲' : '▼'}
                  </span>
                </div>
                {isInstructionsExpanded && (
                  <ul style={{ margin: '0.5rem 0 0 1.5rem', padding: 0, color: '#7d3c98', fontSize: '0.85rem', lineHeight: '1.6' }}>
                    <li style={{ marginBottom: '0.4rem' }}>
                      <strong>🎯 Notificaciones personalizadas:</strong> Al guardar tu token, todas las notificaciones que envíes llegarán únicamente a tu dispositivo (no a todos los suscriptores).
                    </li>
                    <li style={{ marginBottom: '0.4rem' }}>
                      <strong>🔒 Asociado a tu perfil:</strong> El token se guarda localmente asociado a tu usuario ({username}).
                    </li>
                    <li>
                      <strong>✅ Testeo seguro:</strong> Prueba las notificaciones sin afectar a otros usuarios.
                    </li>
                  </ul>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-btn modal-btn-primary" onClick={handleSendToken} style={{ background: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)' }}>
                <span className="btn-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                </span>
                Enviar notificación test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Bienvenida con información de grupos */}
      {isWelcomeModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWelcomeModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header" style={{ padding: '1rem 1.5rem' }}>
              <h2 className="modal-title" style={{ fontSize: '1.3rem' }}>👋 Bienvenido, {username}</h2>
              <button className="modal-close-btn" onClick={() => setIsWelcomeModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body" style={{ padding: '1.2rem 1.5rem' }}>
              <div style={{ marginBottom: '0.8rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.8rem' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#4caf50">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#2c3e50' }}>
                    Tus permisos activos:
                  </span>
                </div>
                
                {/* Rol: Notificaciones Push (solo si NO es tester) */}
                {(() => {
                  if (ou === 'TI') {
                    console.log('[ROL] Usuario identificado como Tester (TI)', { username, ou, grupos });
                    return null;
                  }
                  if (ou && ou !== 'TI') {
                    console.log('[ROL] Usuario identificado como Notificaciones Push', { username, ou, grupos });
                    return (
                      <div style={{ padding: '0.8rem', background: 'linear-gradient(135deg, #fff9e6 0%, #ffeaa7 100%)', borderRadius: '8px', marginBottom: '0.6rem', border: '2px solid #ffd700' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#f39c12">
                            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                          </svg>
                          <strong style={{ color: '#f39c12', fontSize: '0.88rem' }}>Notificaciones Push</strong>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#7d6608' }}>
                          Puedes enviar y gestionar notificaciones push
                        </p>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Rol: Tester TI */}
                {ou === 'TI' && (
                  <div style={{ padding: '0.8rem', background: 'linear-gradient(135deg, #e8daef 0%, #d4bfea 100%)', borderRadius: '8px', border: '2px solid #9b59b6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="#9b59b6">
                        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                      </svg>
                      <strong style={{ color: '#9b59b6', fontSize: '0.88rem' }}>Tester (TI)</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#6a0dad' }}>
                      Acceso a funciones de testeo y desarrollo avanzadas
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer" style={{ padding: '0.8rem 1.5rem' }}>
              <button className="modal-btn modal-btn-primary" onClick={() => setIsWelcomeModalOpen(false)} style={{ padding: '10px 24px', fontSize: '0.9rem' }}>
                Continuar
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
            <span className="pending-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2c3e50">
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
              </svg>
            </span>
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
                  <th className="center-header">Centro de envíos</th>
                </tr>
              </thead>
              <tbody>
                {/* Card para agregar nueva notificación urgente */}
                {showUrgentForm && (
                  <NuevaNotificacionCard
                    onGuardar={({ seccion, titulo, centroEnvios }) => {
                      // Crear notificación urgente manual
                      const urgentNotification: PendingNotificationFromUrl = {
                        id: `urgent-${Date.now()}`,
                        seccion: seccion,
                        titulo: titulo,
                        subtitulo: '', // No tiene subtítulo porque es manual
                        url: '', // No tiene URL porque es manual
                        thumbnail: '', // Usará la imagen por defecto
                        fechaEnvio: null, // Pendiente de envío
                        estadoEnvio: 'Pendiente',
                        usuarios: centroEnvios,
                        timestamp: new Date().toISOString(),
                      }
                      addPendingNotification(urgentNotification)
                      setShowUrgentForm(false) // Ocultar formulario después de guardar
                      alert(`✅ Notificación urgente creada:\nSección: ${seccion}\nTítulo: ${titulo}\nCentro de envíos: ${centroEnvios}`)
                    }}
                  />
                )}
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
                    <td className="section-cell editable-section-cell">
                      {editingSectionId === pending.id ? (
                        <div className="section-edit-container">
                          <input
                            type="text"
                            className="section-edit-input"
                            value={editingSectionValue}
                            onChange={(e) => setEditingSectionValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveSection(pending.id)
                              if (e.key === 'Escape') handleCancelEditSection()
                            }}
                            autoFocus
                          />
                          <div className="section-edit-actions">
                            <button
                              className="section-save-btn"
                              onClick={() => handleSaveSection(pending.id)}
                              title="Guardar sección"
                            >
                              ✓
                            </button>
                            <button
                              className="section-cancel-btn"
                              onClick={handleCancelEditSection}
                              title="Cancelar"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="section-display-container">
                          <span className="section-text">{pending.seccion}</span>
                          <button
                            className="section-edit-btn"
                            onClick={() => handleStartEditSection(pending.id, pending.seccion)}
                            title="Editar sección"
                          >
                            ✎
                          </button>
                        </div>
                      )}
                    </td>
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
                      <div className="actions-container">
                        <div className="actions-zone actions-zone-yellow">
                          <div className="zone-buttons">
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
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="white">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                        {ou === 'TI' && (
                          <div className="actions-zone actions-zone-purple">
                            <div className="zone-label">TEST</div>
                            <div className="zone-buttons">
                              <button 
                                className="test-btn"
                                onClick={() => handleOpenTokenModal(pending.id)}
                                title="Probar notificación"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="white">
                                  <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.04 1.79 2.97 3 5.19 3s4.15-1.21 5.19-3H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8zm-4 4v3c0 .22-.03.47-.07.7l-.1.65-.37.65c-.72 1.24-2.04 2-3.46 2s-2.74-.77-3.46-2l-.37-.64-.1-.65C8.03 15.47 8 15.22 8 15v-4c0-.23.03-.48.07-.7l.1-.65.37-.65c.3-.52.72-.97 1.21-1.31l.57-.39.68-.19c.3-.08.62-.11.95-.11.22 0 .43.02.65.06l.68.19.57.39c.49.35.91.79 1.21 1.31l.37.65.1.65c.04.22.07.47.07.7v1zm-6 2h4v2h-4v-2zm0-4h4v2h-4v-2z"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
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
                  <div className="status-cell-container">
                    <span className={`status-badge ${getStatusClass(notification.estadoEnvio)}`}>
                      {notification.estadoEnvio}
                    </span>
                    {isAuthenticated && notification.estadoEnvio.toLowerCase() === 'enviado' && (
                      <button 
                        className="resend-btn"
                        onClick={() => handleResend(notification)}
                        title="Reenviar notificación"
                      >
                        ↻ Reenviar
                      </button>
                    )}
                  </div>
                </td>
                <td className="number-cell">{notification.totalEnvios.toLocaleString()}</td>
                <td>{notification.usuarios}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Modal de advertencia de edición */}
      {isEditWarningModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditWarningModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#f39c12" strokeWidth="2" fill="none"/>
                  <path d="M12 8V12" stroke="#f39c12" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="#f39c12"/>
                </svg>
                Edición en Curso
              </h2>
              <button className="modal-close-btn" onClick={() => setIsEditWarningModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#2c3e50', marginBottom: '16px' }}>
                Tienes una <strong>edición de título abierta</strong>.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={() => setIsEditWarningModalOpen(false)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de error de reenvío (no autenticado) */}
      {isResendErrorModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResendErrorModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2" fill="none"/>
                  <path d="M12 8V12" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="12" cy="16" r="1" fill="#e74c3c"/>
                </svg>
                Sesión Requerida
              </h2>
              <button className="modal-close-btn" onClick={() => setIsResendErrorModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#2c3e50', marginBottom: '8px' }}>
                Debes <strong>iniciar sesión</strong> para reenviar notificaciones.
              </p>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                Por favor inicia sesión con tu cuenta.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={() => setIsResendErrorModalOpen(false)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de éxito de reenvío */}
      {isResendSuccessModalOpen && (
        <div className="modal-overlay" onClick={() => setIsResendSuccessModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="#27ae60" strokeWidth="2" fill="none"/>
                  <path d="M8 12L11 15L16 9" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                ¡Agregada!
              </h2>
              <button className="modal-close-btn" onClick={() => setIsResendSuccessModalOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-divider"></div>
            <div className="modal-body" style={{ padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#2c3e50', marginBottom: '8px' }}>
                Notificación agregada a <strong>pendientes para reenvío</strong>.
              </p>
              <p style={{ fontSize: '0.9rem', color: '#7f8c8d' }}>
                Puedes editarla antes de enviarla.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="modal-btn modal-btn-primary" 
                onClick={() => setIsResendSuccessModalOpen(false)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </div>
          </div>
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
