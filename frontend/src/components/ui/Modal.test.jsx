import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Modal from './Modal'

describe('Modal Component', () => {
  describe('Visibility', () => {
    it('renders nothing when isOpen is false', () => {
      render(
        <Modal isOpen={false} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      expect(screen.queryByText('Test Modal')).not.toBeInTheDocument()
      expect(screen.queryByText('Modal content')).not.toBeInTheDocument()
    })

    it('renders content when isOpen is true', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      )
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
      expect(screen.getByText('Modal content')).toBeInTheDocument()
    })

    it('supports open prop as alias for isOpen', () => {
      render(
        <Modal open={true} onClose={vi.fn()} title="Open Alias">
          <p>Content</p>
        </Modal>
      )
      expect(screen.getByText('Open Alias')).toBeInTheDocument()
    })
  })

  describe('Title', () => {
    it('renders the title when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="My Dialog Title">
          <p>Body</p>
        </Modal>
      )
      expect(screen.getByText('My Dialog Title')).toBeInTheDocument()
    })

    it('renders without title', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()}>
          <p>No title body</p>
        </Modal>
      )
      expect(screen.getByText('No title body')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="T" description="A helpful description">
          <p>Body</p>
        </Modal>
      )
      expect(screen.getByText('A helpful description')).toBeInTheDocument()
    })
  })

  describe('Close behaviour', () => {
    it('calls onClose when Escape key is pressed', () => {
      const onClose = vi.fn()
      render(
        <Modal isOpen={true} onClose={onClose} title="Escape test">
          <p>Content</p>
        </Modal>
      )
      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('calls onClose when close button is clicked', async () => {
      const onClose = vi.fn()
      const user = userEvent.setup()
      render(
        <Modal isOpen={true} onClose={onClose} title="Close Button">
          <p>Content</p>
        </Modal>
      )
      // The × button in the header
      const closeBtn = screen.getByRole('button', { name: /close/i })
      await user.click(closeBtn)
      expect(onClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Footer', () => {
    it('renders footer content when provided', () => {
      render(
        <Modal
          isOpen={true}
          onClose={vi.fn()}
          title="Footer Modal"
          footer={<button>Confirm</button>}
        >
          <p>Body</p>
        </Modal>
      )
      expect(screen.getByText('Confirm')).toBeInTheDocument()
    })

    it('renders without footer', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="No Footer">
          <p>Body only</p>
        </Modal>
      )
      expect(screen.getByText('Body only')).toBeInTheDocument()
    })
  })

  describe('Sizes', () => {
    it('applies sm size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="Small" size="sm">
          <p>Content</p>
        </Modal>
      )
      expect(container.innerHTML).toContain('max-w-sm')
    })

    it('applies xl size class', () => {
      const { container } = render(
        <Modal isOpen={true} onClose={vi.fn()} title="XL" size="xl">
          <p>Content</p>
        </Modal>
      )
      expect(container.innerHTML).toContain('max-w-2xl')
    })
  })

  describe('Children', () => {
    it('renders complex children', () => {
      render(
        <Modal isOpen={true} onClose={vi.fn()} title="Complex">
          <form>
            <input placeholder="Name" />
            <button type="submit">Submit</button>
          </form>
        </Modal>
      )
      expect(screen.getByPlaceholderText('Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
    })
  })
})

