import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Card, { CardHeader, CardDivider } from './Card'

describe('Card Component', () => {
  // ---------------------------------------------------------------------------
  // Variants
  // ---------------------------------------------------------------------------
  describe('Variants', () => {
    it('renders default variant with border and shadow', () => {
      const { container } = render(<Card variant="default">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('rounded-lg')
    })

    it('renders elevated variant with stronger shadow and no border', () => {
      const { container } = render(<Card variant="elevated">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('rounded-lg')
      // elevated variant uses a box-shadow (shadow-[...]) class and no border-2
      expect(card).not.toHaveClass('border-2')
    })

    it('renders bordered variant with 2px border', () => {
      const { container } = render(<Card variant="bordered">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('border-2')
      expect(card).toHaveClass('bg-white')
      expect(card).toHaveClass('rounded-lg')
    })

    it('defaults to the default variant when no variant prop is supplied', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      // "default" variant includes "border border-[...]"
      expect(card).toHaveClass('border')
    })
  })

  // ---------------------------------------------------------------------------
  // Padding options
  // ---------------------------------------------------------------------------
  describe('Padding', () => {
    it('applies no padding when padding="none"', () => {
      const { container } = render(<Card padding="none">Content</Card>)
      const card = container.firstChild
      expect(card).not.toHaveClass('p-4')
      expect(card).not.toHaveClass('p-6')
      expect(card).not.toHaveClass('p-8')
    })

    it('applies p-4 when padding="sm"', () => {
      const { container } = render(<Card padding="sm">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('p-4')
    })

    it('applies p-6 when padding="md" (default)', () => {
      const { container } = render(<Card padding="md">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('p-6')
    })

    it('applies p-6 by default (padding prop omitted)', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('p-6')
    })

    it('applies p-8 when padding="lg"', () => {
      const { container } = render(<Card padding="lg">Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('p-8')
    })
  })

  // ---------------------------------------------------------------------------
  // Hover effect
  // ---------------------------------------------------------------------------
  describe('Hover prop', () => {
    it('adds hover and transition classes when hover=true', () => {
      const { container } = render(<Card hover>Content</Card>)
      const card = container.firstChild
      expect(card).toHaveClass('transition-all')
      expect(card).toHaveClass('duration-300')
      expect(card).toHaveClass('cursor-pointer')
    })

    it('does NOT add hover classes when hover=false (default)', () => {
      const { container } = render(<Card>Content</Card>)
      const card = container.firstChild
      expect(card).not.toHaveClass('cursor-pointer')
    })
  })

  // ---------------------------------------------------------------------------
  // Children rendering
  // ---------------------------------------------------------------------------
  describe('Children rendering', () => {
    it('renders plain text children', () => {
      render(<Card>Hello World</Card>)
      expect(screen.getByText('Hello World')).toBeInTheDocument()
    })

    it('renders nested React element children', () => {
      render(
        <Card>
          <p data-testid="child-para">Nested paragraph</p>
        </Card>
      )
      expect(screen.getByTestId('child-para')).toBeInTheDocument()
    })

    it('renders multiple children', () => {
      render(
        <Card>
          <span data-testid="child-1">First</span>
          <span data-testid="child-2">Second</span>
        </Card>
      )
      expect(screen.getByTestId('child-1')).toBeInTheDocument()
      expect(screen.getByTestId('child-2')).toBeInTheDocument()
    })
  })

  // ---------------------------------------------------------------------------
  // Custom className pass-through
  // ---------------------------------------------------------------------------
  describe('Custom className', () => {
    it('appends custom className to the card element', () => {
      const { container } = render(<Card className="my-custom-class">Content</Card>)
      expect(container.firstChild).toHaveClass('my-custom-class')
    })
  })

  // ---------------------------------------------------------------------------
  // Extra HTML props
  // ---------------------------------------------------------------------------
  describe('HTML prop forwarding', () => {
    it('forwards data-* attributes', () => {
      const { container } = render(<Card data-testid="card-root">Content</Card>)
      expect(screen.getByTestId('card-root')).toBeInTheDocument()
    })

    it('forwards onClick handler', () => {
      let clicked = false
      const { container } = render(
        <Card onClick={() => { clicked = true }}>Clickable</Card>
      )
      container.firstChild.click()
      expect(clicked).toBe(true)
    })
  })

  // ---------------------------------------------------------------------------
  // CardHeader sub-component
  // ---------------------------------------------------------------------------
  describe('CardHeader', () => {
    it('renders the title', () => {
      render(<CardHeader title="Section Title" />)
      expect(screen.getByText('Section Title')).toBeInTheDocument()
    })

    it('renders the subtitle when provided', () => {
      render(<CardHeader title="Title" subtitle="Sub text" />)
      expect(screen.getByText('Sub text')).toBeInTheDocument()
    })

    it('does NOT render subtitle element when subtitle is omitted', () => {
      render(<CardHeader title="Title Only" />)
      expect(screen.queryByText('Sub text')).not.toBeInTheDocument()
    })

    it('renders an action slot', () => {
      render(
        <CardHeader
          title="Title"
          action={<button data-testid="action-btn">Edit</button>}
        />
      )
      expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    })

    it('appends custom className', () => {
      const { container } = render(
        <CardHeader title="T" className="custom-header" />
      )
      expect(container.firstChild).toHaveClass('custom-header')
    })
  })

  // ---------------------------------------------------------------------------
  // CardDivider sub-component
  // ---------------------------------------------------------------------------
  describe('CardDivider', () => {
    it('renders a horizontal rule element', () => {
      const { container } = render(<CardDivider />)
      const divider = container.firstChild
      expect(divider).toBeInTheDocument()
      expect(divider.tagName).toBe('DIV')
      expect(divider).toHaveClass('h-px')
    })
  })
})
