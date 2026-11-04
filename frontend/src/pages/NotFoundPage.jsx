import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.jpeg';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-canvas)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      textAlign: 'center',
    }}>
      {/* Logo */}
      <Link to="/" style={{ marginBottom: '32px', display: 'inline-block' }}>
        <img
          src={logo}
          alt="DealZone"
          style={{
            height: '60px',
            width: 'auto',
            borderRadius: '14px',
            objectFit: 'contain',
          }}
        />
      </Link>

      {/* 404 Display */}
      <div style={{
        fontSize: 'clamp(5rem, 20vw, 8rem)',
        fontWeight: 900,
        lineHeight: 1,
        background: 'var(--gradient-brand)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        marginBottom: '16px',
        userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{
        fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
        fontWeight: 700,
        color: 'var(--text-primary)',
        marginBottom: '12px',
      }}>
        الصفحة غير موجودة
      </h1>

      <p style={{
        color: 'var(--text-secondary)',
        fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
        maxWidth: '400px',
        marginBottom: '32px',
        lineHeight: 1.6,
      }}>
        يبدو أن الصفحة التي تبحث عنها لا وجود لها أو تم نقلها.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to={isAuthenticated ? '/dashboard' : '/login'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: '12px',
            background: 'var(--dz-cyan)', color: '#fff',
            textDecoration: 'none', fontWeight: 700, fontSize: '0.9375rem',
            transition: 'opacity 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {isAuthenticated ? '→ لوحة التحكم' : '→ تسجيل الدخول'}
        </Link>
        <button
          onClick={() => window.history.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 28px', borderRadius: '12px',
            background: 'var(--bg-card)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9375rem', transition: 'all 150ms',
          }}
        >
          ← رجوع
        </button>
      </div>

      {/* Decoration */}
      <div style={{
        marginTop: '48px',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
      }}>
        DealZone — Trade Smarter. Grow Faster.
      </div>
    </div>
  );
}
