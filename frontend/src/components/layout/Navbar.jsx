import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Globe,
  Building2,
  ChevronDown,
  LayoutDashboard,
  Package,
  FileText,
  Handshake,
  Truck,
  ShieldCheck,
  Info,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { notificationService } from '../../shared/api/services/notificationService'
import { authService } from '../../shared/api/services/authService'
import { tokenStore } from '../../shared/api/axios'
import Button from '../ui/Button'
import Logo from '../common/Logo'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setLanguage = useUIStore((s) => s.setLanguage)

  const {
    isSystemAdmin,
    hasCompany,
    isVerified,
    canManageRfqs,
    canSubmitOffers,
    canViewCommercial,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
    role,
  } = usePermissions()

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  // Track scroll position for header glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  // Poll unread notification count every 30s when authenticated
  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
  const unreadCount = unreadData?.unreadCount ?? 0

  const qc = useQueryClient()

  const handleLogout = async () => {
    try {
      const rt = tokenStore.getRefresh()
      if (rt) {
        await authService.logout(rt)
      }
    } catch {
      // Continue client cleanup even if network fails
    } finally {
      qc.clear()
      clearAuth()
      navigate('/')
    }
  }

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  // Define public navigation items
  const publicLinks = [
    { label: isAr ? 'الرئيسية' : 'Home', path: '/' },
    { label: isAr ? 'عن المنصة' : 'About', path: '/about' },
    { label: isAr ? 'الكتالوج الصناعي' : 'Catalog', path: '/catalog' },
  ]

  // Define authenticated quick links strictly separated by role
  const adminLinks = [
    { label: isAr ? 'التحليلات والمؤشرات' : 'Analytics', path: '/admin/analytics', icon: LayoutDashboard },
    { label: isAr ? 'توثيق الشركات' : 'Verification Queue', path: '/admin/verification', icon: ShieldCheck },
    { label: isAr ? 'الكتالوج' : 'Catalog', path: '/admin/catalog', icon: Package },
    { label: isAr ? 'فض النزاعات' : 'Disputes', path: '/admin/disputes', icon: Handshake },
    { label: isAr ? 'مزودو الشحن' : 'Shipping', path: '/admin/shipping', icon: Truck },
  ]

  const companyLinks = [
    { label: isAr ? 'لوحة التحكم' : 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    hasCompany && { label: isAr ? 'الكتالوج' : 'Catalog', path: '/catalog', icon: Package },
    (canManageRfqs || canSubmitOffers) && {
      label: isSupplierOnly ? (isAr ? 'طلبات السوق' : 'Market RFQs') : (isAr ? 'طلبات الأسعار' : 'RFQs'),
      path: '/rfqs',
      icon: FileText,
    },
    (canSubmitOffers || canManageRfqs) && {
      label: isSupplierOnly
        ? (isAr ? 'عروضي' : 'My Offers')
        : isBuyerOnly
        ? (isAr ? 'العروض المستلمة' : 'Received Offers')
        : (isAr ? 'العروض' : 'Offers'),
      path: '/offers',
      icon: FileText,
    },
    canViewCommercial && { label: isAr ? 'الصفقات' : 'Deals', path: '/deals', icon: Handshake },
    canViewCommercial && { label: isAr ? 'الشحنات' : 'Shipments', path: '/shipments', icon: Truck },
  ].filter(Boolean)

  const authLinks = isSystemAdmin ? adminLinks : companyLinks

  const activeLinks = isAuthenticated ? authLinks : publicLinks

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-[1030] h-20 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/80'
            : 'bg-white border-b border-[rgba(6,36,91,0.06)] shadow-xs'
        }`}
      >
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Left: Brand Logo + Mobile Hamburger Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#06245B] hover:bg-[#EAF4FF] transition-colors focus:outline-none"
              aria-label="Open mobile navigation menu"
            >
              <Menu size={24} />
            </button>

            {/* Official DealZone Logo */}
            <Logo size="md" link={true} />
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1.5">
            {activeLinks.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path)

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 relative flex items-center gap-1.5 ${
                    isActive
                      ? 'text-[#06245B] bg-[#EAF4FF] shadow-xs'
                      : 'text-slate-600 hover:text-[#06245B] hover:bg-slate-100/70'
                  }`}
                >
                  {item.icon && <item.icon size={16} className={isActive ? 'text-[#1266D6]' : 'text-slate-400'} />}
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-1 inset-x-3.5 h-0.5 bg-[#00D9F5] rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right: Actions (Language, Notifications, User Profile / Auth) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher Pill */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-[#1266D6] bg-slate-50 hover:bg-[#EAF4FF] text-xs font-bold text-[#06245B] transition-all duration-200"
              aria-label={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              title={isAr ? 'English' : 'العربية'}
            >
              <Globe size={15} className="text-[#1266D6]" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2.5 rounded-xl hover:bg-[#EAF4FF] text-[#06245B] transition-colors"
                  aria-label={t('nav.notifications')}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 end-1.5 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 ps-2 pe-3 py-1.5 rounded-xl border border-slate-200/80 hover:border-[#1266D6] hover:bg-[#EAF4FF]/50 transition-all text-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06245B] to-[#1266D6] flex items-center justify-center text-white text-xs font-bold shadow-xs">
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-bold text-[#06245B] max-w-[110px] truncate leading-tight">
                        {user?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {role || (isSystemAdmin ? 'Admin' : 'Member')}
                      </span>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      <div className="absolute end-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in">
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-[#06245B] truncate">
                            {user?.fullName}
                          </p>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">{user?.email}</p>
                          {user?.company && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EAF4FF] text-[11px] font-bold text-[#06245B]">
                              <Building2 size={12} className="text-[#1266D6]" />
                              <span className="truncate max-w-[180px]">{user.company.tradeName || user.company.legalName}</span>
                              {isVerified && <span className="text-emerald-600">✓</span>}
                            </div>
                          )}
                        </div>

                        <div className="py-1">
                          {isSystemAdmin ? (
                            <Link
                              to="/admin/verification"
                              className="flex items-center gap-3 px-4 py-2 text-sm font-semibold text-[#1266D6] hover:bg-[#EAF4FF] transition-colors"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <ShieldCheck size={16} className="text-[#00D9F5]" />
                              {isAr ? 'لوحة إدارة المنصة' : 'Admin Portal'}
                            </Link>
                          ) : (
                            <>
                              <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#EAF4FF] hover:text-[#06245B] transition-colors"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <LayoutDashboard size={16} className="text-slate-400" />
                                {isAr ? 'لوحة التحكم' : 'Dashboard'}
                              </Link>

                              {hasCompany && (
                                <Link
                                  to="/company"
                                  className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#EAF4FF] hover:text-[#06245B] transition-colors"
                                  onClick={() => setUserMenuOpen(false)}
                                >
                                  <Building2 size={16} className="text-slate-400" />
                                  {t('nav.company')}
                                </Link>
                              )}
                            </>
                          )}

                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#EAF4FF] hover:text-[#06245B] transition-colors"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User size={16} className="text-slate-400" />
                            {t('nav.profile')}
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 w-full px-4 py-2 text-sm text-[#EF4444] hover:bg-red-50 transition-colors font-medium"
                          >
                            <LogOut size={16} />
                            {t('nav.logout')}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="hidden sm:inline-flex"
                >
                  {t('nav.login')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="shadow-sm shadow-cyan-500/20 font-bold"
                >
                  {t('nav.register')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ============================================================
          MOBILE NAVIGATION DRAWER (SLIDE-OVER SHEET)
          ============================================================ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1050] lg:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="fixed inset-y-0 start-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <Logo size="md" link={true} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#06245B] hover:bg-slate-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Body — Navigation Items */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {activeLinks.map((item) => {
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#EAF4FF] text-[#06245B]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#06245B]'
                    }`}
                  >
                    {item.icon ? (
                      <item.icon size={18} className={isActive ? 'text-[#1266D6]' : 'text-slate-400'} />
                    ) : (
                      <Info size={18} className="text-slate-400" />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            {/* Drawer Footer — Language & Authentication */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#06245B] hover:border-[#1266D6] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-[#1266D6]" />
                  <span>{isAr ? 'اللغة الحالية' : 'Current Language'}</span>
                </div>
                <span className="text-[#1266D6] font-extrabold">{isAr ? 'العربية (AR)' : 'English (EN)'}</span>
              </button>

              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/login')}
                  >
                    {t('nav.login')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    fullWidth
                    onClick={() => navigate('/register')}
                  >
                    {t('nav.register')}
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={handleLogout}
                  className="!text-[#EF4444] !border-red-200 hover:!bg-red-50"
                  icon={<LogOut size={16} />}
                >
                  {t('nav.logout')}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
