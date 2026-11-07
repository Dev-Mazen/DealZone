import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

/**
 * SearchBar Component - DealZone UI Library
 * 
 * A reusable search input component with debouncing, clear functionality,
 * loading indicator, and keyboard navigation support.
 * 
 * Features:
 * - Debounced search input (configurable delay, default 300ms)
 * - Search icon and clear button with smooth transitions
 * - Loading indicator during search operations
 * - Keyboard navigation support (Escape to clear, Enter to submit)
 * - Accessibility features (ARIA labels, keyboard support)
 * - DealZone design system integration
 * - Responsive design with proper focus states
 * 
 * @component
 * @example
 * <SearchBar
 *   placeholder="Search products..."
 *   onSearch={(query) => console.log('Searching:', query)}
 *   debounceDelay={300}
 *   isLoading={false}
 * />
 */
const SearchBar = ({
  placeholder = 'Search...',
  onSearch,
  onClear,
  debounceDelay = 300,
  isLoading = false,
  defaultValue = '',
  className = '',
  size = 'md',
  disabled = false,
  autoFocus = false,
  minLength = 0,
  maxLength,
  'aria-label': ariaLabel = 'Search',
}) => {
  const [value, setValue] = useState(defaultValue)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef(null)
  const debounceTimerRef = useRef(null)

  // Handle input change with debouncing
  const handleInputChange = useCallback(
    (e) => {
      const newValue = e.target.value
      setValue(newValue)

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      // Set new timer for debounced search
      debounceTimerRef.current = setTimeout(() => {
        if (onSearch && newValue.length >= minLength) {
          onSearch(newValue)
        } else if (onSearch && newValue.length === 0) {
          // Trigger search with empty string when cleared
          onSearch('')
        }
      }, debounceDelay)
    },
    [onSearch, debounceDelay, minLength]
  )

  // Handle clear button click
  const handleClear = useCallback(() => {
    setValue('')
    
    // Clear debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    // Trigger immediate search with empty value
    if (onSearch) {
      onSearch('')
    }

    // Trigger onClear callback if provided
    if (onClear) {
      onClear()
    }

    // Return focus to input
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [onSearch, onClear])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e) => {
      // Escape key clears the search
      if (e.key === 'Escape' && value) {
        e.preventDefault()
        handleClear()
      }
      
      // Enter key triggers immediate search (cancels debounce)
      if (e.key === 'Enter') {
        e.preventDefault()
        
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        
        if (onSearch && value.length >= minLength) {
          onSearch(value)
        }
      }
    },
    [value, handleClear, onSearch, minLength]
  )

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  // Size variants
  const sizeClasses = {
    sm: 'h-9 text-sm',
    md: 'h-10 text-base',
    lg: 'h-12 text-base',
  }

  const iconSizeMap = {
    sm: 16,
    md: 18,
    lg: 20,
  }

  const iconSize = iconSizeMap[size]

  // Show clear button when there's a value and not loading
  const showClearButton = value.length > 0 && !isLoading

  return (
    <div className={['relative flex items-center w-full', className].filter(Boolean).join(' ')}>
      {/* Search icon - always visible on left */}
      <span
        className={[
          'absolute start-3 text-[#64748B] pointer-events-none z-10 flex items-center transition-colors',
          isFocused && 'text-[#00D9F5]',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-hidden="true"
      >
        <Search size={iconSize} />
      </span>

      {/* Input field */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled || isLoading}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        aria-label={ariaLabel}
        aria-busy={isLoading}
        className={[
          // Base styles
          'w-full rounded-lg border bg-white text-[#1E293B] transition-all duration-150',
          sizeClasses[size],
          // Padding for icons
          'ps-10', // Left padding for search icon
          showClearButton || isLoading ? 'pe-10' : 'pe-3', // Right padding for clear/loading
          // Placeholder styles
          'placeholder:text-[#94A3B8]',
          // Focus states with cyan ring (DealZone brand color)
          'focus:outline-none focus:ring-2 focus:ring-[#00D9F5] focus:border-[#00D9F5]',
          // Normal border
          'border-[#E2E8F0] hover:border-[#CBD5E1]',
          // Disabled state
          disabled || isLoading
            ? 'opacity-60 cursor-not-allowed bg-[#F8FAFC] text-[#94A3B8]'
            : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Right side: Loading spinner or Clear button */}
      <div className="absolute end-3 flex items-center z-10">
        {isLoading && (
          <span className="text-[#00D9F5] animate-spin flex items-center" aria-label="Loading">
            <Loader2 size={iconSize} />
          </span>
        )}

        {showClearButton && (
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled}
            aria-label="Clear search"
            className={[
              'text-[#64748B] hover:text-[#EF4444] transition-colors duration-150',
              'focus:outline-none focus:text-[#EF4444]',
              'flex items-center justify-center',
              'rounded-full hover:bg-[#F1F5F9] p-0.5',
              disabled && 'cursor-not-allowed opacity-50',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <X size={iconSize} />
          </button>
        )}
      </div>

      {/* Screen reader live region for search status */}
      <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && 'Searching...'}
        {!isLoading && value && `Search results for: ${value}`}
        {!value && 'Search cleared'}
      </span>
    </div>
  )
}

export default SearchBar
