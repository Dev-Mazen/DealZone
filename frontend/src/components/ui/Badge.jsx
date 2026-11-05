const variants = {
  success: 'bg-[rgba(16,185,129,0.10)] text-[#059669]',
  warning: 'bg-[rgba(245,158,11,0.10)] text-[#D97706]',
  error:   'bg-[rgba(239,68,68,0.10)]  text-[#DC2626]',
  info:    'bg-[rgba(59,130,246,0.10)] text-[#2563EB]',
  navy:    'bg-[rgba(6,36,91,0.08)]    text-[#06245B]',
  cyan:    'bg-[rgba(0,217,245,0.12)]  text-[#0891B2]',
  gray:    'bg-[#F1F5F9]               text-[#64748B]',
}

export default function Badge({
  variant = 'gray',
  children,
  dot = false,
  className = '',
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
        variants[variant],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {dot && (
        <span
          className={[
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' ? 'bg-[#10B981]' :
            variant === 'warning' ? 'bg-[#F59E0B]' :
            variant === 'error'   ? 'bg-[#EF4444]' :
            variant === 'info'    ? 'bg-[#3B82F6]' :
            variant === 'cyan'    ? 'bg-[#00D9F5]' :
                                    'bg-[#64748B]',
          ].join(' ')}
        />
      )}
      {children}
    </span>
  )
}

