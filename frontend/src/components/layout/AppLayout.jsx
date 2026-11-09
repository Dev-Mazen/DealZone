import { Outlet, useLocation } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../store/uiStore'
import { PageTransition } from '../animations'

export default function AppLayout({ children }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F4F7FB] overflow-x-hidden">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main
          className={[
            'flex-1 min-w-0 transition-all duration-300 pt-20',
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
    </div>
  )
}

// Public layout (no sidebar, no auth)
export function PublicLayout({ children }) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar />
      <main className="pt-20">
        <PageTransition key={location.pathname}>
          {children || <Outlet />}
        </PageTransition>
      </main>
    </div>
  )
}

