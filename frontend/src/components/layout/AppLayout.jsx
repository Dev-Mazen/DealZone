import { useState, useCallback } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../store/uiStore'
import { PageTransition } from '../animations'

export default function AppLayout({ children }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleMobile = useCallback(() => setMobileOpen((o) => !o), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar onMenuClick={toggleMobile} />
      <Sidebar mobileOpen={mobileOpen} onMobileClose={closeMobile} />

      <main
        className={[
          'min-w-0 pt-16 transition-all duration-300',
          sidebarCollapsed ? 'md:ms-20' : 'md:ms-64',
        ].join(' ')}
      >
        <div className="container py-6">
          <PageTransition key={location.pathname}>
            {children || <Outlet />}
          </PageTransition>
        </div>
      </main>
    </div>
  )
}

// Public layout (بدون Sidebar)
export function PublicLayout({ children }) {
  const location = useLocation()
  const isFullBleed = location.pathname === '/' || location.pathname === '/about'

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar />
      <main className="pt-16">
        {isFullBleed ? (
          <PageTransition key={location.pathname}>
            {children || <Outlet />}
          </PageTransition>
        ) : (
          <div className="container py-6">
            <PageTransition key={location.pathname}>
              {children || <Outlet />}
            </PageTransition>
          </div>
        )}
      </main>
    </div>
  )
}