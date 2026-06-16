// src/pages/Seguros.jsx
import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Phone, Eye, X, Car, Home, HeartPulse, HeartHandshake, HardHat, Scale, Shield } from 'lucide-react';
import { useSeguros } from '../context/SegurosContext';
import SeguroForm from '../components/SeguroForm';
import {
  TIPOS, BRAND, tipoColor, tipoLabel, periodicidadLabel,
} from '../seguros/constants';
import { getEstadisticas } from '../seguros/calc';

export default function Seguros() {
  const { seguros } = useSeguros();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('v') === 'listado' ? 'listado' : 'resumen'; // por defecto Resumen

  return (
    <div className="seg-page">
      {tab === 'resumen' ? <ResumenView data={seguros} /> : <ListadoView data={seguros} />}

      <style>{`
        .seg-page { padding-bottom: 100px; color: #1D1D1F; }

        /* ---- Dark mode ---- */
        :root[data-theme='dark'] .seg-page { color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .seg-h4 { color: #b0bec5; }
        :root[data-theme='dark'] .seg-tipo-row { background: var(--md-sys-color-surface); border-color: #333; }
        :root[data-theme='dark'] .seg-tipo-count,
        :root[data-theme='dark'] .seg-tipo-cost { color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .seg-modal { background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .seg-modal-header { border-bottom-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .seg-form label { color: #b0bec5; }
        :root[data-theme='dark'] .seg-form input,
        :root[data-theme='dark'] .seg-form select,
        :root[data-theme='dark'] .seg-form textarea { background: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface); border-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .segd-modal { background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .segd-header { border-bottom-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .segd-header h3 { color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .segd-label { color: #b0bec5; }
        :root[data-theme='dark'] .segd-value,
        :root[data-theme='dark'] .segd-cob { color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .segd-row { border-bottom-color: #333; }
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
              <span className="seg-tipo-cost" style={{ marginLeft: 'auto' }}>{fmtEur(r.costeMensual)}/mes</span>
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

// "YYYY-MM-DD" -> "DD/MM/YYYY" (o "—" si vacío).
const fmtFecha = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

// Icono distintivo por tipo de seguro.
const TIPO_ICONS = {
  salud: HeartPulse,
  vida: HeartHandshake,
  coche: Car,
  construccion: HardHat,
  hogar: Home,
  responsabilidad_civil: Scale,
  otro: Shield,
};

function ListadoView({ data }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [detail, setDetail] = useState(null);
  const [fTipo, setFTipo] = useState('');
  const [soloActivos, setSoloActivos] = useState(true);
  const { removeSeguro } = useSeguros();

  const rows = useMemo(() => data
    .filter(s => !fTipo || s.tipo === fTipo)
    .filter(s => !soloActivos || s.estado !== 'cancelada'),
    [data, fTipo, soloActivos]);

  return (
    <div>
      <div className="segl-filters">
        <div className="segl-chips">
          <button className={`segl-chip ${fTipo === '' ? 'active' : ''}`} onClick={() => setFTipo('')}>Todos</button>
          {TIPOS.map(t => (
            <button key={t.value} className={`segl-chip ${fTipo === t.value ? 'active' : ''}`}
              onClick={() => setFTipo(t.value)}>{t.label}</button>
          ))}
        </div>
        <label className="segl-check">
          <input type="checkbox" checked={soloActivos} onChange={e => setSoloActivos(e.target.checked)} />
          Solo activos
        </label>
      </div>

      <div className="segl-list">
        {rows.map(s => {
          const { fg } = tipoColor(s.tipo);
          const Icon = TIPO_ICONS[s.tipo] || Shield;
          const cancelada = s.estado === 'cancelada';
          return (
            <div key={s.id} className={`segl-item ${cancelada ? 'cancelada' : ''}`}>
              <div className="segl-icon" style={{ backgroundColor: fg }}>
                <Icon size={20} color="#fff" />
              </div>
              <div className="segl-details">
                <div className="segl-row1">
                  <span className="segl-title" style={{ color: fg }}>{tipoLabel(s.tipo)}</span>
                  <span className="segl-amount">{(Number(s.importeMensual) || 0).toFixed(2)} €/mes</span>
                </div>
                <div className="segl-row2">
                  <span className="segl-comp">{s.compania || '—'}</span>
                  <span className="segl-sep">•</span>
                  <span>Renov. {fmtFecha(s.fechaVencimiento)}</span>
                </div>
                <div className="segl-row3">
                  {!!s.asegurado && <span className="segl-aseg">{s.asegurado}</span>}
                  {!!s.telefono && (
                    <a href={`tel:${s.telefono}`} className="segl-tel"><Phone size={12} /> {s.telefono}</a>
                  )}
                </div>
              </div>
              <div className="segl-actions">
                <button title="Ver detalles" onClick={() => setDetail(s)}><Eye size={16} /></button>
                <button title="Editar" onClick={() => { setEditing(s); setIsFormOpen(true); }}><Edit2 size={16} /></button>
                <button title="Eliminar" className="danger" onClick={() => {
                  if (confirm(`¿Eliminar el seguro de ${tipoLabel(s.tipo)} de ${s.compania || '—'} (póliza ${s.numeroPoliza || '—'})?`)) removeSeguro(s.id);
                }}><Trash2 size={16} /></button>
              </div>
            </div>
          );
        })}
        {rows.length === 0 && <div className="segl-empty">Sin seguros</div>}
      </div>

      <button className="seg-fab" onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus size={24} /></button>
      {isFormOpen && <SeguroForm onClose={() => setIsFormOpen(false)} initialData={editing} />}
      {detail && <SeguroDetalle seguro={detail} onClose={() => setDetail(null)} />}

      <style>{`
        .segl-filters { display: flex; flex-direction: column; gap: 10px; padding: 4px 0 14px; }
        .segl-chips { display: flex; flex-wrap: wrap; gap: 6px; }
        .segl-chip { white-space: nowrap; padding: 6px 12px; border-radius: 20px;
          border: 1px solid var(--md-sys-color-outline); background: var(--md-sys-color-surface);
          font-size: 0.8rem; color: var(--md-sys-color-on-surface); opacity: 0.7; cursor: pointer; }
        .segl-chip.active { background: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary);
          border-color: var(--md-sys-color-primary); opacity: 1; }
        .segl-check { display: flex; align-items: center; gap: 6px; font-size: 0.85rem;
          color: var(--md-sys-color-on-surface); opacity: 0.8; align-self: flex-start; }
        .segl-list { display: flex; flex-direction: column; }
        .segl-item { background: var(--md-sys-color-surface); padding: 12px; border-radius: 12px;
          margin-bottom: 8px; display: flex; gap: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .segl-item.cancelada { opacity: 0.55; }
        .segl-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; }
        .segl-details { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 4px; min-width: 0; }
        .segl-row1 { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
        .segl-title { font-weight: 600; font-size: 0.95rem; color: var(--md-sys-color-on-surface);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .segl-amount { font-weight: 700; font-size: 1rem; color: var(--md-sys-color-on-surface); white-space: nowrap; }
        .segl-row2 { display: flex; align-items: center; gap: 8px; font-size: 0.8rem;
          color: var(--md-sys-color-on-surface); opacity: 0.7; }
        .segl-tipo { font-weight: 600; }
        .segl-sep { color: var(--md-sys-color-outline); }
        .segl-row3 { display: flex; align-items: center; gap: 10px; font-size: 0.8rem;
          color: var(--md-sys-color-on-surface); opacity: 0.7; flex-wrap: wrap; }
        .segl-aseg { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
        .segl-tel { color: var(--md-sys-color-primary); text-decoration: none; display: inline-flex;
          align-items: center; gap: 3px; white-space: nowrap; }
        .segl-empty { text-align: center; padding: 2rem; color: var(--md-sys-color-on-surface);
          opacity: 0.5; font-style: italic; }
        .segl-actions { display: flex; flex-direction: column; justify-content: center; gap: 4px; }
        .segl-actions button { border: none; background: none; padding: 4px; cursor: pointer;
          color: var(--md-sys-color-on-surface); opacity: 0.6; }
        .segl-actions button.danger { color: #ef5350; }
        .seg-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px;
          background: ${BRAND.blue}; color: #fff; border: none; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
      `}</style>
    </div>
  );
}

// Modal de solo lectura con todos los datos del seguro.
function SeguroDetalle({ seguro: s, onClose }) {
  const { fg } = tipoColor(s.tipo);
  const Icon = TIPO_ICONS[s.tipo] || Shield;
  const estadoLabel = s.estado === 'cancelada' ? 'Cancelada' : 'Activa';
  const row = (label, value) => (
    <div className="segd-row">
      <span className="segd-label">{label}</span>
      <span className="segd-value">{value || '—'}</span>
    </div>
  );
  return (
    <div className="segd-overlay" onClick={onClose}>
      <div className="segd-modal" onClick={e => e.stopPropagation()}>
        <div className="segd-header">
          <Icon size={18} color={fg} />
          <span className="segd-tipo" style={{ color: fg }}>{tipoLabel(s.tipo)}</span>
          <h3>{s.compania || '—'}</h3>
          <button type="button" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="segd-body">
          {row('Nº de póliza', s.numeroPoliza)}
          {row('Tomador', s.tomador)}
          {row('Asegurado', s.asegurado)}
          {row('Teléfono', s.telefono ? <a href={`tel:${s.telefono}`} className="seg-tel">{s.telefono}</a> : '')}
          {row('Importe', `${(Number(s.importe) || 0).toFixed(2)} € · ${periodicidadLabel(s.periodicidad)}`)}
          {row('Importe mensual', `${(Number(s.importeMensual) || 0).toFixed(2)} €`)}
          {row('Fecha de efecto', fmtFecha(s.fechaEfecto))}
          {row('Fecha de renovación', fmtFecha(s.fechaVencimiento))}
          {row('Estado', estadoLabel)}
          <div className="segd-row segd-col">
            <span className="segd-label">Coberturas</span>
            <p className="segd-cob">{s.coberturas || '—'}</p>
          </div>
        </div>
        <style>{`
          .segd-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
            display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; overflow-y: auto; }
          .segd-modal { background: #fff; color: #1D1D1F; width: 90%; max-width: 460px;
            border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); overflow: hidden; margin-bottom: 40px; }
          .segd-header { display: flex; align-items: center; gap: 10px;
            padding: 14px 18px; border-bottom: 1px solid #E5E5EA; }
          .segd-tipo { font-weight: 700; font-size: 0.95rem; }
          .segd-header h3 { margin: 0; font-size: 0.95rem; font-weight: 500; opacity: 0.75; flex: 1; text-align: right;
            overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .segd-header button { border: none; background: none; cursor: pointer; color: #6E6E73; }
          .segd-body { padding: 8px 18px 18px; }
          .segd-row { display: flex; gap: 12px; padding: 8px 0; border-bottom: 1px solid #F4F4F6; font-size: 0.9rem; }
          .segd-label { color: #6E6E73; min-width: 120px; font-size: 0.8rem; }
          .segd-value { color: #1D1D1F; flex: 1; word-break: break-word; }
          .segd-col { flex-direction: column; gap: 4px; }
          .segd-cob { margin: 0; white-space: pre-wrap; font-size: 0.85rem; color: #1D1D1F; line-height: 1.4; }
        `}</style>
      </div>
    </div>
  );
}
