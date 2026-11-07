# EntranceAnimation Usage Guide

This guide shows how to integrate the `EntranceAnimation` component into existing DealZone pages.

## Quick Start

### 1. Import the Component

```jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';
```

### 2. Wrap Content

Simply wrap any content you want to animate:

```jsx
<EntranceAnimation direction="up">
  <YourContent />
</EntranceAnimation>
```

## Integration Examples

### Dashboard Page

Add entrance animations to dashboard statistics cards:

```jsx
// src/pages/Dashboard.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function Dashboard() {
  const stats = [
    { label: 'Active RFQs', value: 24 },
    { label: 'Pending Offers', value: 8 },
    { label: 'Completed Deals', value: 156 },
  ];
  
  return (
    <div className="dashboard">
      <EntranceAnimation direction="fade">
        <h1>Dashboard</h1>
      </EntranceAnimation>
      
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <EntranceAnimation 
            key={stat.label}
            direction="up"
            delay={index * 100}
          >
            <StatsCard {...stat} />
          </EntranceAnimation>
        ))}
      </div>
    </div>
  );
}
```

### RFQ Listing Page

Add animations to RFQ cards:

```jsx
// src/pages/RFQs.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function RFQsPage() {
  const { data: rfqs } = useRFQs();
  
  return (
    <div className="rfqs-page">
      <EntranceAnimation direction="fade">
        <h1>Request for Quotations</h1>
      </EntranceAnimation>
      
      <div className="rfq-list">
        {rfqs?.map((rfq, index) => (
          <EntranceAnimation 
            key={rfq.id}
            direction="up"
            delay={Math.min(index * 50, 500)} // Cap at 500ms
          >
            <RFQCard rfq={rfq} />
          </EntranceAnimation>
        ))}
      </div>
    </div>
  );
}
```

### About Page Sections

Create engaging content sections with alternating animations:

```jsx
// src/pages/About.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function AboutPage() {
  return (
    <div className="about-page">
      <EntranceAnimation direction="fade">
        <section className="hero">
          <h1>About DealZone</h1>
          <p>Your trusted B2B marketplace</p>
        </section>
      </EntranceAnimation>
      
      <EntranceAnimation direction="left">
        <section className="mission">
          <h2>Our Mission</h2>
          <p>Connecting buyers and suppliers...</p>
        </section>
      </EntranceAnimation>
      
      <EntranceAnimation direction="right">
        <section className="vision">
          <h2>Our Vision</h2>
          <p>Transforming B2B trade...</p>
        </section>
      </EntranceAnimation>
      
      <EntranceAnimation direction="up">
        <section className="features">
          <h2>Key Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <EntranceAnimation 
                key={feature.id}
                direction="fade"
                delay={index * 150}
              >
                <FeatureCard {...feature} />
              </EntranceAnimation>
            ))}
          </div>
        </section>
      </EntranceAnimation>
    </div>
  );
}
```

### Landing Page Hero

Create an engaging hero section with staggered animations:

```jsx
// src/pages/Landing.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function LandingPage() {
  return (
    <div className="landing-page">
      <section className="hero">
        <EntranceAnimation direction="fade" delay={0}>
          <h1 className="hero-title">
            Welcome to DealZone
          </h1>
        </EntranceAnimation>
        
        <EntranceAnimation direction="up" delay={200}>
          <p className="hero-subtitle">
            Connect. Trade. Grow.
          </p>
        </EntranceAnimation>
        
        <EntranceAnimation direction="up" delay={400}>
          <div className="hero-actions">
            <Button variant="primary">Get Started</Button>
            <Button variant="outline">Learn More</Button>
          </div>
        </EntranceAnimation>
      </section>
    </div>
  );
}
```

### Modal/Dialog Content

Add subtle entrance animations to modals:

```jsx
// src/components/modals/RFQDetailsModal.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function RFQDetailsModal({ rfq, isOpen, onClose }) {
  if (!isOpen) return null;
  
  return (
    <Modal onClose={onClose}>
      <EntranceAnimation direction="fade">
        <div className="modal-header">
          <h2>{rfq.title}</h2>
        </div>
      </EntranceAnimation>
      
      <EntranceAnimation direction="up" delay={100}>
        <div className="modal-body">
          <p>{rfq.description}</p>
          {/* More content */}
        </div>
      </EntranceAnimation>
      
      <EntranceAnimation direction="up" delay={200}>
        <div className="modal-footer">
          <Button onClick={onClose}>Close</Button>
        </div>
      </EntranceAnimation>
    </Modal>
  );
}
```

### Profile Page Sections

Animate profile information sections:

