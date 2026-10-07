import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Menu, Moon, Sun } from 'lucide-react';
import { useData } from '../context/DataContext';
import { ubicacion, varsTono } from '../navigation';
import NavDrawer from './NavDrawer';

import PullToRefresh from './PullToRefresh';

export default function Layout() {
  const { refreshData, settings, updateSettings } = useData();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const cerrarMenu = useCallback(() => setMenuOpen(false), []);
  const actual = ubicacion(location.pathname, location.search);

  const toggleTheme = () => {
    updateSettings({ darkMode: !settings.darkMode });
  };

  return (
    <div className="app-container">
      <nav className="top-nav">
        <button type="button" className="icon-btn-nav" onClick={() => setMenuOpen(true)}
          aria-label="Abrir menú" aria-expanded={menuOpen}>
          <Menu size={22} />
        </button>

        {actual ? (
          <div className="nav-title" style={varsTono(actual.seccion)}>
            <span className="nav-title-icon"><actual.seccion.Icon size={16} /></span>
            <span className="nav-title-text">
              <strong>{actual.seccion.label}</strong>
              {actual.pagina && <span> · {actual.pagina.label}</span>}
            </span>
          </div>
        ) : <div className="nav-title" />}

        <button className="icon-btn-nav" onClick={toggleTheme} aria-label="Cambiar tema">
          {settings.darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </nav>

      <NavDrawer open={menuOpen} onClose={cerrarMenu} actual={actual} />

      <main className="content">
        <PullToRefresh onRefresh={refreshData}>
          <Outlet />
        </PullToRefresh>
      </main>



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
        
        .nav-title { --t-bg: var(--tono-bg); --t-ink: var(--tono-ink);
          flex: 1; min-width: 0; display: flex; align-items: center; justify-content: center; gap: 8px;
          color: var(--t-ink); font-size: 0.95rem; }
        :root[data-theme='dark'] .nav-title { --t-bg: var(--tono-bg-d); --t-ink: var(--tono-ink-d); }
        .nav-title-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--t-bg);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .nav-title-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nav-title-text span { font-weight: 500; opacity: 0.85; }

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
        
        @media (max-width: 480px) {
            .top-nav { padding: 0 6px; }
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
