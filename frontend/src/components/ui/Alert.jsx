import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: {
    container: 'bg-[#10B981]/10 border-[#10B981]/30 text-[#059669]',
    icon: 'text-[#10B981]',
  },
  error: {
    container: 'bg-[#EF4444]/10 border-[#EF4444]/30 text-[#B91C1C]',
    icon: 'text-[#EF4444]',
  },
  warning: {
    container: 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#D97706]',
    icon: 'text-[#F59E0B]',
  },
  info: {
    container: 'bg-[#3B82F6]/10 border-[#3B82F6]/30 text-[#1D4ED8]',
    icon: 'text-[#3B82F6]',
  },
}

export default function Alert({
  type = 'info',
  children,
  dismissible = false,
  onDismiss,
  className = '',
}) {
  const Icon = icons[type]
  const colorScheme = colors[type]

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 p-4 rounded-lg border-2 transition-all duration-150',
        colorScheme.container,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon size={20} className={`shrink-0 mt-0.5 ${colorScheme.icon}`} />
      
      <div className="flex-1 text-sm font-medium leading-relaxed">
        {children}
      </div>

      {dismissible && (
        <button
          onClick={onDismiss}
          className={`shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors ${colorScheme.icon}`}
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
