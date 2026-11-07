import { useState } from 'react'
import Alert from './ui/Alert'

/**
 * Design System Test Component
 * 
 * This component demonstrates the DealZone design system tokens in action.
 * Use this as a reference for implementing consistent UI components.
 * 
 * To view: Import and render this component in any page during development.
 */

export default function DesignSystemTest() {
  const [showAlert, setShowAlert] = useState(true)
  return (
    <div className="min-h-screen bg-[--color-cloud-gray] p-[--spacing-8]">
      <div className="max-w-screen-xl mx-auto">
        
        {/* Header */}
        <header className="mb-[--spacing-12]">
          <h1 className="text-[length:--font-size-h1] font-[--font-weight-bold] text-[--color-navy] mb-[--spacing-2]">
            DealZone Design System
          </h1>
          <p className="text-[length:--font-size-body] text-[--color-text-secondary]">
            Visual reference for design tokens, components, and patterns
          </p>
        </header>

        {/* Colors Section */}
        <section className="mb-[--spacing-12]">
          <h2 className="text-[length:--font-size-h2] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-6]">
            Color Palette
          </h2>
          
          {/* Primary Colors */}
          <div className="mb-[--spacing-6]">
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Primary Brand Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[--spacing-4]">
              <div>
                <div className="h-24 bg-[--color-navy] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Navy</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#06245B</p>
              </div>
              <div>
                <div className="h-24 bg-[--color-cyan] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Cyan</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#00D9F5</p>
              </div>
              <div>
                <div className="h-24 bg-[--color-blue] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Growth Blue</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#1266D6</p>
              </div>
              <div>
                <div className="h-24 bg-white border-2 border-[--color-cloud-gray] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">White</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#FFFFFF</p>
              </div>
            </div>
          </div>

          {/* Status Colors */}
          <div>
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Status Colors
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[--spacing-4]">
              <div>
                <div className="h-24 bg-[--color-success] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Success</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#10B981</p>
              </div>
              <div>
                <div className="h-24 bg-[--color-warning] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Warning</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#F59E0B</p>
              </div>
              <div>
                <div className="h-24 bg-[--color-error] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Error</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#EF4444</p>
              </div>
              <div>
                <div className="h-24 bg-[--color-info] rounded-[--radius-md] shadow-[--shadow-soft] mb-[--spacing-2]"></div>
                <p className="text-[length:--font-size-small] font-[--font-weight-medium]">Info</p>
                <p className="text-[length:--font-size-micro] text-[--color-text-muted]">#3B82F6</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-[--spacing-12]">
          <h2 className="text-[length:--font-size-h2] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-6]">
            Typography Scale
          </h2>
          <div className="bg-white rounded-[--radius-xl] shadow-[--shadow-soft] p-[--spacing-6]">
            <div className="mb-[--spacing-4]">
              <h1 className="text-[length:--font-size-h1] font-[--font-weight-bold] text-[--color-navy]">
                Heading 1 - Bold (Fluid 24px → 32px)
              </h1>
            </div>
            <div className="mb-[--spacing-4]">
              <h2 className="text-[length:--font-size-h2] font-[--font-weight-semibold] text-[--color-navy]">
                Heading 2 - Semibold (Fluid 20px → 24px)
              </h2>
            </div>
            <div className="mb-[--spacing-4]">
              <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy]">
                Heading 3 - Semibold (Fluid 18px → 20px)
              </h3>
            </div>
            <div className="mb-[--spacing-4]">
              <p className="text-[length:--font-size-body] text-[--color-text-primary]">
                Body Text - Regular (Fluid 14px → 16px) - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.
              </p>
            </div>
            <div className="mb-[--spacing-4]">
              <p className="text-[length:--font-size-small] text-[--color-text-secondary]">
                Small Text - Regular (Fluid 12px → 14px) - Supporting text and captions
              </p>
            </div>
            <div>
              <p className="text-[length:--font-size-micro] text-[--color-text-muted] font-[--font-weight-medium]">
                Micro Text - Medium (12px) - Labels and meta information
              </p>
            </div>
          </div>
        </section>

        {/* Components Section */}
        <section className="mb-[--spacing-12]">
          <h2 className="text-[length:--font-size-h2] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-6]">
            Component Examples
          </h2>
          
          {/* Buttons */}
          <div className="mb-[--spacing-6]">
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Buttons
            </h3>
            <div className="flex flex-wrap gap-[--spacing-3]">
              <button className="bg-[--color-cyan] text-white px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md] font-[--font-weight-medium] hover:bg-[--color-blue] transition-all duration-[--transition-base]">
                Primary Button
              </button>
              <button className="bg-[--color-ice-blue] text-[--color-navy] px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md] font-[--font-weight-medium] hover:bg-[--color-cyan]/10 transition-all duration-[--transition-base]">
                Secondary Button
              </button>
              <button className="border-2 border-[--color-navy] text-[--color-navy] px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md] font-[--font-weight-medium] hover:bg-[--color-navy] hover:text-white transition-all duration-[--transition-base]">
                Outline Button
              </button>
              <button className="bg-[--color-error] text-white px-[--spacing-6] py-[--spacing-3] rounded-[--radius-md] font-[--font-weight-medium] hover:opacity-90 transition-all duration-[--transition-base]">
                Danger Button
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="mb-[--spacing-6]">
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Cards
            </h3>
            <div className="grid md:grid-cols-3 gap-[--spacing-4]">
              <div className="bg-white rounded-[--radius-xl] shadow-[--shadow-soft] p-[--spacing-6] hover:shadow-[--shadow-card] transition-all duration-[--transition-base]">
                <h4 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-2]">
                  Card Title
                </h4>
                <p className="text-[length:--font-size-body] text-[--color-text-secondary]">
                  Card content with hover elevation effect
                </p>
              </div>
              <div className="bg-white rounded-[--radius-xl] shadow-[--shadow-soft] p-[--spacing-6] border-2 border-[--color-cyan]">
                <h4 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-2]">
                  Highlighted Card
                </h4>
                <p className="text-[length:--font-size-body] text-[--color-text-secondary]">
                  Card with cyan border accent
                </p>
              </div>
              <div className="bg-white rounded-[--radius-xl] shadow-[--shadow-modal] p-[--spacing-6]">
                <h4 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-2]">
                  Elevated Card
                </h4>
                <p className="text-[length:--font-size-body] text-[--color-text-secondary]">
                  Card with modal shadow
                </p>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-[--spacing-6]">
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Badges
            </h3>
            <div className="flex flex-wrap gap-[--spacing-3]">
              <span className="inline-flex items-center px-[--spacing-3] py-[0.25rem] rounded-[--radius-full] bg-[#10B98114] text-[#059669] text-[length:--font-size-small] font-[--font-weight-medium]">
                ✓ Approved
              </span>
              <span className="inline-flex items-center px-[--spacing-3] py-[0.25rem] rounded-[--radius-full] bg-[#F59E0B14] text-[#D97706] text-[length:--font-size-small] font-[--font-weight-medium]">
                ⏱ Pending
              </span>
              <span className="inline-flex items-center px-[--spacing-3] py-[0.25rem] rounded-[--radius-full] bg-[#EF444414] text-[#DC2626] text-[length:--font-size-small] font-[--font-weight-medium]">
                ✕ Rejected
              </span>
              <span className="inline-flex items-center px-[--spacing-3] py-[0.25rem] rounded-[--radius-full] bg-[#3B82F614] text-[#2563EB] text-[length:--font-size-small] font-[--font-weight-medium]">
                ℹ Info
              </span>
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="text-[length:--font-size-h3] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-3]">
              Alerts
            </h3>
            <div className="space-y-4">
              <Alert type="success">
                <strong>Success!</strong> Your company verification has been approved.
              </Alert>
              <Alert type="error">
                <strong>Error!</strong> Failed to submit offer. Please try again.
              </Alert>
              <Alert type="warning">
                <strong>Warning!</strong> Your offer will expire in 24 hours.
              </Alert>
              <Alert type="info">
                <strong>Info:</strong> New RFQs matching your profile are available.
              </Alert>
              {showAlert && (
                <Alert type="info" dismissible onDismiss={() => setShowAlert(false)}>
                  This is a dismissible alert. Click the × button to close it.
                </Alert>
              )}
              {!showAlert && (
                <button
                  onClick={() => setShowAlert(true)}
                  className="text-[--color-cyan] text-[length:--font-size-small] font-[--font-weight-medium] hover:underline"
                >
                  Show dismissible alert
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Spacing & Shadows */}
        <section className="mb-[--spacing-12]">
          <h2 className="text-[length:--font-size-h2] font-[--font-weight-semibold] text-[--color-navy] mb-[--spacing-6]">
            Spacing & Shadows
          </h2>
          <div className="grid md:grid-cols-4 gap-[--spacing-4]">
            <div className="bg-white rounded-[--radius-md] p-[--spacing-4]" style={{ boxShadow: 'var(--shadow-soft)' }}>
              <p className="text-[length:--font-size-small] font-[--font-weight-medium] text-[--color-navy]">Soft Shadow</p>
            </div>
            <div className="bg-white rounded-[--radius-md] p-[--spacing-4]" style={{ boxShadow: 'var(--shadow-card)' }}>
              <p className="text-[length:--font-size-small] font-[--font-weight-medium] text-[--color-navy]">Card Shadow</p>
            </div>
            <div className="bg-white rounded-[--radius-md] p-[--spacing-4]" style={{ boxShadow: 'var(--shadow-modal)' }}>
              <p className="text-[length:--font-size-small] font-[--font-weight-medium] text-[--color-navy]">Modal Shadow</p>
            </div>
            <div className="bg-white rounded-[--radius-md] p-[--spacing-4]" style={{ boxShadow: 'var(--shadow-brand)' }}>
              <p className="text-[length:--font-size-small] font-[--font-weight-medium] text-[--color-navy]">Brand Shadow</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-[length:--font-size-small] text-[--color-text-muted]">
          <p>DealZone Design System v1.0.0 | Requirements: 1.1, 1.2, 1.3, 1.7, 7.1, 7.12</p>
        </footer>

      </div>
    </div>
  );
}
