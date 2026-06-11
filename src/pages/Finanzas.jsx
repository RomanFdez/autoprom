import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useFinanzas } from '../context/FinanzasContext';
import FinTransactionForm from '../components/FinTransactionForm';
import { CATEGORIES, CUENTAS, MONTHS, catColor, BRAND } from '../finanzas/constants';
import { getSummary, getBreakdown } from '../finanzas/summary';

export default function Finanzas() {
  const { finTransactions } = useFinanzas();
  const [tab, setTab] = useState('anual'); // 'mensual' | 'anual' — por defecto Anual (resumen)
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="fin-page">
      <div className="fin-tabs">
        <button className={tab === 'mensual' ? 'active' : ''} onClick={() => setTab('mensual')}>Mensual</button>
        <button className={tab === 'anual' ? 'active' : ''} onClick={() => setTab('anual')}>Anual</button>
        <div className="fin-year">
          <label>Año </label>
          <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {tab === 'mensual'
        ? <MensualView data={finTransactions} month={month} year={year} setMonth={setMonth} />
        : <AnualView data={finTransactions} year={year} />}

      <style>{`
        .fin-page { padding-bottom: 100px; color: #1D1D1F; }
        .fin-tabs { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .fin-tabs > button { border: none; background: #EBEBED; color: #6E6E73; padding: 7px 16px;
          border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
        .fin-tabs > button.active { background: ${BRAND.blue}; color: #fff; }
        .fin-year { margin-left: auto; font-size: 0.85rem; color: #6E6E73; }
        .fin-year select { border: 1px solid #D2D2D7; border-radius: 6px; padding: 4px 8px;
          background: #FAFAFA; margin-left: 4px; }
      `}</style>
    </div>
  );
}

