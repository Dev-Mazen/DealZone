import { useEffect, useRef, useState } from 'react';

/**
 * EntranceAnimation Component
 * 
 * Triggers smooth entrance animations when elements enter the viewport using the Intersection Observer API.
 * Supports multiple animation directions, stagger delays, and respects user motion preferences.
 * 
 * **Validates: Requirements 3.1, 3.7**
 * 
 * @component
 * @example
 * // Basic fade-in animation
 * <EntranceAnimation>
 *   <div>Content to animate</div>
 * </EntranceAnimation>
 * 
 * @example
 * // Slide up with delay for stagger effect
 * <EntranceAnimation direction="up" delay={200}>
 *   <div>Staggered content</div>
 * </EntranceAnimation>
 * 
 * @example
 * // Multiple items with sequential stagger
 * {items.map((item, index) => (
 *   <EntranceAnimation key={item.id} direction="right" delay={index * 100}>
 *     <Card>{item.content}</Card>
 *   </EntranceAnimation>
 * ))}
 */
function EntranceAnimation({ 
  children, 
  delay = 0, 
  direction = 'fade',
  threshold = 0.1,
  rootMargin = '0px',
  triggerOnce = true,
  className = ''
}) {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer setup
  useEffect(() => {
    const element = elementRef.current;
    if (!element || prefersReducedMotion) {
      // If reduced motion is preferred, show immediately
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply delay before triggering animation
            setTimeout(() => {
              setIsVisible(true);
            }, delay);

            // Disconnect observer if triggerOnce is true
            if (triggerOnce) {
              observer.unobserve(element);
            }
          } else if (!triggerOnce) {
            setIsVisible(false);
          }
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(element);

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, [delay, threshold, rootMargin, triggerOnce, prefersReducedMotion]);

  // Get animation classes based on direction
  const getAnimationClasses = () => {
    if (prefersReducedMotion) {
      return 'opacity-100 translate-x-0 translate-y-0';
    }

    const baseClasses = 'transition-all duration-700 ease-out';
    
    if (!isVisible) {
      switch (direction) {
        case 'up':
          return `${baseClasses} opacity-0 translate-y-10`;
        case 'down':
          return `${baseClasses} opacity-0 -translate-y-10`;
        case 'left':
          return `${baseClasses} opacity-0 translate-x-10`;
        case 'right':
          return `${baseClasses} opacity-0 -translate-x-10`;
        case 'fade':
        default:
          return `${baseClasses} opacity-0`;
      }
    }

    return `${baseClasses} opacity-100 translate-x-0 translate-y-0`;
  };

  return (
    <div 
      ref={elementRef} 
      className={`${getAnimationClasses()} ${className}`}
    >
      {children}
    </div>
  );
}

export default EntranceAnimation;
