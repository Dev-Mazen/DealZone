import { useState } from 'react'
import Input from './Input'
import { Mail, Lock, User, Phone, Search, DollarSign, Eye, EyeOff } from 'lucide-react'

/**
 * Input Component Showcase
 * Demonstrates all features and variations of the Input component
 */
export default function InputShowcase() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState('')
  const [search, setSearch] = useState('')
  const [showValidation, setShowValidation] = useState(false)

  return (
    <div className="min-h-screen bg-[#F4F7FB] py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-[#06245B] mb-2">Input Component Showcase</h1>
          <p className="text-[#64748B]">
            Complete demonstration of the DealZone Input component with all features
          </p>
        </div>

        {/* Basic Inputs */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Basic Input Types</h2>
          <div className="space-y-4">
            <Input
              type="text"
              label="Text Input"
              placeholder="Enter text..."
              helperText="This is a standard text input"
            />
            
            <Input
              type="email"
              label="Email Input"
              placeholder="example@dealzone.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              helperText="We'll never share your email"
            />
            
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+20 xxx xxx xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            
            <Input
              type="number"
              label="Number Input"
              placeholder="Enter amount..."
              helperText="Numbers only"
            />
          </div>
        </div>

        {/* Icons */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Inputs with Icons</h2>
          <div className="space-y-4">
            <Input
              type="email"
              label="Email with Left Icon"
              placeholder="your@email.com"
              leftIcon={<Mail size={18} />}
              helperText="Email icon enhances visual clarity"
            />
            
            <Input
              type="text"
              label="User Name"
              placeholder="John Doe"
              leftIcon={<User size={18} />}
            />
            
            <Input
              type="tel"
              label="Phone with Icon"
              placeholder="+20 xxx xxx xxxx"
              leftIcon={<Phone size={18} />}
            />
            
            <Input
              type="text"
              label="Search"
              placeholder="Search..."
              leftIcon={<Search size={18} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            
            <Input
              type="number"
              label="Price"
              placeholder="0.00"
              leftIcon={<DollarSign size={18} />}
              helperText="Enter price in EGP"
            />
          </div>
        </div>

        {/* Password Input with Toggle */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Password Input with Toggle</h2>
          <div className="space-y-4">
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Enter password..."
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer pointer-events-auto"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              helperText="Password must be at least 8 characters"
            />
          </div>
        </div>

        {/* Required State */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Required Inputs</h2>
          <div className="space-y-4">
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              leftIcon={<Mail size={18} />}
              required
              helperText="This field is required"
            />
            
            <Input
              type="text"
              label="Company Name"
              placeholder="Enter company name..."
              leftIcon={<User size={18} />}
              required
            />
          </div>
        </div>

        {/* Validation States */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Validation States</h2>
          <div className="space-y-4">
            <Input
              type="email"
              label="Valid Email"
              placeholder="valid@example.com"
              leftIcon={<Mail size={18} />}
              value="user@dealzone.com"
              helperText="Email format is correct"
            />
            
            <Input
              type="email"
              label="Invalid Email"
              placeholder="invalid email"
              leftIcon={<Mail size={18} />}
              value="invalidemail"
              error="Please enter a valid email address"
            />
            
            <Input
              type="password"
              label="Password"
              placeholder="Enter password..."
              leftIcon={<Lock size={18} />}
              value="123"
              error="Password must be at least 8 characters"
            />
            
            <Input
              type="number"
              label="Quantity"
              placeholder="Enter quantity..."
              value="0"
              error="Quantity must be greater than 0"
            />
          </div>
        </div>

        {/* Disabled State */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Disabled State</h2>
          <div className="space-y-4">
            <Input
              type="text"
              label="Disabled Input"
              placeholder="This input is disabled"
              value="Cannot edit this"
              disabled
              helperText="This field cannot be modified"
            />
            
            <Input
              type="email"
              label="Disabled Email"
              placeholder="disabled@example.com"
              leftIcon={<Mail size={18} />}
              value="locked@dealzone.com"
              disabled
            />
          </div>
        </div>

        {/* Focus States Demo */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Focus States</h2>
          <div className="space-y-4">
            <Input
              type="text"
              label="Default Focus State"
              placeholder="Click to focus - see cyan ring"
              helperText="Focus ring uses DealZone cyan (#00D9F5)"
            />
            
            <Input
              type="text"
              label="Error Focus State"
              placeholder="Click to focus - see red ring"
              error="This field has an error"
            />
          </div>
        </div>

        {/* Complete Form Example */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Complete Registration Form Example</h2>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <Input
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              leftIcon={<User size={18} />}
              required
              helperText="As it appears on official documents"
            />
            
            <Input
              type="email"
              label="Email Address"
              placeholder="your@email.com"
              leftIcon={<Mail size={18} />}
              required
              error={showValidation && !email ? "Email is required" : ""}
            />
            
            <Input
              type="tel"
              label="Phone Number"
              placeholder="+20 xxx xxx xxxx"
              leftIcon={<Phone size={18} />}
              required
              helperText="Include country code"
            />
            
            <Input
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="Create a password"
              leftIcon={<Lock size={18} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="cursor-pointer pointer-events-auto"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              required
              helperText="Minimum 8 characters, include numbers and symbols"
            />
            
            <button
              type="submit"
              onClick={() => setShowValidation(true)}
              className="w-full bg-[#00D9F5] hover:bg-[#1266D6] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors duration-150"
            >
              Register
            </button>
          </form>
        </div>

        {/* Design Token Reference */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">Design Token Reference</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#00D9F5]"></div>
              <span className="text-[#64748B]">Focus Ring: DealZone Cyan (#00D9F5)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#EF4444]"></div>
              <span className="text-[#64748B]">Error State: Error Red (#EF4444)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#E2E8F0]"></div>
              <span className="text-[#64748B]">Border: Light Gray (#E2E8F0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#1E293B]"></div>
              <span className="text-[#64748B]">Text: Primary Dark (#1E293B)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#64748B]"></div>
              <span className="text-[#64748B]">Icons & Helper: Slate Gray (#64748B)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#94A3B8]"></div>
              <span className="text-[#64748B]">Placeholder: Muted Gray (#94A3B8)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#F8FAFC]"></div>
              <span className="text-[#64748B]">Disabled Background: Off-White (#F8FAFC)</span>
            </div>
          </div>
        </div>

        {/* Features Summary */}
        <div className="bg-[#EAF4FF] border border-[#00D9F5] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-[#06245B] mb-4">✓ Implemented Features</h2>
          <ul className="space-y-2 text-sm text-[#1E293B]">
            <li>✓ Support for text, email, password, number, tel input types</li>
            <li>✓ Label, error message, and helper text display</li>
            <li>✓ Left and right icon slots for visual enhancement</li>
            <li>✓ Focus states with cyan ring and border color (#00D9F5)</li>
            <li>✓ Disabled and required visual states</li>
            <li>✓ DealZone design tokens integration</li>
            <li>✓ 8px border radius (rounded-lg)</li>
            <li>✓ Error state with red border (#EF4444)</li>
            <li>✓ Smooth 150ms transitions</li>
            <li>✓ Accessible with ARIA attributes</li>
            <li>✓ Forward ref support for form libraries</li>
            <li>✓ Backward compatibility with existing props</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
