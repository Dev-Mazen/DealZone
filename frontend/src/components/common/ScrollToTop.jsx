import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Reusable ScrollToTop component
 * - Resets window scroll position to the top upon route changes.
 * - Uses smooth scrolling while respecting user's prefers-reduced-motion preference.
 * - Handles nested route transitions cleanly.
 * - Preserves intentional in-page anchor links (e.g. #section-id).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    // If navigating to an anchor hash within the page, scroll smoothly to the element
    if (hash) {
      const id = hash.replace(/^#/, '')
      const targetElement = document.getElementById(id) || document.querySelector(hash)
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    // Check user motion preferences
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const behavior = prefersReducedMotion ? 'auto' : 'smooth'

    // Scroll window to top
    if (typeof window !== 'undefined') {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior,
      })
    }
  }, [pathname, hash])

  return null
}

