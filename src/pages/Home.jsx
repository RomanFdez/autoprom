import { Link } from 'react-router-dom';
import { Wallet, ShieldCheck, Home as HomeIcon, Sofa } from 'lucide-react';

// Cuatro nodos en las diagonales del anillo (50% ± 35.36% = r·cos45°), así las
// etiquetas quedan fuera del círculo: encima en los de arriba, debajo en los de abajo.
const SECTIONS = [
  { to: '/finanzas?v=anual', label: 'Finanzas', Icon: Wallet, pos: 'tl' },
  { to: '/seguros?v=resumen', label: 'Seguros', Icon: ShieldCheck, pos: 'tr' },
  { to: '/casa', label: 'Casa', Icon: Sofa, pos: 'bl' },
  { to: '/reports', label: 'P.S. Espada', Icon: HomeIcon, pos: 'br' },
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
          --home-ink: #1D1D1F;
          --home-ink-2: #6E6E73;
          --home-ring: #D2D2D7;
          --home-shadow: rgba(0, 0, 0, 0.08);

          display: flex;
          align-items: center;
          justify-content: center;
          min-height: min(calc(100dvh - 180px), 640px);
          padding: 72px 16px;
        }
        :root[data-theme='dark'] .home-page {
          --home-ink: var(--md-sys-color-on-surface);
          --home-ink-2: #b0bec5;
          --home-ring: #4a4a4a;
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
          background: var(--node-bg);
          border: 2px solid var(--node-edge);
          box-shadow: 0 2px 12px var(--home-shadow);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--node-ink);
          text-decoration: none;
          transition: transform 0.15s ease, border-color 0.15s ease;
        }
        .home-node:hover,
        .home-node:focus-visible {
          transform: translate(-50%, -50%) scale(1.07);
          border-color: var(--node-ink);
        }
        .home-node--tl { left: 14.64%; top: 14.64%; }
        .home-node--tr { left: 85.36%; top: 14.64%; }
        .home-node--bl { left: 14.64%; top: 85.36%; }
        .home-node--br { left: 85.36%; top: 85.36%; }

        /* Fondos pastel por sección (cada sección conserva su color) */
        .home-node--tl { --node-bg: #DEEBFA; --node-edge: #C3D9F2; --node-ink: #1D4E89; }
        .home-node--tr { --node-bg: #DFF2E4; --node-edge: #C2E3CC; --node-ink: #1E6B3A; }
        .home-node--bl { --node-bg: #ECE4F7; --node-edge: #D8CBEE; --node-ink: #5B3A8C; }
        .home-node--br { --node-bg: #FCEEDC; --node-edge: #F0DBBB; --node-ink: #8A5A16; }
        :root[data-theme='dark'] .home-node--tl { --node-bg: #24384F; --node-edge: #34506F; --node-ink: #9EC7F2; }
        :root[data-theme='dark'] .home-node--tr { --node-bg: #22402C; --node-edge: #335C41; --node-ink: #94D8A8; }
        :root[data-theme='dark'] .home-node--bl { --node-bg: #2E2540; --node-edge: #4A3B66; --node-ink: #C9B3EE; }
        :root[data-theme='dark'] .home-node--br { --node-bg: #453520; --node-edge: #614B2D; --node-ink: #EBC386; }

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
        .home-node--tl .home-node-label,
        .home-node--tr .home-node-label {
          top: auto;
          bottom: 100%;
          margin: 0 0 10px;
        }
      `}</style>
    </div>
  );
}
