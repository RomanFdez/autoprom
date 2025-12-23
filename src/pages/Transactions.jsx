import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import TransactionForm from '../components/TransactionForm';
import { getIcon } from '../utils/icons';
import { Plus, Download, Upload, Filter, Pin, Trash2, Edit2, Copy } from 'lucide-react';
import { format, isSameDay, isSameWeek, isSameMonth, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const FILTERS = {
  TODAY: 'Hoy',
  YESTERDAY: 'Ayer',
  WEEK: 'Esta semana',
  MONTH: 'Este mes',
  ALL: 'Todo el tiempo'
};

export default function Transactions() {
  const { transactions, categories, tags, settings, removeTransaction, addTransaction, importData } = useData();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      const tDate = parseISO(t.date);
      switch (filter) {
        case FILTERS.TODAY: return isSameDay(tDate, now);
        case FILTERS.YESTERDAY: return isSameDay(tDate, subDays(now, 1));
        case FILTERS.WEEK: return isSameWeek(tDate, now, { weekStartsOn: 1 });
        case FILTERS.MONTH: return isSameMonth(tDate, now);
        case FILTERS.ALL: return true;
        default: return true;
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort desc by date
  }, [transactions, filter]);

  const pinnedTransactions = filteredTransactions.filter(t => t.isPinned);
  const unpinnedTransactions = filteredTransactions.filter(t => !t.isPinned);

  const currentBalance = useMemo(() => {
    const initial = parseFloat(settings.initialBalance) || 0;
    const total = transactions.reduce((acc, t) => acc + t.amount, 0);
    return initial + total;
  }, [transactions, settings]);

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setIsFormOpen(true);
  };

  const handleExport = () => {
    // CSV Export
    const headers = ['id', 'date', 'amount', 'categoryCode', 'tagCodes', 'description', 'isPinned'];
    const rows = transactions.map(t => {
      const cat = categories.find(c => c.id === t.categoryId);
      const tTags = tags.filter(tag => (t.tagIds || []).includes(tag.id));
      return [
        t.id,
        t.date,
        t.amount,
        cat ? cat.code : '',
        tTags.map(tag => tag.code).join('|'),
        t.description || '',
        t.isPinned ? '1' : '0'
      ].map(field => {
        const str = String(field || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    // Add BOM and sep=, for Excel compatibility
    const csvContent = ['sep=,', headers.join(','), ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transacciones_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        let lines = text.split('\n').map(l => l.trim()).filter(l => l);

        // Skip optional 'sep=' line
        if (lines[0] && lines[0].startsWith('sep=')) {
          lines = lines.slice(1);
        }

        if (lines.length < 1) return;

        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        const newTransactions = lines.slice(1).map(line => {
          // Basic split (handling quotes crudely but effective for our simple generation)
          const values = line.split(',').map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));

          // Map back to IDs
          const catCode = values[3];
          const tagCodes = values[4] ? values[4].split('|') : [];

          const cat = categories.find(c => c.code === catCode);
          const tTagIds = tags.filter(tag => tagCodes.includes(tag.code)).map(t => t.id);

          return {
            id: values[0] || undefined,
            date: values[1],
            amount: parseFloat(values[2]),
            categoryId: cat?.id || '',
            tagIds: tTagIds,
            description: values[5],
            isPinned: values[6] === '1'
          };
        });

        let count = 0;
        newTransactions.forEach(t => {
          if (t.amount && !isNaN(t.amount)) {
            addTransaction(t);
            count++;
          }
        });
        alert(`Importación completada: ${count} transacciones.`);
        e.target.value = '';
      } catch (err) {
        console.error(err);
        alert('Error al importar. Asegúrate de que el formato es correcto.');
      }
    };
    reader.readAsText(file);
  };

  const handleDuplicate = (t) => {
    const { id, ...rest } = t;
    addTransaction({ ...rest, date: format(new Date(), 'yyyy-MM-dd') });
  };

  const TransactionItem = ({ t }) => {
    const cat = categories.find(c => c.id === t.categoryId) || { name: 'Sin categoría', color: '#999', icon: 'category' };
    const Icon = getIcon(cat.icon);

    return (
      <div className="transaction-item">
        <div className="t-icon" style={{ backgroundColor: cat.color }}>
          <Icon size={20} color="white" />
        </div>
        <div className="t-details">
          <div className="t-row-1">
            <span className="t-concept">{t.description || cat.name}</span>
            <span className={`t-amount ${t.amount >= 0 ? 'income' : 'expense'}`}>
              {t.amount.toFixed(2)} €
            </span>
          </div>
          <div className="t-row-2">
            <span className="t-cat-name" style={{ color: cat.color }}>{cat.name}</span>
            <span className="separator">•</span>
            <span className="t-date">{format(parseISO(t.date), 'dd MMM', { locale: es })}</span>
            <div className="t-tags">
              {(t.tagIds || []).map(tid => {
                const tag = tags.find(tag => tag.id === tid);
                if (!tag) return null;
                return (
                  <span key={tag.id} className="mini-tag" style={{ border: `1px solid ${tag.color}`, color: tag.color }}>
                    {tag.name}
                  </span>
                );
              })}
            </div>
            {t.isPinned && <Pin size={12} className="pin-indicator" />}
          </div>
        </div>
        <div className="t-actions">
          <button onClick={() => handleDuplicate(t)} title="Duplicar"><Copy size={16} /></button>
          <button onClick={() => handleEdit(t)}><Edit2 size={16} /></button>
          <button onClick={() => { if (confirm('¿Eliminar?')) removeTransaction(t.id) }} className="danger"><Trash2 size={16} /></button>
        </div>
      </div>
    );
  };
  return (
    <div className="page-container">
      {/* Filters and Actions Header */}
      <div className="filters-header">
        <div className="filters-scroll">
          {Object.values(FILTERS).map(f => (
            <button
              key={f}
              className={`filter-chip ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="header-actions">
          <button className="icon-action-btn" onClick={handleExport} title="Exportar CSV">
            <Download size={20} />
          </button>
          <label className="icon-action-btn" title="Importar CSV">
            <Upload size={20} />
            <input type="file" hidden accept=".csv" onChange={handleImport} />
          </label>
        </div>
      </div>

      {/* Balance Display */}
      <div className="balance-display">
        <span className="balance-label">Saldo Actual</span>
        <span className={`balance-amount ${currentBalance >= 0 ? 'income' : 'expense'}`}>
          {currentBalance.toFixed(2)} €
        </span>
      </div>

      <div className="transactions-list">
        {/* Pinned Section */}
        {pinnedTransactions.length > 0 && (
          <div className="section-group">
            <div className="section-title"><Pin size={12} /> Fijados</div>
            {pinnedTransactions.map(t => <TransactionItem key={t.id} t={t} />)}
          </div>
        )}

        {/* Regular List */}
        <div className="section-group">
          {unpinnedTransactions.map(t => <TransactionItem key={t.id} t={t} />)}
          {unpinnedTransactions.length === 0 && pinnedTransactions.length === 0 && (
            <div className="empty-state">No hay transacciones</div>
          )}
        </div>
      </div>

      {/* Main Add Button */}
      <button className="fab" onClick={() => { setEditingTransaction(null); setIsFormOpen(true); }}>
        <Plus size={24} />
      </button>

      {isFormOpen && (
        <TransactionForm
          onClose={() => setIsFormOpen(false)}
          initialData={editingTransaction}
        />
      )}

      <style>{`
        .page-container {
          padding-bottom: 100px;
        }
        
        /* New Header Layout */
        .filters-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0 16px;
        }
        
        .filters-scroll {
          flex: 1;
          display: flex;
          overflow-x: auto;
          gap: 8px;
          scrollbar-width: none;
        }
        .filters-scroll::-webkit-scrollbar {
          display: none;
        }
        
        .filter-chip {
          white-space: nowrap;
          padding: 6px 14px;
          border-radius: 20px;
          border: 1px solid #ddd;
          background: white;
          font-size: 0.85rem;
          color: #666;
        }
        .filter-chip.active {
          background: var(--md-sys-color-primary);
          color: white;
          border-color: var(--md-sys-color-primary);
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          padding-left: 8px;
          border-left: 1px solid #eee;
        }
        
        .icon-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #555;
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .icon-action-btn:active {
          background: #f0f0f0;
        }

        /* Balance Display */
        .balance-display {
            background: white;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .balance-label {
            font-weight: 500;
            color: #555;
            font-size: 0.95rem;
        }
        .balance-amount {
            font-size: 1.25rem;
            font-weight: 700;
        }
        .balance-amount.income { color: #2e7d32; } /* Green for positive balance */
        .balance-amount.expense { color: #d32f2f; } /* Red for negative balance */

        .section-group {
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 0.75rem;
          color: #999;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .transaction-item {
          background: white;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 8px;
          display: flex;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
        }
        .t-icon {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .t-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }
        .t-row-1 {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .t-concept {
          font-weight: 500;
          font-size: 0.95rem;
          color: #333;
        }
        .t-cat-name {
          font-size: 0.8rem;
          font-weight: 500;
        }
        .separator {
            color: #ccc;
        }
        .t-amount {
          font-weight: 600;
          font-size: 1rem;
        }
        .t-amount.income { color: var(--color-income); } /* Yellow */
        .t-amount.expense { color: var(--color-expense); } /* Red */
        
        .t-row-2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: #888;
        }
        .mini-tag {
          font-size: 0.7rem;
          padding: 1px 6px;
          border-radius: 8px;
          font-size: 0.7rem;
        }
        .pin-indicator {
          transform: rotate(45deg);
        }

        .t-actions {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          opacity: 0.3;
          transition: opacity 0.2s;
        }
        .transaction-item:hover .t-actions {
          opacity: 1;
        }
        .t-actions button {
          border: none;
          background: none;
          padding: 4px;
          cursor: pointer;
          color: #666;
        }
        .t-actions button.danger { color: #d32f2f; }

        .fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: var(--md-sys-color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--elevation-3);
          border: none;
          z-index: 1000;
        }
        
        .empty-state {
          text-align: center;
          padding: 2rem;
          color: #999;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
