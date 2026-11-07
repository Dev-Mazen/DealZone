import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import EntranceAnimation from './EntranceAnimation';

/**
 * Unit tests for EntranceAnimation component
 * 
 * **Validates: Requirements 3.1, 3.7**
 * 
 * Tests verify:
 * - Intersection Observer setup and cleanup
 * - Direction variants (up, down, left, right, fade)
 * - Stagger delay functionality
 * - prefers-reduced-motion support
 * - Animation triggering on viewport entry
 */

describe('EntranceAnimation', () => {
  let intersectionObserverMock;
  let observeMock;
  let unobserveMock;
  let disconnectMock;

  beforeEach(() => {
    // Mock IntersectionObserver
    observeMock = vi.fn();
    unobserveMock = vi.fn();
    disconnectMock = vi.fn();

    intersectionObserverMock = vi.fn(function(callback, options) {
      this.callback = callback;
      this.options = options;
      this.observe = observeMock;
      this.unobserve = unobserveMock;
      this.disconnect = disconnectMock;
    });

    global.IntersectionObserver = intersectionObserverMock;

    // Mock matchMedia
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render children', () => {
    render(
      <EntranceAnimation>
        <div>Test Content</div>
      </EntranceAnimation>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should setup Intersection Observer with correct options', () => {
    render(
      <EntranceAnimation threshold={0.5} rootMargin="50px">
        <div>Test</div>
      </EntranceAnimation>
    );

    expect(intersectionObserverMock).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        threshold: 0.5,
        rootMargin: '50px',
      })
    );
  });

  it('should observe the element on mount', () => {
    const { container } = render(
      <EntranceAnimation>
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(observeMock).toHaveBeenCalledWith(element);
  });

  it('should unobserve on unmount', () => {
    const { container, unmount } = render(
      <EntranceAnimation>
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    unmount();

    expect(unobserveMock).toHaveBeenCalledWith(element);
  });

  it('should apply fade animation classes by default', () => {
    const { container } = render(
      <EntranceAnimation>
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');
    expect(element.className).toContain('transition-all');
  });

  it('should apply up direction animation classes', () => {
    const { container } = render(
      <EntranceAnimation direction="up">
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');
    expect(element.className).toContain('translate-y-10');
  });

  it('should apply down direction animation classes', () => {
    const { container } = render(
      <EntranceAnimation direction="down">
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');
    expect(element.className).toContain('-translate-y-10');
  });

  it('should apply left direction animation classes', () => {
    const { container } = render(
      <EntranceAnimation direction="left">
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');
    expect(element.className).toContain('translate-x-10');
  });

  it('should apply right direction animation classes', () => {
    const { container } = render(
      <EntranceAnimation direction="right">
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');
    expect(element.className).toContain('-translate-x-10');
  });

  it('should show element immediately when prefers-reduced-motion is enabled', () => {
    global.matchMedia = vi.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(
      <EntranceAnimation>
        <div>Test</div>
      </EntranceAnimation>
    );

    const element = container.firstChild;
    expect(element.className).toContain('opacity-100');
    expect(element.className).toContain('translate-x-0');
    expect(element.className).toContain('translate-y-0');
  });

  it('should trigger animation after specified delay', async () => {
    vi.useFakeTimers();
    
    const { container } = render(
      <EntranceAnimation delay={500}>
        <div>Test</div>
      </EntranceAnimation>
    );

    // Get the IntersectionObserver callback
    const observerInstance = intersectionObserverMock.mock.results[0].value;
    
    // Simulate intersection
    observerInstance.callback([
      {
        isIntersecting: true,
        target: container.firstChild,
      }
    ]);

    // Before delay, should still have initial classes
    const element = container.firstChild;
    expect(element.className).toContain('opacity-0');

    // Fast-forward time
    vi.advanceTimersByTime(500);

    // After delay, should have visible classes
    await waitFor(() => {
      expect(element.className).toContain('opacity-100');
    });

    vi.useRealTimers();
  });

  it('should unobserve after first intersection when triggerOnce is true', () => {
    const { container } = render(
      <EntranceAnimation triggerOnce={true}>
        <div>Test</div>
      </EntranceAnimation>
    );

    const observerInstance = intersectionObserverMock.mock.results[0].value;
    const element = container.firstChild;
    
    // Simulate intersection
    observerInstance.callback([
      {
        isIntersecting: true,
        target: element,
      }
    ]);

    expect(unobserveMock).toHaveBeenCalledWith(element);
  });

  it('should not unobserve when triggerOnce is false', () => {
    const { container } = render(
      <EntranceAnimation triggerOnce={false}>
        <div>Test</div>
      </EntranceAnimation>
    );

    const observerInstance = intersectionObserverMock.mock.results[0].value;
    
    // Simulate intersection
    observerInstance.callback([
      {
        isIntersecting: true,
        target: container.firstChild,
      }
    ]);

    expect(unobserveMock).not.toHaveBeenCalled();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EntranceAnimation className="custom-class">
        <div>Test</div>
      </EntranceAnimation>
    );

    expect(container.firstChild.className).toContain('custom-class');
  });

  it('should support multiple staggered animations', () => {
    const items = ['Item 1', 'Item 2', 'Item 3'];
    
    const { container } = render(
      <>
        {items.map((item, index) => (
          <EntranceAnimation key={index} delay={index * 100} direction="up">
            <div>{item}</div>
          </EntranceAnimation>
        ))}
      </>
    );

    expect(container.children).toHaveLength(3);
    expect(intersectionObserverMock).toHaveBeenCalledTimes(3);
  });
});
