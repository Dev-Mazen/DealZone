import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FileText,
  DollarSign,
  Handshake,
  Truck,
  Bell,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'

export default function Sidebar() {
  const location = useLocation()
  const { t, language } = useTranslation()
  const isAr = language === 'ar'
  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const {
    isSystemAdmin,
    canManageRfqs,
    canSubmitOffers,
    canViewCommercial,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
    hasCompany,
  } = usePermissions()

  // Build nav items strictly separated by role
  const adminNavItems = [
    { label: isAr ? 'طلبات التوثيق' : 'Verification Queue', icon: ShieldCheck, path: '/admin/verification' },
    { label: isAr ? 'إدارة الكتالوج' : 'Catalog Management', icon: Package, path: '/admin/catalog' },
    { label: isAr ? 'فض النزاعات' : 'Disputes Management', icon: Handshake, path: '/admin/disputes' },
    { label: isAr ? 'مزودو الشحن' : 'Shipping Providers', icon: Truck, path: '/admin/shipping' },
  ]

  const companyNavItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    hasCompany && { label: t('nav.catalog'), icon: Package, path: '/catalog' },
    canManageRfqs && { label: t('nav.rfqs'), icon: FileText, path: '/rfqs' },
    isSupplierOnly && { label: isAr ? 'طلبات السوق' : 'Discover RFQs', icon: FileText, path: '/rfqs' },
    canSubmitOffers && !canManageRfqs && { label: isAr ? 'عروضي' : 'My Offers', icon: DollarSign, path: '/offers' },
    canManageRfqs && !canSubmitOffers && { label: isAr ? 'العروض المستلمة' : 'Received Offers', icon: DollarSign, path: '/offers' },
    canManageRfqs && canSubmitOffers && { label: isAr ? 'العروض' : 'Offers', icon: DollarSign, path: '/offers' },
    canViewCommercial && { label: t('nav.deals') || 'Deals', icon: Handshake, path: '/deals' },
    canViewCommercial && { label: t('nav.shipments') || 'Shipments', icon: Truck, path: '/shipments' },
    hasCompany && { label: t('nav.notifications') || 'Notifications', icon: Bell, path: '/notifications' },
  ].filter(Boolean)

  const navItems = isSystemAdmin ? adminNavItems : companyNavItems

  const isActive = (path) => {
    if (path === '/rfqs') return location.pathname.startsWith('/rfqs')
    if (path === '/offers') return location.pathname.startsWith('/offers')
    if (path === '/deals') return location.pathname.startsWith('/deals')
    if (path === '/admin') return location.pathname.startsWith('/admin')
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="md:hidden fixed inset-0 bg-[rgba(6,36,91,0.4)] z-[1020]"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed start-0 top-20 bottom-0 bg-white border-e border-[rgba(6,36,91,0.06)] z-[1025] transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          'max-md:shadow-xl',
          !collapsed ? 'translate-x-0' : 'max-md:-translate-x-full',
        ].join(' ')}
      >
        <nav className="flex flex-col h-full p-3">
          {/* Nav items */}
          <ul className="flex-1 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)

              return (
                <li key={item.path + item.label}>
                  <Link
                    to={item.path}
                    className={[
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group',
                      active
                        ? 'bg-[#EAF4FF] text-[#06245B] font-semibold'
                        : 'text-[#64748B] hover:bg-[#F4F7FB] hover:text-[#06245B]',
                      collapsed ? 'justify-center' : '',
                    ].join(' ')}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      size={20}
                      className={active ? 'text-[#00D9F5]' : 'group-hover:text-[#1266D6]'}
                    />
                    {!collapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Collapse toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden md:flex items-center justify-center h-10 rounded-xl border border-[rgba(6,36,91,0.1)] hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </nav>
      </aside>
    </>
  )
}

