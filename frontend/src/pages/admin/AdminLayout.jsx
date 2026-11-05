import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { ShieldCheck, Building2, Package, AlertTriangle, Truck } from 'lucide-react'
import { usePermissions } from '../../hooks/usePermissions'

const adminNav = [
  { path: 'verification', label: 'Verification Queue', icon: Building2 },
  { path: 'catalog', label: 'Catalog Management', icon: Package },
  { path: 'disputes', label: 'Disputes', icon: AlertTriangle },
  { path: 'shipping', label: 'Shipping Providers', icon: Truck },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const { isSystemAdmin } = usePermissions()

  if (!isSystemAdmin) {
    navigate('/dashboard', { replace: true })
    return null
  }

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#06245B] flex items-center justify-center">
          <ShieldCheck size={20} className="text-[#00D9F5]" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#06245B]">Admin Portal</h1>
          <p className="text-xs text-[#64748B]">System administration</p>
        </div>
      </div>

      {/* Admin nav tabs */}
      <div className="flex gap-2 flex-wrap border-b border-[rgba(6,36,91,0.08)] pb-0">
        {adminNav.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => [
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px',
              isActive
                ? 'border-[#00D9F5] text-[#06245B]'
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

