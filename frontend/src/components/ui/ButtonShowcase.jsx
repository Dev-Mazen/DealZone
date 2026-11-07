import { Search, Send, Trash2, Download, ArrowRight, ChevronRight } from 'lucide-react';
import Button from './Button';

/**
 * ButtonShowcase Component
 * 
 * Comprehensive showcase of all Button component variants, sizes, and states
 * as specified in Task 2.1: Button component with variants
 * 
 * Requirements Validated:
 * - 1.1: Visual Design System Enhancement (colors, typography)
 * - 1.3: Border radii and shadows
 * - 3.2: Hover and focus transitions
 * - 11.4: Performance optimization
 */
export default function ButtonShowcase() {
  return (
    <div className="p-8 space-y-12 bg-[#F4F7FB] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#06245B] mb-2">
            DealZone Button Component
          </h1>
          <p className="text-[#64748B]">
            Comprehensive showcase of all button variants, sizes, and states
          </p>
        </div>

        {/* Variants Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Button Variants
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
          </div>
        </section>

        {/* Sizes Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Button Sizes (sm, md, lg)
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#64748B] mb-2">Small (h-8 = 32px, px-3, text-sm)</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm">Small Primary</Button>
                <Button variant="secondary" size="sm">Small Secondary</Button>
                <Button variant="outline" size="sm">Small Outline</Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Medium (h-10 = 40px, px-5, text-sm) - Default</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="md">Medium Primary</Button>
                <Button variant="secondary" size="md">Medium Secondary</Button>
                <Button variant="outline" size="md">Medium Outline</Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Large (h-12 = 48px, px-7, text-base)</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="lg">Large Primary</Button>
                <Button variant="secondary" size="lg">Large Secondary</Button>
                <Button variant="outline" size="lg">Large Outline</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Loading State Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Loading State
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" loading>Loading Primary</Button>
            <Button variant="secondary" loading>Loading Secondary</Button>
            <Button variant="outline" loading>Loading Outline</Button>
            <Button variant="ghost" loading>Loading Ghost</Button>
            <Button variant="danger" loading>Loading Danger</Button>
          </div>
        </section>

        {/* Disabled State Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Disabled State (opacity-50, cursor-not-allowed)
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" disabled>Disabled Primary</Button>
            <Button variant="secondary" disabled>Disabled Secondary</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
            <Button variant="ghost" disabled>Disabled Ghost</Button>
            <Button variant="danger" disabled>Disabled Danger</Button>
          </div>
        </section>

        {/* Icon Slots Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Icon Slots (Left/Right)
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#64748B] mb-2">Left Icon</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" icon={<Search size={16} />}>
                  Search
                </Button>
                <Button variant="secondary" icon={<Download size={16} />}>
                  Download
                </Button>
                <Button variant="outline" icon={<Send size={16} />}>
                  Send Message
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Right Icon</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" iconEnd={<ArrowRight size={16} />}>
                  Continue
                </Button>
                <Button variant="secondary" iconEnd={<ChevronRight size={16} />}>
                  Next Step
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Both Icons</p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="primary" 
                  icon={<Search size={16} />}
                  iconEnd={<ArrowRight size={16} />}
                >
                  Search and Continue
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Icon Only (with aria-label)</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" icon={<Search size={16} />} aria-label="Search" />
                <Button variant="secondary" icon={<Download size={16} />} aria-label="Download" />
                <Button variant="danger" icon={<Trash2 size={16} />} aria-label="Delete" />
              </div>
            </div>
          </div>
        </section>

        {/* Transitions Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Hover & Focus Transitions (≤300ms)
          </h2>
          <p className="text-sm text-[#64748B] mb-4">
            All buttons have transition-all duration-150 (150ms). Hover over buttons to see smooth color transitions and scale effects.
          </p>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-[#64748B] mb-2">Hover Effects:</p>
              <ul className="text-sm text-[#64748B] mb-2 list-disc list-inside">
                <li>Primary: bg-[#00D9F5] → hover:bg-[#00C4DE]</li>
                <li>Secondary: bg-[#06245B] → hover:bg-[#123878]</li>
                <li>Outline: bg-transparent → hover:bg-[#EAF4FF]</li>
                <li>Ghost: bg-transparent → hover:bg-[#EAF4FF]</li>
                <li>Danger: bg-[#EF4444] → hover:bg-[#DC2626]</li>
                <li>All: active:scale-[0.98] for button press feedback</li>
              </ul>
            </div>
            <div>
              <p className="text-sm text-[#64748B] mb-2">Focus States (Tab to test):</p>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Tab to Focus</Button>
                <Button variant="secondary">Focus Ring Test</Button>
                <Button variant="outline">Keyboard Navigation</Button>
              </div>
              <p className="text-xs text-[#64748B] mt-2">
                Focus-visible: ring-2 ring-offset-2 with brand color ring
              </p>
            </div>
          </div>
        </section>

        {/* Full Width Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Full Width Option
          </h2>
          <div className="space-y-3">
            <Button variant="primary" fullWidth>Full Width Primary</Button>
            <Button variant="secondary" fullWidth>Full Width Secondary</Button>
            <Button variant="outline" fullWidth>Full Width Outline</Button>
          </div>
        </section>

        {/* Real-World Examples */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Real-World Usage Examples
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-[#06245B] mb-3">Form Actions</p>
              <div className="flex gap-3">
                <Button variant="primary" icon={<Send size={16} />}>
                  Submit RFQ
                </Button>
                <Button variant="outline">Cancel</Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#06245B] mb-3">Navigation</p>
              <div className="flex gap-3">
                <Button variant="secondary" iconEnd={<ArrowRight size={16} />}>
                  Continue to Payment
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#06245B] mb-3">Destructive Actions</p>
              <div className="flex gap-3">
                <Button variant="danger" icon={<Trash2 size={16} />}>
                  Delete Company
                </Button>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-[#06245B] mb-3">Loading State in Forms</p>
              <div className="flex gap-3">
                <Button variant="primary" loading>
                  Creating RFQ...
                </Button>
                <Button variant="secondary" disabled>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* As Prop Section */}
        <section className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Polymorphic "as" Prop (Link Buttons)
          </h2>
          <div className="flex flex-wrap gap-4">
            <Button 
              as="a" 
              href="https://dealzone.example.com" 
              variant="primary"
              icon={<ArrowRight size={16} />}
            >
              Visit Website
            </Button>
            <Button 
              as="a" 
              href="/about" 
              variant="secondary"
            >
              Learn More
            </Button>
          </div>
        </section>

        {/* Design Token Reference */}
        <section className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Design Token Reference
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-[#06245B] mb-2">Colors (from @/styles/tokens)</h3>
              <ul className="text-sm text-[#64748B] space-y-1">
                <li>Primary Cyan: #00D9F5</li>
                <li>Primary Navy: #06245B</li>
                <li>Secondary Ice Blue: #EAF4FF</li>
                <li>Error Red: #EF4444</li>
                <li>Slate Gray: #64748B</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#06245B] mb-2">Spacing & Typography</h3>
              <ul className="text-sm text-[#64748B] space-y-1">
                <li>Border Radius: 8px (md), 12px (lg)</li>
                <li>Shadow: 0 4px 20px -2px rgba(6, 36, 91, 0.08)</li>
                <li>Transition Duration: 150ms (≤300ms requirement)</li>
                <li>Font Weight: 400 (Regular), 500 (Medium), 600 (Semibold)</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Requirements Validation */}
        <section className="bg-[#EAF4FF] rounded-xl p-6">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            ✅ Requirements Validation Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Req 1.1, 1.3:</strong> Implements DealZone design tokens from @/styles/tokens (colors, typography, spacing)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Req 3.2:</strong> Hover and focus transitions with max 300ms duration (currently 150ms)
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Req 11.4:</strong> Performance optimized with React.forwardRef, minimal re-renders
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Task 2.1:</strong> All variants (primary, secondary, outline, ghost, danger) implemented
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Task 2.1:</strong> All sizes (sm, md, lg) with proper spacing implemented
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Task 2.1:</strong> Loading and disabled states with visual feedback implemented
              </span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-[#10B981] font-bold">✓</span>
              <span className="text-[#06245B]">
                <strong>Task 2.1:</strong> Left/right icon slots (icon, iconEnd props) implemented
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
