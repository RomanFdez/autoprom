// src/seguros/calc.test.js
import { describe, it, expect } from 'vitest';
import { importeMensual, getEstadisticas } from './calc';

const seg = (over = {}) => ({
  id: Math.random().toString(36).slice(2),
  tipo: 'coche', numeroPoliza: 'P1', compania: 'AMA', tomador: 'Yo',
  asegurado: 'Coche', telefono: '900', importe: 120, periodicidad: 'anual',
  fechaEfecto: '2026-01-01', fechaVencimiento: '', estado: 'activa',
  coberturas: '', importeMensual: 10, ...over,
});

describe('importeMensual', () => {
  it('divide el importe por los meses del periodo', () => {
    expect(importeMensual(100, 'mensual')).toBe(100);
    expect(importeMensual(100, 'bimensual')).toBe(50);
    expect(importeMensual(120, 'trimestral')).toBe(40);
    expect(importeMensual(120, 'anual')).toBe(10);
    expect(importeMensual(240, 'bianual')).toBe(10);
  });

  it('importe inválido → 0', () => {
    expect(importeMensual(undefined, 'anual')).toBe(0);
    expect(importeMensual('', 'anual')).toBe(0);
    expect(importeMensual(NaN, 'anual')).toBe(0);
  });

  it('redondea a 2 decimales', () => {
    expect(importeMensual(100, 'trimestral')).toBe(33.33);
  });
});

describe('getEstadisticas', () => {
  const TODAY = new Date(2026, 5, 16); // 16 jun 2026

  it('suma coste mensual y anual solo de los activos', () => {
    const data = [
      seg({ importeMensual: 10, estado: 'activa' }),
      seg({ importeMensual: 25, estado: 'activa' }),
      seg({ importeMensual: 99, estado: 'cancelada' }),
    ];
    const st = getEstadisticas(data, TODAY);
    expect(st.costeMensual).toBe(35);
    expect(st.costeAnual).toBe(420);
    expect(st.total).toBe(2);
  });

  it('agrupa por tipo (conteo y coste mensual), solo activos', () => {
    const data = [
      seg({ tipo: 'coche', importeMensual: 10 }),
      seg({ tipo: 'coche', importeMensual: 5 }),
      seg({ tipo: 'salud', importeMensual: 30 }),
      seg({ tipo: 'salud', importeMensual: 70, estado: 'cancelada' }),
    ];
    const st = getEstadisticas(data, TODAY);
    const coche = st.porTipo.find(t => t.tipo === 'coche');
    const salud = st.porTipo.find(t => t.tipo === 'salud');
    expect(coche).toMatchObject({ count: 2, costeMensual: 15 });
    expect(salud).toMatchObject({ count: 1, costeMensual: 30 });
  });

  it('próximas renovaciones: solo con vencimiento futuro, orden ascendente', () => {
    const data = [
      seg({ id: 'a', fechaVencimiento: '2026-08-01' }),
      seg({ id: 'b', fechaVencimiento: '2026-07-01' }),
      seg({ id: 'c', fechaVencimiento: '2026-01-01' }), // pasado → excluido
      seg({ id: 'd', fechaVencimiento: '' }),           // sin fecha → excluido
      seg({ id: 'e', fechaVencimiento: '2026-09-01', estado: 'cancelada' }), // excluido
    ];
    const st = getEstadisticas(data, TODAY);
    expect(st.proximasRenovaciones.map(s => s.id)).toEqual(['b', 'a']);
  });
});
