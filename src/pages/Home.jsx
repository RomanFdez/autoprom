import { Link } from 'react-router-dom';
import { SECCIONES, inicioSeccion, varsTono } from '../navigation';

// Cuatro nodos en las diagonales del anillo (50% ± 35.36% = r·cos45°), así las
// etiquetas quedan fuera del círculo: encima en los de arriba, debajo en los de abajo.
const POSICIONES = ['tl', 'tr', 'bl', 'br'];

export default function Home() {
  return (
    <div className="home-page">
      <div className="home-ring">
        <span className="home-center">Familia</span>
        {SECCIONES.slice(0, POSICIONES.length).map((s, i) => (
          <Link key={s.key} to={inicioSeccion(s)} style={varsTono(s)}
            className={`home-node home-node--${POSICIONES[i]}`} aria-label={s.label}>
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

        /* Colores por sección (src/navigation.js) */
        .home-node { --node-bg: var(--tono-bg); --node-edge: var(--tono-edge); --node-ink: var(--tono-ink); }
        :root[data-theme='dark'] .home-node { --node-bg: var(--tono-bg-d); --node-edge: var(--tono-edge-d); --node-ink: var(--tono-ink-d); }

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
