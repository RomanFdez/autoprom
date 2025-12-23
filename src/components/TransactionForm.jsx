import { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { getIcon } from '../utils/icons';
import { X, Check, Calendar, Pin } from 'lucide-react';
import { format } from 'date-fns';

export default function TransactionForm({ onClose, initialData = null }) {
    const { categories, tags, addTransaction, updateTransaction, transactions } = useData();

    const [type, setType] = useState('expense'); // 'expense' or 'income'
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [categoryId, setCategoryId] = useState('');
    const [selectedTagIds, setSelectedTagIds] = useState([]);
    const [isPinned, setIsPinned] = useState(false);
    const [description, setDescription] = useState(''); // Optional, not explicitly requested but useful.

    useEffect(() => {
        if (initialData) {
            setType(initialData.amount >= 0 ? 'income' : 'expense');
            setAmount(Math.abs(initialData.amount).toString());
            setDate(initialData.date);
            setCategoryId(initialData.categoryId);
            setSelectedTagIds(initialData.tagIds || []);
            setIsPinned(initialData.isPinned || false);
            setDescription(initialData.description || '');
        } else {
            // Default: if income selected (unlikely on fresh load unless defaulted), set INGR.
            // On fresh load, Expense is default.
            if (categories.length > 0) setCategoryId(categories[0].id);
        }
    }, [initialData, categories]);

    useEffect(() => {
        // When type changes, ensure selected category is valid for that type.
        // If not valid, select the first valid one.
        const currentCat = categories.find(c => c.id === categoryId);
        let isValid = false;
        if (currentCat) {
            if (type === 'income') {
                isValid = currentCat.showInIncome !== false;
            } else {
                isValid = currentCat.showInExpense !== false;
            }
        }

        if (!isValid) {
            const firstValid = categories.find(c => {
                if (type === 'income') return c.showInIncome !== false;
                return c.showInExpense !== false;
            });
            if (firstValid) setCategoryId(firstValid.id);
        }
    }, [type, categories]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!categoryId || !amount) return;

        const finalAmount = parseFloat(amount) * (type === 'expense' ? -1 : 1);

        const transaction = {
            id: initialData?.id,
            amount: finalAmount,
            date,
            categoryId,
            tagIds: selectedTagIds,
            isPinned,
            description
        };

        if (initialData) {
            updateTransaction(transaction);
        } else {
            addTransaction(transaction);
        }
        onClose();
    };

    const toggleTag = (tagId) => {
        if (selectedTagIds.includes(tagId)) {
            setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
        } else {
            setSelectedTagIds([...selectedTagIds, tagId]);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal">
                <div className="modal-header">
                    <h3>{initialData ? 'Editar' : 'Nueva'} Transacción</h3>
                    <button className="icon-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Type Toggle */}
                    <div className="type-toggle">
                        <div
                            className={`type-option ${type === 'expense' ? 'active expense' : ''}`}
                            onClick={() => setType('expense')}
                        >
                            Gasto
                        </div>
                        <div
                            className={`type-option ${type === 'income' ? 'active income' : ''}`}
                            onClick={() => setType('income')}
                        >
                            Ingreso
                        </div>
                    </div>

                    {/* Amount */}
                    <div className="input-group">
                        <label className="input-label">Importe</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-input amount-input"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    {/* Description/Concept */}
                    <div className="input-group">
                        <label className="input-label">Concepto</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Ej. Compra de materiales"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {/* Date */}
                        <div className="input-group" style={{ flex: 1 }}>
                            <label className="input-label">Fecha</label>
                            <div className="date-input-wrapper">
                                <input
                                    type="date"
                                    className="form-input"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        {/* Pinned */}
                        <div className="input-group" style={{ width: 'auto', display: 'flex', alignItems: 'center', paddingTop: '15px' }}>
                            <button
                                type="button"
                                className={`pin-btn ${isPinned ? 'active' : ''}`}
                                onClick={() => setIsPinned(!isPinned)}
                                title="Fijar transacción"
                            >
                                <Pin size={20} className={isPinned ? 'fill-current' : ''} />
                            </button>
                        </div>
                    </div>

                    {/* Category */}
                    <div className="input-group">
                        <label className="input-label">Categoría</label>
                        <div className="category-grid">
                            {categories.map(cat => {
                                const Icon = getIcon(cat.icon);
                                const isSelected = categoryId === cat.id;

                                const isIncome = type === 'income';
                                // Visibility Check
                                if (isIncome) {
                                    if (cat.showInIncome === false) return null;
                                } else {
                                    // Expense
                                    if (cat.showInExpense === false) return null;
                                }

                                return (
                                    <div
                                        key={cat.id}
                                        className={`category-item ${isSelected ? 'selected' : ''}`}
                                        onClick={() => setCategoryId(cat.id)}
                                        style={{
                                            borderColor: isSelected ? cat.color : 'transparent',
                                            backgroundColor: isSelected ? `${cat.color}20` : '#f5f5f5',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div
                                            className="cat-icon"
                                            style={{ backgroundColor: isSelected ? cat.color : '#e0e0e0' }}
                                        >
                                            <Icon size={18} color={isSelected ? 'white' : '#757575'} />
                                        </div>
                                        <span className="cat-name">{cat.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="input-group">
                        <label className="input-label">Etiquetas</label>
                        <div className="tags-container">
                            {tags.map(tag => {
                                const isSelected = selectedTagIds.includes(tag.id);
                                return (
                                    <div
                                        key={tag.id}
                                        className={`tag-chip ${isSelected ? 'selected' : ''}`}
                                        onClick={() => toggleTag(tag.id)}
                                        style={{
                                            backgroundColor: isSelected ? tag.color : '#f0f0f0',
                                            color: isSelected ? 'white' : '#333'
                                        }}
                                    >
                                        {tag.name}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            className="btn"
                            onClick={onClose}
                            style={{ flex: 1, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                        >
                            Guardar
                        </button>
                    </div>
                </form>
            </div>
            <style>{`
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .type-toggle {
          display: flex;
          background: #f0f0f0;
          border-radius: 24px;
          padding: 4px;
          margin-bottom: 1.5rem;
        }
        .type-option {
          flex: 1;
          text-align: center;
          padding: 8px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          color: #666;
          transition: all 0.2s;
        }
        .type-option.active {
          background: white;
          color: black;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .type-option.active.expense {
          color: var(--color-expense);
        }
        .type-option.active.income {
          color: var(--color-income); // Yellow can be hard to read on white, maybe darken text?
          /* Using a darker yellow/orange for text readability if needed, but keeping logic simpler */
          color: #ffb300; 
        }

        .amount-input {
          font-size: 2rem;
          text-align: center;
          font-weight: bold;
          border: none;
          background: transparent;
          border-bottom: 2px solid #ddd;
          border-radius: 0;
          padding: 0.5rem;
        }
        .amount-input:focus {
          outline: none;
          border-color: var(--md-sys-color-primary);
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: 8px;
        }
        .category-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          text-align: center;
        }
        .cat-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .cat-name {
          font-size: 0.7rem;
          line-height: 1.1;
        }

        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .tag-chip {
          padding: 6px 12px;
          border-radius: 16px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: transform 0.1s;
        }
        .tag-chip:active {
          transform: scale(0.95);
        }
        
        .pin-btn {
          background: none;
          border: 1px solid #ddd;
          width: 44px;
          height: 44px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #999;
          cursor: pointer;
        }
        .pin-btn.active {
          border-color: var(--md-sys-color-primary);
          color: var(--md-sys-color-primary);
          background: var(--md-sys-color-primary-container);
        }
        .fill-current {
          fill: currentColor;
        }

        .full-width {
          width: 100%;
          margin-top: 1rem;
          padding: 1rem;
        }
      `}</style>
        </div>
    );
}
