// src/pages/Seguros.jsx
import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Phone } from 'lucide-react';
import { useSeguros } from '../context/SegurosContext';
import SeguroForm from '../components/SeguroForm';
import {
  TIPOS, BRAND, tipoColor, tipoLabel, periodicidadLabel,
} from '../seguros/constants';
import { getEstadisticas } from '../seguros/calc';

export default function Seguros() {
  const { seguros } = useSeguros();
  const [tab, setTab] = useState('resumen'); // 'resumen' (por defecto) | 'listado'

  return (
    <div className="seg-page">
      <div className="seg-tabs">
        <button className={tab === 'resumen' ? 'active' : ''} onClick={() => setTab('resumen')}>Resumen</button>
        <button className={tab === 'listado' ? 'active' : ''} onClick={() => setTab('listado')}>Listado</button>
      </div>

      {tab === 'resumen' ? <ResumenView data={seguros} /> : <ListadoView data={seguros} />}

      <style>{`
        .seg-page { padding-bottom: 100px; color: #1D1D1F; }
        .seg-tabs { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .seg-tabs > button { border: none; background: #EBEBED; color: #6E6E73; padding: 7px 16px;
          border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
        .seg-tabs > button.active { background: ${BRAND.blue}; color: #fff; }
      `}</style>
    </div>
  );
}