function MensualView({ data, month, year, setMonth }) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [qConcepto, setQConcepto] = useState('');
  const [fCuenta, setFCuenta] = useState('');
  const [fCategoria, setFCategoria] = useState('');
  const { removeFin, updateFin } = useFinanzas();

  const monthRows = useMemo(() => {
    const mm = String(month).padStart(2, '0');
    return data
      .filter(t => t.fecha.slice(0, 4) === String(year) && t.fecha.slice(5, 7) === mm)
      .filter(t => !qConcepto || (t.concepto || '').toLowerCase().includes(qConcepto.toLowerCase()))
      .filter(t => !fCuenta || t.cuenta === fCuenta)
      .filter(t => !fCategoria || t.categoria === fCategoria);
  }, [data, month, year, qConcepto, fCuenta, fCategoria]);

  const totals = useMemo(() => {
    let ingresos = 0, gastos = 0;
    for (const t of monthRows) { if (t.importe >= 0) ingresos += t.importe; else gastos += t.importe; }
    return { ingresos, gastos, balance: ingresos + gastos };
  }, [monthRows]);

  const recategorize = (t) => {
    const next = prompt(`Nueva categoría para "${t.concepto}":\n${CATEGORIES.join(', ')}`, t.categoria);
    if (next && CATEGORIES.includes(next)) updateFin({ ...t, categoria: next });
  };

  return (
    <div>
      <div className="fin-monthbar">
        {MONTHS.map((m, i) => (
          <button key={m} className={`fin-pill ${month === i + 1 ? 'active' : ''}`}
            onClick={() => setMonth(i + 1)}>{m.slice(0, 3)}</button>
        ))}
      </div>

      <div className="fin-cards">
        <div className="fin-card" style={{ background: BRAND.incomeBg, borderColor: BRAND.incomeBorder }}>
          <span style={{ color: BRAND.incomeText }}>Ingresos</span>
          <strong style={{ color: BRAND.incomeText }}>{totals.ingresos.toFixed(2)} €</strong>
        </div>
        <div className="fin-card" style={{ background: BRAND.expenseBg, borderColor: BRAND.expenseBorder }}>
          <span style={{ color: BRAND.expenseText }}>Gastos</span>
          <strong style={{ color: BRAND.expenseText }}>{totals.gastos.toFixed(2)} €</strong>
        </div>
        <div className="fin-card" style={{ background: BRAND.balanceBg, borderColor: BRAND.balanceBorder }}>
          <span style={{ color: BRAND.balanceText }}>Balance</span>
          <strong style={{ color: BRAND.balanceText }}>{totals.balance.toFixed(2)} €</strong>
        </div>
      </div>

      <div className="fin-filters">
        <input placeholder="Buscar concepto…" value={qConcepto} onChange={e => setQConcepto(e.target.value)} />
        <select value={fCuenta} onChange={e => setFCuenta(e.target.value)}>
          <option value="">Todas las cuentas</option>
          {CUENTAS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={fCategoria} onChange={e => setFCategoria(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="fin-table-wrap">
      <table className="fin-table">
        <colgroup>
          <col style={{ width: '8%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '23%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '15%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
        <thead>
          <tr><th>Fec.</th><th>Cat.</th><th>Subcat.</th><th>Concepto</th><th>Cuenta</th><th className="num">Importe</th><th></th></tr>
        </thead>
        <tbody>
          {monthRows.map(t => {
            const { bg, fg } = catColor(t.categoria);
            return (
              <tr key={t.id}>
                <td className="nowrap">{t.fecha.slice(8, 10)}/{t.fecha.slice(5, 7)}</td>
                <td><span className="fin-badge" style={{ background: bg, color: fg }}
                  onClick={() => recategorize(t)} title="Cambiar categoría">{t.categoria}</span></td>
                <td className="ell" title={t.subcategoria || ''}>{t.subcategoria || ''}</td>
                <td className="ell" title={t.concepto}>{t.concepto}</td>
                <td className="ell" title={t.cuenta}>{t.cuenta}</td>
                <td className="num nowrap" style={{ color: t.importe >= 0 ? BRAND.incomeText : BRAND.expenseText }}>
                  {t.importe.toFixed(2)}</td>
                <td className="actions">
                  <button onClick={() => { setEditing(t); setIsFormOpen(true); }}><Edit2 size={13} /></button>
                  <button onClick={() => { if (confirm('¿Eliminar apunte?')) removeFin(t.id); }}><Trash2 size={13} /></button>
                </td>
              </tr>
            );
          })}
          {monthRows.length === 0 && <tr><td colSpan="7" className="empty">Sin apuntes</td></tr>}
        </tbody>
      </table>
      </div>

      <button className="fin-fab" onClick={() => { setEditing(null); setIsFormOpen(true); }}><Plus size={24} /></button>
      {isFormOpen && <FinTransactionForm onClose={() => setIsFormOpen(false)} initialData={editing} />}

      <style>{`
        .fin-monthbar { display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px; }
        .fin-pill { border: none; background: transparent; color: #6E6E73; padding: 4px 10px;
          border-radius: 16px; font-size: 0.8rem; cursor: pointer; }
        .fin-pill.active { background: ${BRAND.blue}; color: #fff; }
        .fin-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 14px; }
        .fin-card { border: 1px solid; border-radius: 14px; padding: 12px 14px; display: flex;
          flex-direction: column; gap: 4px; }
        .fin-card span { font-size: 0.72rem; text-transform: uppercase; letter-spacing: .04em; }
        .fin-card strong { font-size: 1.15rem; }
        .fin-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .fin-filters input, .fin-filters select { border: 1px solid #D2D2D7; border-radius: 8px;
          padding: 7px 10px; background: #FAFAFA; font-size: 0.85rem; }
        .fin-table-wrap { width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .fin-table { width: 100%; table-layout: fixed; border-collapse: collapse; background: #fff;
          border-radius: 12px; overflow: hidden; font-size: 0.66rem; }
        .fin-table th { text-align: left; background: #FAFAFA; color: #6E6E73; text-transform: uppercase;
          font-size: 0.55rem; padding: 4px 4px; border-bottom: 1px solid #E5E5EA; }
        .fin-table td { padding: 3px 4px; border-bottom: 1px solid #F0F0F0; vertical-align: top; }
        .fin-table .num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 600; }
        .fin-table .nowrap { white-space: nowrap; }
        .fin-table .ell { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .fin-badge { display: inline-block; max-width: 100%; padding: 1px 5px; border-radius: 20px;
          font-size: 0.6rem; line-height: 1.3; cursor: pointer; overflow: hidden; text-overflow: ellipsis;
          white-space: nowrap; vertical-align: middle; }
        .fin-table .actions { white-space: nowrap; }
        .fin-table td.actions { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .fin-table .actions button { border: none; background: none; cursor: pointer; color: #6E6E73; padding: 0; }
        .fin-table .actions button:last-child { color: #C0392B; }
        .fin-table .empty { text-align: center; color: #AEAEB2; font-style: italic; padding: 20px; }
        .fin-fab { position: fixed; bottom: 24px; right: 24px; width: 56px; height: 56px; border-radius: 28px;
          background: ${BRAND.blue}; color: #fff; border: none; display: flex; align-items: center;
          justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 1000; }
      `}</style>
    </div>
  );
}

function AnualView({ data, year }) {
  const [open, setOpen] = useState({}); // categoria -> bool (drill-down abierto)
  const summary = useMemo(() => getSummary(data, year), [data, year]);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fmt = (v) => (v == null ? '—' : v.toFixed(2));

  const toggle = (cat) => setOpen(o => ({ ...o, [cat]: !o[cat] }));

  return (
    <div className="fin-anual-wrap">
      <table className="fin-anual">
        <thead>
          <tr>
            <th>Categoría</th>
            {months.map(m => <th key={m} className="num">{MONTHS[m - 1].slice(0, 3)}</th>)}
            <th className="num">Total</th><th className="num">Media</th><th className="num">Previsión</th>
          </tr>
        </thead>
        <tbody>
          {summary.rows.map(row => {
            const { bg, fg } = catColor(row.categoria);
            const hasSub = summary.cats_with_subcats.includes(row.categoria);
            return (
              <CategoriaRows key={row.categoria} row={row} months={months} fmt={fmt}
                bg={bg} fg={fg} hasSub={hasSub} isOpen={!!open[row.categoria]}
                onToggle={() => toggle(row.categoria)} data={data} year={year} />
            );
          })}
          <tr className="fin-total">
            <td>TOTAL</td>
            {months.map(m => <td key={m} className="num">{fmt(summary.total_row.meses[String(m)])}</td>)}
            <td className="num">{fmt(summary.total_row.total_actual)}</td>
            <td className="num">{fmt(summary.total_row.media_mensual)}</td>
            <td className="num">{fmt(summary.total_row.prevision)}</td>
          </tr>
        </tbody>
      </table>

      <style>{`
        .fin-anual-wrap { overflow-x: auto; }
        .fin-anual { border-collapse: collapse; font-size: 0.75rem; background: #fff; min-width: 900px; }
        .fin-anual th { background: #FAFAFA; color: #6E6E73; text-transform: uppercase; font-size: 0.62rem;
          padding: 7px 8px; border-bottom: 1px solid #E5E5EA; position: sticky; top: 0; }
        .fin-anual td { padding: 6px 8px; border-bottom: 1px solid #F0F0F0; white-space: nowrap; }
        .fin-anual .num { text-align: right; font-variant-numeric: tabular-nums; }
        .fin-anual .fin-total td { font-weight: 700; background: #FAFAFA; border-top: 2px solid #E5E5EA; }
        .fin-anual .fin-badge { padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .fin-anual .caret { cursor: pointer; user-select: none; margin-right: 4px; color: #6E6E73; }
        .fin-anual .sub td { color: #6E6E73; background: #FCFCFD; }
        .fin-anual .sub td:first-child { padding-left: 24px; font-style: italic; }
      `}</style>
    </div>
  );
}

function CategoriaRows({ row, months, fmt, bg, fg, hasSub, isOpen, onToggle, data, year }) {
  const breakdown = useMemo(
    () => (isOpen ? getBreakdown(data, year, row.categoria) : null),
    [isOpen, data, year, row.categoria]
  );
  return (
    <>
      <tr>
        <td>
          {hasSub && <span className="caret" onClick={onToggle}>{isOpen ? '▼' : '▶'}</span>}
          <span className="fin-badge" style={{ background: bg, color: fg }}>{row.categoria}</span>
        </td>
        {months.map(m => <td key={m} className="num">{fmt(row.meses[String(m)])}</td>)}
        <td className="num">{fmt(row.total_actual)}</td>
        <td className="num">{fmt(row.media_mensual)}</td>
        <td className="num">{fmt(row.prevision)}</td>
      </tr>
      {isOpen && breakdown && breakdown.rows.map(sub => (
        <tr key={sub.subcategoria} className="sub">
          <td>{sub.subcategoria}</td>
          {months.map(m => <td key={m} className="num">{fmt(sub.meses[String(m)])}</td>)}
          <td className="num">{fmt(sub.total_actual)}</td>
          <td className="num">{fmt(sub.media_mensual)}</td>
          <td className="num">{fmt(sub.prevision)}</td>
        </tr>
      ))}
    </>
  );
}
