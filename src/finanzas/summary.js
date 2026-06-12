// Puerto JS de la lógica de main.py (get_summary / get_breakdown).
// Funciones puras: reciben el array de apuntes, no tocan red ni Firestore.

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

function monthOf(fecha) {
  // fecha = "YYYY-MM-DD"
  return parseInt(fecha.slice(5, 7), 10);
}

function currentMonth(year, today) {
  if (today.getFullYear() === year) return today.getMonth() + 1;
  if (today.getFullYear() > year) return 12;
  return 0;
}

// Construye filas pivote a partir de un map key->{month->sum}.
function buildRows(pivot, keyName, actualMonths) {
  const n = actualMonths.length;
  const remaining = 12 - n;
  const actualSet = new Set(actualMonths);
  return Object.keys(pivot).sort().map((key) => {
    const meses = {};
    let total = 0;
    for (let m = 1; m <= 12; m++) {
      if (actualSet.has(m)) {
        const v = pivot[key][m] || 0;
        meses[String(m)] = round2(v);
        total += v;
      } else {
        meses[String(m)] = null;
      }
    }
    const media = n > 0 ? total / n : 0;
    return {
      [keyName]: key,
      meses,
      total_actual: round2(total),
      media_mensual: round2(media),
      prevision: round2(total + media * remaining),
    };
  });
}

export function getSummary(transactions, year, today = new Date()) {
  const rowsForYear = transactions.filter(t => t.fecha.slice(0, 4) === String(year));

  const pivot = {};
  const monthsSeen = new Set();
  for (const r of rowsForYear) {
    const m = monthOf(r.fecha);
    pivot[r.categoria] = pivot[r.categoria] || {};
    pivot[r.categoria][m] = (pivot[r.categoria][m] || 0) + r.importe;
    monthsSeen.add(m);
  }

  const curMonth = currentMonth(year, today);
  const actualMonths = [...monthsSeen].filter(m => m <= curMonth).sort((a, b) => a - b);
  const n = actualMonths.length;
  const remaining = 12 - n;
  const actualSet = new Set(actualMonths);

  const rows = buildRows(pivot, 'categoria', actualMonths);

  // Fila TOTAL: suma de todas las categorías por mes.
  const allCats = Object.keys(pivot);
  const totalMeses = {};
  let grandTotal = 0;
  for (let m = 1; m <= 12; m++) {
    if (actualSet.has(m)) {
      const v = allCats.reduce((acc, c) => acc + (pivot[c][m] || 0), 0);
      totalMeses[String(m)] = round2(v);
      grandTotal += v;
    } else {
      totalMeses[String(m)] = null;
    }
  }
  const grandMedia = n > 0 ? grandTotal / n : 0;

  const catsWithSubcats = [...new Set(
    rowsForYear.filter(r => r.subcategoria != null).map(r => r.categoria)
  )];

  return {
    rows,
    total_row: {
      categoria: 'TOTAL',
      meses: totalMeses,
      total_actual: round2(grandTotal),
      media_mensual: round2(grandMedia),
      prevision: round2(grandTotal + grandMedia * remaining),
    },
    actual_months: actualMonths,
    cats_with_subcats: catsWithSubcats,
  };
}

export function getBreakdown(transactions, year, categoria, today = new Date()) {
  const rowsForYear = transactions.filter(
    t => t.fecha.slice(0, 4) === String(year) && t.categoria === categoria
  );

  const pivot = {};
  const monthsSeen = new Set();
  for (const r of rowsForYear) {
    const m = monthOf(r.fecha);
    const sub = r.subcategoria || '(sin subcategoría)';
    pivot[sub] = pivot[sub] || {};
    pivot[sub][m] = (pivot[sub][m] || 0) + r.importe;
    monthsSeen.add(m);
  }

  const curMonth = currentMonth(year, today);
  const actualMonths = [...monthsSeen].filter(m => m <= curMonth).sort((a, b) => a - b);

  return {
    rows: buildRows(pivot, 'subcategoria', actualMonths),
    actual_months: actualMonths,
  };
}
