import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Badge from './Badge'

describe('Badge Component', () => {
  describe('Variants', () => {
    it('renders success variant with green styling', () => {
      render(<Badge variant="success">Approved</Badge>)
      const badge = screen.getByText('Approved')
      expect(badge).toBeInTheDocument()
      expect(badge.className).toContain('text-[#059669]')
    })

    it('renders warning variant with orange styling', () => {
      render(<Badge variant="warning">Pending</Badge>)
      const badge = screen.getByText('Pending')
      expect(badge.className).toContain('text-[#D97706]')
    })

    it('renders error variant with red styling', () => {
      render(<Badge variant="error">Rejected</Badge>)
      const badge = screen.getByText('Rejected')
      expect(badge.className).toContain('text-[#DC2626]')
    })

    it('renders info variant with blue styling', () => {
      render(<Badge variant="info">In Progress</Badge>)
      const badge = screen.getByText('In Progress')
      expect(badge.className).toContain('text-[#2563EB]')
    })

    it('renders navy variant', () => {
      render(<Badge variant="navy">Admin</Badge>)
      const badge = screen.getByText('Admin')
      expect(badge.className).toContain('text-[#06245B]')
    })

    it('renders cyan variant', () => {
      render(<Badge variant="cyan">Featured</Badge>)
      const badge = screen.getByText('Featured')
      expect(badge.className).toContain('text-[#0891B2]')
    })

    it('renders gray as default variant', () => {
      render(<Badge>Default</Badge>)
      const badge = screen.getByText('Default')
      expect(badge.className).toContain('text-[#64748B]')
    })
  })

  describe('Sizes', () => {
    it('renders sm size with correct classes', () => {
      render(<Badge size="sm">Small</Badge>)
      const badge = screen.getByText('Small')
      expect(badge.className).toContain('px-2')
      expect(badge.className).toContain('text-[10px]')
    })

    it('renders md size as default', () => {
      render(<Badge>Medium</Badge>)
      const badge = screen.getByText('Medium')
      expect(badge.className).toContain('px-2.5')
      expect(badge.className).toContain('text-xs')
    })

    it('renders lg size with correct classes', () => {
      render(<Badge size="lg">Large</Badge>)
      const badge = screen.getByText('Large')
      expect(badge.className).toContain('px-3')
      expect(badge.className).toContain('text-sm')
    })
  })

  describe('Dot indicator', () => {
    it('renders dot when dot prop is true', () => {
      render(<Badge variant="success" dot>Active</Badge>)
      const badge = screen.getByText('Active')
      // The dot is a sibling span inside the badge
      const dot = badge.querySelector('span')
      expect(dot).toBeInTheDocument()
    })

    it('does not render dot by default', () => {
      render(<Badge>No Dot</Badge>)
      const badge = screen.getByText('No Dot')
      expect(badge.querySelectorAll('span').length).toBe(0)
    })
  })

  describe('Shape', () => {
    it('always renders as a pill (rounded-full)', () => {
      render(<Badge>Pill Shape</Badge>)
      const badge = screen.getByText('Pill Shape')
      expect(badge.className).toContain('rounded-full')
    })
  })

  describe('Custom className', () => {
    it('applies additional className', () => {
      render(<Badge className="my-custom-class">Custom</Badge>)
      const badge = screen.getByText('Custom')
      expect(badge.className).toContain('my-custom-class')
    })
  })

  describe('Accessibility', () => {
    it('renders as a span element', () => {
      render(<Badge>Status</Badge>)
      const badge = screen.getByText('Status')
      expect(badge.tagName).toBe('SPAN')
    })

    it('passes extra props through', () => {
      render(<Badge aria-label="Current status: approved" variant="success">✓</Badge>)
      const badge = screen.getByLabelText('Current status: approved')
      expect(badge).toBeInTheDocument()
    })
  })
})

