import { forwardRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Input Component - DealZone UI Library
 * 
 * A flexible form input component supporting various types, validation states,
 * built-in password show/hide toggle, and visual enhancements with left/right icons.
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
      showPasswordToggle = true,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 8)}`
    const [isPasswordVisible, setIsPasswordVisible] = useState(false)

    const isPasswordType = type === 'password'
    const effectiveType = isPasswordType && isPasswordVisible ? 'text' : type

    // Support both naming conventions
    const displayLeftIcon = leftIcon || startIcon
    let displayRightIcon = rightIcon || endIcon
    const displayHelperText = helperText || hint

    // Built-in show/hide password toggle button
    if (isPasswordType && showPasswordToggle && !displayRightIcon) {
      displayRightIcon = (
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => {
            e.preventDefault()
            setIsPasswordVisible((prev) => !prev)
          }}
          className="text-[#64748B] hover:text-[#06245B] focus:outline-none transition-colors p-1 rounded-md"
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
        >
          {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )
    }

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
            type={effectiveType}
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
            <span className="absolute end-3 text-[#64748B] z-10 flex items-center">
              {displayRightIcon}
            </span>
          )}
        </div>

        {/* Error message display */}
        {error && (
          <p
            id={`${inputId}-error`}
            role="alert"
            className="text-xs text-[#EF4444] flex items-start gap-1 font-medium transition-all duration-150"
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
