import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const sizeWidths = { sm: '400px', md: '560px', lg: '720px', xl: '900px' };

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}) {
  const dialogRef = useRef(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Focus trap: focus first focusable element on open
  useEffect(() => {
    if (open && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) {
        focusable[0].focus();
      }
    }
  }, [open]);

  // Tab key focus trap
  const handleKeyDown = useCallback((e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusable = Array.from(
      dialogRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal, 300)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(4,22,56,0.6)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.2s ease-out both',
      }}
      onClick={
        closeOnBackdrop
          ? (e) => {
              if (e.target === e.currentTarget) onClose?.();
            }
          : undefined
      }
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className="dz-card animate-scale-in"
        style={{
          width: '100%',
          maxWidth: sizeWidths[size] || sizeWidths.md,
          maxHeight: '90svh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        {title ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="dz-btn-ghost"
              style={{
                padding: '6px',
                borderRadius: '8px',
                color: 'var(--text-muted)',
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="dz-btn-ghost"
            style={{
              position: 'absolute',
              insetBlockStart: '12px',
              insetInlineEnd: '12px',
              padding: '6px',
              borderRadius: '8px',
              color: 'var(--text-muted)',
              zIndex: 1,
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        )}

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export default Modal;
