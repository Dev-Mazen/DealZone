/**
 * DealZone Design Tokens - Typography System
 * 
 * This file defines the typography scale, font families, and fluid typography
 * for responsive text scaling across all viewport sizes.
 */

export const typography = {
  // Font Families
  fontFamily: {
    arabic: "'Cairo', 'Tahoma', 'Arial', sans-serif",
    latin: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  
  // Fixed Typography Scale
  sizes: {
    h1: {
      fontSize: '32px',
      lineHeight: '40px',
      fontWeight: '700', // Bold
    },
    h2: {
      fontSize: '24px',
      lineHeight: '32px',
      fontWeight: '600', // Semibold
    },
    h3: {
      fontSize: '20px',
      lineHeight: '28px',
      fontWeight: '600', // Semibold
    },
    h4: {
      fontSize: '18px',
      lineHeight: '26px',
      fontWeight: '600', // Semibold
    },
    body: {
      fontSize: '16px',
      lineHeight: '24px',
      fontWeight: '400', // Regular
    },
    small: {
      fontSize: '14px',
      lineHeight: '20px',
      fontWeight: '400', // Regular
    },
    micro: {
      fontSize: '12px',
      lineHeight: '16px',
      fontWeight: '500', // Medium
    },
  },
  
  // Fluid Typography using clamp() for responsive text scaling
  // These scale smoothly between viewport sizes
  fluid: {
    // H1: scales from 24px (mobile) to 32px (desktop)
    h1: 'clamp(1.5rem, 2vw + 1rem, 2rem)',
    
    // H2: scales from 20px (mobile) to 24px (desktop)
    h2: 'clamp(1.25rem, 1.5vw + 0.75rem, 1.5rem)',
    
    // H3: scales from 18px (mobile) to 20px (desktop)
    h3: 'clamp(1.125rem, 1vw + 0.625rem, 1.25rem)',
    
    // H4: scales from 16px (mobile) to 18px (desktop)
    h4: 'clamp(1rem, 0.75vw + 0.5rem, 1.125rem)',
    
    // Body: scales from 14px (mobile) to 16px (desktop)
    body: 'clamp(0.875rem, 0.5vw + 0.5rem, 1rem)',
    
    // Small: scales from 12px (mobile) to 14px (desktop)
    small: 'clamp(0.75rem, 0.5vw + 0.375rem, 0.875rem)',
    
    // Micro: stays consistent at 12px
    micro: '0.75rem',
  },
  
  // Font Weights
  fontWeight: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Line Heights
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
    loose: '2',
  },
  
  // Letter Spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// Type-safe typography keys
export type TypographySize = keyof typeof typography.sizes;
export type FluidSize = keyof typeof typography.fluid;
export type FontWeight = keyof typeof typography.fontWeight;
