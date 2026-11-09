import { useEffect, useState } from 'react'
import './PageTransition.css'

/**
 * PageTransition wrapper component
 * Implements smooth fade-in and slide-up animations for route-level page components
 * 
 * Animations:
 * - Fade-in: opacity 0 → 1, duration 200ms
 * - Slide-up: translateY 8px → 0, duration 200ms
 * 
 * Respects prefers-reduced-motion media query for accessibility.
 * Robust design: never leaves content invisible or stuck at opacity: 0.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to animate
 * @param {string} props.className - Optional extra classes
 */
const PageTransition = ({ children, className = '' }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Ensure visibility is always active
    setIsVisible(true)
  }, [])

  return (
    <div className={`page-transition ${isVisible ? 'page-transition-enter' : ''} ${className}`}>
      {children}
    </div>
  )
}

export default PageTransition
