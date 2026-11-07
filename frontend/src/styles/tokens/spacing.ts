/**
 * DealZone Design Tokens - Spacing, Shadows, and Border Radii
 * 
 * This file defines the spacing scale, shadows, and border radius values
 * for consistent layout and visual depth throughout the application.
 */

export const spacing = {
  // Spacing Scale (in rem)
  scale: {
    0: '0',
    1: '0.25rem',   // 4px
    2: '0.5rem',    // 8px
    3: '0.75rem',   // 12px
    4: '1rem',      // 16px
    5: '1.25rem',   // 20px
    6: '1.5rem',    // 24px
    8: '2rem',      // 32px
    10: '2.5rem',   // 40px
    12: '3rem',     // 48px
    16: '4rem',     // 64px
    20: '5rem',     // 80px
    24: '6rem',     // 96px
  },
  
  // Border Radii
  radii: {
    none: '0',
    sm: '0.25rem',    // 4px - small elements
    md: '0.5rem',     // 8px - cards, inputs (primary use)
    lg: '0.75rem',    // 12px - modals, containers
    xl: '1rem',       // 16px - large cards
    '2xl': '1.5rem',  // 24px - hero sections
    full: '9999px',   // Full border radius - pills, badges, circular elements
  },
  
  // Shadows - soft diffuse shadows for elevation
  shadows: {
    // Basic shadows
    sm: '0 1px 2px 0 rgba(6, 36, 91, 0.05)',
    md: '0 4px 6px -1px rgba(6, 36, 91, 0.08), 0 2px 4px -2px rgba(6, 36, 91, 0.06)',
    lg: '0 10px 15px -3px rgba(6, 36, 91, 0.08), 0 4px 6px -4px rgba(6, 36, 91, 0.05)',
    xl: '0 20px 25px -5px rgba(6, 36, 91, 0.10), 0 8px 10px -6px rgba(6, 36, 91, 0.06)',
    
    // Specialized shadows
    soft: '0 4px 20px -2px rgba(6, 36, 91, 0.08)',      // Subtle elevation
    card: '0 2px 8px -1px rgba(6, 36, 91, 0.06)',       // Card hover state
    modal: '0 8px 32px -4px rgba(6, 36, 91, 0.12)',     // Modal/dialog overlay
    brand: '0 4px 20px -2px rgba(6, 36, 91, 0.12)',     // Branded element emphasis
    
    // No shadow
    none: 'none',
  },
  
  // Transitions - animation timing
  transitions: {
    fast: '150ms ease',
    base: '250ms ease',
    slow: '400ms ease',
  },
  
  // Z-Index Layers
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    overlay: 1040,
    modal: 1050,
    popover: 1060,
    toast: 1070,
  },
} as const;

// Type-safe spacing keys
export type SpacingScale = keyof typeof spacing.scale;
export type BorderRadius = keyof typeof spacing.radii;
export type Shadow = keyof typeof spacing.shadows;
export type ZIndex = keyof typeof spacing.zIndex;
