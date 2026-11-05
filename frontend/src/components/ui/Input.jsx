import { forwardRef } from 'react'

const Input = forwardRef(
  ({ label, error, hint, startIcon, endIcon, required, className = '', id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[#1E293B]"
          >
            {label}
            {required && (
              <span className="text-[#EF4444] ms-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative flex items-center">
          {startIcon && (
            <span className="absolute start-3 text-[#64748B] pointer-events-none z-10">
              {startIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={[
              'w-full h-10 rounded-lg border bg-white text-[#1E293B] text-sm transition-all duration-150',
              'placeholder:text-[#94A3B8]',
              'focus:outline-none focus:ring-2 focus:ring-[#00D9F5] focus:border-transparent',
              startIcon ? 'ps-10' : 'ps-3',
              endIcon ? 'pe-10' : 'pe-3',
              error
                ? 'border-[#EF4444] focus:ring-[#EF4444]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
              props.disabled ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC]' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {endIcon && (
            <span className="absolute end-3 text-[#64748B] pointer-events-none z-10">
              {endIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-xs text-[#EF4444]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[#64748B]">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input

