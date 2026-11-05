import { forwardRef } from 'react'

const Textarea = forwardRef(
  ({ label, error, hint, required, className = '', id, rows = 4, ...props }, ref) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 8)}`

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-[#1E293B]">
            {label}
            {required && (
              <span className="text-[#EF4444] ms-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          className={[
            'w-full p-3 rounded-lg border bg-white text-[#1E293B] text-sm transition-all duration-150 resize-y',
            'placeholder:text-[#94A3B8]',
            'focus:outline-none focus:ring-2 focus:ring-[#00D9F5] focus:border-transparent',
            error
              ? 'border-[#EF4444] focus:ring-[#EF4444]'
              : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
            props.disabled ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC] resize-none' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />

        {error && (
          <p id={`${textareaId}-error`} role="alert" className="text-xs text-[#EF4444]">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${textareaId}-hint`} className="text-xs text-[#64748B]">
            {hint}
          </p>
        )}
      </div>
    )
  },
)

Textarea.displayName = 'Textarea'
export default Textarea

