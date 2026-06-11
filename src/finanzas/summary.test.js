import { describe, it, expect } from 'vitest';
import { getSummary, getBreakdown } from './summary';

// today fijo para determinismo: 15 mar 2026 → cur_month = 3.
const TODAY = new Date(2026, 2, 15);

const tx = (fecha, categoria, importe, subcategoria = null) => ({
  fecha, categoria, importe, subcategoria,
  concepto: 'x', tipo: importe < 0 ? 'Gasto' : 'Ingreso', cuenta: 'ING',
});

describe('getSummary', () => {
  it('pivota por categoría y mes, con meses sin datos a null', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-02-10', 'Nomina', 2000),
      tx('2026-01-15', 'Ocio', -50),
    ];
    const { rows } = getSummary(data, 2026, TODAY);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.meses['1']).toBe(2000);
    expect(nomina.meses['2']).toBe(2000);
    expect(nomina.meses['3']).toBeNull();
    expect(nomina.meses['12']).toBeNull();
    expect(nomina.total_actual).toBe(4000);
  });

  it('calcula media y previsión: total + media*(12-n)', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-02-10', 'Nomina', 2000),
    ];
    const { rows } = getSummary(data, 2026, TODAY);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.media_mensual).toBe(2000);
    expect(nomina.prevision).toBe(4000 + 2000 * 10); // 24000
  });

  it('la fila TOTAL suma todas las categorías', () => {
    const data = [
      tx('2026-01-10', 'Nomina', 2000),
      tx('2026-01-15', 'Ocio', -50),
    ];
    const { total_row } = getSummary(data, 2026, TODAY);
    expect(total_row.categoria).toBe('TOTAL');
    expect(total_row.meses['1']).toBe(1950);
    expect(total_row.total_actual).toBe(1950);
  });
});

describe('getSummary — casos de año', () => {
  const data = [
    tx('2026-01-10', 'Nomina', 2000),
    tx('2026-02-10', 'Nomina', 2000),
  ];

  it('año pasado: cur_month=12, usa todos los meses con datos', () => {
    const future = new Date(2027, 0, 1); // today en 2027, year=2026 ya pasó
    const { actual_months } = getSummary(data, 2026, future);
    expect(actual_months).toEqual([1, 2]);
  });

  it('año futuro: cur_month=0, no hay meses reales → previsión 0', () => {
    const past = new Date(2025, 0, 1); // today en 2025, year=2026 es futuro
    const { rows, actual_months } = getSummary(data, 2026, past);
    expect(actual_months).toEqual([]);
    const nomina = rows.find(r => r.categoria === 'Nomina');
    expect(nomina.total_actual).toBe(0);
    expect(nomina.prevision).toBe(0);
    expect(nomina.meses['1']).toBeNull();
  });
});

describe('getBreakdown', () => {
  const TODAY2 = new Date(2026, 2, 15);
  const data = [
    tx('2026-01-05', 'Compras varias', -30, 'Amazon'),
    tx('2026-02-05', 'Compras varias', -20, 'Amazon'),
    tx('2026-01-08', 'Compras varias', -15, 'Farmacia'),
    tx('2026-01-09', 'Compras varias', -5), // sin subcategoría
  ];

  it('pivota por subcategoría, con (sin subcategoría) para nulls', () => {
    const { rows } = getBreakdown(data, 2026, 'Compras varias', TODAY2);
    const amazon = rows.find(r => r.subcategoria === 'Amazon');
    const sinSub = rows.find(r => r.subcategoria === '(sin subcategoría)');
    expect(amazon.total_actual).toBe(-50);
    expect(amazon.meses['1']).toBe(-30);
    expect(sinSub.total_actual).toBe(-5);
  });
});
