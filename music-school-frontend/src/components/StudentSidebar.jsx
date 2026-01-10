import { useAuth, UserButton } from '@clerk/clerk-react'
import { Link, useLocation } from 'react-router-dom'

export default function StudentSidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const { user } = useAuth()
  const location = useLocation()
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', href: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: '📚', href: '/dashboard' },
    { id: 'tokens', label: 'My Tokens', icon: '🎫', href: '/dashboard' },
    { id: 'calendar', label: 'Calendar', icon: '📅', href: '/student/calendar' },
    { id: 'attendance', label: 'Attendance', icon: '📊', href: '/student/attendance' },
    { id: 'resources', label: 'Resources', icon: '📖', href: '/student/resources' },
  ]

  // Determine active tab based on current location
  const getCurrentActiveTab = () => {
    const path = location.pathname
    if (path === '/dashboard') return activeTab || 'overview'
    if (path.includes('/calendar')) return 'calendar'
    if (path.includes('/attendance')) return 'attendance'
    if (path.includes('/resources')) return 'resources'
    return activeTab || 'overview'
  }

  const currentActive = getCurrentActiveTab()

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed top-0 bottom-0 left-0 z-40 w-56 lg:w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:top-20 lg:h-[calc(100vh-5rem)] ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
             
            {/* Navigation Menu */}
            <nav className="p-3 mt-8 lg:p-2">
              <ul className="space-y-1 lg:space-y-2 text-bold">
                {menuItems.map((item) => {
                  // Overview, My Courses, and My Tokens should change tabs (for dashboard page)
                  const isDashboardTab = item.id === 'overview' || item.id === 'courses' || item.id === 'tokens'
                  const isActive = currentActive === item.id
                  
                  return (
                    <li key={item.id}>
                      {isDashboardTab && onTabChange && location.pathname === '/dashboard' ? (
                        <button
                          onClick={() => {
                            onTabChange(item.id)
                            if (onClose) {
                              onClose()
                            }
                          }}
                          className={`w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-lg lg:text-xl">{item.icon}</span>
                          <span className="font-medium text-sm lg:text-base"
                          style={{
                            fontFamily: "'Bona Nova', serif",
                          }}
                          >{item.label}</span>
                        </button>
                      ) : (
                        <Link
                          to={item.href}
                          onClick={() => {
                            // If it's a dashboard tab, also trigger the tab change
                            if (isDashboardTab && onTabChange) {
                              onTabChange(item.id)
                            }
                            if (onClose) {
                              onClose()
                            }
                          }}
                          className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 ${
                            isActive
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                          }`}
                        >
                          <span className="text-lg lg:text-xl">{item.icon}</span>
                          <span className="font-medium text-sm lg:text-base"
                          style={{
                            fontFamily: "'Bona Nova', serif",
                          }}
                          >{item.label}</span>
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  )
}