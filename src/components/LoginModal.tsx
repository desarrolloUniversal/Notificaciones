import './LoginModal.css'
import { useState } from 'react'
import { useAuthStore } from '../auth/useAuthStore'

interface LoginModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const { login, isLoading } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Por favor ingrese usuario y contraseña')
      return
    }

    // Validar que NO sea un correo electrónico
    if (username.includes('@')) {
      setErrorMessage('Debe ingresar un usuario, no un correo electrónico')
      return
    }

    try {
      await login({
        username: username.trim(),
        password: password.trim(),
        rememberMe,
      })

      // Login exitoso - el componente se desmontará y reseteará estados
      onSuccess?.()
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al iniciar sesión')
    }
  }

  const handleClose = () => {
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
              <label className="login-form-label">Usuario:</label>
              <input
                type="text"
                className="login-form-input"
                placeholder="Ingrese su usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div className="login-form-group">
              <label className="login-form-label">Contraseña:</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-form-input"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="new-password"
                  style={{ paddingRight: '38px' }}
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    height: '24px',
                    width: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    outline: 'none',
                  }}
                  onMouseDown={e => e.preventDefault()}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // Ojo abierto amarillo
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f1c40f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="12" rx="10" ry="7"/>
                      <circle cx="12" cy="12" r="3.5"/>
                    </svg>
                  ) : (
                    // Ojo cerrado (línea cruzada)
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <ellipse cx="12" cy="12" rx="10" ry="7"/>
                      <circle cx="12" cy="12" r="3.5"/>
                      <line x1="4" y1="20" x2="20" y2="4" stroke="#888" strokeWidth="2.5"/>
                    </svg>
                  )}
                </button>
              </div>
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
