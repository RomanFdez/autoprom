import { describe, it, expect } from 'vitest';
import { getSummary } from './summary';

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
