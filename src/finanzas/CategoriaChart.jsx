import { useState, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import { MONTHS, catColor } from './constants';

// Categorías disponibles en el selector del gráfico (y su etiqueta visible).
const CHART_CATS = {
  'Comida/Super': 'Comida/Super',
  'Compras varias': 'Compras varias',
  'Facturas': 'Facturas',
  'Gasolina y Transporte': 'Gasolina y Transporte',
  'Niños': 'Niños',
  'Ocio': 'Ocio',
  'Nomina': 'Nominas/ingresos',
};

// Gráfico de barras por mes de una categoría, con línea de media.
// Permite comparar la evolución del gasto de la categoría a lo largo del año.
export default function CategoriaChart({ summary, prevSummary, year }) {
  const cats = summary.rows.map(r => r.categoria).filter(c => c in CHART_CATS);
  const [selected, setSelected] = useState(null);
  // Si la categoría elegida desaparece (cambio de año), volvemos a la primera.
  const cat = cats.includes(selected) ? selected : cats[0];

  const row = summary.rows.find(r => r.categoria === cat);
  const prevRow = prevSummary?.rows.find(r => r.categoria === cat);
  // Los gastos se guardan en negativo: los mostramos en positivo para leer la evolución.
  const sign = row && row.total_actual < 0 ? -1 : 1;
  const chartData = useMemo(() => {
    if (!row) return [];
    return MONTHS.map((name, i) => {
      const v = row.meses[String(i + 1)];
      const p = prevRow ? prevRow.meses[String(i + 1)] : null;
      return {
        mes: name.slice(0, 3),
        importe: v == null ? null : sign * v,
        anterior: p == null ? null : sign * p,
      };
    });
  }, [row, prevRow, sign]);
  const hasPrev = prevRow != null;

  if (!row) return null;

  const media = sign * row.media_mensual;
  const { bg, fg } = catColor(cat);
  const fmtEur = (v) => `${v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;

  return (
    <div className="fin-chart" style={{ '--bar-light': fg, '--bar-dark': bg }}>
      <div className="fin-chart-head">
        <h3>Evolución mensual</h3>
        {hasPrev && (
          <span className="fin-chart-legend">
            <i style={{ background: 'var(--fin-bar-prev)' }} /> {year - 1}
            <i style={{ background: 'var(--fin-bar)' }} /> {year}
          </span>
        )}
        <select value={cat} onChange={e => setSelected(e.target.value)}>
          {cats.map(c => <option key={c} value={c}>{CHART_CATS[c]}</option>)}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--fin-border-soft)" />
          <XAxis dataKey="mes" tickLine={false} axisLine={false}
            tick={{ fill: 'var(--fin-ink-2)', fontSize: 11 }} />
          <YAxis tickLine={false} axisLine={false} width={60}
            tick={{ fill: 'var(--fin-ink-2)', fontSize: 11 }}
            tickFormatter={v => v.toLocaleString('es-ES')} />
          <Tooltip
            formatter={(v, name) => [fmtEur(v), name]}
            cursor={{ fill: 'var(--fin-cursor)' }}
            contentStyle={{ background: 'var(--fin-surface)', border: '1px solid var(--fin-border-soft)',
              borderRadius: 8, fontSize: '0.8rem' }}
            labelStyle={{ color: 'var(--fin-ink)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--fin-ink)' }} />
          {hasPrev && (
            <Bar dataKey="anterior" name={String(year - 1)} fill="var(--fin-bar-prev)"
              radius={[4, 4, 0, 0]} maxBarSize={20} />
          )}
          <Bar dataKey="importe" name={String(year)} fill="var(--fin-bar)"
            radius={[4, 4, 0, 0]} maxBarSize={hasPrev ? 20 : 36} />
          <ReferenceLine y={media} stroke="var(--fin-ink-2)" strokeDasharray="4 4"
            label={{ value: `Media ${fmtEur(media)}`, position: 'insideTopRight',
              fill: 'var(--fin-ink-2)', fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>

      <style>{`
        .fin-chart { margin-top: 20px; background: var(--fin-surface); border: 1px solid var(--fin-border);
          border-radius: 12px; padding: 16px;
          --fin-bar: var(--bar-light); --fin-bar-prev: #D2D2D7; --fin-cursor: rgba(0, 0, 0, 0.04); }
        .fin-chart-legend { display: flex; align-items: center; gap: 6px; font-size: 0.75rem;
          color: var(--fin-ink-2); margin-left: auto; }
        .fin-chart-legend i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
        .fin-chart-head select { margin-left: 0; }
        .fin-chart-head { display: flex; align-items: center; justify-content: space-between;
          gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
        .fin-chart-head h3 { margin: 0; font-size: 0.95rem; }
        .fin-chart-head select { border: 1px solid var(--fin-border-input); border-radius: 6px; padding: 4px 8px;
          background: var(--fin-surface-alt); color: var(--fin-ink); font-size: 0.85rem; }
        :root[data-theme='dark'] .fin-chart {
          --fin-bar: var(--bar-dark); --fin-bar-prev: #4a4a4a; --fin-cursor: rgba(255, 255, 255, 0.06); }
      `}</style>
    </div>
  );
}
