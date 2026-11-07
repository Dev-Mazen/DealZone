import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

/**
 * SUCCESS CHECKMARK ANIMATION
 * Displays an animated checkmark icon with scale-in and bounce effect
 * Used for successful form submissions and confirmations
 */
export function SuccessCheckmark({ size = 48, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={[
        'inline-flex items-center justify-center',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0',
        className,
      ].join(' ')}
      style={{
        animation: isVisible ? 'successBounce 0.6s ease-out' : 'none',
      }}
    >
      <CheckCircle2
        size={size}
        className="text-[#10B981] drop-shadow-lg"
        strokeWidth={2.5}
      />
    </div>
  )
}

/**
 * ERROR SHAKE ANIMATION
 * Displays an error icon with horizontal shake animation
 * Used for failed validations and error states
 */
export function ErrorShake({ size = 48, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={[
        'inline-flex items-center justify-center',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100' : 'opacity-0',
        className,
      ].join(' ')}
      style={{
        animation: isVisible ? 'errorShake 0.5s ease-in-out' : 'none',
      }}
    >
      <XCircle
        size={size}
        className="text-[#EF4444] drop-shadow-lg"
        strokeWidth={2.5}
      />
    </div>
  )
}

/**
 * WARNING PULSE ANIMATION
 * Displays a warning icon with subtle pulse effect
 * Used for warning states and confirmations
 */
export function WarningPulse({ size = 48, className = '' }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={[
        'inline-flex items-center justify-center',
        'transition-all duration-300 ease-out',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        className,
      ].join(' ')}
      style={{
        animation: isVisible ? 'warningPulse 1.5s ease-in-out infinite' : 'none',
      }}
    >
      <AlertCircle
        size={size}
        className="text-[#F59E0B] drop-shadow-lg"
        strokeWidth={2.5}
      />
    </div>
  )
}

/**
 * ANIMATED FEEDBACK WRAPPER
 * Wraps any element with success/error feedback animations
 * Automatically handles state transitions with smooth animations
 */
export function AnimatedFeedback({
  children,
  state = 'idle', // 'idle' | 'success' | 'error' | 'loading'
  showIcon = true,
  iconSize = 24,
  className = '',
}) {
  const [prevState, setPrevState] = useState(state)

  useEffect(() => {
    if (state !== prevState) {
      setPrevState(state)
    }
  }, [state, prevState])

  const getIconComponent = () => {
    switch (state) {
      case 'success':
        return <SuccessCheckmark size={iconSize} />
      case 'error':
        return <ErrorShake size={iconSize} />
      default:
        return null
    }
  }

  return (
    <div
      className={[
        'relative inline-flex items-center gap-3',
        state === 'success' && 'animate-successFeedback',
        state === 'error' && 'animate-errorFeedback',
        className,
      ].join(' ')}
    >
      {showIcon && state !== 'idle' && state !== 'loading' && (
        <div className="shrink-0">{getIconComponent()}</div>
      )}
      <div className="flex-1">{children}</div>
    </div>
  )
}

/**
 * FORM INPUT WITH VALIDATION FEEDBACK
 * Enhanced input wrapper with animated success/error states
 * Automatically shows checkmark or shake animation on validation
 */
export function ValidatedInput({
  label,
  error,
  success,
  touched,
  className = '',
  inputClassName = '',
  children,
  ...props
}) {
  const [shakeKey, setShakeKey] = useState(0)

  useEffect(() => {
    // Trigger shake animation when error changes
    if (error && touched) {
      setShakeKey((prev) => prev + 1)
    }
  }, [error, touched])

  const hasError = touched && error
  const hasSuccess = touched && success && !error

  return (
    <div className={['space-y-1.5', className].join(' ')}>
      {label && (
        <label className="block text-sm font-medium text-[#06245B]">
          {label}
        </label>
      )}
      <div className="relative">
        <div
          key={shakeKey}
          className={[
            'relative',
            hasError && 'animate-inputShake',
            'transition-all duration-200',
          ].join(' ')}
        >
          {children}
          {/* Success checkmark icon */}
          {hasSuccess && (
            <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none animate-successScale">
              <CheckCircle2 size={20} className="text-[#10B981]" strokeWidth={2.5} />
            </div>
          )}
          {/* Error icon */}
          {hasError && (
            <div className="absolute inset-y-0 end-3 flex items-center pointer-events-none">
              <XCircle size={20} className="text-[#EF4444]" strokeWidth={2.5} />
            </div>
          )}
        </div>
        {/* Error message with slide-in animation */}
        {hasError && (
          <p className="text-sm text-[#EF4444] mt-1 animate-slideDown">
            {error}
          </p>
        )}
        {/* Success message with slide-in animation */}
        {hasSuccess && (
          <p className="text-sm text-[#10B981] mt-1 animate-slideDown">
            {success}
          </p>
        )}
      </div>
    </div>
  )
}

