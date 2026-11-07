# Animation Components

This directory contains reusable animation components for the DealZone application.

## PageTransition

A wrapper component that applies smooth fade-in and slide-up animations to route-level page components.

### Features

- **Fade-in animation:** Opacity transitions from 0 to 1 over 200ms
- **Slide-up animation:** Element translates from 10px below to its natural position over 200ms
- **Accessibility:** Respects `prefers-reduced-motion` media query for users who prefer reduced animations
- **Performance:** Uses CSS transitions for hardware-accelerated animations
- **Automatic:** Applied globally via AppLayout and PublicLayout components

### Usage

The PageTransition component is already applied globally in the layout components, so all route-level pages automatically receive the transition effect. No additional implementation is required in individual page components.

#### Manual Usage (if needed)

```jsx
import { PageTransition } from '@/components/animations'

function MyPage() {
  return (
    <PageTransition>
      <div>
        <h1>Page Title</h1>
        <p>Page content...</p>
      </div>
    </PageTransition>
  )
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | Required | The page content to animate |

### Animation Specifications

- **Duration:** 200ms
- **Timing function:** ease-out
- **Opacity:** 0 → 1
- **Transform:** translateY(10px) → translateY(0)

### Accessibility

The component automatically detects and respects the user's motion preferences:

- **Standard users:** See smooth 200ms transitions
- **Reduced motion users:** See instant transitions (0ms duration)

This is implemented via the CSS `@media (prefers-reduced-motion: reduce)` query.

### Testing

#### Visual Testing

1. Navigate between different routes in the application
2. Observe the smooth fade-in and slide-up effect on page content
3. The animation should complete in 200ms

#### Accessibility Testing

1. Open Chrome DevTools (F12)
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Rendering" and select "Show Rendering"
4. Check "Emulate CSS media feature prefers-reduced-motion"
5. Select "prefers-reduced-motion: reduce"
6. Navigate between routes
7. Verify that page transitions are instant (no animation)

#### Automated Testing

Unit tests are available in `PageTransition.test.jsx`. The tests verify:

- Component renders children correctly
- Animation classes are applied on mount
- CSS properties are correctly set
- Component handles remounting (simulating route changes)
- Multiple children are supported
- Accessibility considerations are met

### Implementation Details

#### Component Structure

```
PageTransition
├── PageTransition.jsx    (React component)
├── PageTransition.css    (CSS styles with animations)
├── PageTransition.test.jsx    (Unit tests)
├── PageTransition.visual.test.jsx    (Visual test page)
└── index.js    (Export)
```

#### How It Works

1. Component mounts with `isVisible = false` state
2. `useEffect` hook sets `isVisible = true` after mount
3. CSS transitions animate from initial state to visible state
4. On unmount, state resets for next page transition

#### CSS Classes

- `.page-transition`: Initial state with opacity 0 and translateY(10px)
- `.page-transition-enter`: Final state with opacity 1 and translateY(0)
- `@media (prefers-reduced-motion: reduce)`: Disables animations for accessibility

### Browser Compatibility

The PageTransition component uses standard CSS features supported by all modern browsers:

- CSS Transitions (opacity, transform)
- CSS @media queries (prefers-reduced-motion)
- React hooks (useState, useEffect)

**Supported browsers:**
- Chrome/Edge (recent versions)
- Firefox (recent versions)
- Safari (recent versions)

### Performance Considerations

- Uses CSS transitions instead of JavaScript animations for better performance
- Transitions are hardware-accelerated (opacity and transform)
- No additional libraries required
- Minimal JavaScript overhead (single state update)

### Requirements Fulfilled

This component fulfills the following requirements from the UI/UX Enhancement spec:

- **Requirement 3.5:** Smooth page transitions between route changes
- **Requirement 3.6:** CSS transitions with 200ms duration
- **Requirement 3.7:** Respects prefers-reduced-motion media query

### Related Components

- **EntranceAnimation:** For scroll-triggered entrance animations on content sections
- **Micro-interactions:** For hover states and interactive element feedback

### Troubleshooting

#### Animation not visible

1. Verify the component is wrapping your page content
2. Check that CSS file is being imported
3. Inspect element classes in DevTools
4. Ensure no conflicting CSS is overriding transitions

#### Animation too fast/slow

The 200ms duration is specified in the requirements. If you need to adjust it:

1. Modify the `transition` property in `PageTransition.css`
2. Update the duration value (currently `200ms`)
3. Ensure consistency across all transition properties

#### Accessibility issues

The component automatically handles reduced motion preferences. If issues persist:

1. Test the `@media (prefers-reduced-motion: reduce)` query manually
2. Verify browser support for the media query
3. Check that system-level motion preferences are properly configured

### Future Enhancements

Potential improvements for future iterations:

- Configurable animation duration via props
- Different transition directions (slide-left, slide-right, fade-only)
- Transition variants for different page types
- Exit animations before route change
- Loading state integration

### Contributing

When modifying this component:

1. Maintain backward compatibility
2. Update tests to reflect changes
3. Test with reduced motion enabled
4. Verify performance impact
5. Update this documentation
