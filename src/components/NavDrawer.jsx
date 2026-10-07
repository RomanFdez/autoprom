// src/components/NavDrawer.jsx
// Menú lateral con todas las secciones y sus páginas (config en src/navigation.js).
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { House, X } from 'lucide-react';
import { SECCIONES, urlPagina, inicioSeccion, varsTono } from '../navigation';

export default function NavDrawer({ open, onClose, actual }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div className={`drw-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden="true" />
      <nav className={`drw ${open ? 'open' : ''}`} aria-label="Menú principal" aria-hidden={!open} inert={!open}>
        <div className="drw-head">
          <Link to="/" className={`drw-home ${!actual ? 'active' : ''}`} onClick={onClose}>
            <House size={18} /> Inicio
          </Link>
          <button type="button" className="drw-close" onClick={onClose} aria-label="Cerrar menú"><X size={20} /></button>
        </div>

        <div className="drw-body">
          {SECCIONES.map(s => (
            <div key={s.key} className="drw-sec" style={varsTono(s)}>
              <Link to={inicioSeccion(s)} className="drw-sec-title" onClick={onClose}>
                <span className="drw-sec-icon"><s.Icon size={16} /></span>
                {s.label}
              </Link>
              {s.paginas.map(p => {
                const activa = actual?.pagina === p;
                return (
                  <Link key={urlPagina(p)} to={urlPagina(p)} onClick={onClose}
                    className={`drw-page ${activa ? 'active' : ''}`} aria-current={activa ? 'page' : undefined}>
                    {p.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <style>{`
        .drw-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 2500;
          opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
        .drw-backdrop.open { opacity: 1; pointer-events: auto; }
        .drw { position: fixed; top: 0; bottom: 0; left: max(0px, calc(50% - 300px)); width: min(280px, 82vw);
          background: var(--md-sys-color-surface); color: var(--md-sys-color-on-surface); z-index: 2600;
          box-shadow: 4px 0 24px rgba(0,0,0,0.18); display: flex; flex-direction: column;
          transform: translateX(-110%); visibility: hidden;
          transition: transform 0.22s ease, visibility 0s linear 0.22s; }
        .drw.open { transform: translateX(0); visibility: visible; transition: transform 0.22s ease; }
        .drw-head { display: flex; align-items: center; justify-content: space-between; height: 60px;
          padding: 0 8px 0 12px; border-bottom: 1px solid var(--md-sys-color-outline); flex-shrink: 0; }
        .drw-home { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border-radius: 8px;
          color: inherit; text-decoration: none; font-weight: 600; }
        .drw-home.active { background: rgba(0,0,0,0.06); }
        .drw-close { border: none; background: none; color: inherit; opacity: 0.6; padding: 8px; cursor: pointer; line-height: 0; }
        .drw-body { overflow-y: auto; padding: 8px 10px 24px; }
        .drw-sec { --t-bg: var(--tono-bg); --t-ink: var(--tono-ink); margin-top: 10px; }
        :root[data-theme='dark'] .drw-sec { --t-bg: var(--tono-bg-d); --t-ink: var(--tono-ink-d); }
        .drw-sec-title { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 8px;
          color: var(--t-ink); text-decoration: none; font-weight: 700; font-size: 0.95rem; }
        .drw-sec-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--t-bg);
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .drw-page { display: block; padding: 7px 10px 7px 46px; border-radius: 8px; color: inherit;
          text-decoration: none; font-size: 0.9rem; opacity: 0.85; }
        .drw-page:hover, .drw-sec-title:hover, .drw-home:hover { background: rgba(0,0,0,0.04); }
        .drw-page.active { background: var(--t-bg); color: var(--t-ink); font-weight: 600; opacity: 1; }
      `}</style>
    </>
  );
}
