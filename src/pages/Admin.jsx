import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import { ICON_KEYS, getIcon } from '../utils/icons';
import { Plus, Edit2, Trash2, Check, Save, Download, Lock, Upload, Tag, List, Settings } from 'lucide-react';

const COLORS = [
    '#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5',
    '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800',
    '#ff5722', '#795548', '#9e9e9e', '#607d8b'
];

export default function Admin() {
    const {
        categories, addCategory, updateCategory, removeCategory,
        tags, addTag, updateTag, removeTag,
        settings, updateSettings, transactions
    } = useData();

    const [activeTab, setActiveTab] = useState('categories'); // 'categories', 'tags', 'settings'
    const [balance, setBalance] = useState(settings.initialBalance || 0);
    const [isCatModalOpen, setIsCatModalOpen] = useState(false);
    const [isTagModalOpen, setIsTagModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    const handleUpdateBalance = () => {
        updateSettings({ initialBalance: parseFloat(balance) });
        alert('Saldo inicial actualizado');
    };

    const handleBackup = async () => {
        const data = await api.loadData();
        if (!data) return alert('Error al cargar datos');
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const openCatModal = (cat = null) => {
        setEditingItem(cat ? { ...cat } : { name: '', code: '', color: COLORS[0], icon: 'category', showInExpense: true, showInIncome: true });
        setIsCatModalOpen(true);
    };

    const openTagModal = (tag = null) => {
        setEditingItem(tag ? { ...tag } : { name: '', code: '', color: COLORS[0] });
        setIsTagModalOpen(true);
    };

    const handleSaveCategory = (e) => {
        e.preventDefault();
        const code = editingItem.code || editingItem.name.substring(0, 4).toUpperCase();

        const newItem = { ...editingItem, code };

        if (newItem.id) {
            updateCategory(newItem);
        } else {
            addCategory(newItem);
        }
        setIsCatModalOpen(false);
        setEditingItem(null);
    };

    const handleSaveTag = (e) => {
        e.preventDefault();
        const code = editingItem.code || editingItem.name.substring(0, 4).toUpperCase();
        if (editingItem.id) {
            updateTag({ ...editingItem, code });
        } else {
            addTag({ ...editingItem, code });
        }
        setIsTagModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteCategory = (id) => {
        if (confirm('¿Seguro que quieres eliminar esta categoría?')) {
            removeCategory(id);
        }
    };

    const handleDeleteTag = (id) => {
        if (confirm('¿Seguro que quieres eliminar esta etiqueta?')) {
            removeTag(id);
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h2>Administración</h2>
                <div className="admin-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'categories' ? 'active' : ''}`}
                        onClick={() => setActiveTab('categories')}
                    >
                        <List size={18} />
                        <span>Categorías</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
                        onClick={() => setActiveTab('tags')}
                    >
                        <Tag size={18} />
                        <span>Etiquetas</span>
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        <Settings size={18} />
                        <span>Configuración</span>
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {activeTab === 'categories' && (
                    <>
                        <div className="section-header">
                            <h3>Gestión de Categorías</h3>
                            <button className="btn btn-sm" onClick={() => openCatModal()}>
                                <Plus size={18} /> Nueva
                            </button>
                        </div>
                        <div className="list-container">
                            {categories.map(cat => {
                                const Icon = getIcon(cat.icon);
                                // Calculate Remaining Debt
                                const spent = transactions
                                    .filter(t => t.categoryId === cat.id && t.amount < 0)
                                    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
                                const remaining = Math.max(0, cat.debt - spent);

                                return (
                                    <div key={cat.id} className="list-item">
                                        <div className="item-icon" style={{ backgroundColor: cat.color }}>
                                            <Icon size={20} color="white" />
                                        </div>
                                        <div className="item-details">
                                            <div className="item-name">{cat.name}</div>
                                            {cat.debt > 0 && (
                                                <div className="item-code" style={{ color: 'var(--md-sys-color-on-surface)', opacity: 0.6, fontSize: '0.8rem' }}>
                                                    Deuda: {remaining.toFixed(2)}€ / {cat.debt.toFixed(2)}€
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-actions">
                                            <button className="icon-btn" onClick={() => openCatModal(cat)}><Edit2 size={16} /></button>
                                            <button className="icon-btn danger" onClick={() => handleDeleteCategory(cat.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {activeTab === 'tags' && (
                    <>
                        <div className="section-header">
                            <h3>Gestión de Etiquetas</h3>
                            <button className="btn btn-sm" onClick={() => openTagModal()}>
                                <Plus size={18} /> Nueva
                            </button>
                        </div>
                        <div className="list-container">
                            {tags.map(tag => (
                                <div key={tag.id} className="list-item">
                                    <div className="item-icon" style={{ backgroundColor: tag.color, borderRadius: '4px' }}>
                                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '10px' }}>#</span>
                                    </div>
                                    <div className="item-details">
                                        <div className="item-name">{tag.name}</div>
                                    </div>
                                    <div className="item-actions">
                                        <button className="icon-btn" onClick={() => openTagModal(tag)}><Edit2 size={16} /></button>
                                        <button className="icon-btn danger" onClick={() => handleDeleteTag(tag.id)}><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'settings' && (
                    <div className="settings-container">
                        {/* Initial Balance */}
                        <div className="card">
                            <h3>Saldo Inicial</h3>
                            <p className="card-desc">
                                El saldo con el que empieza la cuenta antes de las transacciones registradas.
                            </p>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                />
                                <button className="btn btn-primary" onClick={handleUpdateBalance}>
                                    <Save size={18} /> Guardar
                                </button>
                            </div>
                        </div>

                        {/* Account Settings */}
                        <div className="card">
                            <h3>Contraseña</h3>
                            <p className="card-desc">
                                Actualizar la contraseña de acceso a la aplicación.
                            </p>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const newPass = e.target.newPassword.value;
                                const confirmPass = e.target.confirmPassword.value;

                                if (newPass !== confirmPass) {
                                    alert('Las contraseñas no coinciden');
                                    return;
                                }

                                if (newPass) {
                                    const success = await api.changePassword(newPass);
                                    if (success) {
                                        alert('Contraseña actualizada correctamente');
                                        e.target.reset();
                                    } else {
                                        alert('Error al actualizar la contraseña');
                                    }
                                }
                            }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        name="newPassword"
                                        type="password"
                                        className="form-input"
                                        placeholder="Nueva contraseña"
                                        required
                                    />
                                    <input
                                        name="confirmPassword"
                                        type="password"
                                        className="form-input"
                                        placeholder="Repetir"
                                        required
                                    />
                                    <button type="submit" className="btn btn-primary">
                                        <Lock size={18} />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Backups */}
                        <div className="card">
                            <h3>Copia de Seguridad</h3>
                            <p className="card-desc">
                                Descarga o restaura tus datos.
                            </p>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-primary" onClick={handleBackup}>
                                    <Download size={18} /> Descargar
                                </button>

                                <label className="btn btn-secondary">
                                    <Upload size={18} /> Restaurar
                                    <input
                                        type="file"
                                        accept=".json"
                                        style={{ display: 'none' }}
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (!file) return;

                                            if (!confirm('¡ATENCIÓN! Esto sobrescribirá todos los datos actuales. ¿Seguro?')) {
                                                e.target.value = '';
                                                return;
                                            }

                                            const reader = new FileReader();
                                            reader.onload = async (e) => {
                                                try {
                                                    const json = JSON.parse(e.target.result);
                                                    if (!json.transactions || !json.categories) throw new Error('Formato inválido');
                                                    const success = await api.saveData(json);
                                                    if (success) {
                                                        alert('Datos restaurados. Recargando...');
                                                        window.location.reload();
                                                    } else {
                                                        alert('Error al guardar datos.');
                                                    }
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error: ' + err.message);
                                                }
                                            };
                                            reader.readAsText(file);
                                        }}
                                    />
                                </label>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {(isCatModalOpen || isTagModalOpen) && (
                <div className="modal-overlay">
                    <div className="modal">
                        <h3>{editingItem.id ? 'Editar' : 'Nueva'} {isCatModalOpen ? 'Categoría' : 'Etiqueta'}</h3>
                        <form onSubmit={isCatModalOpen ? handleSaveCategory : handleSaveTag}>

                            <div className="input-group">
                                <label className="input-label">Nombre</label>
                                <input
                                    required
                                    className="form-input"
                                    value={editingItem.name}
                                    onChange={e => setEditingItem({ ...editingItem, name: e.target.value })}
                                />
                            </div>

                            {isCatModalOpen && (
                                <div className="input-group">
                                    <label className="input-label">Deuda Total (€)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={editingItem.debt || ''}
                                        onChange={e => setEditingItem({ ...editingItem, debt: parseFloat(e.target.value) || 0 })}
                                    />
                                    <small style={{ color: 'var(--md-sys-color-on-surface)', opacity: 0.6 }}>Opcional. Cantidad total a pagar.</small>
                                </div>
                            )}

                            {isCatModalOpen && (
                                <div className="input-group">
                                    <label className="input-label">Visibilidad</label>
                                    <div style={{ display: 'flex', gap: '24px', marginTop: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={editingItem.showInExpense !== false}
                                                    onChange={e => setEditingItem({ ...editingItem, showInExpense: e.target.checked })}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span style={{ fontSize: '0.9rem' }}>Gastos</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label className="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    checked={editingItem.showInIncome !== false}
                                                    onChange={e => setEditingItem({ ...editingItem, showInIncome: e.target.checked })}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                            <span style={{ fontSize: '0.9rem' }}>Ingresos</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label">Color</label>
                                <div className="color-grid">
                                    {COLORS.map(c => (
                                        <div
                                            key={c}
                                            className={`color-swatch ${editingItem.color === c ? 'selected' : ''}`}
                                            style={{ backgroundColor: c }}
                                            onClick={() => setEditingItem({ ...editingItem, color: c })}
                                        >
                                            {editingItem.color === c && <Check size={12} color="white" />}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {isCatModalOpen && (
                                <div className="input-group">
                                    <label className="input-label">Icono</label>
                                    <div className="icon-grid">
                                        {ICON_KEYS.map(k => {
                                            const Icon = getIcon(k);
                                            return (
                                                <div
                                                    key={k}
                                                    className={`icon-swatch ${editingItem.icon === k ? 'selected' : ''}`}
                                                    onClick={() => setEditingItem({ ...editingItem, icon: k })}
                                                >
                                                    <Icon size={20} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button type="button" className="btn text-btn" onClick={() => { setIsCatModalOpen(false); setIsTagModalOpen(false); }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
        .admin-header {
            margin-bottom: 2rem;
        }
        .admin-header h2 {
            margin-bottom: 1rem;
            text-align: center;
        }
        .admin-tabs {
            display: flex;
            background: var(--md-sys-color-background);
            padding: 4px;
            border-radius: 20px;
            border: 1px solid var(--md-sys-color-outline);
            gap: 4px;
        }
        .tab-btn {
            flex: 1;
            border: none;
            background: none;
            padding: 8px 12px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            font-weight: 500;
            color: var(--md-sys-color-on-surface);
            opacity: 0.6;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 0.9rem;
        }
        .tab-btn:hover {
            opacity: 0.8;
            background: rgba(0,0,0,0.05);
        }
        .tab-btn.active {
            background: var(--md-sys-color-surface);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            opacity: 1;
            color: var(--md-sys-color-primary);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .settings-container {
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          border: 1px solid var(--md-sys-color-outline);
          border-radius: 20px;
          background: var(--md-sys-color-surface);
          color: var(--md-sys-color-on-surface);
          cursor: pointer;
        }
        .list-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .list-item {
          background: var(--md-sys-color-surface);
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          color: var(--md-sys-color-on-surface);
        }
        .item-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .item-details { flex: 1; }
        .item-name { font-weight: 500; }
        .item-code {
          font-size: 0.75rem;
          color: var(--md-sys-color-on-surface);
          opacity: 0.6;
        }
        .icon-btn {
          background: none;
          border: none;
          padding: 6px;
          color: var(--md-sys-color-on-surface);
          border-radius: 50%;
          opacity: 0.7;
          cursor: pointer;
        }
        .icon-btn:hover {
          background-color: var(--md-sys-color-on-surface-variant);
          opacity: 1;
        }
        .icon-btn.danger:hover {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .card {
            background: var(--md-sys-color-surface);
            padding: 1.5rem;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .card h3 { margin-bottom: 0.5rem; font-size: 1.1rem; }
        .card-desc {
            font-size: 0.85rem;
            opacity: 0.7;
            margin-bottom: 1rem;
        }

        .btn-primary {
            background: var(--md-sys-color-primary);
            color: var(--md-sys-color-on-primary);
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        .btn-secondary {
            background: var(--md-sys-color-surface-variant);
            color: var(--md-sys-color-on-surface-variant);
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
          backdrop-filter: blur(2px);
        }
        .modal {
          background: var(--md-sys-color-surface);
          padding: 1.5rem;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
          color: var(--md-sys-color-on-surface);
        }
        .modal h3 { margin-bottom: 1.5rem; }
        .input-group { margin-bottom: 1rem; }
        .input-label { display: block; font-size: 0.85rem; margin-bottom: 4px; opacity: 0.8; }
        .form-input {
            width: 100%;
            padding: 10px;
            border-radius: 8px;
            border: 1px solid var(--md-sys-color-outline);
            background: transparent;
            color: inherit;
        }
        
        .color-grid, .icon-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .color-swatch {
          width: 32px; height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex; alignItems: center; justifyContent: center;
          border: 2px solid transparent;
        }
        .color-swatch.selected { border-color: #333; transform: scale(1.1); }
        .icon-swatch {
          width: 40px; height: 40px;
          border-radius: 8px;
          background: var(--md-sys-color-surface-variant);
          display: flex; alignItems: center; justifyContent: center;
          cursor: pointer;
          border: 2px solid transparent;
        }
        .icon-swatch.selected {
          border-color: var(--md-sys-color-primary);
          background: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
        }
        .modal-actions {
          display: flex; justifyContent: flex-end; gap: 1rem; margin-top: 2rem;
        }
        .text-btn { background: none; border:none; cursor: pointer; color: inherit; opacity: 0.7; }

        /* Toggle */
        .toggle-switch {
          position: relative; display: inline-block; width: 44px; height: 24px;
        }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .slider {
          position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0;
          background-color: var(--md-sys-color-outline-variant);
          transition: .3s; border-radius: 24px;
        }
        .slider:before {
          position: absolute; content: "";
          height: 18px; width: 18px;
          left: 3px; bottom: 3px;
          background-color: white;
          transition: .3s; border-radius: 50%;
          box-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        input:checked + .slider { background-color: var(--md-sys-color-primary); }
        input:checked + .slider:before { transform: translateX(20px); }
      `}</style>
        </div>
    );
}
