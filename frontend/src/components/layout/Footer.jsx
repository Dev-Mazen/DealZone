import React from 'react'
import { Link } from 'react-router-dom'
import Logo from '../common/Logo'
import { useTranslation } from '../../hooks/useTranslation'
import { InstagramIcon, FacebookIcon, LinkedinIcon } from '../common/SocialIcons'

export const OFFICIAL_SOCIAL_LINKS = [
  {
    name: 'LinkedIn',
    nameAr: 'لينكد إن',
    url: 'https://www.linkedin.com/company/dealzonee/',
    icon: LinkedinIcon,
    ariaLabel: 'Visit DealZone on LinkedIn',
    ariaLabelAr: 'زيارة ديل زون على لينكد إن',
  },
  {
    name: 'Facebook',
    nameAr: 'فيسبوك',
    url: 'https://www.facebook.com/dealzonehub',
    icon: FacebookIcon,
    ariaLabel: 'Visit DealZone on Facebook',
    ariaLabelAr: 'زيارة ديل زون على فيسبوك',
  },
  {
    name: 'Instagram',
    nameAr: 'إنستغرام',
    url: 'https://www.instagram.com/dealzonee/',
    icon: InstagramIcon,
    ariaLabel: 'Visit DealZone on Instagram',
    ariaLabelAr: 'زيارة ديل زون على إنستغرام',
  },
]

export default function Footer({ className = '' }) {
  const { language } = useTranslation()
  const isAr = language === 'ar'

  return (
    <footer className={`bg-[#041638] text-slate-400 py-12 border-t border-white/10 text-sm ${className}`}>
      <div className="container max-w-6xl mx-auto px-4 space-y-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <Logo size="sm" variant="white" link={true} />
            <span className="text-xs text-slate-500 border-s border-slate-700 ps-4">
              {isAr ? 'منصة التوريد الصناعي B2B في مصر' : "Egypt's Premier Industrial B2B Marketplace"}
            </span>
          </div>

          {/* Nav Links */}
          <nav aria-label="Footer Navigation" className="flex flex-wrap justify-center items-center gap-6 text-xs text-slate-400">
            <Link to="/" className="hover:text-white transition-colors">{isAr ? 'الرئيسية' : 'Home'}</Link>
            <Link to="/about" className="hover:text-white transition-colors">{isAr ? 'عن المنصة' : 'About'}</Link>
            <Link to="/catalog" className="hover:text-white transition-colors">{isAr ? 'الكتالوج' : 'Catalog'}</Link>
            <Link to="/login" className="hover:text-white transition-colors">{isAr ? 'تسجيل الدخول' : 'Sign In'}</Link>
            <Link to="/register" className="hover:text-[#00D9F5] transition-colors font-medium">{isAr ? 'تسجيل شركة' : 'Register'}</Link>
          </nav>

          {/* Official Social Media Links */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 hidden sm:inline">
              {isAr ? 'تابعنا:' : 'Follow Us:'}
            </span>
            <div className="flex items-center gap-2">
              {OFFICIAL_SOCIAL_LINKS.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={isAr ? social.ariaLabelAr : social.ariaLabel}
                    className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-[#00D9F5] hover:border-[#00D9F5]/40 hover:bg-[#00D9F5]/10 transition-all duration-200"
                  >
                    <Icon size={18} />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom divider and copyright */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            &copy; {new Date().getFullYear()} DealZone Egypt (ديل زون). {isAr ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}
          </p>
          <p className="text-[11px] text-slate-500">
            {isAr
              ? 'المنصة الصناعية المتخصصة للمنسوجات، الأغذية، والمعادن في جمهورية مصر العربية'
              : 'Specialized Industrial Marketplace for Textiles, Food, and Metals in Egypt'}
          </p>
        </div>
      </div>
    </footer>
  )
}

