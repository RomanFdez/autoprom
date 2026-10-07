// src/pages/Pilas.jsx
import { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Search, ChevronLeft, BatteryFull, MapPin } from 'lucide-react';
import { usePilas } from '../context/PilasContext';
import PilaAsignacionForm from '../components/PilaAsignacionForm';
import PilaTipoForm from '../components/PilaTipoForm';
import {
  resumenPorTipo, sugerenciasDe, antiguedad, ordenarPorAparato, filtrar, describirMovimiento,
} from '../casa/pilas';

const ACCENT = '#5B3A8C';

// ISO datetime -> "DD/MM/YYYY HH:MM" (hora local).
const fmtFechaHora = (iso) => {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function Pilas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('v') === 'historial' ? 'historial' : 'asignaciones';
  const { loading } = usePilas();

  return (
    <div className="pil-page">
      <div className="pil-top">
        <Link to="/casa" className="pil-back"><ChevronLeft size={18} /> Casa</Link>
        <div className="pil-tabs">
          <button className={tab === 'asignaciones' ? 'active' : ''} onClick={() => setSearchParams({})}>Pilas</button>
          <button className={tab === 'historial' ? 'active' : ''} onClick={() => setSearchParams({ v: 'historial' })}>Historial</button>
        </div>
      </div>

      {loading
        ? <div className="pil-empty">Cargando…</div>
        : tab === 'historial' ? <HistorialView /> : <AsignacionesView />}

      <style>{`
        .pil-page { padding-bottom: 100px; color: var(--md-sys-color-on-surface); }
        .pil-top { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
        .pil-back { display: inline-flex; align-items: center; gap: 2px; color: var(--md-sys-color-on-surface);
          opacity: 0.7; text-decoration: none; font-size: 0.9rem; }
        .pil-tabs { display: flex; gap: 6px; }
        .pil-tabs button { padding: 6px 14px; border-radius: 8px; border: none; cursor: pointer;
          background: #EBEBED; color: #6E6E73; font-weight: 600; font-size: 0.85rem; }
        .pil-tabs button.active { background: ${ACCENT}; color: #fff; }
        .pil-empty { text-align: center; padding: 2rem; opacity: 0.5; font-style: italic; }

        /* Modales (formularios) */
        .pil-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
          display: flex; justify-content: center; align-items: flex-start; padding-top: 60px; overflow-y: auto; }
        .pil-modal { background: #fff; color: #1D1D1F; width: 90%; max-width: 420px;
          border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25); overflow: hidden; margin-bottom: 40px; }
        .pil-modal-header { display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; border-bottom: 1px solid #E5E5EA; }
        .pil-modal-header h3 { margin: 0; font-size: 1.05rem; }
        .pil-modal-header button { border: none; background: none; cursor: pointer; color: #6E6E73; }
        .pil-form { display: flex; flex-direction: column; gap: 10px; padding: 16px 18px; }
        .pil-form label { display: flex; flex-direction: column; font-size: 0.8rem; color: #6E6E73; gap: 4px; flex: 1; min-width: 0; }
        .pil-form-row { display: flex; gap: 10px; }
        .pil-form input, .pil-form select { font-size: 0.95rem; padding: 8px 10px; border: 1px solid #D2D2D7;
          border-radius: 8px; background: #FAFAFA; color: #1D1D1F; font-family: inherit; min-width: 0; }
        .pil-readonly { font-size: 0.85rem; background: #F3EEFA; border: 1px solid #D8CBEE;
          border-radius: 8px; padding: 8px 10px; }
        .pil-save { margin-top: 6px; background: ${ACCENT}; color: #fff; border: none;
          padding: 10px; border-radius: 8px; font-weight: 600; cursor: pointer; }
        .pil-save:disabled { opacity: 0.6; }

        /* ---- Dark mode ---- */
        :root[data-theme='dark'] .pil-tabs button:not(.active) { background: #2c2c2e; color: #b0bec5; }
        :root[data-theme='dark'] .pil-modal { background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .pil-modal-header { border-bottom-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .pil-form label { color: #b0bec5; }
        :root[data-theme='dark'] .pil-form input,
        :root[data-theme='dark'] .pil-form select { background: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface); border-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .pil-readonly { background: #2E2540; border-color: #4A3B66; }
      `}</style>
    </div>
  );
}

