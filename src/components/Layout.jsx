import { Outlet, NavLink } from 'react-router-dom';
import { LayoutList, PieChart, Settings } from 'lucide-react';

export default function Layout() {
    return (
        <div className="app-container">
            <main className="content">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <LayoutList size={24} />
                    <span>Transacciones</span>
                </NavLink>
                <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <PieChart size={24} />
                    <span>Informes</span>
                </NavLink>
                <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings size={24} />
                    <span>Admin</span>
                </NavLink>
            </nav>

            <style>{`
        .app-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          padding-bottom: 70px; /* Nav height */
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: var(--md-sys-color-surface);
          border-top: 1px solid #eee;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--md-sys-color-secondary);
          text-decoration: none;
          font-size: 0.75rem;
          gap: 4px;
          transition: color 0.2s;
          width: 100%;
          height: 100%;
        }
        .nav-item.active {
          color: var(--md-sys-color-primary);
        }
        .content {
          flex: 1;
          padding: 16px;
        }
        @media (min-width: 600px) {
           .app-container {
              max-width: 600px; /* Mobile first view on desktop */
              margin: 0 auto;
              background: white;
              min-height: 100vh;
              box-shadow: 0 0 20px rgba(0,0,0,0.05);
           }
           .bottom-nav {
             max-width: 600px;
             left: 50%;
             transform: translateX(-50%);
           }
        }
      `}</style>
        </div>
    );
}
