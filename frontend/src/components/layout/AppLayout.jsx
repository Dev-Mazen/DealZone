import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (window.innerWidth < 769) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 769) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100svh', background: 'var(--bg-canvas)' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area — offset by sidebar width on desktop */}
      <div
        id="main-content"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Navbar onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main
          style={{
            flex: 1,
            padding: 'clamp(16px, 3vw, 32px)',
            maxWidth: '100%',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* Desktop sidebar spacing — RTL aware via CSS logical property */}
      <style>{`
        @media (min-width: 769px) {
          #main-content {
            margin-inline-start: 240px;
          }
        }
        /* Sidebar fixed on inline-start (left in LTR, right in RTL) */
        #sidebar-panel {
          inset-inline-start: 0;
          inset-inline-end: auto;
        }
      `}</style>
    </div>
  );
}
