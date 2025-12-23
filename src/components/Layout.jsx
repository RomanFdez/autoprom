import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutList, PieChart, Settings, LogOut, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { getIcon } from '../utils/icons';

import PullToRefresh from './PullToRefresh';

export default function Layout() {
  const { logout } = useAuth();
  const { transactions, categories, refreshData } = useData();
  const navigate = useNavigate();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredResults = transactions.filter(t => {
    if (!searchQuery) return false;
    const q = searchQuery.toLowerCase();
    const cat = categories.find(c => c.id === t.categoryId);
    return (
      (t.description && t.description.toLowerCase().includes(q)) ||
      (cat && cat.name.toLowerCase().includes(q)) ||
      t.amount.toString().includes(q)
    );
  }).slice(0, 10); // Limit results

  return (
    <div className="app-container">
      <nav className="top-nav">
        <div className="nav-left">
          <button className="icon-btn-nav" onClick={() => setIsSearchOpen(true)}>
            <Search size={20} />
          </button>
        </div>

        <div className="nav-center">
          <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <PieChart size={18} />
            <span>Resumen</span>
          </NavLink>
          <NavLink to="/transactions" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <LayoutList size={18} />
            <span>Transacciones</span>
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Settings size={18} />
            <span>Admin</span>
          </NavLink>
        </div>

        <div className="nav-right">
          <button className="icon-btn-nav logout-btn" onClick={handleLogout}>
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="content">
        <PullToRefresh onRefresh={refreshData}>
          <Outlet />
        </PullToRefresh>
      </main>

      {/* Search Modal */}
      {isSearchOpen && (
        <div className="search-overlay" onClick={() => setIsSearchOpen(false)}>
          <div className="search-modal" onClick={e => e.stopPropagation()}>
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input
                type="text"
                autoFocus
                placeholder="Buscar transacciones..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <button className="close-search" onClick={() => setIsSearchOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="search-results">
              {searchQuery && filteredResults.length === 0 && (
                <div className="no-results">No se encontraron resultados</div>
              )}
              {filteredResults.map(t => {
                const cat = categories.find(c => c.id === t.categoryId) || { name: '?', color: '#ccc', icon: 'category' };
                const Icon = getIcon(cat.icon);
                return (
                  <div key={t.id} className="result-item">
                    <div className="r-icon" style={{ backgroundColor: cat.color }}>
                      <Icon size={14} color="white" />
                    </div>
                    <div className="r-info">
                      <div className="r-desc">{t.description || cat.name}</div>
                      <div className="r-date">{format(parseISO(t.date), 'dd MMM', { locale: es })}</div>
                    </div>
                    <div className={`r-amount ${t.amount >= 0 ? 'income' : 'expense'}`}>
                      {t.amount.toFixed(2)} €
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-top: 60px;
          background-color: var(--md-sys-color-background);
          color: var(--md-sys-color-on-background);
        }
        
        /* New Nav Layout */
        .top-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 60px;
          background: var(--md-sys-color-surface);
          border-bottom: 1px solid var(--md-sys-color-outline);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1rem;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        
        .nav-left, .nav-right {
            display: flex;
            gap: 8px;
        }
        
        .nav-center {
            display: flex;
            gap: 16px;
        }

        .nav-link {
            text-decoration: none;
            color: var(--md-sys-color-secondary);
            font-weight: 500;
            font-size: 0.75rem; /* Smaller font for icon label */
            position: relative;
            padding: 4px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 2px;
            transition: color 0.2s;
        }
        .nav-link.active {
            color: var(--md-sys-color-primary);
        }
        .nav-link.active::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0; right: 0;
            height: 2px;
            background: var(--md-sys-color-primary);
            border-radius: 2px;
        }

        .icon-btn-nav {
            background: none;
            border: none;
            color: var(--md-sys-color-on-surface);
            padding: 8px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .icon-btn-nav:hover {
            background-color: rgba(0,0,0,0.05);
        }
        .logout-btn { color: #d32f2f; }
        
        /* Mobile adjustment */
        @media (max-width: 480px) {
            .nav-link { font-size: 0.8rem; }
            .nav-center { gap: 10px; }
            .top-nav { padding: 0 8px; }
        }

        .content {
          flex: 1;
          padding: 16px;
        }

        /* Search Modal */
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
        
        .search-results {
            max-height: 300px;
            overflow-y: auto;
        }
        .no-results {
            padding: 16px;
            text-align: center;
            color: var(--md-sys-color-secondary);
            font-size: 0.9rem;
        }
        .result-item {
            display: flex;
            align-items: center;
            padding: 10px 16px;
            gap: 12px;
            border-bottom: 1px solid var(--md-sys-color-outline);
            cursor: pointer;
        }
        .result-item:hover {
            background-color: rgba(0,0,0,0.03);
        }
        .r-icon {
            width: 28px;
            height: 28px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .r-info { flex: 1; }
        .r-desc { font-size: 0.9rem; font-weight: 500; }
        .r-date { font-size: 0.75rem; color: var(--md-sys-color-secondary); }
        .r-amount { font-weight: 600; font-size: 0.9rem; }
        .r-amount.income { color: var(--color-income); }
        .r-amount.expense { color: var(--color-expense); }

        @media (min-width: 600px) {
           .app-container {
              max-width: 600px;
              margin: 0 auto;
              background: var(--md-sys-color-surface);
              min-height: 100vh;
              box-shadow: 0 0 20px rgba(0,0,0,0.05);
           }
           .top-nav {
             max-width: 600px;
             left: 50%;
             transform: translateX(-50%);
           }
        }
      `}</style>
    </div>
  );
}
