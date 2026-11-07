# DealZone Design System - Quick Reference Guide

This guide provides a visual reference for the DealZone design system implementation.

## 🎨 Color Palette

### Primary Brand Colors

```
Navy         #06245B  ██████  Main brand color, headers, navigation
Cyan         #00D9F5  ██████  Primary CTAs, active states
Growth Blue  #1266D6  ██████  Interactive links, secondary CTAs
White        #FFFFFF  ██████  Text on dark, card backgrounds
```

### Secondary Colors

```
Ice Blue     #EAF4FF  ██████  Light backgrounds, badge fills
Cloud Gray   #F4F7FB  ██████  Main canvas background
Slate Gray   #64748B  ██████  Secondary text, labels
Deep Blue    #123878  ██████  Dark hover states
```

### Status Colors

```
Success      #10B981  ██████  Approved, confirmed, delivered
Warning      #F59E0B  ██████  Pending, awaiting
Error        #EF4444  ██████  Rejected, disputed, failed
Info         #3B82F6  ██████  Informational, in-transit
```

## 📝 Typography

### Font Families

- **English**: Inter (sans-serif)
- **Arabic**: Cairo (sans-serif)

Both fonts are loaded via Google Fonts CDN in `index.html`.

### Typography Scale

| Size  | Desktop     | Mobile      | Weight   | Usage                    |
|-------|-------------|-------------|----------|--------------------------|
| H1    | 32px/40px   | 24px/32px   | Bold     | Hero titles, page titles |
| H2    | 24px/32px   | 20px/28px   | Semibold | Section headings         |
| H3    | 20px/28px   | 18px/26px   | Semibold | Card titles, subsections |
| H4    | 18px/26px   | 16px/24px   | Semibold | Small headings           |
| Body  | 16px/24px   | 14px/20px   | Regular  | Main content             |
| Small | 14px/20px   | 12px/18px   | Regular  | Supporting text          |
| Micro | 12px/16px   | 12px/16px   | Medium   | Labels, meta info        |

### Fluid Typography

All typography uses CSS `clamp()` for smooth responsive scaling:

```css
/* H1 scales from 24px on mobile to 32px on desktop */
font-size: clamp(1.5rem, 2vw + 1rem, 2rem);
```

## 📐 Spacing Scale

| Token | Value  | Pixels | Common Usage                    |
|-------|--------|--------|---------------------------------|
| 0     | 0      | 0px    | No spacing                      |
| 1     | 0.25rem| 4px    | Tight spacing, icon gaps        |
| 2     | 0.5rem | 8px    | Small padding, compact elements |
| 3     | 0.75rem| 12px   | Default gap between elements    |
| 4     | 1rem   | 16px   | Standard padding                |
| 6     | 1.5rem | 24px   | Section spacing                 |
| 8     | 2rem   | 32px   | Large component spacing         |
| 12    | 3rem   | 48px   | Section margins                 |
| 16    | 4rem   | 64px   | Page section spacing            |

## 🔘 Border Radius

| Size   | Value     | Usage                              |
|--------|-----------|-----------------------------------|
| sm     | 0.25rem   | Small elements, tight corners     |
| md     | 0.5rem    | **Cards, inputs** (primary)       |
| lg     | 0.75rem   | Modals, containers                |
| xl     | 1rem      | Large cards, hero sections        |
| 2xl    | 1.5rem    | Extra large containers            |
| full   | 9999px    | Pills, badges, circular elements  |

## 🌑 Shadows

| Name   | Usage                          | CSS Value                                         |
|--------|--------------------------------|--------------------------------------------------|
| soft   | Subtle card elevation          | 0 4px 20px -2px rgba(6, 36, 91, 0.08)           |
| card   | Card hover state               | 0 2px 8px -1px rgba(6, 36, 91, 0.06)            |
| modal  | Dialog and modal overlays      | 0 8px 32px -4px rgba(6, 36, 91, 0.12)           |
| brand  | Special branded elements       | 0 4px 20px -2px rgba(6, 36, 91, 0.12)           |

## 📱 Responsive Breakpoints

| Breakpoint | Min Width | Device Category           |
|------------|-----------|---------------------------|
| sm         | 640px     | Large phones              |
| md         | 768px     | **Tablets** (mobile split)|
| lg         | 1024px    | Small laptops             |
| xl         | 1280px    | Desktops                  |
| 2xl        | 1536px    | Large displays, 4K        |

### Key Viewport Sizes

