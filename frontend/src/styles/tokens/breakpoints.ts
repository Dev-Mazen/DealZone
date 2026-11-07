/**
 * DealZone Design Tokens - Responsive Breakpoints
 * 
 * This file defines the responsive breakpoint system for mobile-first design.
 * All breakpoints are mobile-first, meaning styles cascade upward.
 */

export const breakpoints = {
  // Breakpoint values in pixels
  values: {
    sm: 640,   // Small smartphones and up
    md: 768,   // Tablets and up
    lg: 1024,  // Small laptops and up
    xl: 1280,  // Desktops and up
    '2xl': 1536, // Large desktops and 4K displays
  },
  
  // Media query strings for use in styled components or JS
  media: {
    sm: '@media (min-width: 640px)',
    md: '@media (min-width: 768px)',
    lg: '@media (min-width: 1024px)',
    xl: '@media (min-width: 1280px)',
    '2xl': '@media (min-width: 1536px)',
  },
  
  // Max-width container sizes per breakpoint
  containers: {
    sm: '640px',   // max-w-screen-sm
    md: '768px',   // max-w-screen-md
    lg: '1024px',  // max-w-screen-lg
    xl: '1280px',  // max-w-screen-xl
    '2xl': '1536px', // max-w-screen-2xl
    full: '100%',  // max-w-full
  },
} as const;

// Type-safe breakpoint keys
export type Breakpoint = keyof typeof breakpoints.values;

// Device categories for reference
export const devices = {
  mobile: {
    small: '320px - 374px',   // iPhone SE, small Android phones
    medium: '375px - 639px',  // iPhone 12, 13, 14
  },
  tablet: {
    small: '640px - 767px',   // Large phones landscape
    medium: '768px - 1023px', // iPad Mini, standard tablets
  },
  desktop: {
    small: '1024px - 1279px', // Small laptops, iPad Pro landscape
    medium: '1280px - 1535px', // Standard desktops
    large: '1536px+',          // Large desktops, 4K displays
  },
} as const;
