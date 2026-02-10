import './LoginModal.css'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  if (!isOpen) return null

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2 className="login-modal-title">INICIAR SESIÓN</h2>
          <button className="login-modal-close" onClick={onClose}>
            ✕
          </button>
          <div className="login-modal-divider"></div>
        </div>

        <div className="login-modal-body">
          <div className="login-form-group">
            <label className="login-form-label">Correo Electrónico:</label>
            <input
              type="email"
              className="login-form-input"
              placeholder=""
            />
          </div>

          <div className="login-form-group">
            <label className="login-form-label">Contraseña:</label>
            <input
              type="password"
              className="login-form-input"
              placeholder=""
            />
          </div>

          <div className="login-form-checkbox">
            <input type="checkbox" id="remember" className="login-checkbox" />
            <label htmlFor="remember" className="login-checkbox-label">
              Mantener sesión iniciada
            </label>
          </div>
        </div>

        <div className="login-modal-footer">
          <button className="login-modal-btn login-modal-btn-primary">
            ENTRAR
          </button>
          <button 
            className="login-modal-btn login-modal-btn-secondary"
            onClick={onClose}
          >
            SALIR
          </button>
        </div>
      </div>
    </div>
  )
}
