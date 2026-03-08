import { useMemo } from 'react';
import { useData } from '../context/DataContext';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, ReferenceLine, CartesianGrid,
} from 'recharts';
import { computeStatistics } from '../utils/statisticsData';

export default function Statistics() {
  const { transactions, categories } = useData();

  const { budgetVsActual, cumulativeSpending, totalBudget } = useMemo(
    () => computeStatistics(transactions, categories),
    [transactions, categories]
  );

  const formatEur = (v) => `${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`;

  return (
    <div className="statistics-page">
      <h2 className="stats-title">Estadísticas</h2>

      {/* Budget vs Actual */}
      <div className="chart-section">
        <h3>Presupuesto vs Real</h3>
        {budgetVsActual.length === 0 ? (
          <div className="empty-state">No hay categorías con presupuesto definido</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={budgetVsActual.length * 60 + 40}>
              <BarChart data={budgetVsActual} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <XAxis type="number" tickFormatter={formatEur} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v) => formatEur(v)} />
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <Bar dataKey="budget" name="Presupuesto" fill="var(--md-sys-color-outline)" opacity={0.35} radius={[0, 4, 4, 0]} />
                <Bar dataKey="spent" name="Gastado" radius={[0, 4, 4, 0]}>
                  {budgetVsActual.map((entry) => (
                    <Cell
                      key={entry.id}
                      fill={entry.spent > entry.budget ? '#f44336' : entry.color}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legend list */}
            <div className="list-group">
              {budgetVsActual.map(item => (
                <div key={item.id} className="list-row">
                  <div className="row-left">
                    <div className="dot" style={{ backgroundColor: item.spent > item.budget ? '#f44336' : item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <div className="row-right">
                    <span className="spent-val">{formatEur(item.spent)}</span>
                    <span className="budget-val"> / {formatEur(item.budget)}</span>
                    <span className={`pct ${item.percentUsed > 100 ? 'over' : ''}`}>
                      {item.percentUsed.toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Cumulative Spending */}
      <div className="chart-section" style={{ marginTop: '2rem' }}>
        <h3>Gasto Acumulado</h3>
        {cumulativeSpending.length === 0 ? (
          <div className="empty-state">No hay datos para mostrar</div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={cumulativeSpending} margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4caf50" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4caf50" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatEur} tick={{ fontSize: 11 }} />
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <Tooltip formatter={(v) => formatEur(v)} />
                <Area
                  type="monotone"
                  dataKey="cumulative"
                  name="Acumulado"
                  stroke="#4caf50"
                  strokeWidth={2}
                  fill="url(#areaGrad)"
                />
                {totalBudget > 0 && (
                  <ReferenceLine
                    y={totalBudget}
                    stroke="#f44336"
                    strokeDasharray="5 5"
                    label={{ value: `Presupuesto: ${formatEur(totalBudget)}`, position: 'insideTopRight', fontSize: 11, fill: '#f44336' }}
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>

            <div className="cumulative-summary">
              <div className="summary-item">
                <span className="summary-label">Total gastado</span>
                <span className="summary-value">{formatEur(cumulativeSpending[cumulativeSpending.length - 1]?.cumulative || 0)}</span>
              </div>
              {totalBudget > 0 && (
                <div className="summary-item">
                  <span className="summary-label">Presupuesto total</span>
                  <span className="summary-value budget">{formatEur(totalBudget)}</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <style>{`
        .statistics-page {
          padding-bottom: 2rem;
        }
        .stats-title {
          display: none;
        }
        .chart-section h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--md-sys-color-on-surface);
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: var(--md-sys-color-on-surface);
          opacity: 0.5;
        }
        .list-group {
          background: var(--md-sys-color-surface);
          border-radius: 12px;
          padding: 8px;
          margin-top: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .list-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-bottom: 1px solid var(--md-sys-color-outline);
          color: var(--md-sys-color-on-surface);
        }
        .list-row:last-child { border-bottom: none; }
        .row-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .row-right {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.9rem;
        }
        .spent-val { font-weight: 600; }
        .budget-val { opacity: 0.5; font-size: 0.85rem; }
        .pct {
          background: var(--md-sys-color-background);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
          min-width: 42px;
          text-align: center;
        }
        .pct.over {
          background: #f44336;
          color: white;
        }
        .cumulative-summary {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }
        .summary-item {
          flex: 1;
          background: var(--md-sys-color-surface);
          border-radius: 12px;
          padding: 16px;
          text-align: center;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .summary-label {
          display: block;
          font-size: 0.75rem;
          opacity: 0.6;
          text-transform: uppercase;
          margin-bottom: 4px;
          color: var(--md-sys-color-on-surface);
        }
        .summary-value {
          font-size: 1.2rem;
          font-weight: bold;
          color: var(--md-sys-color-on-surface);
        }
        .summary-value.budget {
          color: #f44336;
        }
      `}</style>
    </div>
  );
}
