import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Container from './Container'

describe('Container Component', () => {
  it('renders children correctly', () => {
    render(
      <Container>
        <div>Test Content</div>
      </Container>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies default xl size variant', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('max-w-screen-xl')
  })

  it('applies sm size variant when specified', () => {
    const { container } = render(
      <Container size="sm">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('max-w-screen-sm')
  })

  it('applies md size variant when specified', () => {
    const { container } = render(
      <Container size="md">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('max-w-screen-md')
  })

  it('applies lg size variant when specified', () => {
    const { container } = render(
      <Container size="lg">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('max-w-screen-lg')
  })

  it('applies full size variant when specified', () => {
    const { container } = render(
      <Container size="full">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('max-w-screen-2xl')
  })

  it('has centered alignment with mx-auto', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('mx-auto')
  })

  it('has responsive horizontal padding', () => {
    const { container } = render(
      <Container>
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('px-4')
    expect(containerEl).toHaveClass('sm:px-6')
    expect(containerEl).toHaveClass('lg:px-8')
  })

  it('applies additional className prop', () => {
    const { container } = render(
      <Container className="custom-class">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveClass('custom-class')
  })

  it('forwards ref correctly', () => {
    const ref = { current: null }
    render(
      <Container ref={ref}>
        <div>Content</div>
      </Container>
    )
    expect(ref.current).toBeInstanceOf(HTMLDivElement)
  })

  it('passes through additional props', () => {
    const { container } = render(
      <Container data-testid="custom-container">
        <div>Content</div>
      </Container>
    )
    const containerEl = container.firstChild
    expect(containerEl).toHaveAttribute('data-testid', 'custom-container')
  })
})
