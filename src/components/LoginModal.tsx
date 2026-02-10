import './LoginModal.css'
import { useState } from 'react'
import { useAuthStore } from '../auth/useAuthStore'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const { login, isLoading } = useAuthStore()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese correo y contraseña')
      return
    }

    try {
      await login({
        email: email.trim(),
        password: password.trim(),
        rememberMe,
      })

      // Login exitoso
      setEmail('')
      setPassword('')
      setRememberMe(false)
      onSuccess?.()
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al iniciar sesión')
    }
  }

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setErrorMessage('')
    onClose()
  }

  return (
    <div className="login-modal-overlay" onClick={handleClose}>
      <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2 className="login-modal-title">INICIAR SESIÓN</h2>
          <button className="login-modal-close" onClick={handleClose}>
            ✕
          </button>
          <div className="login-modal-divider"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="login-modal-body">
            {errorMessage && (
              <div style={{ 
                color: '#dc3545', 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: '#f8d7da', 
                borderRadius: '4px',
                fontSize: '14px'
              }}>
                {errorMessage}
              </div>
            )}

            <div className="login-form-group">
              <label className="login-form-label">Correo Electrónico:</label>
              <input
                type="text"
                className="login-form-input"
                placeholder=""
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="login-form-group">
              <label className="login-form-label">Contraseña:</label>
              <input
                type="password"
                className="login-form-input"
                placeholder=""
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            <div className="login-form-checkbox">
              <input 
                type="checkbox" 
                id="remember" 
                className="login-checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={isLoading}
              />
              <label htmlFor="remember" className="login-checkbox-label">
                Mantener sesión iniciada
              </label>
            </div>
          </div>

          <div className="login-modal-footer">
            <button 
              type="submit"
              className="login-modal-btn login-modal-btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
            </button>
            <button 
              type="button"
              className="login-modal-btn login-modal-btn-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              SALIR
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
