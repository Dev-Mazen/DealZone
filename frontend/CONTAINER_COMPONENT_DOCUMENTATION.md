# Container Component Documentation

## Overview

The Container component is a flexible, responsive layout component designed for consistent page layouts throughout the DealZone application. It provides size variants with max-width constraints, centered alignment, and responsive horizontal padding.

## Implementation

**Location:** `src/components/layout/Container.jsx`

**Requirements Satisfied:** 
- Requirement 7.1: Comprehensive Responsive Design Optimization
- Requirement 7.11: Consistent spacing, padding, and margins across all breakpoints

## Features

### 1. Size Variants

The component provides five size variants with different max-width constraints:

| Variant | Max Width | Tailwind Class | Use Case |
|---------|-----------|----------------|----------|
| `sm` | 640px | `max-w-screen-sm` | Narrow content, forms |
| `md` | 768px | `max-w-screen-md` | Articles, blog posts |
| `lg` | 1024px | `max-w-screen-lg` | Standard pages with sidebars |
| `xl` | 1280px | `max-w-screen-xl` | Default page width (default) |
| `full` | 1536px | `max-w-screen-2xl` | Wide dashboards, data tables |

### 2. Centered Alignment

All containers are centered using `mx-auto` (margin-left: auto; margin-right: auto), ensuring consistent positioning regardless of viewport width.

### 3. Responsive Horizontal Padding

The component implements responsive padding that adapts to different breakpoints:

- **Mobile (< 640px):** `px-4` (16px horizontal padding)
- **Tablet (640px - 1024px):** `sm:px-6` (24px horizontal padding)
- **Desktop (≥ 1024px):** `lg:px-8` (32px horizontal padding)

This ensures content never touches the viewport edges while maximizing usable space on larger screens.

### 4. Custom Styling Support

The component accepts additional `className` props, allowing you to add custom styling while maintaining the core responsive behavior.

### 5. Ref Forwarding

The component uses `forwardRef` to allow parent components to access the underlying DOM element.

## Usage Examples

### Basic Usage (Default xl size)

```jsx
import Container from '@/components/layout/Container'

function MyPage() {
  return (
    <Container>
      <h1>Page Title</h1>
      <p>Page content...</p>
    </Container>
  )
}
```

### With Size Variant

```jsx
<Container size="sm">
  <form>
    <input type="text" placeholder="Email" />
    <button>Submit</button>
  </form>
</Container>
```

### With Custom Styling

```jsx
<Container className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl">
  <div className="text-white p-8">
    <h2>Hero Section</h2>
    <p>Marketing content...</p>
  </div>
</Container>
```

### Nested Containers

```jsx
<Container size="full">
  <h1>Main Content Area</h1>
  <Container size="md" className="bg-gray-100 py-6 rounded-lg">
    <p>Narrower nested content for emphasis</p>
  </Container>
</Container>
```

### With Ref

```jsx
import { useRef, useEffect } from 'react'

function MyComponent() {
  const containerRef = useRef(null)
  
  useEffect(() => {
    if (containerRef.current) {
      console.log('Container width:', containerRef.current.offsetWidth)
    }
  }, [])
  
  return (
    <Container ref={containerRef}>
      <p>Content</p>
    </Container>
  )
}
```

## Props API

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'xl'` | Determines the max-width constraint |
| `className` | `string` | `''` | Additional CSS classes to apply |
| `children` | `ReactNode` | required | Content to render inside the container |
| `...props` | `HTMLDivElement props` | - | All other props are forwarded to the div element |

## Design Token Integration

The Container component uses DealZone design tokens:

- **Breakpoints:** Follows the Tailwind breakpoint system (sm, md, lg, xl, 2xl)
- **Spacing:** Uses consistent spacing scale for padding (px-4, px-6, px-8)
- **Max-widths:** Aligns with screen size breakpoints (640px, 768px, 1024px, 1280px, 1536px)

## Testing

### Visual Testing

A visual test file is available at `frontend/test-container.html`. Open this file in a browser to verify:

- All size variants render correctly
- Centered alignment works at all viewport widths
- Responsive padding adapts to different screen sizes
- Custom styling can be applied

### Unit Testing

Unit tests are available in `src/components/layout/Container.test.jsx`:

```bash
npm test Container.test.jsx
```

Tests cover:
- Rendering with children
- All size variants
- Default size (xl)
- Centered alignment
- Responsive padding classes
- Custom className application
- Ref forwarding
- Props forwarding

## Component Showcase

A comprehensive showcase component is available at `src/components/layout/ContainerShowcase.jsx`. Import and render this component to see all Container variants in action:

```jsx
import ContainerShowcase from '@/components/layout/ContainerShowcase'

function App() {
  return <ContainerShowcase />
}
```

## Responsive Behavior

The Container component adapts to different viewport sizes:

1. **Mobile (320px - 640px):**
   - Full width with 16px horizontal padding
   - Content stacks vertically naturally
   - Touch-friendly spacing

2. **Tablet (640px - 1024px):**
   - Increased to 24px horizontal padding
   - Container width constrained by size variant
   - Balanced content width

3. **Desktop (1024px+):**
   - Maximum 32px horizontal padding
   - Full max-width applied based on size variant
   - Optimal reading width maintained

## Best Practices

1. **Choose the Right Size:**
   - Use `sm` for forms and narrow content
   - Use `md` for reading content (articles, blog posts)
   - Use `lg` for general pages with sidebars
   - Use `xl` (default) for most application pages
   - Use `full` for dashboards and data-heavy interfaces

2. **Nesting Containers:**
   - Avoid deeply nesting containers (max 2 levels)
   - Use smaller inner containers to create visual hierarchy
   - Ensure inner containers are smaller than outer ones

3. **Custom Styling:**
   - Add background colors, borders, and effects via className
   - Avoid overriding padding unless necessary
   - Maintain consistent spacing with design tokens

4. **Accessibility:**
   - Containers don't affect semantic HTML structure
   - Ensure proper heading hierarchy within containers
   - Use landmarks (main, section, article) inside containers

## Implementation Details

### File Structure

```
frontend/src/components/layout/
├── Container.jsx              # Main component
├── Container.test.jsx         # Unit tests
└── ContainerShowcase.jsx      # Visual showcase
```

### Dependencies

- React (forwardRef)
- Tailwind CSS (for utility classes)

### Browser Compatibility

- All modern browsers (Chrome, Firefox, Safari, Edge)
- IE11 not supported (uses modern CSS)

## Related Components

- **AppLayout:** Uses Container for page structure
- **Navbar:** Works alongside Container for page layouts
- **Card:** Often used inside Container for content sections

## Migration Guide

If replacing existing layout components:

```jsx
// Before
<div className="max-w-7xl mx-auto px-4">
  <Content />
</div>

// After
<Container size="xl">
  <Content />
</Container>
```

## Future Enhancements

Potential improvements for future versions:

- [ ] Add `fluid` prop for full-width containers without max-width
- [ ] Add `noPadding` prop to disable horizontal padding
- [ ] Add vertical padding variants
- [ ] Add animation variants for entrance effects
- [ ] Add TypeScript type definitions

## Support

For issues or questions about the Container component:

1. Check this documentation
2. Review the showcase component
3. Check the test file for usage examples
4. Refer to the design system guide

---

**Version:** 1.0.0  
**Last Updated:** 2024  
**Requirements:** 7.1, 7.11  
**Status:** ✅ Complete and Tested
