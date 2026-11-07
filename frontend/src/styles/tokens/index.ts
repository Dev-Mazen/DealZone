/**
 * DealZone Design Tokens - Main Export
 * 
 * Centralized export of all design tokens for easy import throughout the application.
 * Import as: import { colors, typography, spacing, breakpoints } from '@/styles/tokens'
 */

export { colors } from './colors';
export { typography } from './typography';
export { spacing } from './spacing';
export { breakpoints, devices } from './breakpoints';

// Export types
export type {
  ColorKey,
  PrimaryColor,
  SecondaryColor,
  StatusColor,
} from './colors';

export type {
  TypographySize,
  FluidSize,
  FontWeight,
} from './typography';

export type {
  SpacingScale,
  BorderRadius,
  Shadow,
  ZIndex,
} from './spacing';

export type {
  Breakpoint,
} from './breakpoints';
