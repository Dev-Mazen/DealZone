import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import logoTransparent from '../../assets/logo-transparent.png'

/**
 * Official DealZone Logo Component
 * - Uses the tightly cropped transparent DealZone logo mark (no artificial white box)
 * - Seamlessly blends into light, dark, and navbar backgrounds
 * - Correctly renders brand name order in both RTL (ديل زون) and LTR (DEAL ZONE)
 * - Smoothly scrolls to the top of the page when clicked while already on the Landing Page ("/")
 * - Safe for standalone rendering outside Router (e.g. FullPageSpinner during app loading)
 */
export default function Logo({
  size = 'md',
  showText = true,
  variant = 'default',
  className = '',
  link = true,
}) {
  const { language } = useTranslation()
  const isAr = language === 'ar'

  // Enlarged display sizes across all variants for prominent brand visibility and legibility
  const sizeMap = {
    sm: { img: 'h-10 w-auto max-w-[56px]', text: 'text-lg', sub: 'text-[10px]', tag: 'text-xs' },
    md: { img: 'h-12 w-auto max-w-[68px]', text: 'text-xl sm:text-2xl', sub: 'text-xs', tag: 'text-xs' },
    lg: { img: 'h-16 sm:h-20 w-auto max-w-[100px]', text: 'text-2xl sm:text-3xl', sub: 'text-xs sm:text-sm', tag: 'text-sm' },
    xl: { img: 'h-24 sm:h-28 w-auto max-w-[140px]', text: 'text-3xl sm:text-4xl', sub: 'text-sm sm:text-base', tag: 'text-base' },
  }

  const currentSize = sizeMap[size] || sizeMap.md
  const isWhite = variant === 'white'

  // Smooth scroll to top when clicked on landing page without page reload
  const handleLogoClick = (e) => {
    if (typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '')) {
      e.preventDefault()
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth',
      })
    }
  }

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Official DealZone Logo Mark:
          - On dark backgrounds (isWhite / footer / dark heroes): Rendered cleanly with NO box or border.
          - On light backgrounds: Rendered inside a dark navy executive box so the white emblem elements pop with high contrast.
      */}
      {isWhite ? (
        <div className={`${currentSize.img} shrink-0 flex items-center justify-center transition-all duration-200 group-hover:scale-105`}>
          <img
            src={logoTransparent}
            alt="DealZone Official Logo"
            className="h-full w-auto object-contain block drop-shadow-md"
            loading="eager"
          />
        </div>
      ) : (
        <div
          className={`${currentSize.img} shrink-0 flex items-center justify-center p-2 rounded-2xl bg-gradient-to-b from-[#06245B] to-[#041638] shadow-[0_4px_12px_rgba(6,36,91,0.25)] border border-[#06245B] transition-all duration-200 group-hover:scale-105 group-hover:shadow-[0_6px_16px_rgba(6,36,91,0.35)]`}
        >
          <img
            src={logoTransparent}
            alt="DealZone Official Logo"
            className="h-full w-auto object-contain block drop-shadow-sm"
            loading="eager"
          />
        </div>
      )}

      {showText && (
        <div className="flex flex-col text-start">
          {isAr ? (
            /* Arabic Brand Rendering: ديل زون (Only Arabic text, no English duplicate) */
            <>
              <div
                dir="rtl"
                className={`inline-flex items-center gap-1.5 font-extrabold tracking-tight leading-none ${currentSize.text}`}
              >
                <span className={isWhite ? 'text-white' : 'text-[#06245B]'}>
                  ديل
                </span>
                <span className="text-[#00D9F5]">
                  زون
                </span>
              </div>
              <span
                className={`${currentSize.sub} font-semibold tracking-wider leading-tight mt-1 ${
                  isWhite ? 'text-slate-300' : 'text-[#64748B]'
                }`}
              >
                التوريدات الصناعية
              </span>
            </>
          ) : (
            /* English Brand Rendering: DEAL ZONE (explicit LTR prevents reversal) */
            <>
              <div
                dir="ltr"
                className={`inline-flex items-center gap-1 font-extrabold tracking-tight leading-none ${currentSize.text}`}
              >
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
            </>
          )}
        </div>
      )}
    </div>
  )

  if (link) {
    return (
      <Link
        to="/"
        onClick={handleLogoClick}
        className="inline-flex items-center shrink-0 cursor-pointer"
        aria-label="DealZone Home"
      >
        {content}
      </Link>
    )
  }

  return content
}
