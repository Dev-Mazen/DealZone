import { useEffect, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUIStore } from '../../store/uiStore'
import { useTranslation } from '../../hooks/useTranslation'
import { usePermissions } from '../../hooks/usePermissions'
import { getNavSections, getRoleKey, getRoleLabel, isPathActive } from './navConfig'

export default function Sidebar({ mobileOpen = false, onMobileClose = () => { } }) {
  const { pathname } = useLocation()
  const { language } = useTranslation()
  const isAr = language === 'ar'

  const collapsed = useUIStore((s) => s.sidebarCollapsed)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  const { isSystemAdmin, isSupplierOnly, isBuyerOnly, isVerified } = usePermissions()
  const roleKey = getRoleKey({ isSystemAdmin, isSupplierOnly, isBuyerOnly })
  const sections = useMemo(() => getNavSections(roleKey, isAr), [roleKey, isAr])

  // قفل على الموبايل عند تغيير الصفحة
  useEffect(() => {
    onMobileClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Escape يقفل على الموبايل
  useEffect(() => {
    if (!mobileOpen) return
    const onKey = (e) => e.key === 'Escape' && onMobileClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen, onMobileClose])

  const CollapseIcon = collapsed
    ? isAr ? ChevronLeft : ChevronRight
    : isAr ? ChevronRight : ChevronLeft

  return (
    <>
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 top-16 bg-[rgba(6,36,91,0.4)] z-[1020]"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label={isAr ? 'التنقل الرئيسي' : 'Main navigation'}
        className={[
          'fixed start-0 top-16 bottom-0 z-[1025] w-64 bg-white border-e border-[rgba(6,36,91,0.06)]',
          'transition-all duration-300',
          collapsed ? 'md:w-20' : 'md:w-64',
          mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full rtl:translate-x-full',
          'md:translate-x-0 md:rtl:translate-x-0 md:shadow-none',
        ].join(' ')}
      >
        <nav className="flex flex-col h-full p-3">
          <div className="flex-1 overflow-y-auto space-y-4">
            {/* الدور وحالة التوثيق */}
            {!isSystemAdmin && (
              <div className={`px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl ${collapsed ? 'md:hidden' : ''}`}>
                <p className="text-[11px] font-bold text-[#06245B] truncate">
                  {getRoleLabel(roleKey, isAr)}
                </p>
                {isVerified ? (
                  <span className="mt-1 inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ✓ {isAr ? 'موثق' : 'Verified'}
                  </span>
                ) : (
                  <Link
                    to="/verification"
                    className="mt-1 inline-block text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-1.5 py-0.5 rounded"
                  >
                    {isAr ? 'غير موثق · أكمل التوثيق' : 'Unverified · Complete verification'}
                  </Link>
                )}
              </div>
            )}

            {sections.map((section, idx) => (
              <div key={section.key}>
                {section.title && (
                  <>
                    <p
                      className={`px-3 mb-1 text-[11px] font-bold uppercase tracking-wide text-slate-400 ${collapsed ? 'md:hidden' : ''
                        }`}
                    >
                      {section.title}
                    </p>
                    {idx > 0 && (
                      <hr className={`hidden mb-2 border-slate-100 ${collapsed ? 'md:block' : ''}`} />
                    )}
                  </>
                )}
                <ul className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isPathActive(pathname, item)
                    return (
                      <li key={item.key}>
                        <Link
                          to={item.path}
                          title={collapsed ? item.label : undefined}
                          aria-current={active ? 'page' : undefined}
                          className={[
                            'group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150',
                            collapsed ? 'md:justify-center' : '',
                            active
                              ? 'bg-[#EAF4FF] text-[#06245B] font-semibold'
                              : 'text-[#64748B] hover:bg-[#F4F7FB] hover:text-[#06245B]',
                          ].join(' ')}
                        >
                          <Icon
                            size={20}
                            className={`shrink-0 ${active ? 'text-[#1266D6]' : 'group-hover:text-[#1266D6]'}`}
                          />
                          <span className={`truncate flex-1 text-sm ${collapsed ? 'md:hidden' : ''}`}>
                            {item.label}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center w-full h-10 rounded-xl border border-[rgba(6,36,91,0.1)] hover:bg-[#EAF4FF] text-[#64748B] hover:text-[#06245B] transition-colors"
              aria-label={
                collapsed
                  ? isAr ? 'توسيع القائمة' : 'Expand sidebar'
                  : isAr ? 'طي القائمة' : 'Collapse sidebar'
              }
            >
              <CollapseIcon size={18} />
            </button>
          </div>
        </nav>
      </aside>
    </>
  )
}