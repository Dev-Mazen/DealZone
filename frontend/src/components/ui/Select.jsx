import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(
  ({ label, error, hint, options, placeholder, required, className = '', id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-[#1E293B]">
            {label}
            {required && (
              <span className="text-[#EF4444] ms-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            className={[
              'w-full h-10 ps-3 pe-10 rounded-lg border bg-white text-[#1E293B] text-sm transition-all duration-150 appearance-none cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-[#00D9F5] focus:border-transparent',
              error
                ? 'border-[#EF4444] focus:ring-[#EF4444]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
              props.disabled ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC]' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="absolute end-3 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none">
            <ChevronDown size={16} />
          </span>
        </div>

        {error && <p role="alert" className="text-xs text-[#EF4444]">{error}</p>}
        {hint && !error && <p className="text-xs text-[#64748B]">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select

