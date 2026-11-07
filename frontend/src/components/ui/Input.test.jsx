import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './Input'
import { Mail, Lock, User, Phone } from 'lucide-react'

describe('Input Component', () => {
  describe('Basic Rendering', () => {
    it('renders input with type text by default', () => {
      render(<Input placeholder="Enter text" />)
      const input = screen.getByPlaceholderText('Enter text')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })

    it('renders with different input types', () => {
      const { rerender } = render(<Input type="email" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')

      rerender(<Input type="password" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'password')

      rerender(<Input type="number" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'number')

      rerender(<Input type="tel" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'tel')
    })

    it('renders with placeholder', () => {
      render(<Input placeholder="Enter your email" />)
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    })
  })

  describe('Label Display', () => {
    it('renders with label', () => {
      render(<Input label="Email Address" />)
      expect(screen.getByText('Email Address')).toBeInTheDocument()
    })

    it('associates label with input using htmlFor and id', () => {
      render(<Input label="Email Address" id="email-input" />)
      const label = screen.getByText('Email Address')
      const input = screen.getByLabelText('Email Address')
      expect(label).toHaveAttribute('for', 'email-input')
      expect(input).toHaveAttribute('id', 'email-input')
    })

    it('generates unique id when not provided', () => {
      render(<Input label="Email" />)
      const input = screen.getByLabelText('Email')
      expect(input).toHaveAttribute('id')
      expect(input.getAttribute('id')).toMatch(/^input-/)
    })
  })

  describe('Required State', () => {
    it('shows required indicator when required prop is true', () => {
      render(<Input label="Email" required />)
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('adds required attribute to input element', () => {
      render(<Input label="Email" required data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveAttribute('required')
    })

    it('does not show required indicator when required is false', () => {
      render(<Input label="Email" />)
      expect(screen.queryByText('*')).not.toBeInTheDocument()
    })
  })

  describe('Disabled State', () => {
    it('renders disabled input with correct styling', () => {
      render(<Input disabled data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toBeDisabled()
      expect(input).toHaveClass('opacity-60', 'cursor-not-allowed', 'bg-[#F8FAFC]')
    })

    it('does not accept user input when disabled', async () => {
      const user = userEvent.setup()
      render(<Input disabled data-testid="input" />)
      const input = screen.getByTestId('input')
      
      await user.type(input, 'test')
      expect(input).toHaveValue('')
    })
  })

  describe('Icon Slots', () => {
    it('renders with left icon', () => {
      render(
        <Input
          leftIcon={<Mail data-testid="left-icon" size={18} />}
          data-testid="input"
        />
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('input')).toHaveClass('ps-10')
    })

    it('renders with right icon', () => {
      render(
        <Input
          rightIcon={<Lock data-testid="right-icon" size={18} />}
          data-testid="input"
        />
      )
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
      expect(screen.getByTestId('input')).toHaveClass('pe-10')
    })

    it('renders with both left and right icons', () => {
      render(
        <Input
          leftIcon={<User data-testid="left-icon" size={18} />}
          rightIcon={<Lock data-testid="right-icon" size={18} />}
          data-testid="input"
        />
      )
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
      expect(screen.getByTestId('input')).toHaveClass('ps-10', 'pe-10')
    })

    it('supports backward compatibility with startIcon and endIcon', () => {
      render(
        <Input
          startIcon={<Mail data-testid="start-icon" size={18} />}
          endIcon={<Lock data-testid="end-icon" size={18} />}
        />
      )
      expect(screen.getByTestId('start-icon')).toBeInTheDocument()
      expect(screen.getByTestId('end-icon')).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('renders with error message', () => {
      render(<Input error="This field is required" />)
      expect(screen.getByText('This field is required')).toBeInTheDocument()
    })

    it('applies error styling to input', () => {
      render(<Input error="Invalid email" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('border-[#EF4444]')
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })

    it('associates error message with input using aria-describedby', () => {
      render(<Input error="Invalid email" id="email-input" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-describedby', 'email-input-error')
    })

    it('hides helper text when error is present', () => {
      render(
        <Input
          helperText="Enter a valid email address"
          error="Invalid email format"
        />
      )
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
      expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument()
    })
  })

  describe('Helper Text', () => {
    it('renders with helper text', () => {
      render(<Input helperText="Enter your email address" />)
      expect(screen.getByText('Enter your email address')).toBeInTheDocument()
    })

    it('supports backward compatibility with hint prop', () => {
      render(<Input hint="This is a hint" />)
      expect(screen.getByText('This is a hint')).toBeInTheDocument()
    })

    it('associates helper text with input using aria-describedby', () => {
      render(
        <Input
          helperText="Enter your email"
          id="email-input"
          data-testid="input"
        />
      )
      const input = screen.getByTestId('input')
      expect(input).toHaveAttribute('aria-describedby', 'email-input-hint')
    })
  })

  describe('Focus States', () => {
    it('applies cyan ring on focus', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('focus:ring-[#00D9F5]', 'focus:border-[#00D9F5]')
    })

    it('applies error ring on focus when error is present', () => {
      render(<Input error="Invalid" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('focus:ring-[#EF4444]', 'focus:border-[#EF4444]')
    })
  })

  describe('DealZone Design Tokens', () => {
    it('applies correct border radius (8px via rounded-lg)', () => {
      render(<Input data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveClass('rounded-lg')
    })

    it('applies DealZone color for focus ring (#00D9F5 cyan)', () => {
      render(<Input data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveClass('focus:ring-[#00D9F5]')
    })

    it('applies DealZone error color (#EF4444)', () => {
      render(<Input error="Error" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveClass('border-[#EF4444]')
    })

    it('applies correct text colors', () => {
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('text-[#1E293B]') // Primary text
      expect(input).toHaveClass('placeholder:text-[#94A3B8]') // Muted placeholder
    })
  })

  describe('User Interaction', () => {
    it('accepts user input', async () => {
      const user = userEvent.setup()
      render(<Input data-testid="input" />)
      const input = screen.getByTestId('input')
      
      await user.type(input, 'hello@example.com')
      expect(input).toHaveValue('hello@example.com')
    })

    it('calls onChange handler', async () => {
      const user = userEvent.setup()
      const handleChange = vi.fn()
      render(<Input onChange={handleChange} data-testid="input" />)
      const input = screen.getByTestId('input')
      
      await user.type(input, 'test')
      expect(handleChange).toHaveBeenCalled()
    })

    it('calls onFocus and onBlur handlers', async () => {
      const user = userEvent.setup()
      const handleFocus = vi.fn()
      const handleBlur = vi.fn()
      render(
        <Input onFocus={handleFocus} onBlur={handleBlur} data-testid="input" />
      )
      const input = screen.getByTestId('input')
      
      await user.click(input)
      expect(handleFocus).toHaveBeenCalled()
      
      await user.tab()
      expect(handleBlur).toHaveBeenCalled()
    })
  })

  describe('Forward Ref', () => {
    it('forwards ref to input element', () => {
      const ref = { current: null }
      render(<Input ref={ref} />)
      expect(ref.current).toBeInstanceOf(HTMLInputElement)
    })

    it('allows programmatic focus via ref', () => {
      const ref = { current: null }
      render(<Input ref={ref} data-testid="input" />)
      ref.current.focus()
      expect(screen.getByTestId('input')).toHaveFocus()
    })
  })

  describe('Custom Styling', () => {
    it('accepts and applies custom className', () => {
      render(<Input className="custom-class" data-testid="input" />)
      expect(screen.getByTestId('input')).toHaveClass('custom-class')
    })

    it('preserves base classes when custom className is provided', () => {
      render(<Input className="custom-class" data-testid="input" />)
      const input = screen.getByTestId('input')
      expect(input).toHaveClass('w-full', 'rounded-lg', 'custom-class')
    })
  })

  describe('Complete Form Example', () => {
    it('renders complete input with all features', () => {
      render(
        <Input
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          leftIcon={<Mail data-testid="icon" size={18} />}
          helperText="We'll never share your email"
          required
          id="email"
          data-testid="input"
        />
      )

      expect(screen.getByText('Email Address')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
      expect(screen.getByTestId('icon')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByText("We'll never share your email")).toBeInTheDocument()
      expect(screen.getByTestId('input')).toHaveAttribute('type', 'email')
      expect(screen.getByTestId('input')).toHaveAttribute('required')
    })
  })
})
