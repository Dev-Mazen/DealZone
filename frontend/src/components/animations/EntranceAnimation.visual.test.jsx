import EntranceAnimation from './EntranceAnimation';

/**
 * Visual Test Component for EntranceAnimation
 * 
 * Simple visual verification test that can be rendered in the browser.
 * Tests all core functionality without requiring a test runner.
 */
function EntranceAnimationVisualTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">EntranceAnimation Visual Test</h1>
        
        {/* Test 1: Basic Fade */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 1: Basic Fade Animation</h2>
          <EntranceAnimation direction="fade">
            <div className="bg-white p-6 rounded-lg shadow">
              <p>This should fade in when scrolled into view</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 2: Direction Up */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 2: Slide Up</h2>
          <EntranceAnimation direction="up">
            <div className="bg-blue-50 p-6 rounded-lg shadow">
              <p>This should slide up from below</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 3: Direction Down */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 3: Slide Down</h2>
          <EntranceAnimation direction="down">
            <div className="bg-green-50 p-6 rounded-lg shadow">
              <p>This should slide down from above</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 4: Direction Left */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 4: Slide Left</h2>
          <EntranceAnimation direction="left">
            <div className="bg-purple-50 p-6 rounded-lg shadow">
              <p>This should slide in from the right</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 5: Direction Right */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 5: Slide Right</h2>
          <EntranceAnimation direction="right">
            <div className="bg-yellow-50 p-6 rounded-lg shadow">
              <p>This should slide in from the left</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 6: Stagger Effect */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 6: Stagger Effect</h2>
          <div className="space-y-4">
            {[0, 100, 200, 300, 400].map((delay, index) => (
              <EntranceAnimation key={index} direction="up" delay={delay}>
                <div className="bg-indigo-50 p-4 rounded-lg shadow">
                  <p>Item {index + 1} - Delay: {delay}ms</p>
                </div>
              </EntranceAnimation>
            ))}
          </div>
        </section>

        {/* Test 7: Custom Threshold */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 7: Custom Threshold (50%)</h2>
          <EntranceAnimation direction="fade" threshold={0.5}>
            <div className="bg-pink-50 p-6 rounded-lg shadow">
              <p>This triggers when 50% of the element is visible</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 8: Trigger Multiple Times */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 8: Trigger Multiple Times</h2>
          <EntranceAnimation direction="fade" triggerOnce={false}>
            <div className="bg-orange-50 p-6 rounded-lg shadow">
              <p>Scroll past this and back - it should animate each time</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Test 9: Custom ClassName */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 9: Custom Class Name</h2>
          <EntranceAnimation direction="up" className="border-4 border-red-500">
            <div className="bg-red-50 p-6 rounded-lg shadow">
              <p>This has a custom red border from className prop</p>
            </div>
          </EntranceAnimation>
        </section>

        {/* Spacer for scrolling */}
        <div className="h-screen flex items-center justify-center">
          <p className="text-gray-500">Scroll down to see more tests ↓</p>
        </div>

        {/* Test 10: Multiple animations */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Test 10: Grid with Multiple Animations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <EntranceAnimation direction="left" delay={0}>
              <div className="bg-cyan-50 p-6 rounded-lg shadow">
                <p>Left 1</p>
              </div>
            </EntranceAnimation>
            <EntranceAnimation direction="up" delay={100}>
              <div className="bg-cyan-100 p-6 rounded-lg shadow">
                <p>Up 2</p>
              </div>
            </EntranceAnimation>
            <EntranceAnimation direction="right" delay={200}>
              <div className="bg-cyan-150 p-6 rounded-lg shadow">
                <p>Right 3</p>
              </div>
            </EntranceAnimation>
          </div>
        </section>

        {/* Accessibility Note */}
        <section className="mb-12">
          <EntranceAnimation direction="fade">
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-gray-300">
              <h3 className="font-semibold mb-2">✅ Accessibility Check</h3>
              <p className="text-sm text-gray-700">
                To test prefers-reduced-motion support:
              </p>
              <ol className="list-decimal list-inside text-sm text-gray-700 mt-2 space-y-1">
                <li>Open Chrome DevTools (F12)</li>
                <li>Press Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)</li>
                <li>Type "reduced motion" and select "Emulate CSS prefers-reduced-motion"</li>
                <li>Refresh the page - all animations should be disabled</li>
              </ol>
            </div>
          </EntranceAnimation>
        </section>

        <div className="h-32"></div>
      </div>
    </div>
  );
}

export default EntranceAnimationVisualTest;
