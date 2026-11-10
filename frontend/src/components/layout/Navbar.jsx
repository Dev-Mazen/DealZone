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
  Users,
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
import { getPublicLinks, getRoleKey, getRoleLabel, isPathActive } from './navConfig'

/**
 * onMenuClick: تمريره من AppLayout بيخلي الـ Navbar رفيع (الـ Sidebar هو التنقل).
 * من غيره (PublicLayout) بيظهر بلينكات عامة + Drawer للموبايل.
 */
export default function Navbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)
  const setLanguage = useUIStore((s) => s.setLanguage)

  const { isSystemAdmin, hasCompany, isVerified, isBuyerOnly, isSupplierOnly } = usePermissions()
  const roleKey = getRoleKey({ isSystemAdmin, isSupplierOnly, isBuyerOnly })

  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  const qc = useQueryClient()
  const hasSidebar = isAuthenticated && typeof onMenuClick === 'function'
  const dashboardPath = isSystemAdmin ? '/admin/analytics' : '/dashboard'

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setDrawerOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!userMenuOpen && !drawerOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setDrawerOpen(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [userMenuOpen, drawerOpen])

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationService.getUnreadCount(),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 20_000,
  })
  const unreadCount = unreadData?.unreadCount ?? 0

  const handleLogout = async () => {
    try {
      const rt = tokenStore.getRefresh()
      if (rt) await authService.logout(rt)
    } catch {
      // نكمل تنظيف الجلسة حتى لو الشبكة فشلت
    } finally {
      qc.clear()
      clearAuth()
      navigate('/')
    }
  }

  const toggleLanguage = () => setLanguage(language === 'en' ? 'ar' : 'en')

  const publicLinks = getPublicLinks(isAr)
  const centerLinks = hasSidebar
    ? []
    : [
      ...publicLinks,
      ...(isAuthenticated
        ? [{ label: isAr ? 'لوحة التحكم' : 'Dashboard', path: dashboardPath, icon: LayoutDashboard }]
        : []),
    ]

  const menuItemClass =
    'flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-[#EAF4FF] hover:text-[#06245B] transition-colors'

  return (
    <>
      <nav
        className={`fixed top-0 inset-x-0 z-[1030] h-16 transition-all duration-300 ${isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-slate-200/80'
            : 'bg-white border-b border-[rgba(6,36,91,0.06)]'
          }`}
      >
        <div className="h-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          {/* Start: زرار القائمة + اللوجو */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={hasSidebar ? onMenuClick : () => setDrawerOpen(true)}
              className={`${hasSidebar ? 'md:hidden' : 'lg:hidden'} p-2 rounded-xl text-[#06245B] hover:bg-[#EAF4FF] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1266D6]`}
              aria-label={isAr ? 'فتح القائمة' : 'Open menu'}
            >
              <Menu size={22} />
            </button>
            <Logo size="md" link={true} />
          </div>

          {/* Center: لينكات عامة (للزائر والصفحات العامة فقط) */}
          <div className="hidden lg:flex items-center gap-1 flex-1 justify-center mx-2">
            {centerLinks.map((item) => {
              const active = isPathActive(pathname, item)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${active
                      ? 'text-[#06245B] bg-[#EAF4FF]'
                      : 'text-slate-600 hover:text-[#06245B] hover:bg-slate-100/70'
                    }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
          {hasSidebar && <div className="flex-1" />}

          {/* End: اللغة، الإشعارات، المستخدم */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 hover:border-[#1266D6] bg-slate-50 hover:bg-[#EAF4FF] text-xs font-bold text-[#06245B] transition-colors"
              aria-label={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
              title={isAr ? 'English' : 'العربية'}
            >
              <Globe size={14} className="text-[#1266D6]" />
              <span>{isAr ? 'EN' : 'عربي'}</span>
            </button>

            {isAuthenticated ? (
              <>
                <Link
                  to="/notifications"
                  className="relative p-2.5 rounded-xl hover:bg-[#EAF4FF] text-[#06245B] transition-colors"
                  aria-label={
                    unreadCount > 0
                      ? `${t('nav.notifications')} (${unreadCount})`
                      : t('nav.notifications')
                  }
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 end-1.5 min-w-4 h-4 px-1 rounded-full bg-[#EF4444] text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={userMenuOpen}
                    className="flex items-center gap-2 ps-2 pe-3 py-1.5 rounded-xl border border-slate-200/80 hover:border-[#1266D6] hover:bg-[#EAF4FF]/50 transition-colors text-start"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#06245B] to-[#1266D6] flex items-center justify-center text-white text-xs font-bold">
                      {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="hidden sm:flex flex-col">
                      <span className="text-xs font-bold text-[#06245B] max-w-[120px] truncate leading-tight">
                        {user?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium max-w-[120px] truncate">
                        {user?.company?.tradeName || user?.company?.legalName || getRoleLabel(roleKey, isAr)}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div
                        role="menu"
                        className="absolute end-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-fade-in"
                      >
                        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                          <p className="text-sm font-bold text-[#06245B] truncate">{user?.fullName}</p>
                          <p className="text-xs text-[#64748B] truncate mt-0.5">{user?.email}</p>
                          <p className="text-[11px] text-slate-500 mt-1">{getRoleLabel(roleKey, isAr)}</p>
                          {user?.company && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#EAF4FF] text-[11px] font-bold text-[#06245B]">
                              <Building2 size={12} className="text-[#1266D6]" />
                              <span className="truncate max-w-[170px]">
                                {user.company.tradeName || user.company.legalName}
                              </span>
                              {isVerified && <span className="text-emerald-600">✓</span>}
                            </div>
                          )}
                        </div>

                        <div className="py-1">
                          {!isSystemAdmin && hasCompany && (
                            <>
                              <Link to="/company" role="menuitem" className={menuItemClass}>
                                <Building2 size={16} className="text-slate-400" />
                                {t('nav.company')}
                              </Link>
                              <Link to="/company?tab=members" role="menuitem" className={menuItemClass}>
                                <Users size={16} className="text-slate-400" />
                                {t('nav.members')}
                              </Link>
                            </>
                          )}
                          <Link to="/profile" role="menuitem" className={menuItemClass}>
                            <User size={16} className="text-slate-400" />
                            {t('nav.profile')}
                          </Link>
                        </div>

                        <div className="border-t border-slate-100 mt-1 pt-1">
                          <button
                            onClick={handleLogout}
                            role="menuitem"
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
                  className="font-bold"
                >
                  {t('nav.register')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Drawer الموبايل: للزائر وللصفحات العامة فقط */}
      {!hasSidebar && drawerOpen && (
        <div className="fixed inset-0 z-[1050] lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 start-0 max-w-xs w-full bg-white shadow-2xl flex flex-col z-10 animate-slide-in">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <Logo size="md" link={true} />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-500 hover:text-[#06245B] hover:bg-slate-100 transition-colors"
                aria-label={isAr ? 'إغلاق القائمة' : 'Close menu'}
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {centerLinks.map((item) => {
                const active = isPathActive(pathname, item)
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    aria-current={active ? 'page' : undefined}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${active
                        ? 'bg-[#EAF4FF] text-[#06245B]'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-[#06245B]'
                      }`}
                  >
                    {Icon && (
                      <Icon size={18} className={active ? 'text-[#1266D6]' : 'text-slate-400'} />
                    )}
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 space-y-3">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-[#06245B] hover:border-[#1266D6] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Globe size={16} className="text-[#1266D6]" />
                  {isAr ? 'اللغة الحالية' : 'Current Language'}
                </span>
                <span className="text-[#1266D6] font-extrabold">
                  {isAr ? 'العربية (AR)' : 'English (EN)'}
                </span>
              </button>

              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => navigate('/login')}>
                    {t('nav.login')}
                  </Button>
                  <Button variant="primary" size="sm" fullWidth onClick={() => navigate('/register')}>
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