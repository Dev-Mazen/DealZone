# DealZone Design Tokens

This directory contains the official DealZone design system tokens - the foundational design values that ensure consistent visual identity across the entire application.

## 📁 File Structure

```
tokens/
├── colors.ts       # Brand colors, status colors, text colors, gradients
├── typography.ts   # Font families, sizes, fluid typography, weights
├── spacing.ts      # Spacing scale, shadows, border radii, z-index
├── breakpoints.ts  # Responsive breakpoints and device categories
└── index.ts        # Central export of all tokens
```

## 🎨 Design Token Categories

### 1. Colors (`colors.ts`)

Official DealZone brand colors based on the Brand Identity Guidelines.

```typescript
import { colors } from '@/styles/tokens';

// Primary Brand Colors
colors.primary.navy       // #06245B - Main brand color
colors.primary.cyan       // #00D9F5 - Primary CTAs
colors.primary.growthBlue // #1266D6 - Interactive links
colors.primary.white      // #FFFFFF - Pure white

// Secondary Colors
colors.secondary.iceBlue    // #EAF4FF - Light backgrounds
colors.secondary.cloudGray  // #F4F7FB - Canvas background
colors.secondary.slateGray  // #64748B - Secondary text
colors.secondary.deepBlue   // #123878 - Dark hover states

// Status Colors
colors.status.success // #10B981 - Approved, confirmed
colors.status.warning // #F59E0B - Pending, awaiting
colors.status.error   // #EF4444 - Rejected, failed
colors.status.info    // #3B82F6 - Informational

// Gradients
colors.gradients.digital // 135deg, navy → blue → cyan
colors.gradients.trust   // 180deg, dark → navy → blue
colors.gradients.hero    // 135deg, navy → deep → blue
```

### 2. Typography (`typography.ts`)

Font families, sizes, and responsive fluid typography using CSS `clamp()`.

```typescript
import { typography } from '@/styles/tokens';

// Font Families
typography.fontFamily.latin  // 'Inter' for English
typography.fontFamily.arabic // 'Cairo' for Arabic

// Fixed Typography Sizes
typography.sizes.h1    // 32px / 40px / Bold
typography.sizes.h2    // 24px / 32px / Semibold
typography.sizes.h3    // 20px / 28px / Semibold
typography.sizes.body  // 16px / 24px / Regular
typography.sizes.small // 14px / 20px / Regular
typography.sizes.micro // 12px / 16px / Medium

// Fluid Typography (Responsive)
typography.fluid.h1    // clamp(24px → 32px)
typography.fluid.h2    // clamp(20px → 24px)
typography.fluid.h3    // clamp(18px → 20px)
typography.fluid.body  // clamp(14px → 16px)

// Font Weights
typography.fontWeight.light     // 300
typography.fontWeight.regular   // 400
typography.fontWeight.semibold  // 600
typography.fontWeight.bold      // 700
```

### 3. Spacing & Shadows (`spacing.ts`)

Spacing scale, border radii, shadows, and z-index layers.

```typescript
import { spacing } from '@/styles/tokens';

// Spacing Scale
spacing.scale[0]  // 0
spacing.scale[4]  // 1rem (16px)
spacing.scale[6]  // 1.5rem (24px)
spacing.scale[8]  // 2rem (32px)

// Border Radii
spacing.radii.sm   // 4px - small elements
spacing.radii.md   // 8px - cards, inputs ⭐ PRIMARY
spacing.radii.lg   // 12px - modals, containers
spacing.radii.full // 9999px - pills, badges

// Shadows
spacing.shadows.soft   // Subtle elevation
spacing.shadows.card   // Card hover state
spacing.shadows.modal  // Dialog overlay
spacing.shadows.brand  // Branded emphasis

// Z-Index Layers
spacing.zIndex.dropdown // 1000
spacing.zIndex.modal    // 1050
spacing.zIndex.toast    // 1070
```

### 4. Breakpoints (`breakpoints.ts`)

Responsive breakpoints for mobile-first design.

