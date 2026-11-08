/**
 * Card Component
 * 
 * A flexible container component with elevation variants, padding options, and hover effects.
 * Implements the DealZone design system with 8px border radius and soft shadows.
 * 
 * @param {Object} props
 * @param {ReactNode} props.children - Card content
 * @param {'default' | 'elevated' | 'bordered'} props.variant - Visual variant (default: 'default')
 * @param {'none' | 'sm' | 'md' | 'lg'} props.padding - Padding size (default: 'md')
 * @param {boolean} props.hover - Enable hover elevation effect (default: false)
 * @param {string} props.className - Additional CSS classes
 * 
 * Requirements: 1.3, 1.4, 3.2
 */
export function Card({ 
  children, 
  variant = 'default', 
  padding = 'md', 
  noPadding = false, 
  hover = false, 
  className = '', 
  ...props 
}) {
  const effectivePadding = noPadding ? 'none' : padding
  // Variant styles - elevation and borders
  const variantStyles = {
    default: 'bg-white rounded-lg border border-[rgba(6,36,91,0.06)] shadow-[0_4px_6px_-1px_rgba(6,36,91,0.08),0_2px_4px_-2px_rgba(6,36,91,0.06)]',
    elevated: 'bg-white rounded-lg shadow-[0_4px_20px_-2px_rgba(6,36,91,0.08)]',
    bordered: 'bg-white rounded-lg border-2 border-[#F4F7FB]',
  };

  // Padding size options
  const paddingStyles = {
    none: '',
    sm: 'p-4',    // 16px
    md: 'p-6',    // 24px
    lg: 'p-8',    // 32px
  };

  // Hover elevation effect with shadow transition
  const hoverStyles = hover 
    ? 'transition-all duration-300 ease-out hover:shadow-[0_10px_15px_-3px_rgba(6,36,91,0.10),0_4px_6px_-4px_rgba(6,36,91,0.05)] hover:-translate-y-0.5 cursor-pointer' 
    : '';

  return (
    <div
      className={[
        variantStyles[variant],
        paddingStyles[effectivePadding],
        hoverStyles,
        className,
      ].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </div>
  );
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

