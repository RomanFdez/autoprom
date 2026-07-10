import { useState, useMemo } from 'react';
import { MONTHS, catColor } from './constants';
import { getSummary, getBreakdown } from './summary';
import CategoriaChart from './CategoriaChart';

export default function AnualView({ data, year }) {
  const [open, setOpen] = useState({}); // categoria -> bool (drill-down abierto)
  const summary = useMemo(() => getSummary(data, year), [data, year]);
  const prevSummary = useMemo(() => getSummary(data, year - 1), [data, year]);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const fmt = (v) => (v == null ? '—' : v.toFixed(2));

  const toggle = (cat) => setOpen(o => ({ ...o, [cat]: !o[cat] }));

  return (
    <>
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
    </div>

    <CategoriaChart summary={summary} prevSummary={prevSummary} year={year} />

    <style>{`
        .fin-anual-wrap { overflow-x: auto; }
        .fin-anual { border-collapse: collapse; font-size: 0.75rem; background: var(--fin-surface); min-width: 900px; }
        .fin-anual th { background: var(--fin-surface-alt); color: var(--fin-ink-2); text-transform: uppercase; font-size: 0.62rem;
          padding: 7px 8px; border-bottom: 1px solid var(--fin-border); position: sticky; top: 0; z-index: 2; }
        .fin-anual td { padding: 6px 8px; border-bottom: 1px solid var(--fin-border-soft); white-space: nowrap; }
        .fin-anual .num { text-align: right; font-variant-numeric: tabular-nums; }
        /* Primera columna (categoría) fija al hacer scroll horizontal */
        .fin-anual th:first-child, .fin-anual td:first-child {
          position: sticky; left: 0; border-right: 1px solid var(--fin-border); }
        .fin-anual td:first-child { background: var(--fin-surface); z-index: 1; }
        .fin-anual th:first-child { z-index: 3; }
        .fin-anual .fin-total td { font-weight: 700; background: var(--fin-surface-alt); border-top: 2px solid var(--fin-border); }
        .fin-anual .fin-total td:first-child { background: var(--fin-surface-alt); }
        .fin-anual .fin-badge { padding: 2px 8px; border-radius: 20px; font-size: 0.7rem; }
        .fin-anual .caret { cursor: pointer; user-select: none; margin-right: 4px; color: var(--fin-ink-2); }
        .fin-anual .sub td { color: var(--fin-ink-2); background: var(--fin-surface-sub); }
        .fin-anual .sub td:first-child { padding-left: 24px; font-style: italic; background: var(--fin-surface-sub); }
      `}</style>
    </>
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
