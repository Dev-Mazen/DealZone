import { Link } from 'react-router-dom'
import logoImg from '../../assets/logo.jpeg'

/**
 * Official DealZone Logo Component
 * Renders the exact official DealZone logo asset with high-fidelity brand typography.
 */
export default function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  className = '',
  link = true,
}) {
  const sizeMap = {
    sm: { img: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]' },
    md: { img: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm' },
  }

  const currentSize = sizeMap[size] || sizeMap.md
  const isWhite = variant === 'white'

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Official DealZone Logo Image */}
      <div className={`${currentSize.img} rounded-xl overflow-hidden shadow-sm shrink-0 border border-black/5 bg-white flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}>
        <img
          src={logoImg}
          alt="DealZone Official Logo"
          className="w-full h-full object-contain"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-start">
          <div className="flex items-center gap-1 font-extrabold tracking-tight leading-none">
            <span className={isWhite ? 'text-white' : 'text-[#06245B]'}>
              DEAL
            </span>
            <span className="text-[#00D9F5]">
              ZONE
            </span>
          </div>
          <span
            className={`${currentSize.sub} uppercase font-semibold tracking-wider leading-tight mt-1 ${
              isWhite ? 'text-slate-300' : 'text-[#64748B]'
            }`}
          >
            Industrial Procurement
          </span>
        </div>
      )}
    </div>
  )

  if (link) {
    return (
      <Link to="/" className="inline-flex items-center shrink-0" aria-label="DealZone Home">
        {content}
      </Link>
    )
  }

  return content
}

