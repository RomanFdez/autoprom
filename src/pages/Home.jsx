import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, Home as HomeIcon } from 'lucide-react';

// Vértices de un triángulo equilátero inscrito en el anillo:
// arriba (50%, 0%), abajo-izq (50-43.3%, 75%), abajo-dcha (50+43.3%, 75%).
const SECTIONS = [
  { to: '/finanzas?v=anual', label: 'Finanzas', Icon: Wallet, pos: 'top' },
  { to: '/seguros?v=resumen', label: 'Seguros', Icon: ShieldCheck, pos: 'left' },
  { to: '/reports', label: 'P.S. Espada', Icon: HomeIcon, pos: 'right' },
];

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-ring">
        <span className="home-center">Familia</span>
        {SECTIONS.map(s => (
          <Link key={s.to} to={s.to} className={`home-node home-node--${s.pos}`} aria-label={s.label}>
            <s.Icon className="home-node-icon" />
            <span className="home-node-label">{s.label}</span>
          </Link>
        ))}
      </div>

      <style>{`
        .home-page {
          --home-surface: #fff;
          --home-ink: #1D1D1F;
          --home-ink-2: #6E6E73;
          --home-ring: #D2D2D7;
          --home-border: #E5E5EA;
          --home-accent: #0055B3;
          --home-shadow: rgba(0, 0, 0, 0.08);

          display: flex;
          align-items: center;
          justify-content: center;
          min-height: min(calc(100dvh - 180px), 640px);
          padding: 72px 16px;
        }
        :root[data-theme='dark'] .home-page {
          --home-surface: var(--md-sys-color-surface);
          --home-ink: var(--md-sys-color-on-surface);
          --home-ink-2: #b0bec5;
          --home-ring: #4a4a4a;
          --home-border: var(--md-sys-color-outline);
          --home-accent: #64b5f6;
          --home-shadow: rgba(0, 0, 0, 0.4);
        }

        .home-ring {
          position: relative;
          width: min(62vmin, 380px);
          aspect-ratio: 1;
          border: 2.5px solid var(--home-ring);
          border-radius: 50%;
        }
        .home-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          color: var(--home-ink);
        }

        .home-node {
          position: absolute;
          width: min(26vmin, 104px);
          aspect-ratio: 1;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: var(--home-surface);
          border: 2px solid var(--home-border);
          box-shadow: 0 2px 12px var(--home-shadow);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--home-ink);
          text-decoration: none;
          transition: transform 0.15s ease, border-color 0.15s ease, color 0.15s ease;
        }
        .home-node:hover,
        .home-node:focus-visible {
          transform: translate(-50%, -50%) scale(1.07);
          border-color: var(--home-accent);
          color: var(--home-accent);
        }
        .home-node--top { left: 50%; top: 0; }
        .home-node--left { left: 6.7%; top: 75%; }
        .home-node--right { left: 93.3%; top: 75%; }

        .home-node-icon {
          width: 38%;
          height: 38%;
        }

        .home-node-label {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 10px;
          font-size: 0.95rem;
          font-weight: 600;
          white-space: nowrap;
          color: var(--home-ink);
        }
        .home-node--top .home-node-label {
          top: auto;
          bottom: 100%;
          margin: 0 0 10px;
        }
      `}</style>
    </div>
  );
}
