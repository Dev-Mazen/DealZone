import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchBar from './SearchBar'

describe('SearchBar Component', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox', { name: /search/i })
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('placeholder', 'Search...')
    })

    it('renders with custom placeholder', () => {
      render(<SearchBar placeholder="Search products..." onSearch={vi.fn()} />)
      const input = screen.getByPlaceholderText('Search products...')
      expect(input).toBeInTheDocument()
    })

    it('renders with custom aria-label', () => {
      render(<SearchBar aria-label="Search for items" onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox', { name: /search for items/i })
      expect(input).toBeInTheDocument()
    })

    it('renders search icon', () => {
      render(<SearchBar onSearch={vi.fn()} />)
      const searchIcon = screen.getByRole('textbox').parentElement.querySelector('svg')
      expect(searchIcon).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const { container } = render(
        <SearchBar className="custom-class" onSearch={vi.fn()} />
      )
      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('Size Variants', () => {
    it('renders small size correctly', () => {
      render(<SearchBar size="sm" onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-9', 'text-sm')
    })

    it('renders medium size correctly (default)', () => {
      render(<SearchBar size="md" onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-10', 'text-base')
    })

    it('renders large size correctly', () => {
      render(<SearchBar size="lg" onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveClass('h-12', 'text-base')
    })
  })

  describe('User Input', () => {
    it('updates value on user input', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test query')
      expect(input).toHaveValue('test query')
    })

    it('respects maxLength prop', () => {
      render(<SearchBar maxLength={10} onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('maxLength', '10')
    })

    it('supports defaultValue prop', () => {
      render(<SearchBar defaultValue="initial value" onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveValue('initial value')
    })
  })

  describe('Debounced Search', () => {
    it('debounces search callback with default delay (300ms)', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')

      // Should not call immediately
      expect(handleSearch).not.toHaveBeenCalled()

      // Fast forward time by 300ms
      vi.advanceTimersByTime(300)

      // Should call after debounce delay
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1)
        expect(handleSearch).toHaveBeenCalledWith('test')
      })
    })

    it('debounces with custom delay', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} debounceDelay={500} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')

      // Should not call before delay
      vi.advanceTimersByTime(400)
      expect(handleSearch).not.toHaveBeenCalled()

      // Should call after custom delay
      vi.advanceTimersByTime(100)
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1)
      })
    })

    it('resets debounce timer on each keystroke', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} debounceDelay={300} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 't')
      vi.advanceTimersByTime(200)
      
      await user.type(input, 'e')
      vi.advanceTimersByTime(200)
      
      await user.type(input, 's')
      vi.advanceTimersByTime(200)

      // Should not have called yet due to reset timers
      expect(handleSearch).not.toHaveBeenCalled()

      // Complete the debounce delay
      vi.advanceTimersByTime(100)

      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1)
        expect(handleSearch).toHaveBeenCalledWith('tes')
      })
    })

    it('respects minLength before triggering search', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} minLength={3} debounceDelay={300} />)
      const input = screen.getByRole('textbox')

      // Type less than minLength
      await user.type(input, 'ab')
      vi.advanceTimersByTime(300)
      expect(handleSearch).not.toHaveBeenCalled()

      // Type exactly minLength
      await user.type(input, 'c')
      vi.advanceTimersByTime(300)
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('abc')
      })
    })
  })

  describe('Clear Functionality', () => {
    it('shows clear button when input has value', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      // Initially no clear button
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()

      // Type something
      await user.type(input, 'test')

      // Clear button should appear
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument()
    })

    it('clears input value when clear button is clicked', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test query')
      expect(input).toHaveValue('test query')

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(input).toHaveValue('')
    })

    it('calls onSearch with empty string when cleared', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      handleSearch.mockClear() // Clear previous calls

      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(handleSearch).toHaveBeenCalledWith('')
    })

    it('calls onClear callback when provided', async () => {
      const handleClear = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} onClear={handleClear} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(handleClear).toHaveBeenCalledTimes(1)
    })

    it('returns focus to input after clearing', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      await user.click(clearButton)

      expect(input).toHaveFocus()
    })

    it('hides clear button when loading', () => {
      render(<SearchBar onSearch={vi.fn()} defaultValue="test" isLoading={true} />)
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    })
  })

  describe('Loading State', () => {
    it('displays loading spinner when isLoading is true', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-busy', 'true')
      
      // Check for loading indicator in the DOM
      const loadingSpinner = screen.getByLabelText(/loading/i)
      expect(loadingSpinner).toBeInTheDocument()
    })

    it('disables input when loading', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('does not show clear button when loading', () => {
      render(<SearchBar onSearch={vi.fn()} defaultValue="test" isLoading={true} />)
      expect(screen.queryByRole('button', { name: /clear search/i })).not.toBeInTheDocument()
    })
  })

  describe('Keyboard Navigation', () => {
    it('clears input on Escape key press', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test query')
      expect(input).toHaveValue('test query')

      await user.keyboard('{Escape}')
      expect(input).toHaveValue('')
    })

    it('triggers immediate search on Enter key press', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} debounceDelay={300} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      
      // Should not have called yet (debounce not finished)
      expect(handleSearch).not.toHaveBeenCalled()

      // Press Enter
      await user.keyboard('{Enter}')

      // Should call immediately without waiting for debounce
      expect(handleSearch).toHaveBeenCalledWith('test')
      expect(handleSearch).toHaveBeenCalledTimes(1)
    })

    it('does not clear on Escape if input is empty', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} />)
      const input = screen.getByRole('textbox')

      await user.keyboard('{Escape}')
      
      // Should not trigger search
      expect(handleSearch).not.toHaveBeenCalled()
    })
  })

  describe('Disabled State', () => {
    it('disables input when disabled prop is true', () => {
      render(<SearchBar onSearch={vi.fn()} disabled={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toBeDisabled()
    })

    it('prevents typing when disabled', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} disabled={true} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      expect(input).toHaveValue('')
    })

    it('disables clear button when disabled', async () => {
      render(<SearchBar onSearch={vi.fn()} disabled={true} defaultValue="test" />)
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      expect(clearButton).toBeDisabled()
    })
  })

  describe('Focus States', () => {
    it('applies focus styles when input is focused', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.click(input)
      expect(input).toHaveFocus()
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-[#00D9F5]', 'focus:border-[#00D9F5]')
    })

    it('supports autoFocus prop', () => {
      render(<SearchBar onSearch={vi.fn()} autoFocus={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveFocus()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<SearchBar onSearch={vi.fn()} aria-label="Search products" />)
      const input = screen.getByRole('textbox', { name: /search products/i })
      expect(input).toHaveAttribute('aria-busy', 'false')
    })

    it('updates aria-busy when loading', () => {
      render(<SearchBar onSearch={vi.fn()} isLoading={true} />)
      const input = screen.getByRole('textbox')
      expect(input).toHaveAttribute('aria-busy', 'true')
    })

    it('provides screen reader status updates', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      
      const statusRegion = screen.getByRole('status')
      expect(statusRegion).toBeInTheDocument()
    })

    it('clear button has proper aria-label', async () => {
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={vi.fn()} />)
      const input = screen.getByRole('textbox')

      await user.type(input, 'test')
      const clearButton = screen.getByRole('button', { name: /clear search/i })
      expect(clearButton).toHaveAttribute('aria-label', 'Clear search')
    })
  })

  describe('Edge Cases', () => {
    it('handles rapid typing correctly', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} debounceDelay={300} />)
      const input = screen.getByRole('textbox')

      // Type rapidly
      await user.type(input, 'abcdefghij')
      
      // Only the last value should trigger search after debounce
      vi.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledTimes(1)
        expect(handleSearch).toHaveBeenCalledWith('abcdefghij')
      })
    })

    it('cleans up debounce timer on unmount', () => {
      const { unmount } = render(<SearchBar onSearch={vi.fn()} />)
      
      // This should not throw any errors
      expect(() => unmount()).not.toThrow()
    })

    it('handles empty string search correctly', async () => {
      const handleSearch = vi.fn()
      const user = userEvent.setup({ delay: null })
      render(<SearchBar onSearch={handleSearch} defaultValue="test" />)
      const input = screen.getByRole('textbox')

      // Clear all text
      await user.clear(input)
      
      vi.advanceTimersByTime(300)
      
      await waitFor(() => {
        expect(handleSearch).toHaveBeenCalledWith('')
      })
    })
  })
})
