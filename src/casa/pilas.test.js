// src/casa/pilas.test.js
import { describe, it, expect } from 'vitest';
import {
  resumenPorTipo, sugerenciasDe, antiguedad, agruparPorEstancia, filtrar,
  detalleEdicion, describirMovimiento,
} from './pilas';

const asig = (over = {}) => ({
  id: Math.random().toString(36).slice(2),
  aparato: 'Mando TV', estancia: 'Salón', tipo: 'AAA', cantidad: 2,
  fechaColocacion: '2026-01-01', ...over,
});

describe('resumenPorTipo', () => {
  it('devuelve los tres tipos en orden con total, en uso y disponibles', () => {
    const tipos = [{ tipo: 'AA', total: 12, capacidadMah: 2500 }, { tipo: 'AAA', total: 8 }];
    const asignaciones = [
      asig({ tipo: 'AA', cantidad: 4 }), asig({ tipo: 'AA', cantidad: 2 }), asig({ tipo: 'AAA', cantidad: 2 }),
    ];
    expect(resumenPorTipo(tipos, asignaciones)).toEqual([
      { tipo: 'AA', capacidadMah: 2500, total: 12, enUso: 6, disponibles: 6 },
      { tipo: 'AAA', capacidadMah: null, total: 8, enUso: 2, disponibles: 6 },
      { tipo: 'BRC26650', capacidadMah: null, total: 0, enUso: 0, disponibles: 0 },
    ]);
  });

  it('permite disponibles negativos si el total está mal', () => {
    const r = resumenPorTipo([], [asig({ tipo: 'AA', cantidad: 3 })]);
    expect(r[0]).toMatchObject({ total: 0, enUso: 3, disponibles: -3 });
  });
});

describe('sugerenciasDe', () => {
  it('deduplica ignorando mayúsculas y espacios y conserva la grafía más reciente', () => {
    const asignaciones = [asig({ aparato: 'Mando TV', fechaColocacion: '2026-05-01' })];
    const movimientos = [
      { aparato: 'mando tv ', fecha: '2026-01-01T10:00:00.000Z' },
      { aparato: 'Ratón', fecha: '2026-02-01T10:00:00.000Z' },
      { aparato: '', fecha: '2026-03-01T10:00:00.000Z' },
    ];
    expect(sugerenciasDe(asignaciones, movimientos, 'aparato')).toEqual(['Mando TV', 'Ratón']);
  });

  it('usa la grafía del movimiento si es posterior', () => {
    const asignaciones = [asig({ estancia: 'salon', fechaColocacion: '2026-01-01' })];
    const movimientos = [{ estancia: 'Salon', fecha: '2026-06-01T10:00:00.000Z' }];
    expect(sugerenciasDe(asignaciones, movimientos, 'estancia')).toEqual(['Salon']);
  });
});

describe('antiguedad', () => {
  const hoy = new Date(2026, 9, 7); // 7 oct 2026
  it('formatea días, meses y años', () => {
    expect(antiguedad('2026-10-07', hoy)).toBe('hoy');
    expect(antiguedad('2026-10-06', hoy)).toBe('hace 1 día');
    expect(antiguedad('2026-09-08', hoy)).toBe('hace 29 días');
    expect(antiguedad('2026-09-07', hoy)).toBe('hace 1 mes');
    expect(antiguedad('2025-11-07', hoy)).toBe('hace 11 meses');
    expect(antiguedad('2025-10-07', hoy)).toBe('hace 1 año');
    expect(antiguedad('2024-04-07', hoy)).toBe('hace 2 años');
  });

  it('trata fechas futuras o vacías sin romper', () => {
    expect(antiguedad('2026-12-01', hoy)).toBe('hoy');
    expect(antiguedad('', hoy)).toBe('');
  });
});

describe('agruparPorEstancia', () => {
  it('agrupa sin distinguir mayúsculas, ordena y deja "Sin estancia" al final', () => {
    const grupos = agruparPorEstancia([
      asig({ aparato: 'Ratón', estancia: 'Despacho' }),
      asig({ aparato: 'Linterna', estancia: '' }),
      asig({ aparato: 'Mando TV', estancia: 'Salón' }),
      asig({ aparato: 'Mando aire', estancia: 'salón ' }),
    ]);
    expect(grupos.map(g => g.estancia)).toEqual(['Despacho', 'Salón', 'Sin estancia']);
    expect(grupos[1].items.map(a => a.aparato)).toEqual(['Mando aire', 'Mando TV']);
  });
});

describe('filtrar', () => {
  const lista = [
    asig({ aparato: 'Mando TV', estancia: 'Salón', tipo: 'AAA' }),
    asig({ aparato: 'Linterna', estancia: 'Garaje', tipo: 'BRC26650' }),
  ];
  it('devuelve todo con texto vacío', () => {
    expect(filtrar(lista, '  ')).toHaveLength(2);
  });
  it('busca en aparato, estancia y tipo sin tildes ni mayúsculas', () => {
    expect(filtrar(lista, 'salon').map(a => a.aparato)).toEqual(['Mando TV']);
    expect(filtrar(lista, 'brc').map(a => a.aparato)).toEqual(['Linterna']);
    expect(filtrar(lista, 'LINT').map(a => a.aparato)).toEqual(['Linterna']);
  });
});

describe('detalleEdicion', () => {
  it('lista los campos cambiados', () => {
    const antes = asig({ cantidad: 4 });
    expect(detalleEdicion(antes, { ...antes, cantidad: 2, estancia: 'Cocina' }))
      .toBe('estancia Salón → Cocina; cantidad 4 → 2');
  });
  it('devuelve cadena vacía si no cambia nada', () => {
    const a = asig();
    expect(detalleEdicion(a, { ...a })).toBe('');
  });
});

describe('describirMovimiento', () => {
  it('genera un texto por acción', () => {
    expect(describirMovimiento({ accion: 'poner', aparato: 'Mando TV', estancia: 'Salón', tipo: 'AAA', cantidad: 2 }))
      .toBe('Puestas 2× AAA en Mando TV (Salón)');
    expect(describirMovimiento({ accion: 'quitar', aparato: 'Mando TV', estancia: '', tipo: 'AAA', cantidad: 2 }))
      .toBe('Quitadas 2× AAA de Mando TV');
    expect(describirMovimiento({ accion: 'editar', aparato: 'Mando TV', tipo: 'AAA', detalle: 'cantidad 4 → 2' }))
      .toBe('Editado Mando TV: cantidad 4 → 2');
    expect(describirMovimiento({ accion: 'ajusteTotal', tipo: 'AA', detalle: 'total 10 → 12' }))
      .toBe('Stock de AA: total 10 → 12');
  });
});
