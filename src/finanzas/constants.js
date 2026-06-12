// Catálogos fijos de finanzas personales (portados de main.py).
// NO mezclar con las categorías de empresa (DataContext / categories).

export const CATEGORIES = [
  "Casa JF", "Casa Madrid", "Casa SE", "Comida/Super", "Comisiones",
  "Compras varias", "Devolución", "Facturas", "Gasolina y Transporte",
  "Impuestos", "Ingreso Deuda", "Niños", "Nomina", "Ocio", "Seguros",
  "Subscripciones",
];

// Solo aplican a la categoría "Compras varias".
export const SUBCATEGORIES = [
  "Amazon", "Cafetería / Bar", "Compras Niños", "Delivery", "El Corte Inglés",
  "Farmacia", "Hogar", "Kiosco / Pequeñas compras", "Libros y Cultura",
  "Liquidación tarjeta Cajamar", "Mercado / Alimentación", "Ocio / Juegos",
  "Otros (revisar)", "Perfumería / Belleza", "Ropa y Calzado",
  "Tecnología / Dominios", "Wallapop (segunda mano)",
];

export const CATEGORY_WITH_SUBCATS = "Compras varias";

export const CUENTAS = ["ING", "IberiaCard", "Sabadell", "Cajamar"];

export const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

// "background:foreground" (tomado del index.html de referencia).
const CAT_COLORS = {
  "Casa JF": "#DBEAFE:#1D4ED8",
  "Casa Madrid": "#DBEAFE:#1D4ED8",
  "Casa SE": "#DBEAFE:#1D4ED8",
  "Comida/Super": "#FEF3C7:#92400E",
  "Comisiones": "#F3F4F6:#374151",
  "Compras varias": "#EDE9FE:#5B21B6",
  "Devolución": "#CCFBF1:#0F766E",
  "Facturas": "#FEF9C3:#854D0E",
  "Gasolina y Transporte": "#FFEDD5:#9A3412",
  "Impuestos": "#FEE2E2:#991B1B",
  "Ingreso Deuda": "#D1FAE5:#065F46",
  "Niños": "#FCE7F3:#9D174D",
  "Nomina": "#DCFCE7:#166534",
  "Ocio": "#F3E8FF:#6B21A8",
  "Seguros": "#E2E8F0:#334155",
  "Subscripciones": "#CFFAFE:#155E75",
};

const CAT_COLOR_FALLBACK = "#F3F4F6:#374151";

// Devuelve { bg, fg } para una categoría.
export function catColor(cat) {
  const [bg, fg] = (CAT_COLORS[cat] || CAT_COLOR_FALLBACK).split(":");
  return { bg, fg };
}

// Colores de marca.
export const BRAND = {
  blue: "#0055B3",
  incomeText: "#166534",
  incomeBg: "#F0FDF4",
  incomeBorder: "#86EFAC",
  expenseText: "#991B1B",
  expenseBg: "#FFF5F5",
  expenseBorder: "#FCA5A5",
  balanceText: "#1E40AF",
  balanceBg: "#EFF6FF",
  balanceBorder: "#93C5FD",
};