/**
 * SUBMIT BUTTON WITH STATE FEEDBACK
 * Button that automatically shows loading, success, and error states
 * with appropriate animations and color transitions
 */
export function FeedbackButton({
  children,
  state = 'idle', // 'idle' | 'loading' | 'success' | 'error'
  variant = 'primary',
  className = '',
  onClick,
  ...props
}) {
  const [displayText, setDisplayText] = useState(children)

  useEffect(() => {
    if (state === 'success' || state === 'error') {
      // Keep the state for 2 seconds before reverting
      const timer = setTimeout(() => {
        setDisplayText(children)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setDisplayText(children)
    }
  }, [state, children])

  const getButtonClasses = () => {
    const baseClasses = [
      'relative inline-flex items-center justify-center gap-2',
      'px-6 py-2.5 rounded-xl font-semibold text-sm',
      'transition-all duration-200',
      'focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      className,
    ]

    // State-specific classes
    switch (state) {
      case 'loading':
        return [...baseClasses, 'bg-[#64748B] text-white cursor-wait'].join(' ')
      case 'success':
        return [
          ...baseClasses,
          'bg-[#10B981] text-white',
          'animate-successPulse',
        ].join(' ')
      case 'error':
        return [
          ...baseClasses,
          'bg-[#EF4444] text-white',
          'animate-errorShake',
        ].join(' ')
      default:
        // Variant classes for idle state
        if (variant === 'primary') {
          return [
            ...baseClasses,
            'bg-[#00D9F5] text-[#06245B] hover:bg-[#00C4DE]',
            'shadow-sm hover:shadow-md',
          ].join(' ')
        } else if (variant === 'secondary') {
          return [
            ...baseClasses,
            'bg-[#06245B] text-white hover:bg-[#123878]',
            'shadow-sm hover:shadow-md',
          ].join(' ')
        }
        return baseClasses.join(' ')
    }
  }

  const getIconComponent = () => {
    switch (state) {
      case 'loading':
        return (
          <svg
            className="w-4 h-4 animate-spin"
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
        )
      case 'success':
        return <CheckCircle2 size={18} strokeWidth={2.5} />
      case 'error':
        return <XCircle size={18} strokeWidth={2.5} />
      default:
        return null
    }
  }

  return (
    <button
      type="button"
      className={getButtonClasses()}
      disabled={state === 'loading' || state === 'success'}
      onClick={onClick}
      {...props}
    >
      {getIconComponent()}
      <span>{displayText}</span>
    </button>
  )
}

/**
 * COLOR TRANSITION WRAPPER
 * Wraps elements with smooth color transitions
 * Used for highlighting changes or drawing attention
 */
export function ColorTransition({
  children,
  trigger,
  highlightColor = '#EAF4FF',
  duration = 1000,
  className = '',
}) {
  const [isHighlighted, setIsHighlighted] = useState(false)

  useEffect(() => {
    if (trigger) {
      setIsHighlighted(true)
      const timer = setTimeout(() => setIsHighlighted(false), duration)
      return () => clearTimeout(timer)
    }
  }, [trigger, duration])

  return (
    <div
      className={[
        'transition-colors',
        isHighlighted ? 'bg-opacity-100' : 'bg-opacity-0',
        className,
      ].join(' ')}
      style={{
        backgroundColor: isHighlighted ? highlightColor : 'transparent',
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  )
}

export default {
  SuccessCheckmark,
  ErrorShake,
  WarningPulse,
  AnimatedFeedback,
  ValidatedInput,
  FeedbackButton,
  ColorTransition,
}
