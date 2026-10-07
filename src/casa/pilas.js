// src/casa/pilas.js
// Lógica pura del submódulo Pilas (sin Firestore ni React).
import { TIPOS_PILA, SIN_ESTANCIA } from './constants';

// Minúsculas, sin tildes y sin espacios en los extremos (para comparar y buscar).
export const normalizar = (s) => String(s || '')
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .trim().toLowerCase();

// Por cada tipo: { tipo, capacidadMah, total, enUso, disponibles }.
// Un tipo sin documento cuenta como total 0. Disponibles puede ser negativo.
export function resumenPorTipo(tipos, asignaciones) {
  return TIPOS_PILA.map(tipo => {
    const doc = tipos.find(t => t.tipo === tipo) || {};
    const total = Number(doc.total) || 0;
    const enUso = asignaciones
      .filter(a => a.tipo === tipo)
      .reduce((s, a) => s + (Number(a.cantidad) || 0), 0);
    return { tipo, capacidadMah: doc.capacidadMah ?? null, total, enUso, disponibles: total - enUso };
  });
}

// Valores ya usados de `campo` ('aparato' | 'estancia'), sin duplicados
// (ignorando mayúsculas y espacios). Se conserva la grafía más reciente.
export function sugerenciasDe(asignaciones, movimientos, campo) {
  const valores = [
    ...asignaciones.map(a => ({ v: a[campo], f: a.fechaColocacion || '' })),
    ...movimientos.map(m => ({ v: m[campo], f: m.fecha || '' })),
  ].sort((a, b) => b.f.localeCompare(a.f));

  const vistos = new Map();
  for (const { v } of valores) {
    const txt = String(v || '').trim();
    const key = txt.toLowerCase();
    if (txt && !vistos.has(key)) vistos.set(key, txt);
  }
  return [...vistos.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

const plural = (n, uno, varios) => `hace ${n} ${n === 1 ? uno : varios}`;

// Tiempo desde "YYYY-MM-DD": "hoy", "hace N días", "hace N meses", "hace N años".
export function antiguedad(fechaISO, hoy = new Date()) {
  if (!fechaISO) return '';
  const [y, m, d] = fechaISO.split('-').map(Number);
  const desde = Date.UTC(y, m - 1, d);
  const hasta = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const dias = Math.floor((hasta - desde) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias < 30) return plural(dias, 'día', 'días');

  const meses = Math.max(1,
    (hoy.getFullYear() - y) * 12 + (hoy.getMonth() + 1 - m) - (hoy.getDate() < d ? 1 : 0));
  if (meses < 12) return plural(meses, 'mes', 'meses');
  return plural(Math.floor(meses / 12), 'año', 'años');
}

// [{ estancia, items }] ordenado por estancia ("Sin estancia" al final);
// dentro de cada grupo, por aparato.
export function agruparPorEstancia(asignaciones) {
  const grupos = new Map();
  for (const a of asignaciones) {
    const key = normalizar(a.estancia);
    if (!grupos.has(key)) grupos.set(key, { estancia: String(a.estancia || '').trim() || SIN_ESTANCIA, items: [] });
    grupos.get(key).items.push(a);
  }
  const lista = [...grupos.entries()].map(([key, g]) => ({
    ...g,
    sin: key === '',
    items: g.items.sort((a, b) => a.aparato.localeCompare(b.aparato, 'es')),
  }));
  lista.sort((a, b) => (a.sin - b.sin) || a.estancia.localeCompare(b.estancia, 'es'));
  return lista.map(({ estancia, items }) => ({ estancia, items }));
}

// Filtra por aparato, estancia o tipo (sin tildes ni mayúsculas).
export function filtrar(asignaciones, texto) {
  const q = normalizar(texto);
  if (!q) return asignaciones;
  return asignaciones.filter(a =>
    [a.aparato, a.estancia, a.tipo].some(v => normalizar(v).includes(q)));
}

const CAMPOS_EDICION = [
  ['aparato', 'aparato'],
  ['estancia', 'estancia'],
  ['tipo', 'tipo'],
  ['cantidad', 'cantidad'],
  ['fechaColocacion', 'fecha'],
];

// Texto con los campos cambiados: "estancia Salón → Cocina; cantidad 4 → 2".
export function detalleEdicion(antes, despues) {
  const txt = (v) => (v === '' || v == null ? '—' : String(v));
  return CAMPOS_EDICION
    .filter(([k]) => txt(antes[k]) !== txt(despues[k]))
    .map(([k, label]) => `${label} ${txt(antes[k])} → ${txt(despues[k])}`)
    .join('; ');
}

// Texto legible de un movimiento del historial.
export function describirMovimiento(m) {
  const donde = m.estancia ? `${m.aparato} (${m.estancia})` : m.aparato;
  switch (m.accion) {
    case 'poner': return `Puestas ${m.cantidad}× ${m.tipo} en ${donde}`;
    case 'quitar': return `Quitadas ${m.cantidad}× ${m.tipo} de ${donde}`;
    case 'editar': return `Editado ${m.aparato}: ${m.detalle}`;
    case 'ajusteTotal': return `Stock de ${m.tipo}: ${m.detalle}`;
    default: return '';
  }
}