function AsignacionesView() {
  const { tipos, asignaciones, movimientos, quitarAsignacion } = usePilas();
  const [texto, setTexto] = useState('');
  const [form, setForm] = useState(null); // null | { initialData }
  const [tipoEdit, setTipoEdit] = useState(null);

  const resumen = useMemo(() => resumenPorTipo(tipos, asignaciones), [tipos, asignaciones]);
  const filas = useMemo(() => ordenarPorAparato(filtrar(asignaciones, texto)), [asignaciones, texto]);
  const sugAparatos = useMemo(() => sugerenciasDe(asignaciones, movimientos, 'aparato'), [asignaciones, movimientos]);
  const sugEstancias = useMemo(() => sugerenciasDe(asignaciones, movimientos, 'estancia'), [asignaciones, movimientos]);

  const confirmarQuitar = async (a) => {
    if (!confirm(`¿Quitar ${a.cantidad}× ${a.tipo} de ${a.aparato}? Volverán a disponibles.`)) return;
    try {
      await quitarAsignacion(a);
    } catch (err) {
      console.error(err);
      alert('No se pudo quitar. Inténtalo de nuevo.');
    }
  };

  return (
    <div>
      <div className="pil-cards">
        {resumen.map(r => (
          <button key={r.tipo} className="pil-card" onClick={() => setTipoEdit(r)} title="Ajustar total y capacidad">
            <span className="pil-card-tipo">
              <BatteryFull size={16} /> {r.tipo}
              {r.capacidadMah ? <small> · {r.capacidadMah} mAh</small> : null}
            </span>
            <strong className={r.disponibles < 0 ? 'neg' : ''}>{r.disponibles}</strong>
            <span className="pil-card-sub">disponibles de {r.total} · {r.enUso} en uso</span>
          </button>
        ))}
      </div>

      <div className="pil-search">
        <Search size={16} />
        <input type="search" value={texto} onChange={e => setTexto(e.target.value)}
          placeholder="Buscar aparato, estancia o tipo…" />
      </div>

      <div className="pil-list">
        {filas.map(a => (
          <div key={a.id} className="pil-item">
            <span className="pil-badge">{a.cantidad}× {a.tipo}</span>
            <span className="pil-aparato">{a.aparato}</span>
            <span className="pil-meta">
              {!!a.estancia && <span className="pil-tag"><MapPin size={11} /><span>{a.estancia}</span></span>}
              <span className="pil-age">{antiguedad(a.fechaColocacion)}</span>
            </span>
            <span className="pil-actions">
              <button title="Editar" onClick={() => setForm({ initialData: a })}><Edit2 size={15} /></button>
              <button title="Quitar" className="danger" onClick={() => confirmarQuitar(a)}><Trash2 size={15} /></button>
            </span>
          </div>
        ))}
      </div>
      {filas.length === 0 && (
        <div className="pil-empty">
          {asignaciones.length === 0 ? 'No hay pilas puestas en ningún aparato' : 'Nada coincide con la búsqueda'}
        </div>
      )}

      <button className="pil-fab" title="Poner pilas" onClick={() => setForm({ initialData: null })}><Plus size={24} /></button>
      {form && (
        <PilaAsignacionForm onClose={() => setForm(null)} initialData={form.initialData}
          sugAparatos={sugAparatos} sugEstancias={sugEstancias} />
      )}
      {tipoEdit && <PilaTipoForm onClose={() => setTipoEdit(null)} resumen={tipoEdit} />}

      <style>{`
        .pil-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .pil-card { text-align: left; font: inherit; cursor: pointer; border: 1px solid #D8CBEE; background: #F3EEFA;
          color: ${ACCENT}; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .pil-card-tipo { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 0.85rem; white-space: nowrap; }
        .pil-card-tipo small { font-weight: 500; opacity: 0.8; overflow: hidden; text-overflow: ellipsis; }
        .pil-card strong { font-size: 1.5rem; line-height: 1.1; }
        .pil-card strong.neg { color: #C0392B; }
        .pil-card-sub { font-size: 0.72rem; opacity: 0.85; }
        .pil-search { display: flex; align-items: center; gap: 8px; padding: 8px 12px; border-radius: 10px;
          border: 1px solid var(--md-sys-color-outline); background: var(--md-sys-color-surface); opacity: 0.9; }
        .pil-search input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.95rem;
          color: var(--md-sys-color-on-surface); min-width: 0; }
        .pil-list { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; }
        .pil-item { background: var(--md-sys-color-surface); padding: 4px 6px 4px 10px; border-radius: 8px;
          display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); min-height: 34px; }
        .pil-aparato { flex: 1; font-weight: 600; font-size: 0.9rem; min-width: 0;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pil-meta { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; white-space: nowrap; min-width: 0; }
        .pil-tag { display: inline-flex; align-items: center; gap: 2px; padding: 1px 7px; border-radius: 20px;
          background: #EBEBED; color: #3A3A3C; max-width: 140px; min-width: 0; }
        .pil-tag svg { flex-shrink: 0; }
        .pil-tag span { overflow: hidden; text-overflow: ellipsis; }
        .pil-age { opacity: 0.65; }
        .pil-badge { background: #F3EEFA; color: ${ACCENT}; padding: 1px 7px; border-radius: 20px; font-weight: 600;
          font-size: 0.75rem; white-space: nowrap; flex-shrink: 0; }
        .pil-actions { display: flex; gap: 0; flex-shrink: 0; }
        .pil-actions button { border: none; background: none; padding: 5px; cursor: pointer; line-height: 0;
          color: var(--md-sys-color-on-surface); opacity: 0.6; }
        .pil-actions button.danger { color: #ef5350; opacity: 0.8; }
        .pil-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px;
          background: ${ACCENT}; color: #fff; border: none; display: flex; align-items: center; cursor: pointer;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
        @media (max-width: 480px) {
          .pil-cards { gap: 6px; }
          .pil-card { padding: 10px; }
          .pil-card-tipo small { display: none; }
          .pil-tag { max-width: 80px; }
        }
        :root[data-theme='dark'] .pil-card { background: #2E2540; border-color: #4A3B66; color: #C9B3EE; }
        :root[data-theme='dark'] .pil-badge { background: #2E2540; color: #C9B3EE; }
        :root[data-theme='dark'] .pil-tag { background: #2c2c2e; color: #b0bec5; }
      `}</style>
    </div>
  );
}

function HistorialView() {
  const { movimientos } = usePilas();
  return (
    <div className="pil-hist">
      {movimientos.map(m => (
        <div key={m.id} className="pil-hist-row">
          <span className="pil-hist-txt">{describirMovimiento(m)}</span>
          <span className="pil-hist-meta">{fmtFechaHora(m.fecha)}{m.usuario ? ` · ${m.usuario}` : ''}</span>
        </div>
      ))}
      {movimientos.length === 0 && <div className="pil-empty">Sin movimientos todavía</div>}
      <style>{`
        .pil-hist { display: flex; flex-direction: column; gap: 6px; }
        .pil-hist-row { background: var(--md-sys-color-surface); border-radius: 10px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .pil-hist-txt { font-size: 0.9rem; }
        .pil-hist-meta { font-size: 0.75rem; opacity: 0.6; }
      `}</style>
    </div>
  );
}
