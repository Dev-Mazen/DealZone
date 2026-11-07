import Container from './Container'
import Card from '../ui/Card'

/**
 * Container Component Showcase
 * Demonstrates all size variants and responsive behavior
 */
const ContainerShowcase = () => {
  return (
    <div className="py-12 space-y-16 bg-[#F4F7FB]">
      {/* Header */}
      <Container>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[#06245B] mb-4">
            Container Component Showcase
          </h1>
          <p className="text-[#64748B] max-w-2xl mx-auto">
            Responsive container component with size variants (sm, md, lg, xl, full).
            Each container has centered alignment with mx-auto and responsive horizontal padding.
          </p>
        </div>
      </Container>

      {/* Small Container */}
      <Container size="sm">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-2">
              Small Container (sm)
            </h2>
            <p className="text-[#64748B] mb-4">
              Max-width: 640px (max-w-screen-sm)
            </p>
            <div className="bg-[#EAF4FF] p-4 rounded-lg text-sm text-[#06245B] font-mono">
              Responsive padding: px-4 sm:px-6 lg:px-8
            </div>
          </div>
        </Card>
      </Container>

      {/* Medium Container */}
      <Container size="md">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-2">
              Medium Container (md)
            </h2>
            <p className="text-[#64748B] mb-4">
              Max-width: 768px (max-w-screen-md)
            </p>
            <div className="bg-[#EAF4FF] p-4 rounded-lg text-sm text-[#06245B] font-mono">
              Centered alignment with mx-auto
            </div>
          </div>
        </Card>
      </Container>

      {/* Large Container */}
      <Container size="lg">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-2">
              Large Container (lg)
            </h2>
            <p className="text-[#64748B] mb-4">
              Max-width: 1024px (max-w-screen-lg)
            </p>
            <div className="bg-[#EAF4FF] p-4 rounded-lg">
              <p className="text-sm text-[#06245B] mb-2">
                Perfect for content-rich pages with sidebars
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-white p-3 rounded text-center text-sm">Column 1</div>
                <div className="bg-white p-3 rounded text-center text-sm">Column 2</div>
                <div className="bg-white p-3 rounded text-center text-sm">Column 3</div>
              </div>
            </div>
          </div>
        </Card>
      </Container>

      {/* Extra Large Container (Default) */}
      <Container size="xl">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-2">
              Extra Large Container (xl) - Default
            </h2>
            <p className="text-[#64748B] mb-4">
              Max-width: 1280px (max-w-screen-xl)
            </p>
            <div className="bg-[#EAF4FF] p-4 rounded-lg">
              <p className="text-sm text-[#06245B] mb-2">
                This is the default size when no size prop is specified
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-white p-3 rounded text-center text-sm">Feature 1</div>
                <div className="bg-white p-3 rounded text-center text-sm">Feature 2</div>
                <div className="bg-white p-3 rounded text-center text-sm">Feature 3</div>
                <div className="bg-white p-3 rounded text-center text-sm">Feature 4</div>
              </div>
            </div>
          </div>
        </Card>
      </Container>

      {/* Full Container */}
      <Container size="full">
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-2">
              Full Width Container (full)
            </h2>
            <p className="text-[#64748B] mb-4">
              Max-width: 1536px (max-w-screen-2xl)
            </p>
            <div className="bg-[#EAF4FF] p-4 rounded-lg">
              <p className="text-sm text-[#06245B] mb-2">
                Best for wide dashboards and data-heavy interfaces
              </p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-4">
                <div className="bg-white p-3 rounded text-center text-sm">Stat 1</div>
                <div className="bg-white p-3 rounded text-center text-sm">Stat 2</div>
                <div className="bg-white p-3 rounded text-center text-sm">Stat 3</div>
                <div className="bg-white p-3 rounded text-center text-sm">Stat 4</div>
                <div className="bg-white p-3 rounded text-center text-sm">Stat 5</div>
                <div className="bg-white p-3 rounded text-center text-sm">Stat 6</div>
              </div>
            </div>
          </div>
        </Card>
      </Container>

      {/* Custom className Example */}
      <Container className="bg-gradient-to-r from-[#06245B] to-[#1266D6] rounded-2xl">
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">
            Custom Styling Support
          </h2>
          <p className="text-[#EAF4FF] max-w-2xl mx-auto mb-6">
            The Container component accepts additional className props,
            allowing you to add custom styling while maintaining responsive behavior.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              ✓ Responsive padding
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              ✓ Centered alignment
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm">
              ✓ Max-width constraints
            </div>
          </div>
        </div>
      </Container>

      {/* Nested Containers Example */}
      <Container>
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-4">
              Nested Containers
            </h2>
            <Container size="md" className="bg-[#EAF4FF] py-6 rounded-lg">
              <p className="text-[#06245B] text-center">
                Containers can be nested for complex layouts with multiple levels of content width control.
              </p>
            </Container>
          </div>
        </Card>
      </Container>

      {/* Responsive Behavior Info */}
      <Container>
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-[#06245B] mb-4">
              Responsive Behavior
            </h2>
            <div className="space-y-3 text-[#64748B]">
              <div className="flex items-start gap-3">
                <span className="text-[#00D9F5] font-bold">📱</span>
                <div>
                  <strong className="text-[#06245B]">Mobile (< 640px):</strong>
                  <span className="ml-2">px-4 (16px horizontal padding)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00D9F5] font-bold">📱</span>
                <div>
                  <strong className="text-[#06245B]">Tablet (640px - 1024px):</strong>
                  <span className="ml-2">px-6 (24px horizontal padding)</span>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-[#00D9F5] font-bold">💻</span>
                <div>
                  <strong className="text-[#06245B]">Desktop (≥ 1024px):</strong>
                  <span className="ml-2">px-8 (32px horizontal padding)</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </Container>
    </div>
  )
}

export default ContainerShowcase
