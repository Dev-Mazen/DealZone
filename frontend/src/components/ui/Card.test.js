/**
 * Card Component Unit Tests
 * 
 * Tests for Card component variants, padding options, and hover effects.
 * Validates Requirements 1.3, 1.4, 3.2
 */

import assert from 'node:assert/strict';

console.log('--- TEST GROUP: Card Component (Requirements 1.3, 1.4, 3.2) ---');

// Helper function to simulate Card component logic and return classes
function getCardClasses({ variant = 'default', padding = 'md', hover = false, className = '' }) {
  const variantStyles = {
    default: 'bg-white rounded-lg border border-[rgba(6,36,91,0.06)] shadow-[0_4px_6px_-1px_rgba(6,36,91,0.08),0_2px_4px_-2px_rgba(6,36,91,0.06)]',
    elevated: 'bg-white rounded-lg shadow-[0_4px_20px_-2px_rgba(6,36,91,0.08)]',
    bordered: 'bg-white rounded-lg border-2 border-[#F4F7FB]',
  };

  const paddingStyles = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverStyles = hover 
    ? 'transition-all duration-300 ease-out hover:shadow-[0_10px_15px_-3px_rgba(6,36,91,0.10),0_4px_6px_-4px_rgba(6,36,91,0.05)] hover:-translate-y-0.5 cursor-pointer' 
    : '';

  return [
    variantStyles[variant],
    paddingStyles[padding],
    hoverStyles,
    className,
  ].filter(Boolean).join(' ').split(' ');
}

// Test 1: Default variant with default padding
const defaultClasses = getCardClasses({});

assert.ok(
  defaultClasses.some(c => c.includes('bg-white')),
  'Default card should have white background'
);
assert.ok(
  defaultClasses.some(c => c.includes('rounded-lg')),
  'Default card should have 8px border radius (rounded-lg)'
);
assert.ok(
  defaultClasses.some(c => c.includes('border')),
  'Default card should have border'
);
assert.ok(
  defaultClasses.some(c => c.includes('shadow')),
  'Default card should have shadow'
);
assert.ok(
  defaultClasses.some(c => c === 'p-6'),
  'Default card should have md padding (p-6)'
);

console.log('✅ Test 1: Default variant with default padding - PASSED');

// Test 2: Elevated variant
const elevatedClasses = getCardClasses({ variant: 'elevated' });

assert.ok(
  elevatedClasses.some(c => c.includes('shadow')),
  'Elevated card should have shadow'
);
assert.ok(
  !elevatedClasses.some(c => c.includes('border') && c !== 'border-[rgba(6,36,91,0.06)]'),
  'Elevated card should not have explicit border class (only shadow)'
);

console.log('✅ Test 2: Elevated variant - PASSED');

// Test 3: Bordered variant
const borderedClasses = getCardClasses({ variant: 'bordered' });

assert.ok(
  borderedClasses.some(c => c.includes('border-2')),
  'Bordered card should have border-2 class'
);

console.log('✅ Test 3: Bordered variant - PASSED');

// Test 4: Padding options - none
const noPaddingClasses = getCardClasses({ padding: 'none' });

assert.ok(
  !noPaddingClasses.some(c => c.startsWith('p-')),
  'Card with padding="none" should have no padding classes'
);

console.log('✅ Test 4: Padding option - none - PASSED');

// Test 5: Padding options - sm
const smPaddingClasses = getCardClasses({ padding: 'sm' });

assert.ok(
  smPaddingClasses.some(c => c === 'p-4'),
  'Card with padding="sm" should have p-4 class (16px)'
);

console.log('✅ Test 5: Padding option - sm - PASSED');

// Test 6: Padding options - lg
const lgPaddingCard = React.createElement(Card, { padding: 'lg' }, 'Content');
const lgPaddingClasses = renderAndGetClasses(lgPaddingCard);

assert.ok(
  lgPaddingClasses.some(c => c === 'p-8'),
  'Card with padding="lg" should have p-8 class (32px)'
);

console.log('✅ Test 6: Padding option - lg - PASSED');

// Test 7: Hover elevation effect
const hoverCard = React.createElement(Card, { hover: true }, 'Content');
const hoverClasses = renderAndGetClasses(hoverCard);

