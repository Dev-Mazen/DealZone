import { forwardRef } from 'react'

/**
 * Container Component
 * 
 * A flexible, responsive container component for consistent page layouts.
 * Provides size variants with max-width constraints, centered alignment,
 * and responsive horizontal padding.
 * 
 * @param {Object} props - Component props
 * @param {'sm'|'md'|'lg'|'xl'|'full'} props.size - Container size variant
 * @param {React.ReactNode} props.children - Container content
 * @param {string} props.className - Additional CSS classes
 * 
 * Requirements: 7.1, 7.11
 */

const sizeVariants = {
  sm: 'max-w-screen-sm',   // 640px
  md: 'max-w-screen-md',   // 768px
  lg: 'max-w-screen-lg',   // 1024px
  xl: 'max-w-screen-xl',   // 1280px
  full: 'max-w-screen-2xl', // 1536px
}

const Container = forwardRef(
  (
    {
      size = 'xl',
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={[
          // Base styles
          'w-full mx-auto',
          // Max-width constraint based on size variant
          sizeVariants[size],
          // Responsive horizontal padding
          'px-4 sm:px-6 lg:px-8',
          // Additional classes
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Container.displayName = 'Container'

export default Container
