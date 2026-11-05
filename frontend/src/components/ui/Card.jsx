export function Card({ children, noPadding = false, hoverable = false, className = '', ...props }) {
  return (
    <div
      className={[
        'bg-white rounded-xl border border-[rgba(6,36,91,0.06)] shadow-[0_4px_6px_-1px_rgba(6,36,91,0.08),0_2px_4px_-2px_rgba(6,36,91,0.06)]',
        noPadding ? '' : 'p-6',
        hoverable ? 'transition-all duration-200 hover:shadow-[0_10px_15px_-3px_rgba(6,36,91,0.10)] hover:-translate-y-0.5 cursor-pointer' : '',
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-4 ${className}`}>
      <div>
        <h3 className="text-[#06245B] font-semibold text-base leading-tight">{title}</h3>
        {subtitle && <p className="text-[#64748B] text-sm mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

export function CardDivider() {
  return <div className="h-px bg-[rgba(6,36,91,0.06)] my-4" />
}

export default Card

