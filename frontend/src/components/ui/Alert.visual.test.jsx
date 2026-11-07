import { useState } from 'react'
import Alert from './Alert'

/**
 * Visual test page for Alert component
 * Access via browser to verify all alert types and dismissible behavior
 */
export default function AlertVisualTest() {
  const [showDismissible, setShowDismissible] = useState({
    success: true,
    error: true,
    warning: true,
    info: true,
  })

  const handleDismiss = (type) => {
    setShowDismissible((prev) => ({ ...prev, [type]: false }))
  }

  const resetAll = () => {
    setShowDismissible({
      success: true,
      error: true,
      warning: true,
      info: true,
    })
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-[clamp(1.5rem,2vw+1rem,2rem)] font-bold text-[#06245B] mb-2">
            Alert Component Visual Test
          </h1>
          <p className="text-[#64748B] text-sm">
            Testing all alert types with and without dismissible functionality
          </p>
        </div>

        {/* Non-dismissible Alerts */}
        <section>
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Non-dismissible Alerts
          </h2>
          <div className="space-y-4">
            <Alert type="success">
              <strong>Success!</strong> Your changes have been saved successfully.
            </Alert>

            <Alert type="error">
              <strong>Error!</strong> Failed to save changes. Please try again.
            </Alert>

            <Alert type="warning">
              <strong>Warning!</strong> Your session will expire in 5 minutes.
            </Alert>

            <Alert type="info">
              <strong>Info:</strong> New features are available. Check the changelog.
            </Alert>
          </div>
        </section>

        {/* Dismissible Alerts */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[#06245B]">
              Dismissible Alerts
            </h2>
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-[#00D9F5] text-[#06245B] rounded-lg font-medium text-sm hover:bg-[#00C4DE] transition-colors"
            >
              Reset All
            </button>
          </div>
          <div className="space-y-4">
            {showDismissible.success && (
              <Alert
                type="success"
                dismissible
                onDismiss={() => handleDismiss('success')}
              >
                Company verification approved! You can now submit offers.
              </Alert>
            )}

            {showDismissible.error && (
              <Alert
                type="error"
                dismissible
                onDismiss={() => handleDismiss('error')}
              >
                Invalid credentials. Please check your email and password.
              </Alert>
            )}

            {showDismissible.warning && (
              <Alert
                type="warning"
                dismissible
                onDismiss={() => handleDismiss('warning')}
              >
                Your offer is about to expire. Consider extending the validity date.
              </Alert>
            )}

            {showDismissible.info && (
              <Alert
                type="info"
                dismissible
                onDismiss={() => handleDismiss('info')}
              >
                Maintenance scheduled for tonight at 2:00 AM EET.
              </Alert>
            )}
          </div>
        </section>

        {/* Long Content Test */}
        <section>
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Long Content Test
          </h2>
          <Alert type="info">
            <strong>Important Notice:</strong> The platform will undergo scheduled
            maintenance on Saturday, January 15th from 2:00 AM to 4:00 AM EET. During
            this time, all services including RFQ management, offer submissions, and deal
            processing will be temporarily unavailable. We apologize for any inconvenience
            and appreciate your understanding as we work to improve the platform.
          </Alert>
        </section>

        {/* Custom Styling Test */}
        <section>
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">
            Custom Styling Test
          </h2>
          <Alert type="success" className="border-4 shadow-lg">
            Alert with custom border and shadow styling
          </Alert>
        </section>
      </div>
    </div>
  )
}
