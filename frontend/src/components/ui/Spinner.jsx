import Logo from '../common/Logo'

// Named export alias for pages that import { Spinner }
export function Spinner({ size = 20, className = '', variant }) {
  if (variant === 'page') {
    return <PageSpinner />
  }
  return <SpinnerIcon size={size} className={className} />
}

function SpinnerIcon({ size = 20, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="opacity-80"
      />
    </svg>
  )
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <SpinnerIcon size={32} className="text-[#06245B]" />
    </div>
  )
}

export function FullPageSpinner() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F4F7FB] z-50">
      <div className="flex flex-col items-center gap-4">
        {/* Official DealZone Logo */}
        <Logo size="lg" link={false} />
        <SpinnerIcon size={28} className="text-[#06245B]" />
        <p className="text-sm font-medium text-[#64748B]">Loading DealZone…</p>
      </div>
    </div>
  )
}



export default Spinner

