// src/components/PilaAsignacionForm.jsx
// Modal para poner pilas en un aparato o editar una asignación.
// Los estilos .pil-modal / .pil-form viven en src/pages/Pilas.jsx.
import { useState } from 'react';
import { X } from 'lucide-react';
import { usePilas } from '../context/PilasContext';
import { TIPOS_PILA, hoyISO } from '../casa/constants';

export default function PilaAsignacionForm({ onClose, initialData, sugAparatos, sugEstancias }) {
  const { ponerPilas, editarAsignacion } = usePilas();
  const editing = !!initialData;

  const [aparato, setAparato] = useState(initialData?.aparato || '');
  const [estancia, setEstancia] = useState(initialData?.estancia || '');
  const [tipo, setTipo] = useState(initialData?.tipo || TIPOS_PILA[0]);
  const [cantidad, setCantidad] = useState(String(initialData?.cantidad ?? 2));
  const [fechaColocacion, setFechaColocacion] = useState(initialData?.fechaColocacion || hoyISO());
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const datos = { aparato, estancia, tipo, cantidad: parseInt(cantidad, 10), fechaColocacion };
    try {
      if (editing) await editarAsignacion(initialData, datos);
      else await ponerPilas(datos);
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
          <h3>{editing ? 'Editar pilas' : 'Poner pilas'}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="pil-form">
          <label>Aparato
            <input type="text" list="pil-sug-aparatos" value={aparato} required autoFocus
              onChange={e => setAparato(e.target.value)} placeholder="Mando TV, ratón, linterna…" />
          </label>
          <datalist id="pil-sug-aparatos">
            {sugAparatos.map(s => <option key={s} value={s} />)}
          </datalist>
          <label>Estancia (opcional)
            <input type="text" list="pil-sug-estancias" value={estancia}
              onChange={e => setEstancia(e.target.value)} placeholder="Salón, garaje…" />
          </label>
          <datalist id="pil-sug-estancias">
            {sugEstancias.map(s => <option key={s} value={s} />)}
          </datalist>
          <div className="pil-form-row">
            <label>Tipo
              <select value={tipo} onChange={e => setTipo(e.target.value)}>
                {TIPOS_PILA.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </label>
            <label>Cantidad
              <input type="number" min="1" step="1" value={cantidad} required
                onChange={e => setCantidad(e.target.value)} />
            </label>
          </div>
          <label>Fecha de colocación
            <input type="date" value={fechaColocacion} required onChange={e => setFechaColocacion(e.target.value)} />
          </label>
          <button type="submit" className="pil-save" disabled={guardando}>
            {editing ? 'Guardar' : 'Poner pilas'}
          </button>
        </form>
      </div>
    </div>
  );
}
