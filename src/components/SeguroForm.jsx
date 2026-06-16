// src/components/SeguroForm.jsx
import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { useSeguros } from '../context/SegurosContext';
import { TIPOS, PERIODICIDADES, ESTADOS } from '../seguros/constants';
import { importeMensual } from '../seguros/calc';

export default function SeguroForm({ onClose, initialData }) {
  const { addSeguro, updateSeguro } = useSeguros();
  const editing = !!initialData;

  const [tipo, setTipo] = useState(initialData?.tipo || TIPOS[0].value);
  const [numeroPoliza, setNumeroPoliza] = useState(initialData?.numeroPoliza || '');
  const [compania, setCompania] = useState(initialData?.compania || '');
  const [tomador, setTomador] = useState(initialData?.tomador || '');
  const [asegurado, setAsegurado] = useState(initialData?.asegurado || '');
  const [telefono, setTelefono] = useState(initialData?.telefono || '');
  const [importe, setImporte] = useState(initialData ? String(initialData.importe ?? '') : '');
  const [periodicidad, setPeriodicidad] = useState(initialData?.periodicidad || 'anual');
  const [fechaEfecto, setFechaEfecto] = useState(initialData?.fechaEfecto || new Date().toISOString().slice(0, 10));
  const [fechaVencimiento, setFechaVencimiento] = useState(initialData?.fechaVencimiento || '');
  const [estado, setEstado] = useState(initialData?.estado || 'activa');
  const [coberturas, setCoberturas] = useState(initialData?.coberturas || '');

  const mensual = useMemo(() => importeMensual(importe, periodicidad), [importe, periodicidad]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const doc = {
      ...(initialData || {}),
      tipo, numeroPoliza, compania, tomador, asegurado, telefono,
      importe: parseFloat(importe) || 0,
      periodicidad, fechaEfecto, fechaVencimiento, estado, coberturas,
      importeMensual: mensual,
    };
    if (editing) await updateSeguro(doc);
    else await addSeguro(doc);
    onClose();
  };

  return (
    <div className="seg-overlay" onClick={onClose}>
      <div className="seg-modal" onClick={e => e.stopPropagation()}>
        <div className="seg-modal-header">
          <h3>{editing ? 'Editar seguro' : 'Nuevo seguro'}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="seg-form">
          <label>Tipo
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>
          <label>Nº de póliza
            <input type="text" value={numeroPoliza} onChange={e => setNumeroPoliza(e.target.value)} />
          </label>
          <label>Compañía
            <input type="text" value={compania} onChange={e => setCompania(e.target.value)}
              placeholder="Sanitas, Sabadell, AMA…" />
          </label>
          <label>Tomador
            <input type="text" value={tomador} onChange={e => setTomador(e.target.value)} />
          </label>
          <label>Asegurado (persona / coche / casa / beneficiarios)
            <input type="text" value={asegurado} onChange={e => setAsegurado(e.target.value)} />
          </label>
          <label>Teléfono de contacto
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)}
              placeholder="Compañía / asistencia 24h" />
          </label>
          <label>Importe (€)
            <input type="number" step="0.01" value={importe}
              onChange={e => setImporte(e.target.value)} required />
          </label>
          <label>Periodicidad
            <select value={periodicidad} onChange={e => setPeriodicidad(e.target.value)}>
              {PERIODICIDADES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </label>
          <div className="seg-readonly">Importe mensual: <strong>{mensual.toFixed(2)} €</strong></div>
          <label>Fecha de efecto
            <input type="date" value={fechaEfecto} onChange={e => setFechaEfecto(e.target.value)} required />
          </label>
          <label>Fecha de vencimiento (opcional)
            <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} />
          </label>
          <label>Estado
            <select value={estado} onChange={e => setEstado(e.target.value)}>
              {ESTADOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </label>
          <label>Coberturas
            <textarea rows={5} value={coberturas} onChange={e => setCoberturas(e.target.value)}
              placeholder="Pega aquí las coberturas / condiciones…" />
          </label>
          <button type="submit" className="seg-save">{editing ? 'Guardar' : 'Añadir'}</button>
        </form>
        <style>{`
          .seg-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; overflow-y: auto; }
          .seg-modal { background: #fff; color: #1D1D1F; width: 90%; max-width: 460px;
            border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); overflow: hidden; margin-bottom: 40px; }
          .seg-modal-header { display: flex; justify-content: space-between; align-items: center;
            padding: 14px 18px; border-bottom: 1px solid #E5E5EA; }
          .seg-modal-header h3 { margin: 0; font-size: 1.05rem; }
          .seg-modal-header button { border: none; background: none; cursor: pointer; color: #6E6E73; }
          .seg-form { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
          .seg-form label { display: flex; flex-direction: column; font-size: 0.8rem; color: #6E6E73; gap: 4px; }
          .seg-form input, .seg-form select, .seg-form textarea { font-size: 0.95rem; padding: 8px 10px;
            border: 1px solid #D2D2D7; border-radius: 8px; background: #FAFAFA; color: #1D1D1F;
            font-family: inherit; }
          .seg-readonly { font-size: 0.85rem; color: #1D1D1F; background: #EFF6FF; border: 1px solid #93C5FD;
            border-radius: 8px; padding: 8px 10px; }
          .seg-save { margin-top: 6px; background: #0055B3; color: #fff; border: none;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
}
