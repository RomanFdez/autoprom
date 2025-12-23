import { useState } from 'react';
import { useData } from '../context/DataContext';
import { api } from '../utils/api';
import { ICON_KEYS, getIcon } from '../utils/icons';
import { Plus, X, Edit2, Trash2, Check, Save, Download, Lock } from 'lucide-react';

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
        settings, updateSettings
    } = useData();

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

    // ... existing modals ...
    const openCatModal = (cat = null) => {
        setEditingItem(cat ? { ...cat } : { name: '', code: '', color: COLORS[0], icon: 'category' });
        setIsCatModalOpen(true);
    };

    const openTagModal = (tag = null) => {
        setEditingItem(tag ? { ...tag } : { name: '', code: '', color: COLORS[0] });
        setIsTagModalOpen(true);
    };

    const handleSaveCategory = (e) => {
        e.preventDefault();
        const code = editingItem.code || editingItem.name.substring(0, 4).toUpperCase();
        if (editingItem.id) {
            updateCategory({ ...editingItem, code });
        } else {
            addCategory({ ...editingItem, code });
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
            <h2 style={{ marginBottom: '1rem' }}>Administración</h2>

            {/* Categories */}
            <div className="section-header">
                <h3>Categorías</h3>
                <button className="btn btn-sm" onClick={() => openCatModal()}>
                    <Plus size={18} /> Nueva
                </button>
            </div>
            <div className="list-container">
                {categories.map(cat => {
                    const Icon = getIcon(cat.icon);
                    return (
                        <div key={cat.id} className="list-item">
                            <div className="item-icon" style={{ backgroundColor: cat.color }}>
                                <Icon size={20} color="white" />
                            </div>
                            <div className="item-details">
                                <div className="item-name">{cat.name}</div>
                                {cat.debt > 0 && (
                                    <div className="item-code" style={{ color: '#888', fontSize: '0.8rem' }}>
                                        Deuda: {cat.debt.toFixed(2)}€
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

            {/* Tags */}
            <div className="section-header" style={{ marginTop: '2rem' }}>
                <h3>Etiquetas</h3>
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

            {/* Initial Balance */}
            <div className="card" style={{ marginTop: '2rem' }}>
                <h3>Saldo Inicial</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
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
            <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Configuración de Cuenta</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Cambiar contraseña de acceso.
                </p>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const newPass = e.target.newPassword.value;
                    if (newPass) {
                        const success = await api.changePassword(newPass);
                        if (success) {
                            alert('Contraseña actualizada correctamente');
                            e.target.reset();
                        } else {
                            alert('Error al actualizar la contraseña');
                        }
                    }
                }} style={{ display: 'flex', gap: '8px' }}>
                    <input
                        name="newPassword"
                        type="password"
                        className="form-input"
                        placeholder="Nueva contraseña"
                        required
                    />
                    <button type="submit" className="btn btn-primary">
                        <Lock size={18} /> Actualizar
                    </button>
                </form>
            </div>

            {/* Backups */}
            <div className="card" style={{ marginTop: '1rem' }}>
                <h3>Backup</h3>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                    Descarga una copia completa de tus datos en formato JSON.
                </p>
                <button className="btn btn-primary" onClick={handleBackup}>
                    <Download size={18} /> Descargar Backup
                </button>
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
                                    <label className="input-label">Deuda Actual (€)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0.00"
                                        value={editingItem.debt || ''}
                                        onChange={e => setEditingItem({ ...editingItem, debt: parseFloat(e.target.value) || 0 })}
                                    />
                                    <small style={{ color: '#888' }}>Si se añade gasto a esta categoría, se reducirá de esta deuda.</small>
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
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
          border: 1px solid #ddd;
          border-radius: 20px;
          background: white;
        }
        .list-container {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .list-item {
          background: white;
          padding: 0.75rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
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
        .item-details {
          flex: 1;
        }
        .item-name {
          font-weight: 500;
        }
        .item-code {
          font-size: 0.75rem;
          color: #888;
        }
        .icon-btn {
          background: none;
          border: none;
          padding: 6px;
          color: #666;
          border-radius: 50%;
        }
        .icon-btn:hover {
          background-color: #f0f0f0;
        }
        .icon-btn.danger:hover {
          background-color: #ffebee;
          color: #d32f2f;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 1rem;
        }
        .modal {
          background: white;
          padding: 1.5rem;
          border-radius: 16px;
          width: 100%;
          max-width: 400px;
          max-height: 90vh;
          overflow-y: auto;
        }
        .modal h3 {
          margin-bottom: 1.5rem;
        }
        .color-grid, .icon-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 0.5rem;
        }
        .color-swatch {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid transparent;
        }
        .color-swatch.selected {
          border-color: #333;
          transform: scale(1.1);
        }
        .icon-swatch {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #f5f5f5;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 2px solid transparent;
        }
        .icon-swatch.selected {
          border-color: var(--md-sys-color-primary);
          background: var(--md-sys-color-primary-container);
          color: var(--md-sys-color-on-primary-container);
        }
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
        }
        .text-btn {
          background: none;
          color: #666;
        }
      `}</style>
        </div>
    );
}