```
Mobile Small     320px - 639px   (Base styles)
Mobile Large     640px - 767px   (sm breakpoint)
Tablet           768px - 1023px  (md breakpoint)
Laptop           1024px - 1279px (lg breakpoint)
Desktop          1280px - 1535px (xl breakpoint)
Large Desktop    1536px+         (2xl breakpoint)
```

## 🎭 Component Examples

### Button

```tsx
// Primary button (Cyan background)
<button className="bg-[--color-cyan] text-white px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md] hover:bg-[--color-blue] transition-[--transition-base]">
  Submit
</button>

// Secondary button (Ice Blue background)
<button className="bg-[--color-ice-blue] text-[--color-navy] px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md]">
  Cancel
</button>
```

### Card

```tsx
<div className="bg-white rounded-[--radius-xl] shadow-[--shadow-soft] p-[--spacing-6] hover:shadow-[--shadow-card] transition-[--transition-base]">
  <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy]">
    Card Title
  </h3>
  <p className="text-[length:--font-size-body] text-[--color-text-secondary] mt-[--spacing-2]">
    Card content goes here
  </p>
</div>
```

### Badge

```tsx
// Success badge
<span className="inline-flex items-center gap-[--spacing-1] px-[--spacing-2] py-[0.125rem] rounded-[--radius-full] bg-[#10B98114] text-[#059669] text-[length:--font-size-micro] font-[--font-weight-medium]">
  Approved
</span>

// Warning badge
<span className="inline-flex items-center gap-[--spacing-1] px-[--spacing-2] py-[0.125rem] rounded-[--radius-full] bg-[#F59E0B14] text-[#D97706] text-[length:--font-size-micro] font-[--font-weight-medium]">
  Pending
</span>
```

### Input

```tsx
<input 
  type="text"
  className="w-full px-[--spacing-4] py-[--spacing-3] rounded-[--radius-md] border-2 border-[--color-cloud-gray] focus:border-[--color-cyan] focus:ring-2 focus:ring-[--color-cyan]/20 transition-[--transition-fast]"
  placeholder="Enter text"
/>
```

## 🎨 Usage with TypeScript

```typescript
import { colors, typography, spacing, breakpoints } from '@/styles/tokens';

// Type-safe color access
const buttonBg = colors.primary.cyan;

// Type-safe typography
const headingSize = typography.fluid.h1;

// Type-safe spacing
const padding = spacing.scale[6];

// Type-safe breakpoints
const isDesktop = window.innerWidth >= breakpoints.values.lg;
```

## 🌐 Internationalization (RTL Support)

The design system supports both LTR (English) and RTL (Arabic) layouts:

```tsx
// LTR (English)
<div dir="ltr">
  <p style={{ fontFamily: typography.fontFamily.latin }}>
    English content
  </p>
</div>

// RTL (Arabic)
<div dir="rtl">
  <p style={{ fontFamily: typography.fontFamily.arabic }}>
    محتوى عربي
  </p>
</div>
```

CSS automatically handles font switching based on `dir` attribute.

## 🔍 Design Token Locations

```
src/styles/
├── tokens/
│   ├── colors.ts         # Color definitions
│   ├── typography.ts     # Font, sizes, weights
│   ├── spacing.ts        # Spacing, shadows, radii
│   ├── breakpoints.ts    # Responsive breakpoints
│   └── index.ts          # Central export
└── globals.css           # @theme configuration + base styles
```

## ✅ Checklist: Task 1 Completion

- [x] Install and configure Cairo and Inter fonts (Google Fonts CDN)
- [x] Create design token constants in `src/styles/tokens/`
  - [x] `colors.ts` - Primary, secondary, status colors
  - [x] `typography.ts` - Font families, sizes, fluid typography
  - [x] `spacing.ts` - Spacing scale, shadows, radii, z-index
  - [x] `breakpoints.ts` - Responsive breakpoints
  - [x] `index.ts` - Central export
- [x] Configure Tailwind CSS with DealZone design tokens (@theme in globals.css)
- [x] Set up fluid typography using clamp() functions
- [x] Configure responsive breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px)

## 📚 Additional Resources

- **Tailwind CSS v4 Documentation**: https://tailwindcss.com/docs
- **CSS clamp() Reference**: https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- **Google Fonts**: https://fonts.google.com

---

**Design System Version**: 1.0.0  
**Requirements Satisfied**: 1.1, 1.2, 1.3, 1.7, 7.1, 7.12  
**Last Updated**: Task 1 - Design System Foundation Setup