```jsx
// src/pages/Profile.jsx
import EntranceAnimation from '@/components/animations/EntranceAnimation';

function ProfilePage() {
  const { data: user } = useCurrentUser();
  
  return (
    <div className="profile-page">
      <EntranceAnimation direction="fade">
        <ProfileHeader user={user} />
      </EntranceAnimation>
      
      <div className="profile-sections">
        <EntranceAnimation direction="left" delay={100}>
          <Card>
            <h3>Personal Information</h3>
            {/* Content */}
          </Card>
        </EntranceAnimation>
        
        <EntranceAnimation direction="right" delay={200}>
          <Card>
            <h3>Company Information</h3>
            {/* Content */}
          </Card>
        </EntranceAnimation>
        
        <EntranceAnimation direction="up" delay={300}>
          <Card>
            <h3>Recent Activity</h3>
            {/* Content */}
          </Card>
        </EntranceAnimation>
      </div>
    </div>
  );
}
```

## Best Practices

### 1. Don't Overuse

Not every element needs animation. Focus on:
- Page headers and titles
- Important content sections
- Cards in lists or grids
- Call-to-action elements

### 2. Use Appropriate Delays

```jsx
// Good: Reasonable stagger delays
{items.map((item, index) => (
  <EntranceAnimation delay={index * 100}>
    <Item {...item} />
  </EntranceAnimation>
))}

// Good: Cap delays for long lists
{items.map((item, index) => (
  <EntranceAnimation delay={Math.min(index * 50, 500)}>
    <Item {...item} />
  </EntranceAnimation>
))}

// Bad: Too long delays
{items.map((item, index) => (
  <EntranceAnimation delay={index * 1000}> {/* Way too slow! */}
    <Item {...item} />
  </EntranceAnimation>
))}
```

### 3. Choose Appropriate Directions

- **fade**: Subtle, works for almost anything
- **up**: Natural for content that "rises" into view
- **left/right**: Good for alternating content sections
- **down**: Use sparingly, can feel unnatural

### 4. Consider Performance

```jsx
// Good: Animate container, not individual small elements
<EntranceAnimation direction="up">
  <Card>
    <h3>Title</h3>
    <p>Description</p>
    <Button>Action</Button>
  </Card>
</EntranceAnimation>

// Avoid: Over-animating small elements
<Card>
  <EntranceAnimation direction="up"> {/* Too much! */}
    <h3>Title</h3>
  </EntranceAnimation>
  <EntranceAnimation direction="up" delay={100}>
    <p>Description</p>
  </EntranceAnimation>
  <EntranceAnimation direction="up" delay={200}>
    <Button>Action</Button>
  </EntranceAnimation>
</Card>
```

### 5. Test with Reduced Motion

Always test with `prefers-reduced-motion` enabled to ensure accessibility.

## Common Patterns

### Staggered Grid

```jsx
<div className="grid grid-cols-3 gap-4">
  {items.map((item, index) => (
    <EntranceAnimation 
      key={item.id}
      direction="up"
      delay={index * 100}
    >
      <GridItem {...item} />
    </EntranceAnimation>
  ))}
</div>
```

### Hero with CTA

```jsx
<div className="hero">
  <EntranceAnimation direction="fade">
    <h1>Headline</h1>
  </EntranceAnimation>
  <EntranceAnimation direction="up" delay={200}>
    <p>Subheading</p>
  </EntranceAnimation>
  <EntranceAnimation direction="up" delay={400}>
    <Button>Call to Action</Button>
  </EntranceAnimation>
</div>
```

### Alternating Sections

```jsx
<div className="sections">
  <EntranceAnimation direction="left">
    <Section align="left" />
  </EntranceAnimation>
  <EntranceAnimation direction="right">
    <Section align="right" />
  </EntranceAnimation>
  <EntranceAnimation direction="left">
    <Section align="left" />
  </EntranceAnimation>
</div>
```

### Feature Showcase

```jsx
<div className="features">
  {features.map((feature, index) => (
    <EntranceAnimation 
      key={feature.id}
      direction={['fade', 'up', 'left', 'right'][index % 4]}
      delay={index * 150}
    >
      <FeatureCard {...feature} />
    </EntranceAnimation>
  ))}
</div>
```

## Troubleshooting

### Animation doesn't trigger

1. Check if element is in a container with `overflow: hidden`
2. Try adjusting `threshold` prop
3. Use `rootMargin` to trigger earlier

### Too many items animating slowly

1. Cap the delay: `delay={Math.min(index * 50, 500)}`
2. Reduce delay increment: `delay={index * 50}` instead of `* 100`
3. Only animate first N items

### Content jumps on page load

This is expected behavior - the content starts hidden (opacity: 0) and animates in. If this is problematic:

1. Consider using `direction="fade"` which is more subtle
2. Reduce the delay
3. Only animate below-the-fold content

## Testing

### Visual Testing

1. Open the demo page to see all animations
2. Test in Chrome DevTools with device emulation
3. Enable reduced motion in DevTools to verify accessibility

### Browser Testing

Test in:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Summary

The `EntranceAnimation` component is a powerful tool for adding polish and engagement to your pages. Use it thoughtfully, respect user preferences, and always prioritize performance and accessibility.

**Key Takeaways:**
- ✅ Wrap content sections, not individual small elements
- ✅ Use reasonable delays (50-200ms between items)
- ✅ Choose appropriate directions
- ✅ Test with reduced motion enabled
- ✅ Don't overuse - be selective
