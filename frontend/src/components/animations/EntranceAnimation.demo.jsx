import EntranceAnimation from './EntranceAnimation';
import Card from '../ui/Card';

/**
 * EntranceAnimation Demo Component
 * 
 * Demonstrates all animation directions and stagger effects.
 * Use this page to verify animations work correctly in the browser.
 */
function EntranceAnimationDemo() {
  const demoCards = [
    { id: 1, title: 'Fade In', direction: 'fade' },
    { id: 2, title: 'Slide Up', direction: 'up' },
    { id: 3, title: 'Slide Down', direction: 'down' },
    { id: 4, title: 'Slide Left', direction: 'left' },
    { id: 5, title: 'Slide Right', direction: 'right' },
  ];

  const staggerItems = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    title: `Stagger Item ${i + 1}`,
  }));

  return (
    <div className="min-h-screen bg-secondary-cloudGray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <EntranceAnimation direction="fade">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-primary-navy mb-4">
              Entrance Animation Showcase
            </h1>
            <p className="text-lg text-secondary-slateGray">
              Scroll down to see different animation directions in action
            </p>
          </div>
        </EntranceAnimation>

        {/* Direction Variants Section */}
        <section className="mb-20">
          <EntranceAnimation direction="up">
            <h2 className="text-2xl font-semibold text-primary-navy mb-6">
              Animation Directions
            </h2>
          </EntranceAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoCards.map((card) => (
              <EntranceAnimation 
                key={card.id} 
                direction={card.direction}
                delay={0}
              >
                <Card hover className="h-full">
                  <div className="p-6">
                    <div className="w-12 h-12 rounded-full bg-primary-cyan/20 flex items-center justify-center mb-4">
                      <span className="text-2xl">🎭</span>
                    </div>
                    <h3 className="text-xl font-semibold text-primary-navy mb-2">
                      {card.title}
                    </h3>
                    <p className="text-secondary-slateGray">
                      This card animates with the <code className="bg-secondary-iceBlue px-2 py-1 rounded text-sm">{card.direction}</code> direction
                    </p>
                  </div>
                </Card>
              </EntranceAnimation>
            ))}
          </div>
        </section>

        {/* Stagger Effect Section */}
        <section className="mb-20">
          <EntranceAnimation direction="up">
            <h2 className="text-2xl font-semibold text-primary-navy mb-2">
              Stagger Effect
            </h2>
            <p className="text-secondary-slateGray mb-6">
              Sequential animations with 100ms delays
            </p>
          </EntranceAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staggerItems.map((item, index) => (
              <EntranceAnimation 
                key={item.id}
                direction="up"
                delay={index * 100}
              >
                <Card className="h-full">
                  <div className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-cyan to-primary-growthBlue flex items-center justify-center text-white font-bold">
                        {item.id}
                      </div>
                      <div>
                        <h3 className="font-semibold text-primary-navy">
                          {item.title}
                        </h3>
                        <p className="text-sm text-secondary-slateGray">
                          Delay: {index * 100}ms
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </EntranceAnimation>
            ))}
          </div>
        </section>

        {/* Content Sections with Animations */}
        <section className="mb-20">
          <EntranceAnimation direction="up">
            <h2 className="text-2xl font-semibold text-primary-navy mb-6">
              Content Section Animation
            </h2>
          </EntranceAnimation>

          <div className="space-y-8">
            <EntranceAnimation direction="left">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary-navy mb-3">
                    Slide from Left
                  </h3>
                  <p className="text-secondary-slateGray">
                    This entire content section slides in from the left when it enters the viewport.
                    Perfect for alternating content layouts.
                  </p>
                </div>
              </Card>
            </EntranceAnimation>

            <EntranceAnimation direction="right">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary-navy mb-3">
                    Slide from Right
                  </h3>
                  <p className="text-secondary-slateGray">
                    This section slides in from the right, creating visual interest as users scroll
                    through your content.
                  </p>
                </div>
              </Card>
            </EntranceAnimation>

            <EntranceAnimation direction="up">
              <Card>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-primary-navy mb-3">
                    Slide Up
                  </h3>
                  <p className="text-secondary-slateGray">
                    The classic slide-up animation works great for most content sections,
                    providing a subtle reveal effect.
                  </p>
                </div>
              </Card>
            </EntranceAnimation>
          </div>
        </section>

        {/* Feature Grid with Stagger */}
        <section className="mb-20">
          <EntranceAnimation direction="fade">
            <h2 className="text-2xl font-semibold text-primary-navy mb-2">
              Feature Grid
            </h2>
            <p className="text-secondary-slateGray mb-6">
              Showcase features with staggered fade-in animations
            </p>
          </EntranceAnimation>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '⚡', title: 'Fast', desc: 'Lightning-fast performance' },
              { icon: '🔒', title: 'Secure', desc: 'Enterprise-grade security' },
              { icon: '📊', title: 'Analytics', desc: 'Detailed insights' },
              { icon: '🎨', title: 'Beautiful', desc: 'Modern design system' },
            ].map((feature, index) => (
              <EntranceAnimation 
                key={feature.title}
                direction="fade"
                delay={index * 150}
              >
                <div className="text-center p-6 bg-white rounded-lg shadow-soft">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="text-lg font-semibold text-primary-navy mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-secondary-slateGray">
                    {feature.desc}
                  </p>
                </div>
              </EntranceAnimation>
            ))}
          </div>
        </section>

        {/* Reduced Motion Notice */}
        <EntranceAnimation direction="fade">
          <Card variant="bordered">
            <div className="p-6 text-center">
              <p className="text-secondary-slateGray">
                <strong>Accessibility Notice:</strong> These animations respect the 
                <code className="bg-secondary-iceBlue px-2 py-1 rounded mx-1">prefers-reduced-motion</code>
                media query. Users who prefer reduced motion will see content appear immediately without animation.
              </p>
            </div>
          </Card>
        </EntranceAnimation>

        {/* Scroll Prompt */}
        <div className="h-screen flex items-center justify-center">
          <EntranceAnimation direction="fade">
            <div className="text-center">
              <div className="text-6xl mb-4">👇</div>
              <p className="text-2xl text-primary-navy font-semibold">
                Scroll down to see more animations
              </p>
            </div>
          </EntranceAnimation>
        </div>
      </div>
    </div>
  );
}

export default EntranceAnimationDemo;
