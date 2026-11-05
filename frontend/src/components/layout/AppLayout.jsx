import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import { useUIStore } from '../../store/uiStore'

export default function AppLayout({ children }) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed)

  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar />
      
      <div className="flex">
        <Sidebar />
        
        <main
          className={[
            'flex-1 transition-all duration-300 pt-20',
            sidebarCollapsed ? 'md:ms-20' : 'md:ms-64',
          ].join(' ')}
        >
          <div className="container py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  )
}

// Public layout (no sidebar, no auth)
export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F4F7FB]">
      <Navbar />
      <main className="pt-20">
        {children || <Outlet />}
      </main>
    </div>
  )
}

