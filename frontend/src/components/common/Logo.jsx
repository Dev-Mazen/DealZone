import { Link } from 'react-router-dom'
import { useTranslation } from '../../hooks/useTranslation'
import logoTransparent from '../../assets/logo-transparent.png'
import logoImg from '../../assets/logo.jpeg'

/**
 * Official DealZone Logo Component
 * Correctly renders brand name order in both RTL (ديل زون) and LTR (DEAL ZONE)
 * ensuring it never appears reversed as "ZoneDeal".
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

  const sizeMap = {
    sm: { img: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]', tag: 'text-[10px]' },
    md: { img: 'w-10 h-10', text: 'text-lg', sub: 'text-[10px]', tag: 'text-xs' },
    lg: { img: 'w-14 h-14', text: 'text-2xl', sub: 'text-xs', tag: 'text-sm' },
    xl: { img: 'w-20 h-20', text: 'text-3xl', sub: 'text-sm', tag: 'text-base' },
  }

  const currentSize = sizeMap[size] || sizeMap.md
  const isWhite = variant === 'white'
  // Use transparent PNG on dark/colored backgrounds, jpeg on light
  const logoSrc = isWhite ? logoTransparent : logoImg

  const content = (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {/* Official DealZone Logo Image */}
      <div
        className={`${currentSize.img} rounded-xl overflow-hidden shrink-0 flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${
          isWhite
            ? 'bg-transparent border border-white/20'
            : 'bg-white shadow-sm border border-black/5'
        }`}
      >
        <img
          src={logoSrc}
          alt="DealZone Official Logo"
          className="w-full h-full object-contain"
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
      <Link to="/" className="inline-flex items-center shrink-0" aria-label="DealZone Home">
        {content}
      </Link>
    )
  }

  return content
}
