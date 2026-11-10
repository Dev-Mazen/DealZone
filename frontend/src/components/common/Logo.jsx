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

  // Slightly increased display sizes for prominent brand visibility while preserving 4:3 aspect ratio
  const sizeMap = {
    sm: { img: 'h-8 w-auto max-w-[42px]', text: 'text-base', sub: 'text-[9px]', tag: 'text-[10px]' },
    md: { img: 'h-10 w-auto max-w-[52px]', text: 'text-lg', sub: 'text-[10px]', tag: 'text-xs' },
    lg: { img: 'h-14 w-auto max-w-[72px]', text: 'text-2xl', sub: 'text-xs', tag: 'text-sm' },
    xl: { img: 'h-20 w-auto max-w-[105px]', text: 'text-3xl', sub: 'text-sm', tag: 'text-base' },
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
      {/* Official DealZone Logo Mark — Pure transparency, no artificial white square */}
      <div
        className={`${currentSize.img} shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
      >
        <img
          src={logoTransparent}
          alt="DealZone Official Logo"
          className="h-full w-auto object-contain block"
          loading="eager"
        />
      </div>

      {showText && (
        <div className="flex flex-col text-start">
          {isAr ? (
            /* Arabic Brand Rendering: ديل زون (DealZone) */
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
                <span
                  dir="ltr"
                  className={`font-bold tracking-tight opacity-80 ${isWhite ? 'text-slate-200' : 'text-slate-500'} ${currentSize.tag}`}
                >
                  DealZone
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
