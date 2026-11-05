import { forwardRef } from 'react'

const styles = {
  primary: `
    bg-[#00D9F5] text-[#06245B] font-semibold
    hover:bg-[#00C4DE] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#00D9F5] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-[#06245B] text-white font-semibold
    hover:bg-[#123878] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#06245B] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    shadow-sm hover:shadow-md
  `,
  outline: `
    bg-transparent text-[#06245B] font-semibold
    border-2 border-[#06245B]
    hover:bg-[#EAF4FF] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#06245B] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `,
  ghost: `
    bg-transparent text-[#06245B] font-medium
    hover:bg-[#EAF4FF] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#06245B] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  `,
  danger: `
    bg-[#EF4444] text-white font-semibold
    hover:bg-[#DC2626] active:scale-[0.98]
    focus-visible:ring-2 focus-visible:ring-[#EF4444] focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    shadow-sm hover:shadow-md
  `,
}

const sizes = {
  sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
  md: 'h-10 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-7 text-base rounded-xl gap-2.5',
}

const Button = forwardRef(
  (
    {
      as: Component = 'button',
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconEnd,
      fullWidth = false,
      className = '',
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const isButton = Component === 'button'
    const buttonProps = isButton ? { disabled: disabled || loading, type: props.type || 'button' } : {}

    return (
      <Component
        ref={ref}
        {...buttonProps}
        className={[
          'inline-flex items-center justify-center transition-all duration-150 select-none whitespace-nowrap cursor-pointer',
          styles[variant],
          sizes[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <svg
            className="w-4 h-4 animate-spin shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
            />
          </svg>
        ) : (
          icon && <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && iconEnd && <span className="shrink-0">{iconEnd}</span>}
      </Component>
    )
  },
)

Button.displayName = 'Button'
export default Button