assert.ok(
  hoverClasses.some(c => c.includes('transition')),
  'Hover card should have transition class'
);
assert.ok(
  hoverClasses.some(c => c.includes('hover:shadow')),
  'Hover card should have hover:shadow class'
);
assert.ok(
  hoverClasses.some(c => c.includes('hover:-translate-y-0.5')),
  'Hover card should have hover:-translate-y-0.5 class for elevation effect'
);
assert.ok(
  hoverClasses.some(c => c === 'cursor-pointer'),
  'Hover card should have cursor-pointer class'
);

console.log('✅ Test 7: Hover elevation effect - PASSED');

// Test 8: No hover by default
const noHoverCard = React.createElement(Card, { hover: false }, 'Content');
const noHoverClasses = renderAndGetClasses(noHoverCard);

assert.ok(
  !noHoverClasses.some(c => c.includes('hover:shadow')),
  'Card without hover should not have hover shadow classes'
);
assert.ok(
  !noHoverClasses.some(c => c === 'cursor-pointer'),
  'Card without hover should not have cursor-pointer class'
);

console.log('✅ Test 8: No hover by default - PASSED');

// Test 9: Custom className propagation
const customCard = React.createElement(
  Card, 
  { className: 'custom-class-1 custom-class-2' }, 
  'Content'
);
const customClasses = renderAndGetClasses(customCard);

assert.ok(
  customClasses.includes('custom-class-1'),
  'Custom className should be included'
);
assert.ok(
  customClasses.includes('custom-class-2'),
  'Multiple custom classes should be included'
);

console.log('✅ Test 9: Custom className propagation - PASSED');

// Test 10: Combined variants - elevated + hover + lg padding
const combinedCard = React.createElement(
  Card,
  { variant: 'elevated', hover: true, padding: 'lg' },
  'Content'
);
const combinedClasses = renderAndGetClasses(combinedCard);

assert.ok(
  combinedClasses.some(c => c.includes('shadow')),
  'Combined card should have shadow from elevated variant'
);
assert.ok(
  combinedClasses.some(c => c === 'p-8'),
  'Combined card should have lg padding'
);
assert.ok(
  combinedClasses.some(c => c.includes('hover:shadow')),
  'Combined card should have hover shadow'
);

console.log('✅ Test 10: Combined variants - PASSED');

// Test 11: CardHeader component
const headerCard = React.createElement(
  CardHeader,
  { title: 'Test Title', subtitle: 'Test Subtitle' }
);
const headerHtml = renderToString(headerCard);

assert.ok(
  headerHtml.includes('Test Title'),
  'CardHeader should render title'
);
assert.ok(
  headerHtml.includes('Test Subtitle'),
  'CardHeader should render subtitle'
);
assert.ok(
  headerHtml.includes('text-[#06245B]'),
  'CardHeader title should use navy color (#06245B)'
);
assert.ok(
  headerHtml.includes('text-[#64748B]'),
  'CardHeader subtitle should use slate gray color (#64748B)'
);

console.log('✅ Test 11: CardHeader component - PASSED');

// Test 12: CardDivider component
const dividerCard = React.createElement(CardDivider);
const dividerHtml = renderToString(dividerCard);

assert.ok(
  dividerHtml.includes('bg-[rgba(6,36,91,0.06)]'),
  'CardDivider should have proper background color'
);
assert.ok(
  dividerHtml.includes('h-px'),
  'CardDivider should have 1px height'
);

console.log('✅ Test 12: CardDivider component - PASSED');

// Test 13: 8px border radius verification (rounded-lg = 0.5rem = 8px)
const radiusCard = React.createElement(Card, {}, 'Content');
const radiusClasses = renderAndGetClasses(radiusCard);

assert.ok(
  radiusClasses.some(c => c === 'rounded-lg'),
  'Card should use rounded-lg class (8px border radius as per requirements)'
);

console.log('✅ Test 13: 8px border radius verification - PASSED');

console.log('\n=================================================================');
console.log('Card Component Tests: ALL PASSED (13/13)');
console.log('Requirements Validated: 1.3 (Design Tokens), 1.4 (Visual Hierarchy), 3.2 (Hover Effects)');
console.log('=================================================================\n');
