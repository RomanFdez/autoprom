import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getIcon } from '../utils/icons';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';

export default function Reports() {
    const { transactions, categories, tags } = useData();
    const [type, setType] = useState('expense'); // 'income' or 'expense'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [drilldown, setDrilldown] = useState(null); // { type: 'category' | 'tag', id: string, name: string }

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t =>
            type === 'expense' ? t.amount < 0 : t.amount >= 0
        );
    }, [transactions, type]);

    const totalAmount = useMemo(() => {
        return filteredTransactions.reduce((acc, t) => acc + Math.abs(t.amount), 0);
    }, [filteredTransactions]);

    const categoryData = useMemo(() => {
        const map = {};
        filteredTransactions.forEach(t => {
            const catId = t.categoryId || 'other';
            if (!map[catId]) map[catId] = 0;
            map[catId] += Math.abs(t.amount);
        });

        const data = Object.keys(map).map(catId => {
            if (catId === 'other') {
                return { name: 'Otros', value: map[catId], color: '#9e9e9e', id: 'other' };
            }
            const cat = categories.find(c => c.id === catId);
            return cat
                ? { name: cat.name, value: map[catId], color: cat.color, id: cat.id }
                : { name: 'Desconocido', value: map[catId], color: '#ccc', id: 'unknown' };
        }).sort((a, b) => b.value - a.value);

        return data;
    }, [filteredTransactions, categories]);

    const tagData = useMemo(() => {
        const map = {};
        let untaggedValue = 0;

        filteredTransactions.forEach(t => {
            if (!t.tagIds || t.tagIds.length === 0) {
                untaggedValue += Math.abs(t.amount);
            } else {
                t.tagIds.forEach(tagId => {
                    if (!map[tagId]) map[tagId] = 0;
                    map[tagId] += Math.abs(t.amount);
                });
            }
        });

        const data = Object.keys(map).map(tagId => {
            const tag = tags.find(t => t.id === tagId);
            return tag
                ? { name: tag.name, value: map[tagId], color: tag.color, id: tag.id }
                : { name: 'Desconocido', value: map[tagId], color: '#ccc', id: 'unknown' };
        }).sort((a, b) => b.value - a.value);

        if (untaggedValue > 0) {
            data.push({ name: 'Sin etiqueta', value: untaggedValue, color: '#9e9e9e', id: 'untagged' });
        }

        return data;
    }, [filteredTransactions, tags]);

    // Chart interaction
    const onPieClick = (data, chartType) => {
        if (!data) return;
        setDrilldown({ type: chartType, id: data.id, name: data.name });
    };

    // Total Display Logic
    const displayTotal = useMemo(() => {
        if (selectedCategory) {
            const item = categoryData.find(d => d.name === selectedCategory);
            return item ? item.value : totalAmount;
        }
        return totalAmount;
    }, [categoryData, selectedCategory, totalAmount]);

    const drilldownTransactions = useMemo(() => {
        if (!drilldown) return [];
        return filteredTransactions.filter(t => {
            if (drilldown.type === 'category') {
                if (drilldown.id === 'other') return !t.categoryId;
                return t.categoryId === drilldown.id;
            } else if (drilldown.type === 'tag') {
                if (drilldown.id === 'untagged') return !t.tagIds || t.tagIds.length === 0;
                return (t.tagIds || []).includes(drilldown.id);
            }
            return false;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [filteredTransactions, drilldown]);

    return (
        <div className="reports-page">
            <div className="toggle-container">
                <button
                    className={`toggle-btn ${type === 'expense' ? 'active expense' : ''}`}
                    onClick={() => setType('expense')}
                >
                    Gastos
                </button>
                <button
                    className={`toggle-btn ${type === 'income' ? 'active income' : ''}`}
                    onClick={() => setType('income')}
                >
                    Ingresos
                </button>
            </div>

            <div className="report-content">
                {totalAmount === 0 ? (
                    <div className="empty-state">No hay datos para mostrar</div>
                ) : (
                    <>
                        {/* Category Chart */}
                        <div className="chart-section">
                            <h3>Por Categoría</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            onClick={(data) => {
                                                setSelectedCategory(data.name === selectedCategory ? null : data.name);
                                                onPieClick(data, 'category');
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.color}
                                                    stroke={selectedCategory === entry.name ? '#000' : 'none'}
                                                    strokeWidth={2}
                                                    style={{ opacity: selectedCategory && selectedCategory !== entry.name ? 0.3 : 1 }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text (Total) */}
                                <div className="chart-center-text">
                                    <span className="total-label">{selectedCategory || 'Total'}</span>
                                    <span className={`total-value ${type === 'expense' ? 'expense-text' : 'income-text'}`}>
                                        {displayTotal.toFixed(0)}€
                                    </span>
                                </div>
                            </div>

                            {/* Category List */}
                            <div className="list-group">
                                {categoryData.map(item => (
                                    <div
                                        key={item.id}
                                        className="list-row clickable"
                                        onClick={() => setDrilldown({ type: 'category', id: item.id, name: item.name })}
                                    >
                                        <div className="row-left">
                                            <div className="dot" style={{ backgroundColor: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <strong>{item.value.toFixed(2)} €</strong>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tags Chart */}
                        <div className="chart-section" style={{ marginTop: '2rem' }}>
                            <h3>Por Etiquetas</h3>
                            <div className="chart-wrapper">
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={tagData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={2}
                                            dataKey="value"
                                            onClick={(data) => onPieClick(data, 'tag')}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {tagData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => `${value.toFixed(2)} €`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Tag List */}
                            <div className="list-group">
                                {tagData.map(item => (
                                    <div
                                        key={item.id}
                                        className="list-row clickable"
                                        onClick={() => setDrilldown({ type: 'tag', id: item.id, name: item.name })}
                                    >
                                        <div className="row-left">
                                            <div className="dot" style={{ backgroundColor: item.color }} />
                                            <span>{item.name}</span>
                                        </div>
                                        <strong>{item.value.toFixed(2)} €</strong>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Drilldown Modal */}
            {drilldown && (
                <div className="modal-overlay" onClick={() => setDrilldown(null)}>
                    <div className="modal drilldown-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{drilldown.name}</h3>
                            <button className="close-btn" onClick={() => setDrilldown(null)}><X size={24} /></button>
                        </div>
                        <div className="drilldown-list">
                            {drilldownTransactions.length === 0 ? (
                                <p className="empty-msg">No hay transacciones</p>
                            ) : (
                                drilldownTransactions.map(t => {
                                    const cat = categories.find(c => c.id === t.categoryId) || { name: 'Sin categoría', color: '#999', icon: 'category' };
                                    const Icon = getIcon(cat.icon);
                                    return (
                                        <div key={t.id} className="drilldown-item">
                                            <div className="d-icon" style={{ backgroundColor: cat.color }}>
                                                <Icon size={16} color="white" />
                                            </div>
                                            <div className="d-info">
                                                <div className="d-desc">{t.description || cat.name}</div>
                                                <div className="d-date">{format(parseISO(t.date), 'dd MMM yyyy', { locale: es })}</div>
                                            </div>
                                            <div className="d-amount">
                                                {t.amount.toFixed(2)} €
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
        .toggle-container {
          display: flex;
          background: #e0e0e0;
          padding: 4px;
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }
        .toggle-btn {
          flex: 1;
          border: none;
          background: none;
          padding: 8px;
          border-radius: 16px;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }
        .toggle-btn.active {
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .toggle-btn.active.expense { color: var(--color-expense); }
        .toggle-btn.active.income { color: var(--color-income); }

        .chart-wrapper {
          position: relative;
          margin-bottom: 1rem;
        }
        .chart-center-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        }
        .total-label {
          font-size: 0.8rem;
          color: #999;
          text-transform: uppercase;
        }
        .total-value {
          font-size: 1.2rem;
          font-weight: bold;
        }
        .expense-text { color: var(--color-expense); }
        .income-text { color: var(--color-income); }

        .list-group {
          background: white;
          border-radius: 12px;
          padding: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .list-row {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
          transition: background-color 0.2s;
        }
        .list-row.clickable {
            cursor: pointer;
        }
        .list-row.clickable:active {
            background-color: #f5f5f5;
        }
        .list-row:last-child {
          border-bottom: none;
        }
        .row-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #999;
        }

        /* Modal Styles */
        .modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.6);
            z-index: 2000;
            display: flex;
            align-items: flex-end; /* Bottom sheet on mobile? Or center? -> Center is safer generic */
            justify-content: center;
            padding: 1rem;
        }
        @media (min-width: 600px) {
            .modal-overlay {
                align-items: center;
            }
        }
        .modal.drilldown-modal {
            background: white;
            width: 100%;
            max-width: 500px;
            max-height: 80vh;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .modal-header {
            padding: 16px;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .modal-header h3 {
            margin: 0;
            font-size: 1.1rem;
        }
        .close-btn {
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 4px;
        }
        .drilldown-list {
            overflow-y: auto;
            padding: 16px;
        }
        .drilldown-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 0;
            border-bottom: 1px solid #f9f9f9;
        }
        .d-icon {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        .d-info {
            flex: 1;
        }
        .d-desc {
            font-weight: 500;
            font-size: 0.9rem;
            color: #333;
        }
        .d-date {
            font-size: 0.75rem;
            color: #888;
        }
        .d-amount {
            font-weight: 600;
            font-size: 0.95rem;
        }
        .empty-msg {
            text-align: center;
            color: #999;
            font-style: italic;
        }
      `}</style>
        </div>
    );
}
