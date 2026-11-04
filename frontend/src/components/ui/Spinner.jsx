import { Loader2 } from 'lucide-react';

const sizes = { sm: 16, md: 24, lg: 36, xl: 56 };

export function Spinner({ size = 'md', label, className = '' }) {
  return (
    <div
      role="status"
      aria-label={label || 'Loading'}
      className={className}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      <Loader2
        size={sizes[size] ?? sizes.md}
        style={{ color: 'var(--dz-cyan)', animation: 'spinCycle 0.8s linear infinite' }}
      />
      {label && (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {label}
        </span>
      )}
    </div>
  );
}

export function FullScreenSpinner({ label }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-canvas)',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'var(--dz-navy)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)',
          }}
        >
          <Loader2
            size={28}
            style={{ color: 'var(--dz-cyan)', animation: 'spinCycle 0.8s linear infinite' }}
          />
        </div>
        {label && (
          <span style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export default Spinner;
