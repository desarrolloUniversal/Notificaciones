// import React from 'react';

import React, { useState } from 'react';

interface NuevaNotificacionCardProps {
  onGuardar: (data: {
    seccion: string;
    titulo: string;
    centroEnvios: string;
  }) => void;
}

export const NuevaNotificacionCard: React.FC<NuevaNotificacionCardProps> = ({ onGuardar }) => {
  const [seccion, setSeccion] = useState('');
  const [titulo, setTitulo] = useState('');
  const [centroEnvios, setCentroEnvios] = useState('');

  const handleGuardar = () => {
    if (!seccion.trim() || !titulo.trim() || !centroEnvios.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    onGuardar({ seccion, titulo, centroEnvios });
    setSeccion('');
    setTitulo('');
    setCentroEnvios('');
  };

  return (
    <tr className="nueva-notificacion-row">
      <td colSpan={8} style={{ background: '#eaf4fb', padding: '24px 0', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3.5rem' }}>
          <div style={{ background: '#e3f0fa', borderRadius: 14, boxShadow: '0 2px 8px #b3d6f2', padding: '10px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90 }}>
            <img src="/src/assets/images/el_universal.png" alt="El Universal" style={{ width: 38, height: 38, borderRadius: 8, marginBottom: 2 }} />
            <span style={{ color: '#1565c0', fontWeight: 600, fontSize: '1rem', marginTop: 2 }}>El Universal</span>
          </div>
          <input
            type="text"
            placeholder="Sección"
            value={seccion}
            onChange={e => setSeccion(e.target.value)}
            style={{ padding: '10px', borderRadius: 8, border: '1.5px solid #1976d2', minWidth: 140, fontSize: '1rem', marginRight: '10px', background: '#f5fbff', color: '#1565c0' }}
          />
          <input
            type="text"
            placeholder="Título"
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            style={{ padding: '10px', borderRadius: 8, border: '1.5px solid #1976d2', minWidth: 200, fontSize: '1rem', marginRight: '10px', background: '#f5fbff', color: '#1565c0' }}
          />
          <input
            type="text"
            placeholder="Centro de envíos"
            value={centroEnvios}
            onChange={e => setCentroEnvios(e.target.value)}
            style={{ padding: '10px', borderRadius: 8, border: '1.5px solid #1976d2', minWidth: 170, fontSize: '1rem', marginRight: '10px', background: '#f5fbff', color: '#1565c0' }}
          />
          <button 
            className="modal-btn modal-btn-primary"
            style={{ background: 'linear-gradient(135deg, #1976d2 0%, #64b5f6 100%)', color: '#fff', fontWeight: 600, padding: '10px 28px', borderRadius: 10, fontSize: '1.05rem', boxShadow: '0 2px 8px #b3d6f2', border: 'none' }}
            onClick={handleGuardar}
          >
            Guardar
          </button>
        </div>
      </td>
    </tr>
  );
};
