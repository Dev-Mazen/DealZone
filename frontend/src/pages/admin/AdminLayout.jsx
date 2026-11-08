import { NavLink, Outlet, Navigate } from 'react-router-dom'
import { ShieldCheck, Building2, Package, Handshake, Truck, BarChart3 } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'
import { useTranslation } from '../../hooks/useTranslation'

export default function AdminLayout() {
  const { isSystemAdmin } = usePermissions()
  const { language } = useTranslation()
  const isAr = language === 'ar'

  if (!isSystemAdmin) {
    return <Navigate to="/dashboard" replace />
  }

  const adminNav = [
    { path: '/admin/analytics', label: isAr ? 'المؤشرات والتحليلات' : 'Analytics & KPIs', icon: BarChart3 },
    { path: '/admin/verification', label: isAr ? 'طلبات توثيق الشركات' : 'Verification Queue', icon: Building2 },
    { path: '/admin/catalog', label: isAr ? 'إدارة الكتالوج الصناعي' : 'Catalog Management', icon: Package },
    { path: '/admin/disputes', label: isAr ? 'فض النزاعات والوساطة' : 'Disputes Mediation', icon: Handshake },
    { path: '/admin/shipping', label: isAr ? 'مزودو خدمات الشحن' : 'Shipping Partners', icon: Truck },
  ]

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#06245B] flex items-center justify-center">
          <ShieldCheck size={20} className="text-[#00D9F5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#06245B]">
            {isAr ? 'لوحة إدارة المنصة والتحليلات' : 'Admin Control Portal & Analytics'}
          </h1>
          <p className="text-xs text-[#64748B]">
            {isAr ? 'الإشراف على العمليات وتوثيق الشركات وتقارير الصفقات' : 'System administration, corporate verification & transaction intelligence'}
          </p>
        </div>
      </div>

      {/* Admin nav tabs */}
      <div className="flex gap-2 flex-wrap border-b border-[rgba(6,36,91,0.08)] pb-0">
        {adminNav.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => [
              'flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-all -mb-px',
              isActive
                ? 'border-[#00D9F5] text-[#06245B] bg-[#EAF4FF]/40 rounded-t-lg'
                : 'border-transparent text-[#64748B] hover:text-[#06245B] hover:border-[#CBD5E1]',
            ].join(' ')}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Page content */}
      <Outlet />
    </div>
  )
}
