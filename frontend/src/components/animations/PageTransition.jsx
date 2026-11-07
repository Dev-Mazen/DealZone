import { useEffect, useState } from 'react'
import './PageTransition.css'

/**
 * PageTransition wrapper component
 * Implements smooth fade-in and slide-up animations for route-level page components
 * 
 * Animations:
 * - Fade-in: opacity 0 → 1, duration 200ms
 * - Slide-up: translateY 10px → 0, duration 200ms
 * 
 * Respects prefers-reduced-motion media query for accessibility
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Page content to animate
 */
const PageTransition = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Trigger animation on mount
    setIsVisible(true)

    // Reset animation state when component unmounts (route change)
    return () => setIsVisible(false)
  }, [])

  return (
    <div className={`page-transition ${isVisible ? 'page-transition-enter' : ''}`}>
      {children}
    </div>
  )
}

export default PageTransition
