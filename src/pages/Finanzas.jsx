import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFinanzas } from '../context/FinanzasContext';
import MensualView from '../finanzas/MensualView';
import AnualView from '../finanzas/AnualView';
import { BRAND } from '../finanzas/constants';

export default function Finanzas() {
  const { finTransactions, loading } = useFinanzas();
  const [searchParams] = useSearchParams();
  const tab = searchParams.get('v') === 'mensual' ? 'mensual' : 'anual'; // por defecto Anual
  const now = new Date();
  // Mes activo por defecto = el anterior al actual (Ene → Dic).
  const [month, setMonth] = useState(now.getMonth() === 0 ? 12 : now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  return (
    <div className="fin-page">
      <div className="fin-tabs">
        <div className="fin-year">
          <label>Año </label>
          <select value={year} onChange={e => setYear(parseInt(e.target.value, 10))}>
            {[year - 1, year, year + 1].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {loading
        ? <div className="fin-loading">Cargando movimientos…</div>
        : tab === 'mensual'
          ? <MensualView data={finTransactions} month={month} year={year} setMonth={setMonth} />
          : <AnualView data={finTransactions} year={year} />}

      <style>{`
        /* Variables semánticas de la sección Finanzas (tema claro y oscuro).
           Los componentes de src/finanzas/ las consumen en sus estilos. */
        .fin-page {
          --fin-surface: #fff;            /* fondo de tablas y tarjetas */
          --fin-surface-alt: #FAFAFA;     /* cabeceras, fila total, inputs */
          --fin-surface-sub: #FCFCFD;     /* filas de subcategoría */
          --fin-ink: #1D1D1F;             /* texto principal */
          --fin-ink-2: #6E6E73;           /* texto secundario */
          --fin-border: #E5E5EA;          /* bordes marcados */
          --fin-border-soft: #F0F0F0;     /* separadores suaves */
          --fin-border-input: #D2D2D7;    /* bordes de inputs/selects */
          --fin-pos: #166534;             /* importes positivos */
          --fin-neg: #991B1B;             /* importes negativos */
        }
        :root[data-theme='dark'] .fin-page {
          --fin-surface: var(--md-sys-color-surface);
          --fin-surface-alt: #2a2a2a;
          --fin-surface-sub: #262626;
          --fin-ink: var(--md-sys-color-on-surface);
          --fin-ink-2: #b0bec5;
          --fin-border: var(--md-sys-color-outline);
          --fin-border-soft: #333;
          --fin-border-input: var(--md-sys-color-outline);
          --fin-pos: #4ade80;
          --fin-neg: #f87171;
        }

        .fin-page { padding-bottom: 100px; color: var(--fin-ink); }
        .fin-tabs { display: flex; align-items: center; gap: 6px; margin-bottom: 14px; }
        .fin-tabs > button { border: none; background: #EBEBED; color: #6E6E73; padding: 7px 16px;
          border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.9rem; }
        .fin-tabs > button.active { background: ${BRAND.blue}; color: #fff; }
        .fin-year { margin-left: auto; font-size: 0.85rem; color: var(--fin-ink-2); }
        .fin-year select { border: 1px solid var(--fin-border-input); border-radius: 6px; padding: 4px 8px;
          background: var(--fin-surface-alt); margin-left: 4px; color: var(--fin-ink); }
        .fin-loading { padding: 40px 0; text-align: center; color: var(--fin-ink-2); font-style: italic; }

        /* Modal y formulario (FinTransactionForm) */
        :root[data-theme='dark'] .fin-modal { background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); }
        :root[data-theme='dark'] .fin-modal-header { border-bottom-color: var(--md-sys-color-outline); }
        :root[data-theme='dark'] .fin-form label { color: #b0bec5; }
        :root[data-theme='dark'] .fin-form input,
        :root[data-theme='dark'] .fin-form select { background: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface); border-color: var(--md-sys-color-outline); }
      `}</style>
    </div>
  );
}
