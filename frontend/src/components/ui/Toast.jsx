import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore } from '../../hooks/useToast'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-[#10B981] text-white',
  error: 'bg-[#EF4444] text-white',
  warning: 'bg-[#F59E0B] text-white',
  info: 'bg-[#3B82F6] text-white',
}

function ToastItem({ toast }) {
  const remove = useToastStore((s) => s.remove)
  const Icon = icons[toast.variant]

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => remove(toast.id), toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, remove])

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl animate-slide-in min-w-[320px] max-w-md',
        colors[toast.variant],
      ].join(' ')}
    >
      <Icon size={20} className="shrink-0 mt-0.5" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{toast.message}</p>
      <button
        onClick={() => remove(toast.id)}
        className="shrink-0 p-0.5 rounded hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (!toasts.length) return null

  return (
    <div className="fixed top-4 end-4 z-[1070] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} />
        </div>
      ))}
    </div>
  )
}

