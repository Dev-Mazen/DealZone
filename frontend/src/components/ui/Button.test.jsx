import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button Component', () => {
  describe('Variants', () => {
    it('should render primary variant with correct styles', () => {
      render(<Button variant="primary">Primary Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('bg-[#00D9F5]');
      expect(button).toHaveClass('text-[#06245B]');
    });

    it('should render secondary variant with correct styles', () => {
      render(<Button variant="secondary">Secondary Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-[#06245B]');
      expect(button).toHaveClass('text-white');
    });

    it('should render outline variant with correct styles', () => {
      render(<Button variant="outline">Outline Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('border-2');
      expect(button).toHaveClass('border-[#06245B]');
    });

    it('should render ghost variant with correct styles', () => {
      render(<Button variant="ghost">Ghost Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-transparent');
      expect(button).toHaveClass('text-[#06245B]');
    });

    it('should render danger variant with correct styles', () => {
      render(<Button variant="danger">Danger Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('bg-[#EF4444]');
      expect(button).toHaveClass('text-white');
    });
  });

  describe('Sizes', () => {
    it('should render small size with correct height and padding', () => {
      render(<Button size="sm">Small Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-sm');
    });

    it('should render medium size with correct height and padding', () => {
      render(<Button size="md">Medium Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-5');
    });

    it('should render large size with correct height and padding', () => {
      render(<Button size="lg">Large Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('h-12');
      expect(button).toHaveClass('px-7');
      expect(button).toHaveClass('text-base');
    });
  });

  describe('Loading State', () => {
    it('should show spinner when loading', () => {
      render(<Button loading>Loading Button</Button>);
      const button = screen.getByRole('button');
      const spinner = button.querySelector('svg.animate-spin');
      
      expect(spinner).toBeInTheDocument();
      expect(button).toBeDisabled();
    });

    it('should not show icon when loading', () => {
      const icon = <span data-testid="test-icon">🔍</span>;
      render(<Button loading icon={icon}>Search</Button>);
      
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument();
    });
  });

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toHaveClass('disabled:cursor-not-allowed');
    });

    it('should not trigger onClick when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button disabled onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icon Slots', () => {
    it('should render left icon', () => {
      const icon = <span data-testid="left-icon">📧</span>;
      render(<Button icon={icon}>Email</Button>);
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    });

    it('should render right icon', () => {
      const icon = <span data-testid="right-icon">→</span>;
      render(<Button iconEnd={icon}>Next</Button>);
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });

    it('should render both left and right icons', () => {
      const leftIcon = <span data-testid="left-icon">📧</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;
      
      render(
        <Button icon={leftIcon} iconEnd={rightIcon}>
          Send Message
        </Button>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Transitions', () => {
    it('should have transition classes', () => {
      render(<Button>Transition Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('transition-all');
      expect(button).toHaveClass('duration-150');
    });

    it('should have hover classes', () => {
      render(<Button variant="primary">Hover Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button.className).toContain('hover:');
    });

    it('should have active scale effect', () => {
      render(<Button>Active Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('active:scale-[0.98]');
    });

    it('should have focus-visible ring', () => {
      render(<Button>Focus Test</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('focus-visible:ring-2');
    });
  });

  describe('Full Width', () => {
    it('should render full width when fullWidth prop is true', () => {
      render(<Button fullWidth>Full Width Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('w-full');
    });

    it('should not render full width by default', () => {
      render(<Button>Normal Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).not.toHaveClass('w-full');
    });
  });

  describe('Custom Props', () => {
    it('should apply custom className', () => {
      render(<Button className="custom-class">Custom Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveClass('custom-class');
    });

    it('should handle onClick event', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Click Me</Button>);
      const button = screen.getByRole('button');
      
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should forward ref correctly', () => {
      const ref = { current: null };
      render(<Button ref={ref}>Ref Test</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should render as different element when "as" prop is provided', () => {
      render(<Button as="a" href="/test">Link Button</Button>);
      const link = screen.getByRole('link');
      
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
    });
  });

  describe('Accessibility', () => {
    it('should have type="button" by default', () => {
      render(<Button>Default Type</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should allow custom type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('disabled');
    });
  });

  describe('Content Rendering', () => {
    it('should render children text', () => {
      render(<Button>Click Me</Button>);
      
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render without children', () => {
      const icon = <span data-testid="only-icon">🔍</span>;
      render(<Button icon={icon} aria-label="Search" />);
      const button = screen.getByRole('button');
      
      expect(button).toBeInTheDocument();
      expect(screen.getByTestId('only-icon')).toBeInTheDocument();
    });
  });
});
