import { Bell, Sun, Moon, LogOut, User, ChevronDown, Menu } from 'lucide-react';
import logo from '../../assets/logo.jpeg';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLang } from '../../context/LangContext';
import { useUnreadCount } from '../../hooks/useNotifications';

export default function Navbar({ onMenuToggle }) {
  const { t } = useTranslation('common');
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, toggleLang } = useLang();
  const { data: unreadCount = 0 } = useUnreadCount();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <header className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100, height: '64px' }}>
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingInline: '16px',
        gap: '12px',
      }}>
        {/* Left: Hamburger (mobile) + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="dz-btn-ghost"
            style={{ padding: '8px', display: 'none' }}
            onClick={onMenuToggle}
            aria-label="Toggle menu"
            id="menu-toggle"
          >
            <Menu size={20} />
          </button>

          {/* Logo */}
          <Link
            to="/dashboard"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}
          >
            <img
              src={logo}
              alt="DealZone"
              style={{ height: '38px', width: '38px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
            />
            <span style={{
              fontWeight: 800,
              fontSize: '1.125rem',
              color: '#FFFFFF',
              letterSpacing: '-0.01em',
            }}>
              DEAL ZONE
            </span>
          </Link>
        </div>

        {/* Right: Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Theme Toggle */}
          <button
            className="dz-btn-ghost"
            style={{ padding: '8px', borderRadius: '8px', transition: 'all 150ms' }}
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Toggle */}
          <button
            className="dz-btn-ghost"
            style={{
              padding: '8px 10px',
              borderRadius: '8px',
              fontSize: '0.8125rem',
              fontWeight: 600,
              transition: 'all 150ms',
              minWidth: '40px',
            }}
            onClick={toggleLang}
            aria-label="Toggle language"
          >
            {lang === 'ar' ? 'EN' : 'عر'}
          </button>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="dz-btn-ghost"
            style={{
              padding: '8px',
              borderRadius: '8px',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 150ms',
            }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '4px',
                insetInlineEnd: '4px',
                background: 'var(--error, #ef4444)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                lineHeight: 1,
                minWidth: '16px',
                height: '16px',
                borderRadius: '9999px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>

          {/* User Avatar Dropdown */}
          <div ref={userMenuRef} style={{ position: 'relative' }}>
            <button
              className="dz-btn-ghost"
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 150ms',
              }}
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--dz-navy)',
                border: '2px solid var(--dz-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: 'var(--dz-cyan)',
                flexShrink: 0,
              }}>
                {initials}
              </div>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: 'var(--text-on-sidebar, white)',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {user?.name || 'User'}
              </span>
              <ChevronDown
                size={14}
                style={{
                  color: 'var(--text-muted)',
                  transition: 'transform 150ms',
                  transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>

            {/* Dropdown Menu */}
            {userMenuOpen && (
              <div
                className="dz-card animate-scale-in"
                style={{
                  position: 'absolute',
                  insetBlockStart: 'calc(100% + 8px)',
                  insetInlineEnd: 0,
                  minWidth: '200px',
                  zIndex: 200,
                  padding: '8px',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                {/* User info header */}
                <div style={{
                  padding: '8px 12px 12px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '8px',
                }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user?.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {user?.email}
                  </div>
                </div>

                <Link
                  to="/profile"
                  className="dz-btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    gap: '10px',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 150ms',
                  }}
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User size={16} />
                  <span>{t('nav.profile', 'Profile')}</span>
                </Link>

                <button
                  className="dz-btn-ghost"
                  style={{
                    width: '100%',
                    justifyContent: 'flex-start',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    gap: '10px',
                    color: 'var(--error-text, #ef4444)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 150ms',
                  }}
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>{t('nav.logout', 'Logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile hamburger reveal via CSS */}
      <style>{`
        @media (max-width: 768px) {
          #menu-toggle { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
