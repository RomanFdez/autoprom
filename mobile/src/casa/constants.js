// mobile/src/casa/constants.js
export const TIPOS_PILA = ['AA', 'AAA', 'BRC26650'];

export const COL_TIPOS = 'pilasTipos';
export const COL_ASIGNACIONES = 'pilasAsignaciones';
export const COL_MOVIMIENTOS = 'pilasMovimientos';

// Fecha local de hoy en formato "YYYY-MM-DD".
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