function ResumenView({ data }) {
  const st = useMemo(() => getEstadisticas(data), [data]);
  const fmtEur = (v) => `${v.toFixed(2)} €`;

  return (
    <div>
      <div className="seg-cards">
        <div className="seg-card" style={{ background: BRAND.balanceBg, borderColor: BRAND.balanceBorder }}>
          <span style={{ color: BRAND.balanceText }}>Coste mensual</span>
          <strong style={{ color: BRAND.balanceText }}>{fmtEur(st.costeMensual)}</strong>
        </div>
        <div className="seg-card" style={{ background: BRAND.expenseBg, borderColor: BRAND.expenseBorder }}>
          <span style={{ color: BRAND.expenseText }}>Coste anual</span>
          <strong style={{ color: BRAND.expenseText }}>{fmtEur(st.costeAnual)}</strong>
        </div>
        <div className="seg-card" style={{ background: BRAND.incomeBg, borderColor: BRAND.incomeBorder }}>
          <span style={{ color: BRAND.incomeText }}>Nº de seguros</span>
          <strong style={{ color: BRAND.incomeText }}>{st.total}</strong>
        </div>
      </div>

      <h4 className="seg-h4">Por tipo</h4>
      <div className="seg-tipo-list">
        {st.porTipo.map(r => {
          const { bg, fg } = tipoColor(r.tipo);
          return (
            <div key={r.tipo} className="seg-tipo-row">
              <span className="seg-badge" style={{ background: bg, color: fg }}>{tipoLabel(r.tipo)}</span>
              <span className="seg-tipo-count">{r.count}</span>
              <span className="seg-tipo-cost">{fmtEur(r.costeMensual)}/mes</span>
            </div>
          );
        })}
        {st.porTipo.length === 0 && <div className="seg-empty">Sin seguros</div>}
      </div>

      {st.proximasRenovaciones.length > 0 && (
        <>
          <h4 className="seg-h4">Próximas renovaciones</h4>
          <div className="seg-tipo-list">
            {st.proximasRenovaciones.map(s => (
              <div key={s.id} className="seg-tipo-row">
                <span className="seg-badge" style={{ ...tipoColorStyle(s.tipo) }}>{tipoLabel(s.tipo)}</span>
                <span className="seg-tipo-count">{s.compania}</span>
                <span className="seg-tipo-cost">{s.fechaVencimiento}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .seg-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .seg-card { border: 1px solid; border-radius: 14px; padding: 12px 14px; display: flex;
          flex-direction: column; gap: 4px; }
        .seg-card span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: .04em; }
        .seg-card strong { font-size: 1.15rem; }
        .seg-h4 { margin: 18px 0 8px; font-size: 0.85rem; color: #6E6E73; text-transform: uppercase; letter-spacing: .03em; }
        .seg-tipo-list { display: flex; flex-direction: column; gap: 6px; }
        .seg-tipo-row { display: flex; align-items: center; gap: 10px; background: #fff;
          border: 1px solid #F0F0F0; border-radius: 10px; padding: 8px 12px; }
        .seg-tipo-count { flex: 1; color: #1D1D1F; font-size: 0.85rem; }
        .seg-tipo-cost { font-weight: 600; font-variant-numeric: tabular-nums; font-size: 0.85rem; }
        .seg-badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .seg-empty { text-align: center; color: #AEAEB2; font-style: italic; padding: 20px; }
      `}</style>
    </div>
  );
}

// Helper para estilo de badge inline (usado en próximas renovaciones).
function tipoColorStyle(tipo) {
  const { bg, fg } = tipoColor(tipo);
  return { background: bg, color: fg };
}

function ListadoView({ data }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [fTipo, setFTipo] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const { removeSeguro } = useSeguros();

  const rows = useMemo(() => data
    .filter(s => !fTipo || s.tipo === fTipo)
    .filter(s => !soloActivos || s.estado !== 'cancelada'),
    [data, fTipo, soloActivos]);

  return (
    <div>
      <div className="seg-filters">
        <select value={fTipo} onChange={e => setFTipo(e.target.value)}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
        <label className="seg-check">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} />
          Solo activos
        </label>
      </div>

      <div className="seg-table-wrap">
      <table className="seg-table">
        <colgroup>
          <col style={{ width: '14%' }} />
          <col style={{ width: '20%' }} />
          <col style={{ width: '22%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '16%' }} />
          <col style={{ width: '12%' }} />
        </colgroup>
        <thead>
          <tr><th>Tipo</th><th>Compañía</th><th>Asegurado</th><th>Teléfono</th><th className="num">€/mes</th><th></th></tr>
        </thead>
        <tbody>
          {rows.map(s => {
            const { bg, fg } = tipoColor(s.tipo);
            const cancelada = s.estado === 'cancelada';
            return (
              <tr key={s.id} className={cancelada ? 'cancelada' : ''}>
                <td>
                  <span className="seg-badge" style={{ background: bg, color: fg }}>{tipoLabel(s.tipo)}</span>
                </td>
                <td className="ell" title={`${s.compania} · ${s.numeroPoliza}`}>{s.compania}</td>
                <td className="ell" title={s.asegurado}>{s.asegurado}</td>
                <td className="ell" title={s.telefono}>
                  {s.telefono ? <a href={`tel:${s.telefono}`} className="seg-tel"><Phone size={11} /> {s.telefono}</a> : ''}
                </td>
                <td className="num nowrap">{(Number(s.importeMensual) || 0).toFixed(2)}</td>
                <td className="actions">
                  <button onClick={() => { setEditing(s); setIsFormOpen(true); }}><Edit2 size={13} /></button>
                  <button onClick={() => {
                    if (confirm(`¿Eliminar el seguro de ${tipoLabel(s.tipo)} de ${s.compania || '—'} (póliza ${s.numeroPoliza || '—'})?`)) removeSeguro(s.id);
                  }}><Trash2 size={13} /></button>
                </td>
              </tr>
            );
          })}
          {rows.length === 0 && <tr><td colSpan="6" className="empty">Sin seguros</td></tr>}
        </tbody>
      </table>
      </div>

      <button className="seg-fab" onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus size={24} /></button>
      {isFormOpen && <SeguroForm onClose={() => setIsFormOpen(false)} initialData={editing} />}

      <style>{`
        .seg-filters { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 12px; }
        .seg-filters select { border: 1px solid #D2D2D7; border-radius: 8px; padding: 7px 10px;
          background: #FAFAFA; font-size: 0.85rem; }
        .seg-check { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: #6E6E73; }
        .seg-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .seg-table { width: 100%; table-layout: fixed; border-collapse: collapse; background: #fff;
          border-radius: 12px; overflow: hidden; font-size: 0.66rem; }
        .seg-table th { text-align: left; background: #FAFAFA; color: #6E6E73; text-transform: uppercase;
          font-size: 0.55rem; padding: 4px 4px; border-bottom: 1px solid #E5E5EA; }
        .seg-table td { padding: 4px 4px; border-bottom: 1px solid #F0F0F0; vertical-align: middle; }
        .seg-table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .seg-table .nowrap { white-space: nowrap; }
        .seg-table .ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .seg-table tr.cancelada td { opacity: 0.5; }
        .seg-badge { display: inline-block; max-width: 100%; padding: 1px 6px; border-radius: 20px;
          font-size: 0.6rem; line-height: 1.3; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .seg-tel { color: #0055B3; text-decoration: none; white-space: nowrap; display: inline-flex; align-items: center; gap: 2px; }
        .seg-table td.actions { white-space: nowrap; text-align: right; }
        .seg-table .actions button { border: none; background: none; cursor: pointer; color: #6E6E73; padding: 0 1px; vertical-align: middle; }
        .seg-table .actions button:last-child { color: #C0392B; }
        .seg-table .empty { text-align: center; color: #AEAEB2; font-style: italic; padding: 20px; }
        .seg-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px;
          background: ${BRAND.blue}; color: #fff; border: none; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
      `}</style>
    </div>
  );
}
