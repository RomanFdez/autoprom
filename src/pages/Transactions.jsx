import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import TransactionForm from '../components/TransactionForm';
import { getIcon } from '../utils/icons';
import { Plus, Pin, Trash2, Edit2, Copy, Search, X } from 'lucide-react';
import { format, isSameDay, isSameWeek, isSameMonth, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

const FILTERS = {
  TODAY: 'Hoy',
  MONTH: 'Este mes',
  ALL: 'Todo el tiempo'
};

export default function Transactions() {
  const { transactions, categories, tags, settings, removeTransaction, addTransaction } = useData();
  const [filter, setFilter] = useState(FILTERS.ALL);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter(t => {
      // Date Filter
      const tDate = parseISO(t.date);
      let dateMatch = false;
      switch (filter) {
        case FILTERS.TODAY: dateMatch = isSameDay(tDate, now); break;
        case FILTERS.MONTH: dateMatch = isSameMonth(tDate, now); break;
        case FILTERS.ALL: dateMatch = true; break;
        default: dateMatch = true;
      }
      if (!dateMatch) return false;

      // Search Filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const cat = categories.find(c => c.id === t.categoryId);
        return (
          (t.description && t.description.toLowerCase().includes(q)) ||
          (cat && cat.name.toLowerCase().includes(q)) ||
          t.amount.toString().includes(q)
        );
      }
      return true;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [transactions, filter, searchQuery, categories]);

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
          <button className="icon-action-btn" onClick={() => setIsSearchOpen(true)} title="Buscar">
            <Search size={20} />
          </button>
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

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="search-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="close-search" onClick={() => setIsSearchOpen(false)}>
                <X size={20} />
              </button>
            </div>
            {/* We already see filtered results in the main list, but user likely wants a focused search UI or just to type query
                Since we updated 'filteredTransactions' to respect 'searchQuery', the main list BEHIND the modal will update.
                However, usually search overlay shows results inside it.
                Let's simplify: The overlay is just for typing the query. The user sees results in the main list?
                Actually, the previous implementation showed results INSIDE the modal.
                Let's stick to showing results INSIDE the modal for better UX if the list is long.
                But wait, 'filteredTransactions' is already filtered by searchQuery.
                So if we use 'filteredTransactions' here, it works.
            */}
            <div className="search-list">
              {filteredTransactions.length === 0 && (
                <div className="empty-state">No se encontraron resultados</div>
              )}
              {filteredTransactions.slice(0, 50).map(t => <TransactionItem key={t.id} t={t} />)}
            </div>
          </div>
        </div>
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
          border: 1px solid var(--md-sys-color-outline);
          background: var(--md-sys-color-surface);
          font-size: 0.85rem;
          color: var(--md-sys-color-on-surface);
          opacity: 0.7;
          transition: all 0.2s;
        }
        .filter-chip.active {
          background: var(--md-sys-color-primary);
          color: var(--md-sys-color-on-primary);
          border-color: var(--md-sys-color-primary);
          opacity: 1;
        }
        
        .header-actions {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
          padding-left: 8px;
          border-left: 1px solid var(--md-sys-color-outline);
        }
        
        .icon-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: var(--md-sys-color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--md-sys-color-on-surface);
          cursor: pointer;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .icon-action-btn:active {
          background: var(--md-sys-color-background);
        }

        /* Balance Display */
        .balance-display {
            background: var(--md-sys-color-surface);
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
            color: var(--md-sys-color-on-surface);
            opacity: 0.8;
            font-size: 0.95rem;
        }
        .balance-amount {
            font-size: 1.25rem;
            font-weight: 700;
        }
        .balance-amount.income { color: var(--color-income); }
        .balance-amount.expense { color: var(--color-expense); }

        .section-group {
          margin-bottom: 1rem;
        }
        .section-title {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface);
          opacity: 0.6;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .transaction-item {
          background: var(--md-sys-color-surface);
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 8px;
          display: flex;
          gap: 12px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          position: relative;
          overflow: hidden;
          transition: background-color 0.3s ease;
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
          color: var(--md-sys-color-on-surface);
        }
        .t-cat-name {
          font-size: 0.8rem;
          font-weight: 500;
        }
        .separator {
            color: var(--md-sys-color-outline);
        }
        .t-amount {
          font-weight: 600;
          font-size: 1rem;
        }
        .t-amount.income { color: var(--color-income); } 
        .t-amount.expense { color: var(--color-expense); } 
        
        .t-row-2 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--md-sys-color-on-surface);
          opacity: 0.7;
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
          color: var(--md-sys-color-on-surface);
          opacity: 0.6;
        }
        .t-actions button.danger { color: #ef5350; }

        .fab {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 28px;
          background-color: var(--md-sys-color-primary);
          color: var(--md-sys-color-on-primary);
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
          color: var(--md-sys-color-on-surface);
          opacity: 0.5;
          font-style: italic;
        }

        /* Search Modal Styles */
        .search-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 2000;
            backdrop-filter: blur(2px);
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding-top: 80px;
        }
        .search-modal {
            background: var(--md-sys-color-surface);
            width: 90%;
            max-width: 500px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-height: 80vh;
        }
        .search-header {
            display: flex;
            align-items: center;
            padding: 12px;
            border-bottom: 1px solid var(--md-sys-color-outline);
            gap: 8px;
        }
        .search-input {
            flex: 1;
            border: none;
            font-size: 1rem;
            background: transparent;
            color: var(--md-sys-color-on-surface);
            outline: none;
        }
        .close-search, .search-icon {
            background: none;
            border: none;
            color: var(--md-sys-color-secondary);
            cursor: pointer;
        }
        .search-list {
            overflow-y: auto;
            padding: 8px;
        `}</style>
    </div>
  );
}
