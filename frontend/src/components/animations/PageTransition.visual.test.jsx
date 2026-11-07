/**
 * Visual Test Page for PageTransition Component
 * 
 * This file demonstrates the PageTransition component functionality.
 * 
 * To test:
 * 1. Start the dev server: npm run dev
 * 2. Navigate between routes to see the page transition effect
 * 3. The animation should show:
 *    - Fade-in: opacity 0 → 1, duration 200ms
 *    - Slide-up: translateY 10px → 0, duration 200ms
 * 
 * Accessibility:
 * - Respects prefers-reduced-motion media query
 * - Users who prefer reduced motion will see instant transitions
 * 
 * To test prefers-reduced-motion:
 * 1. Open Chrome DevTools
 * 2. Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows/Linux)
 * 3. Type "Rendering" and select "Show Rendering"
 * 4. In the Rendering panel, check "Emulate CSS media feature prefers-reduced-motion"
 * 5. Select "prefers-reduced-motion: reduce"
 * 6. Navigate between routes - animations should be instant
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import PageTransition from './PageTransition'
import Button from '../ui/Button'

export default function PageTransitionVisualTest() {
  const [pageContent, setPageContent] = useState(1)

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-[#06245B] mb-4">
          PageTransition Component Visual Test
        </h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-[#EAF4FF] rounded-lg">
            <h2 className="font-semibold text-[#06245B] mb-2">
              Animation Specifications
            </h2>
            <ul className="text-sm text-slate-600 space-y-1">
              <li>• <strong>Fade-in:</strong> opacity 0 → 1, 200ms ease-out</li>
              <li>• <strong>Slide-up:</strong> translateY 10px → 0, 200ms ease-out</li>
              <li>• <strong>Accessibility:</strong> Respects prefers-reduced-motion</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h2 className="font-semibold text-[#06245B]">Test Instructions</h2>
            <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
              <li>Click the buttons below to simulate page changes</li>
              <li>Watch for the fade-in and slide-up animation</li>
              <li>Each transition should take 200ms</li>
              <li>
                To test reduced motion support:
                <ul className="ml-6 mt-1 space-y-1 list-disc list-inside">
                  <li>Open Chrome DevTools (F12)</li>
                  <li>Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)</li>
                  <li>Type "Rendering" and open the Rendering panel</li>
                  <li>Check "Emulate prefers-reduced-motion: reduce"</li>
                  <li>Animations should now be instant (no transition)</li>
                </ul>
              </li>
            </ol>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={() => setPageContent((prev) => prev + 1)}
          >
            Simulate Page Change
          </Button>
          <Button
            variant="outline"
            as={Link}
            to="/dashboard"
          >
            Go to Dashboard (Real Route Change)
          </Button>
        </div>
      </div>

      {/* Simulated page content with transition */}
      <PageTransition key={pageContent}>
        <div className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#06245B] mb-4">
            Page Content #{pageContent}
          </h2>
          <div className="space-y-4">
            <p className="text-slate-600">
              This content should fade in and slide up smoothly when the page changes.
              The animation duration is 200ms with ease-out timing.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-[#06245B] mb-2">
                  Animation Property 1
                </h3>
                <p className="text-xs text-slate-600">
                  Opacity transitions from 0 to 1 over 200 milliseconds
                </p>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-sm text-[#06245B] mb-2">
                  Animation Property 2
                </h3>
                <p className="text-xs text-slate-600">
                  Transform transitions from translateY(10px) to translateY(0)
                </p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✓ If you can see this content fading in and sliding up smoothly,
                the PageTransition component is working correctly!
              </p>
            </div>
          </div>
        </div>
      </PageTransition>

      {/* Implementation Notes */}
      <div className="bg-slate-50 rounded-lg p-6">
        <h2 className="font-semibold text-[#06245B] mb-3">
          Implementation Notes
        </h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p>
            <strong>Usage:</strong> The PageTransition component has been applied
            to both AppLayout and PublicLayout, wrapping the {`<Outlet />`} component.
            This means all route-level pages automatically receive the transition effect.
          </p>
          <p>
            <strong>Performance:</strong> The animation uses CSS transitions for optimal
            performance. No JavaScript animation libraries are required.
          </p>
          <p>
            <strong>Accessibility:</strong> The component respects the user's motion
            preferences through the CSS @media (prefers-reduced-motion: reduce) query.
          </p>
        </div>
      </div>

      {/* Browser Compatibility */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h2 className="font-semibold text-[#06245B] mb-3">
          Browser Compatibility
        </h2>
        <div className="text-sm text-slate-600 space-y-2">
          <p>The PageTransition component uses standard CSS features supported by all modern browsers:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>CSS Transitions (opacity, transform)</li>
            <li>CSS @media queries (prefers-reduced-motion)</li>
            <li>React hooks (useState, useEffect)</li>
          </ul>
          <p className="mt-2">
            <strong>Supported:</strong> Chrome, Firefox, Safari, Edge (all recent versions)
          </p>
        </div>
      </div>
    </div>
  )
}