```typescript
import { breakpoints } from '@/styles/tokens';

// Breakpoint Values
breakpoints.values.sm   // 640px
breakpoints.values.md   // 768px  ⭐ MOBILE/DESKTOP SPLIT
breakpoints.values.lg   // 1024px
breakpoints.values.xl   // 1280px
breakpoints.values['2xl'] // 1536px

// Media Query Strings
breakpoints.media.md // '@media (min-width: 768px)'

// Container Max Widths
breakpoints.containers.lg // '1024px'
```

## 🛠️ Usage Examples

### Using in React Components

```tsx
import { colors, typography, spacing } from '@/styles/tokens';

// Inline styles (not recommended, use Tailwind instead)
const buttonStyle = {
  backgroundColor: colors.primary.cyan,
  borderRadius: spacing.radii.md,
  fontSize: typography.fluid.body,
  padding: `${spacing.scale[3]} ${spacing.scale[6]}`,
};

// Conditional styling
const statusColor = status === 'approved' 
  ? colors.status.success 
  : colors.status.warning;
```

### Using with Tailwind CSS

The design tokens are automatically available in Tailwind through the `@theme` directive in `globals.css`:

```tsx
// Colors
<div className="bg-[--color-navy] text-[--color-cyan]" />

// Typography
<h1 className="text-[length:--font-size-h1] font-[--font-weight-bold]" />

// Spacing & Radii
<div className="p-[--spacing-6] rounded-[--radius-md]" />

// Shadows
<div className="shadow-[--shadow-card]" />
```

### Fluid Typography in CSS

```css
.hero-title {
  font-size: var(--font-size-h1); /* Responsive clamp() */
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
}
```

## 📏 Responsive Design Strategy

### Mobile-First Approach

All breakpoints cascade upward from mobile:

1. **Base styles** = Mobile (320px - 639px)
2. **sm:** = Large phones (640px+)
3. **md:** = Tablets (768px+) ⭐ **MOBILE/DESKTOP SPLIT**
4. **lg:** = Laptops (1024px+)
5. **xl:** = Desktops (1280px+)
6. **2xl:** = Large displays (1536px+)

### Common Patterns

```tsx
// Stack on mobile, grid on desktop
<div className="flex flex-col md:grid md:grid-cols-2 gap-4">

// Hide on mobile, show on desktop
<div className="hidden md:block">

// Full width on mobile, constrained on desktop
<div className="w-full lg:max-w-screen-lg mx-auto">
```

## 🎯 Design Principles

### Color Distribution (60-30-10 Rule)

- **60%** - Canvas/White backgrounds (cloudGray, white)
- **30%** - Brand Navy/Slate (text, structure)
- **10%** - Cyan/Action (accents, CTAs)

### Typography Hierarchy

- **H1**: Hero sections, page titles
- **H2**: Section headings
- **H3**: Card titles, subsections
- **Body**: Main content
- **Small**: Supporting text, captions
- **Micro**: Labels, meta info

### Shadow Hierarchy

- **soft**: Resting state cards
- **card**: Hover state elevation
- **modal**: Overlays and dialogs
- **brand**: Special emphasis elements

## 🔒 Type Safety

All design tokens are fully typed for TypeScript autocomplete and type checking:

```typescript
import type { 
  PrimaryColor,
  TypographySize,
  BorderRadius,
  Breakpoint 
} from '@/styles/tokens';

const primaryColor: PrimaryColor = 'navy'; // ✅ Type-safe
const invalidColor: PrimaryColor = 'orange'; // ❌ Type error
```

## 📖 Related Files

- **`globals.css`** - Base styles and Tailwind theme configuration
- **`vite.config.js`** - Path aliases (`@/` resolves to `src/`)
- **`index.html`** - Font loading (Cairo + Inter from Google Fonts)

## 🚀 Best Practices

1. **Always use design tokens** instead of hardcoded values
2. **Prefer Tailwind CSS** over inline styles
3. **Use fluid typography** for responsive text scaling
4. **Follow the 60-30-10 color rule** for balanced designs
5. **Maintain consistent spacing** using the spacing scale
6. **Use semantic status colors** for user feedback

---

**Last Updated**: Design System Foundation Setup
**Spec Requirements**: 1.1, 1.2, 1.3, 1.7, 7.1, 7.12
