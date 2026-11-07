/**
 * DealZone Design Tokens - Color Palette
 * 
 * This file defines the official DealZone brand colors and their usage.
 * Based on the Brand Identity Guidelines for consistent visual identity.
 */

export const colors = {
  // Primary Brand Colors
  primary: {
    navy: '#06245B',      // DealZone Navy - Main brand color, headers, navigation
    cyan: '#00D9F5',      // DealZone Cyan - Primary CTAs, active states, links
    growthBlue: '#1266D6', // Growth Blue - Interactive links, secondary CTAs
    white: '#FFFFFF',      // Pure white - text on dark backgrounds, card backgrounds
  },
  
  // Secondary Colors
  secondary: {
    iceBlue: '#EAF4FF',    // Light backgrounds, badge fills, hover states
    cloudGray: '#F4F7FB',  // Main canvas background, subtle backgrounds
    slateGray: '#64748B',  // Secondary text, labels, disabled states
    deepBlue: '#123878',   // Dark hover states, emphasis
  },
  
  // Status Colors
  status: {
    success: '#10B981',    // Approved, confirmed, delivered, success messages
    warning: '#F59E0B',    // Pending, awaiting, warning messages
    error: '#EF4444',      // Rejected, disputed, failed, error messages
    info: '#3B82F6',       // Informational messages, in-transit status
  },
  
  // Gradients
  gradients: {
    digital: 'linear-gradient(135deg, #06245B 0%, #1266D6 50%, #00D9F5 100%)',
    trust: 'linear-gradient(180deg, #041638 0%, #06245B 60%, #164B91 100%)',
    hero: 'linear-gradient(135deg, #06245B 0%, #123878 60%, #1266D6 100%)',
  },
  
  // Text Colors
  text: {
    primary: '#1E293B',    // Primary text color
    secondary: '#64748B',  // Secondary text, descriptions
    muted: '#94A3B8',      // Muted text, placeholders
    inverse: '#FFFFFF',    // Text on dark backgrounds
  },
} as const;

// Type-safe color keys
export type ColorKey = keyof typeof colors;
export type PrimaryColor = keyof typeof colors.primary;
export type SecondaryColor = keyof typeof colors.secondary;
export type StatusColor = keyof typeof colors.status;
