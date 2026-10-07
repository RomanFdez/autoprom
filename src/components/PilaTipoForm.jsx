// src/components/PilaTipoForm.jsx
// Modal para ajustar el total de pilas y la capacidad de un tipo.
// Los estilos .pil-modal / .pil-form viven en src/pages/Pilas.jsx.
import { useState } from 'react';
import { X } from 'lucide-react';
import { usePilas } from '../context/PilasContext';

export default function PilaTipoForm({ onClose, resumen }) {
  const { ajustarTipo } = usePilas();
  const [total, setTotal] = useState(String(resumen.total));
  const [capacidadMah, setCapacidadMah] = useState(resumen.capacidadMah ? String(resumen.capacidadMah) : '');
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await ajustarTipo(resumen.tipo, { total, capacidadMah });
      onClose();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar. Inténtalo de nuevo.');
      setGuardando(false);
    }
  };

  return (
    <div className="pil-overlay" onClick={onClose}>
      <div className="pil-modal" onClick={e => e.stopPropagation()}>
        <div className="pil-modal-header">
          <h3>Pilas {resumen.tipo}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="pil-form">
          <label>Total de pilas en casa
            <input type="number" min="0" step="1" value={total} required autoFocus
              onChange={e => setTotal(e.target.value)} />
          </label>
          <label>Capacidad (mAh, opcional)
            <input type="number" min="0" step="1" value={capacidadMah}
              onChange={e => setCapacidadMah(e.target.value)} placeholder="2500" />
          </label>
          <div className="pil-readonly">En uso ahora: <strong>{resumen.enUso}</strong></div>
          <button type="submit" className="pil-save" disabled={guardando}>Guardar</button>
        </form>
      </div>
    </div>
  );
}
