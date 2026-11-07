const variants = {
  success: 'bg-[#10B981] text-white',
  warning: 'bg-[#F59E0B] text-white',
  error:   'bg-[#EF4444] text-white',
  info:    'bg-[#3B82F6] text-white',
  navy:    'bg-[#06245B] text-white',
  cyan:    'bg-[#00D9F5] text-[#06245B]',
  gray:    'bg-[#64748B] text-white',
}

const sizes = {
  sm: 'px-2 py-0.5 text-[10px] gap-1',
  md: 'px-2.5 py-1 text-xs gap-1.5',
  lg: 'px-3 py-1.5 text-sm gap-2',
}

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
}

export default function Tag({
  variant = 'gray',
  size = 'md',
  children,
  onRemove,
  icon,
  className = '',
  ...props
}) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full font-medium whitespace-nowrap',
        variants[variant],
        sizes[size],
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {icon && (
        <span className={['shrink-0', iconSizes[size]].join(' ')}>
          {icon}
        </span>
      )}
      <span>{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className={[
            'shrink-0 rounded-full hover:bg-black/10 transition-colors duration-150 focus:outline-none focus:ring-1 focus:ring-white/50',
            iconSizes[size],
            'flex items-center justify-center',
          ].join(' ')}
          aria-label="Remove tag"
        >
          <svg
            viewBox="0 0 14 14"
            fill="none"
            className="w-full h-full"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" />
          </svg>
        </button>
      )}
    </span>
  )
}
