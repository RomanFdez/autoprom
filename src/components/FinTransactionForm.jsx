import { useState } from 'react';
import { X } from 'lucide-react';
import { useFinanzas } from '../context/FinanzasContext';
import {
  CATEGORIES, SUBCATEGORIES, CUENTAS, CATEGORY_WITH_SUBCATS,
} from '../finanzas/constants';

// Convierte el importe (valor absoluto que teclea el usuario) + tipo a importe firmado.
function signedImporte(absValue, tipo) {
  const n = Math.abs(parseFloat(absValue) || 0);
  return tipo === 'Gasto' ? -n : n;
}

export default function FinTransactionForm({ onClose, initialData }) {
  const { addFin, updateFin } = useFinanzas();
  const editing = !!initialData;

  const [fecha, setFecha] = useState(initialData?.fecha || new Date().toISOString().slice(0, 10));
  const [categoria, setCategoria] = useState(initialData?.categoria || CATEGORIES[0]);
  const [subcategoria, setSubcategoria] = useState(initialData?.subcategoria || '');
  const [concepto, setConcepto] = useState(initialData?.concepto || '');
  const [importeAbs, setImporteAbs] = useState(
    initialData ? Math.abs(initialData.importe).toString() : ''
  );
  const [tipo, setTipo] = useState(initialData?.tipo || 'Gasto');
  const [cuenta, setCuenta] = useState(initialData?.cuenta || CUENTAS[0]);

  const showSubcat = categoria === CATEGORY_WITH_SUBCATS;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const doc = {
      ...(initialData || {}),
      fecha,
      categoria,
      subcategoria: showSubcat ? (subcategoria || null) : null,
      concepto,
      importe: signedImporte(importeAbs, tipo),
      tipo,
      cuenta,
    };
    if (editing) await updateFin(doc);
    else await addFin(doc);
    onClose();
  };

  return (
    <div className="fin-overlay" onClick={onClose}>
      <div className="fin-modal" onClick={e => e.stopPropagation()}>
        <div className="fin-modal-header">
          <h3>{editing ? 'Editar apunte' : 'Nuevo apunte'}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="fin-form">
          <label>Fecha
            <input type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
          </label>
          <label>Tipo
            <select value={tipo} onChange={e => setTipo(e.target.value)}>
              <option value="Gasto">Gasto</option>
              <option value="Ingreso">Ingreso</option>
            </select>
          </label>
          <label>Importe (€)
            <input type="number" step="0.01" value={importeAbs}
              onChange={e => setImporteAbs(e.target.value)} required />
          </label>
          <label>Categoría
            <select value={categoria} onChange={e => setCategoria(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          {showSubcat && (
            <label>Subcategoría
              <select value={subcategoria} onChange={e => setSubcategoria(e.target.value)}>
                <option value="">(ninguna)</option>
                {SUBCATEGORIES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          )}
          <label>Cuenta
            <select value={cuenta} onChange={e => setCuenta(e.target.value)}>
              {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>Concepto
            <input type="text" value={concepto} onChange={e => setConcepto(e.target.value)} />
          </label>
          <button type="submit" className="fin-save">{editing ? 'Guardar' : 'Añadir'}</button>
        </form>
        <style>{`
          .fin-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; }
          .fin-modal { background: #fff; color: #1D1D1F; width: 90%; max-width: 460px;
            border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); overflow: hidden; }
          .fin-modal-header { display: flex; justify-content: space-between; align-items: center;
            padding: 14px 18px; border-bottom: 1px solid #E5E5EA; }
          .fin-modal-header h3 { margin: 0; font-size: 1.05rem; }
          .fin-modal-header button { border: none; background: none; cursor: pointer; color: #6E6E73; }
          .fin-form { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
          .fin-form label { display: flex; flex-direction: column; font-size: 0.8rem; color: #6E6E73; gap: 4px; }
          .fin-form input, .fin-form select { font-size: 0.95rem; padding: 8px 10px;
            border: 1px solid #D2D2D7; border-radius: 8px; background: #FAFAFA; color: #1D1D1F; }
          .fin-save { margin-top: 6px; background: #0055B3; color: #fff; border: none;
            padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        `}</style>
      </div>
    </div>
  );
}
