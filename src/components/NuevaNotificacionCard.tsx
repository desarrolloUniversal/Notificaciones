// import React from 'react';

import React, { useState } from 'react';

interface NuevaNotificacionCardProps {
  onGuardar: (data: {
    seccion: string;
    titulo: string;
    usuarios: string;
  }) => void;
  onCancelar: () => void;
  onTest?: (data: { seccion: string; titulo: string; usuarios: string }) => void;
  showTestButton?: boolean;
  username: string;
}

export const NuevaNotificacionCard: React.FC<NuevaNotificacionCardProps> = ({ onGuardar, onCancelar, onTest, showTestButton, username }) => {
  const [seccion, setSeccion] = useState('');
  const [titulo, setTitulo] = useState('');
  const usuarios = username; // Auto-fill con el usuario actual

  const handleGuardar = () => {
    if (!seccion.trim() || !titulo.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    onGuardar({ seccion, titulo, usuarios });
    setSeccion('');
    setTitulo('');
  };

  const handleTest = () => {
    if (!seccion.trim() || !titulo.trim()) {
      alert('Por favor completa todos los campos antes de probar');
      return;
    }
    if (onTest) {
      onTest({ seccion, titulo, usuarios });
    }
  };

  return (
    <tr className="nueva-notificacion-row">
      <td>
        <img 
          src="/notificaciones/src/assets/images/el_universal.png" 
          alt="El Universal" 
          className="thumbnail"
        />
      </td>
      <td>
        <input
          type="text"
          placeholder="Escribe la sección"
          value={seccion}
          onChange={e => setSeccion(e.target.value)}
          style={{ width: '140px', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #d4af37', fontSize: '0.95rem', background: '#fffef5', color: '#8b7500' }}
        />
      </td>
      <td>
        <input
          type="text"
          placeholder="Título"
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          style={{ width: '180px', padding: '6px 8px', borderRadius: 6, border: '1.5px solid #d4af37', fontSize: '0.95rem', background: '#fffef5', color: '#8b7500' }}
        />
      </td>
      <td>-</td>
      <td>
        <span className="status-badge status-pending-orange">
          Pendiente
        </span>
      </td>
      <td className="number-cell">0</td>
      <td>{usuarios}</td>
      <td className="actions-cell">
        <div className="actions-container">
          <div className="actions-zone actions-zone-yellow">
            <div className="zone-buttons">
              <button 
                className="apply-btn"
                onClick={handleGuardar}
                title="Guardar notificación"
              >
                ↑
              </button>
              <button 
                className="delete-btn"
                onClick={onCancelar}
                title="Cancelar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
          {showTestButton && onTest && (
            <div className="actions-zone actions-zone-purple">
              <div className="zone-label">TEST</div>
              <div className="zone-buttons">
                <button 
                  className="test-btn"
                  onClick={handleTest}
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
  );
};
