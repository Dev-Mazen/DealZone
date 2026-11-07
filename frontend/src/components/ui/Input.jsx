import { forwardRef } from 'react'

/**
 * Input Component - DealZone UI Library
 * 
 * A flexible form input component supporting various types, validation states,
 * and visual enhancements with left/right icons.
 * 
 * Features:
 * - Multiple input types (text, email, password, number, tel)
 * - Label, error message, and helper text display
 * - Left/right icon slots for visual enhancement
 * - Focus states with cyan ring and border color
 * - Disabled and required visual states
 * - DealZone design tokens integration
 * 
 * @component
 * @example
 * <Input
 *   type="email"
 *   label="Email Address"
 *   placeholder="Enter your email"
 *   leftIcon={<Mail size={18} />}
 *   error="Invalid email format"
 *   required
 * />
 */
const Input = forwardRef(
  (
    {
      type = 'text',
      label,
      error,
      helperText,
      hint, // Alias for helperText for backward compatibility
      leftIcon,
      rightIcon,
      startIcon, // Alias for leftIcon for backward compatibility
      endIcon, // Alias for rightIcon for backward compatibility
      required,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`
    
    // Support both naming conventions
    const displayLeftIcon = leftIcon || startIcon
    const displayRightIcon = rightIcon || endIcon
    const displayHelperText = helperText || hint

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {/* Label with required indicator */}
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

        {/* Input wrapper with icon slots */}
        <div className="relative flex items-center">
          {/* Left icon slot */}
          {displayLeftIcon && (
            <span className="absolute start-3 text-[#64748B] pointer-events-none z-10 flex items-center">
              {displayLeftIcon}
            </span>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            required={required}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={
              error
                ? `${inputId}-error`
                : displayHelperText
                ? `${inputId}-hint`
                : undefined
            }
            className={[
              // Base styles
              'w-full h-10 rounded-lg border bg-white text-[#1E293B] text-sm transition-all duration-150',
              // Placeholder styles
              'placeholder:text-[#94A3B8]',
              // Focus states with cyan ring (DealZone brand color)
              'focus:outline-none focus:ring-2 focus:ring-[#00D9F5] focus:border-[#00D9F5]',
              // Padding adjustments for icons
              displayLeftIcon ? 'ps-10' : 'ps-3',
              displayRightIcon ? 'pe-10' : 'pe-3',
              // Error state styling
              error
                ? 'border-[#EF4444] focus:ring-[#EF4444] focus:border-[#EF4444]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]',
              // Disabled state styling
              disabled
                ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC] text-[#94A3B8]'
                : '',
              // Custom className
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {/* Right icon slot */}
          {displayRightIcon && (
            <span className="absolute end-3 text-[#64748B] pointer-events-none z-10 flex items-center">
              {displayRightIcon}
            </span>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[#EF4444] flex items-start gap-1"
          >
            {error}
          </p>
        )}

        {/* Helper text display (only shown when no error) */}
        {displayHelperText && !error && (
          <p id={`${inputId}-hint`} className="text-xs text-[#64748B]">
            {displayHelperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input

