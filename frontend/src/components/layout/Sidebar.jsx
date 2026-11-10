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
  Inbox,
  Send,
  Building2,
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
    isBuyer,
    isSupplier,
    isBuyerOnly,
    isSupplierOnly,
    hasBothCapabilities,
    hasCompany,
    isVerified,
    companyType,
  } = usePermissions()

  // 1. System Admin Navigation Items
  const adminNavItems = [
    { label: isAr ? 'لوحة التحليلات' : 'Analytics Portal', icon: LayoutDashboard, path: '/admin/analytics' },
    { label: isAr ? 'طلبات التوثيق' : 'Verification Queue', icon: ShieldCheck, path: '/admin/verification' },
    { label: isAr ? 'إدارة الكتالوج' : 'Catalog Management', icon: Package, path: '/admin/catalog' },
    { label: isAr ? 'فض النزاعات' : 'Disputes Management', icon: Handshake, path: '/admin/disputes' },
    { label: isAr ? 'مزودو الشحن' : 'Shipping Providers', icon: Truck, path: '/admin/shipping' },
  ]

  // 2. Buyer-Specific Navigation Items (Egyptian Manufacturer / Factory)
  const buyerNavItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: isAr ? 'كتالوج الخامات' : 'Materials Catalog', icon: Package, path: '/catalog' },
    { label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
    { label: isAr ? 'طلبات الأسعار (RFQs)' : 'My RFQs & Tenders', icon: FileText, path: '/rfqs' },
    { label: isAr ? 'العروض المستلمة' : 'Received Quotes', icon: Inbox, path: '/offers' },
    { label: isAr ? 'عقود الشراء والتوريد' : 'Purchasing Deals', icon: Handshake, path: '/deals' },
    { label: isAr ? 'الشحنات الواردة' : 'Inbound Shipments', icon: Truck, path: '/shipments' },
    { label: t('nav.notifications') || 'Notifications', icon: Bell, path: '/notifications' },
  ]

  // 3. Supplier-Specific Navigation Items (Raw Materials Vendor / Distributor)
  const supplierNavItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: isAr ? 'الكتالوج وتوريداتي' : 'Catalog & Supply', icon: Package, path: '/catalog' },
    { label: isAr ? 'مناقصات السوق المفتوحة' : 'Open Market Tenders', icon: FileText, path: '/rfqs' },
    { label: isAr ? 'عروضي ومزايداتي' : 'My Submitted Bids', icon: Send, path: '/offers' },
    { label: isAr ? 'عقود البيع والمبيعات' : 'Sales Deals', icon: Handshake, path: '/deals' },
    { label: isAr ? 'الشحن والتسليم' : 'Dispatch & Shipments', icon: Truck, path: '/shipments' },
    { label: t('nav.notifications') || 'Notifications', icon: Bell, path: '/notifications' },
  ]

  // 4. Dual Capability Navigation Items (Buyer + Supplier)
  const dualNavItems = [
    { label: t('nav.dashboard'), icon: LayoutDashboard, path: '/dashboard' },
    { label: isAr ? 'الكتالوج الصناعي' : 'Industrial Catalog', icon: Package, path: '/catalog' },
    { label: isAr ? 'دليل الموردين' : 'Supplier Directory', icon: Building2, path: '/suppliers' },
    { label: isAr ? 'طلبات الأسعار والمناقصات' : 'RFQs & Tenders', icon: FileText, path: '/rfqs' },
    { label: isAr ? 'العروض والمزايدات' : 'Offers & Bids', icon: DollarSign, path: '/offers' },
    { label: isAr ? 'الصفقات التجارية' : 'Commercial Deals', icon: Handshake, path: '/deals' },
    { label: isAr ? 'الشحنات واللوجستيات' : 'Shipments & Logistics', icon: Truck, path: '/shipments' },
    { label: t('nav.notifications') || 'Notifications', icon: Bell, path: '/notifications' },
  ]

  // Select navigation set strictly based on user role
  const navItems = isSystemAdmin
    ? adminNavItems
    : isSupplierOnly
    ? supplierNavItems
    : isBuyerOnly
    ? buyerNavItems
    : dualNavItems

  const isActive = (path) => {
    if (path === '/rfqs') return location.pathname.startsWith('/rfqs')
    if (path === '/suppliers') return location.pathname.startsWith('/suppliers')
    if (path === '/offers') return location.pathname.startsWith('/offers')
    if (path === '/deals') return location.pathname.startsWith('/deals')
    if (path === '/catalog') return location.pathname.startsWith('/catalog')
    if (path === '/shipments') return location.pathname.startsWith('/shipments')
    if (path === '/admin') return location.pathname.startsWith('/admin')
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  // Role tag display
  const roleLabel = isSystemAdmin
    ? isAr ? 'مدير المنصة' : 'Platform Admin'
    : isSupplierOnly
    ? isAr ? '🏭 مورد خامات' : 'Raw Material Supplier'
    : isBuyerOnly
    ? isAr ? '🛒 مشتري (مصنع)' : 'Manufacturer Buyer'
    : isAr ? '🔄 مشتري ومورد' : 'Buyer & Supplier'

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
          'fixed start-0 top-16 bottom-0 bg-white border-e border-[rgba(6,36,91,0.06)] z-[1025] transition-all duration-300',
          collapsed ? 'w-20' : 'w-64',
          'max-md:shadow-xl',
          !collapsed ? 'translate-x-0' : 'max-md:-translate-x-full',
        ].join(' ')}
      >
        <nav className="flex flex-col h-full p-3 justify-between">
          {/* Nav items */}
          <div className="space-y-3">
            {/* Role Header Badge (when not collapsed) */}
            {!collapsed && !isSystemAdmin && (
              <div className="px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#06245B] truncate">
                  {roleLabel}
                </span>
                {isVerified ? (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓ {isAr ? 'موثق' : 'Verified'}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                    {isAr ? 'معاينة' : 'Preview'}
                  </span>
                )}
              </div>
            )}

            <ul className="space-y-1">
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
                        <span className="truncate flex-1 text-sm">{item.label}</span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Collapse toggle */}
          <div className="pt-2">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-full h-10 rounded-xl border border-[rgba(6,36,91,0.1)] hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? (
                isAr ? <ChevronLeft size={18} /> : <ChevronRight size={18} />
              ) : (
                isAr ? <ChevronRight size={18} /> : <ChevronLeft size={18} />
              )}
            </button>
          </div>
        </nav>
      </aside>
    </>
  )
}
