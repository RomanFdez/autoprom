// src/seguros/calc.js
// Funciones puras de la sección Seguros (sin red ni Firestore).
import { mesesDePeriodo } from './constants';

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

// Importe mensual = importe / meses del periodo.
export function importeMensual(importe, periodicidad) {
  const n = parseFloat(importe);
  if (!Number.isFinite(n)) return 0;
  return round2(n / mesesDePeriodo(periodicidad));
}

// Estadísticas sobre los seguros ACTIVOS.
export function getEstadisticas(seguros, today = new Date()) {
  const activos = seguros.filter(s => s.estado !== 'cancelada');

  const costeMensual = round2(
    activos.reduce((acc, s) => acc + (Number(s.importeMensual) || 0), 0)
  );
  const costeAnual = round2(costeMensual * 12);

  const porTipoMap = {};
  for (const s of activos) {
    const t = s.tipo || 'otro';
    porTipoMap[t] = porTipoMap[t] || { tipo: t, count: 0, costeMensual: 0 };
    porTipoMap[t].count += 1;
    porTipoMap[t].costeMensual += Number(s.importeMensual) || 0;
  }
  const porTipo = Object.values(porTipoMap)
    .map(r => ({ ...r, costeMensual: round2(r.costeMensual) }))
    .sort((a, b) => b.costeMensual - a.costeMensual);

  const todayStr = today.toISOString().slice(0, 10);
  const proximasRenovaciones = activos
    .filter(s => s.fechaVencimiento && s.fechaVencimiento >= todayStr)
    .sort((a, b) => (a.fechaVencimiento < b.fechaVencimiento ? -1 : 1));

  return {
    costeMensual,
    costeAnual,
    total: activos.length,
    porTipo,
    proximasRenovaciones,
  };
}
