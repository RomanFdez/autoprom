import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function computeStatistics(transactions, categories) {
  const expenses = transactions.filter(t => t.amount < 0);

  // --- Budget vs Actual ---
  const budgetVsActual = categories
    .filter(cat => cat.debt && cat.debt > 0)
    .map(cat => {
      const spent = expenses
        .filter(t => t.categoryId === cat.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        id: cat.id,
        name: cat.name,
        color: cat.color,
        budget: cat.debt,
        spent,
        remaining: cat.debt - spent,
        percentUsed: cat.debt > 0 ? (spent / cat.debt) * 100 : 0,
      };
    })
    .sort((a, b) => b.budget - a.budget);

  // --- Cumulative Spending ---
  const monthlyMap = {};
  expenses.forEach(t => {
    const key = format(parseISO(t.date), 'yyyy-MM');
    if (!monthlyMap[key]) monthlyMap[key] = 0;
    monthlyMap[key] += Math.abs(t.amount);
  });

  const sortedMonths = Object.keys(monthlyMap).sort();
  let cumulative = 0;
  const cumulativeSpending = sortedMonths.map(key => {
    cumulative += monthlyMap[key];
    return {
      month: format(parseISO(key + '-01'), 'MMM yy', { locale: es }),
      monthKey: key,
      monthly: monthlyMap[key],
      cumulative,
    };
  });

  // --- Total Budget ---
  const totalBudget = categories.reduce((sum, cat) => sum + (cat.debt || 0), 0);

  return { budgetVsActual, cumulativeSpending, totalBudget };
}
