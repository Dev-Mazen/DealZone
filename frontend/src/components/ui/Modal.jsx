import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from './Button'

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
}

export default function Modal({
  open,
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}) {
  const dialogRef = useRef(null)
  const isModalOpen = open ?? isOpen ?? false

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isModalOpen) onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isModalOpen, onClose])

  // Lock scroll
  useEffect(() => {
    if (isModalOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isModalOpen])

  if (!isModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[rgba(6,36,91,0.45)] backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={[
          'relative w-full bg-white rounded-2xl shadow-[0_20px_60px_-10px_rgba(6,36,91,0.25)] animate-fade-in',
          'max-h-[90vh] flex flex-col',
          sizeClasses[size],
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between gap-4 p-6 border-b border-[rgba(6,36,91,0.06)]">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-[#06245B]">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-[#64748B] mt-1">{description}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg text-[#64748B] hover:text-[#06245B] hover:bg-[#EAF4FF] transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="p-6 pt-0 border-t border-[rgba(6,36,91,0.06)] flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// Confirm dialog shorthand
export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-[#475569] text-sm leading-relaxed">{message}</p>
    </Modal>
  )
}

