// src/pages/Casa.jsx
// Sección Casa: contenedor de submódulos del hogar (de momento, solo Pilas).
import { Link } from 'react-router-dom';
import { BatteryFull, ChevronRight } from 'lucide-react';

const MODULOS = [
  { to: '/casa/pilas', label: 'Pilas', desc: 'Dónde están puestas las pilas recargables', Icon: BatteryFull },
];

export default function Casa() {
  return (
    <div className="casa-page">
      <h2 className="casa-title">Casa</h2>
      <div className="casa-list">
        {MODULOS.map(m => (
          <Link key={m.to} to={m.to} className="casa-card">
            <span className="casa-icon"><m.Icon size={22} /></span>
            <span className="casa-text">
              <strong>{m.label}</strong>
              <small>{m.desc}</small>
            </span>
            <ChevronRight size={18} className="casa-chev" />
          </Link>
        ))}
      </div>
      <style>{`
        .casa-page { padding-bottom: 60px; color: var(--md-sys-color-on-surface); }
        .casa-title { margin: 4px 0 16px; font-size: 1.3rem; }
        .casa-list { display: flex; flex-direction: column; gap: 10px; }
        .casa-card { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 14px;
          background: var(--md-sys-color-surface); color: inherit; text-decoration: none;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .casa-icon { width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center;
          justify-content: center; background: #ECE4F7; color: #5B3A8C; flex-shrink: 0; }
        .casa-text { flex: 1; display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .casa-text small { opacity: 0.65; font-size: 0.8rem; }
        .casa-chev { opacity: 0.4; }
        :root[data-theme='dark'] .casa-icon { background: #2E2540; color: #C9B3EE; }
      `}</style>
    </div>
  );
}
