// mobile/src/seguros/constants.js
// Catálogos de la sección Seguros. Reutiliza BRAND de finanzas para coherencia.
import { BRAND } from '../finanzas/constants';

export { BRAND };

// Tipos de seguro (value persistido / label visible).
export const TIPOS = [
  { value: 'salud', label: 'Salud' },
  { value: 'vida', label: 'Vida' },
  { value: 'coche', label: 'Coche' },
  { value: 'construccion', label: 'Construcción' },
  { value: 'hogar', label: 'Hogar' },
  { value: 'responsabilidad_civil', label: 'Responsabilidad Civil' },
  { value: 'otro', label: 'Otro' },
];

// Periodicidad de cobro y nº de meses que cubre cada periodo.
export const PERIODICIDADES = [
  { value: 'mensual', label: 'Mensual', meses: 1 },
  { value: 'bimensual', label: 'Bimensual (cada 2 meses)', meses: 2 },
  { value: 'trimestral', label: 'Trimestral', meses: 3 },
  { value: 'anual', label: 'Anual', meses: 12 },
  { value: 'bianual', label: 'Bianual (cada 2 años)', meses: 24 },
];

export const ESTADOS = [
  { value: 'activa', label: 'Activa' },
  { value: 'cancelada', label: 'Cancelada' },
];

// "background:foreground" por tipo.
const TIPO_COLORS = {
  salud: '#DBEAFE:#1D4ED8',
  vida: '#FCE7F3:#9D174D',
  coche: '#FFEDD5:#9A3412',
  construccion: '#FEF9C3:#854D0E',
  hogar: '#D1FAE5:#065F46',
  responsabilidad_civil: '#E0E7FF:#3730A3',
  otro: '#F3F4F6:#374151',
};
const TIPO_COLOR_FALLBACK = '#F3F4F6:#374151';

export function tipoColor(tipo) {
  const [bg, fg] = (TIPO_COLORS[tipo] || TIPO_COLOR_FALLBACK).split(':');
  return { bg, fg };
}

export function tipoLabel(tipo) {
  return (TIPOS.find(t => t.value === tipo) || { label: tipo || '—' }).label;
}

export function periodicidadLabel(periodicidad) {
  return (PERIODICIDADES.find(p => p.value === periodicidad) || { label: periodicidad || '—' }).label;
}

export function mesesDePeriodo(periodicidad) {
  return (PERIODICIDADES.find(p => p.value === periodicidad) || { meses: 1 }).meses;
}
