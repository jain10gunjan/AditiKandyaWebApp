import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { Link, useNavigate, useLocation } from 'react-router-dom'

export default function StudentNavbar() {
  const { user, isSignedIn } = useUser()
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com'
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-container')) {
        setDropdownOpen(null)
      }
      if (mobileMenuOpen && !e.target.closest('.mobile-menu-popup') && !e.target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [mobileMenuOpen])

  const mainLinks = [
    { href: '/', label: 'Home' },
  ]

  const programsDropdown = [
    { href: '/workshops', label: 'Workshops' },
    { href: '/courses', label: 'Courses' },
  ]

  const aboutDropdown = [
    { href: '/teachers', label: 'Meet the Teacher' },
    { href: '/about', label: 'About' },
  ]

  // Student dashboard links for mobile menu
  const studentDashboardLinks = [
    { href: '/dashboard', label: 'Overview', icon: '🏠', tab: 'overview' },
    { href: '/dashboard', label: 'My Courses', icon: '📚', tab: 'courses' },
    { href: '/student/calendar', label: 'Calendar', icon: '📅', tab: null },
    { href: '/student/attendance', label: 'Attendance', icon: '📊', tab: null },
    { href: '/student/resources', label: 'Resources', icon: '📖', tab: null },
  ]
  
  // Handle dashboard link clicks with tab state
  const handleDashboardLinkClick = (e, href, tab) => {
    e.preventDefault()
    e.stopPropagation()
    setMobileMenuOpen(false)
    
    if (tab && location.pathname === '/dashboard') {
      // If already on dashboard, trigger tab change via localStorage/event
      window.dispatchEvent(new CustomEvent('dashboardTabChange', { detail: { tab } }))
    } else {
      // Navigate to dashboard and set tab
      if (tab) {
        navigate(href, { state: { tab } })
      } else {
        navigate(href)
      }
    }
  }

  // Main bottom menu links (always visible)
  const mobileBottomLinks = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/workshops', label: 'Workshops', icon: '🎓' },
    { href: '/courses', label: 'Courses', icon: '📚' },
  ]

  // Links in the menu popup
  const mobileMenuLinks = [
    { href: '/teachers', label: 'Meet the Teacher', icon: '👩‍🏫' },
    { href: '/about', label: 'About', icon: 'ℹ️' },
    { href: '/contact', label: 'Contact Us', icon: '📞' },
  ]

  if (isSignedIn) {
    mobileMenuLinks.push({ href: '/dashboard', label: 'Dashboard', icon: '📊' })
  }

  if (isAdmin) {
    mobileMenuLinks.push({ href: '/admin', label: 'Admin', icon: '⚙️' })
  }

  return (
    <>
     <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-md backdrop-blur-sm">
        <nav className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navbar */}
          <div className="hidden md:flex items-center justify-center h-20 relative">
            {/* Logo - Absolute Left (match main navbar sizing) */}
            <div className="absolute left-4 flex items-center gap-3">
              <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                <div className="relative flex flex-col items-center justify-center">
                  <span 
                    className="text-slate-900 text-3xl leading-none"
                    style={{
                      fontFamily: "'Satisfy', cursive",
                      fontWeight: 400,
                      fontStyle: 'italic'
                    }}
                  >
                    The Musinest
                  </span>
                  <div className="w-full flex justify-center mt-1">
                    <span 
                      className="text-slate-900 text-sm leading-none"
                      style={{
                        fontFamily: "'Dancing Script', cursive",
                        fontWeight: 300,
                        fontStyle: 'italic'
                      }}
                    >
                      Aditi Kandya
                    </span>
                  </div>
                </div>
              </a>
            </div>
            {/* Centered Navigation Links */}
            <div className="flex items-center gap-4 lg:gap-6">
              {mainLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
                  style={{
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {link.label}
                </a>
              ))}

              {/* Programs Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === 'programs' ? null : 'programs')}
                  className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap flex items-center gap-1"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                >
                  Programs
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen === 'programs' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen === 'programs' && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                    {programsDropdown.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium"
                        onClick={() => setDropdownOpen(null)}
                        style={{
                          fontFamily: "'Bona Nova', serif"
                        }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* About Dropdown */}
              <div className="relative dropdown-container">
                <button
                  onClick={() => setDropdownOpen(dropdownOpen === 'about' ? null : 'about')}
                  className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap flex items-center gap-1"
                  style={{
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  About
                  <svg className={`w-4 h-4 transition-transform ${dropdownOpen === 'about' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {dropdownOpen === 'about' && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50">
                    {aboutDropdown.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors text-sm font-medium"
                        onClick={() => setDropdownOpen(null)}
                        style={{
                          fontFamily: "'Bona Nova', serif"
                        }}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <a
                href="/contact"
                className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
                style={{
                  fontFamily: "'Cinzel', serif",
                }}
              >
                Contact
              </a>

              {isSignedIn && (
                <a
                  href="/dashboard"
                  className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
                  style={{
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  Dashboard
                </a>
              )}

              {isAdmin && (
                <a
                  href="/admin"
                  className="text-slate-700 hover:text-slate-900 transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
                  style={{
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  Admin
                </a>
              )}
            </div>

            {/* Auth Buttons - Absolute Right */}
            <div className="absolute right-4 flex items-center gap-4">
              <SignedOut>
                <SignInButton>
                  <button className="px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>

          {/* Mobile Navbar - Top */}
          {/* Mobile Logo (match main navbar sizing) */}
       <div className="md:hidden flex items-center justify-between h-16 w-full px-0">
         <a href="/" className="flex items-center gap-2">
           <div className="relative flex flex-col items-center justify-center">
             <span 
               className="text-slate-900 text-lg leading-none"
               style={{
                 fontFamily: "'Satisfy', cursive",
                 fontWeight: 400,
                 fontStyle: 'italic'
               }}
             >
               The Musinest
             </span>
             <div className="w-full flex justify-center mt-0.5">
               <span 
                 className="text-slate-900 text-xs leading-none"
                 style={{
                   fontFamily: "'Dancing Script', cursive",
                   fontWeight: 300,
                   fontStyle: 'italic'
                 }}
               >
                 Aditi Kandya
               </span>
             </div>
           </div>
         </a>
         
         <div className="flex items-center gap-3">
           <SignedOut>
             <SignInButton>
               <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all duration-300 shadow-md whitespace-nowrap">
                 Sign In
               </button>
             </SignInButton>
           </SignedOut>
           <SignedIn>
             <UserButton afterSignOutUrl="/" />
           </SignedIn>
         </div>
       </div>
        </nav>
      </header>

      {/* Mobile Bottom Menu */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-slate-200 shadow-2xl backdrop-blur-sm">
        <div className="relative">
          <div className="flex items-center justify-around h-16">
            {/* Left side links */}
            {mobileBottomLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-slate-900 transition-colors flex-1 h-full min-w-[60px] px-1"
              >
                <span className="text-base">{link.icon}</span>
                <span className="text-[9px] uppercase tracking-wide font-bold text-center leading-tight">
                  {link.label}
                </span>
              </Link>
            ))}
            
            {/* Menu Button in the middle */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMobileMenuOpen(prev => !prev)
              }}
              className="mobile-menu-button flex flex-col items-center justify-center gap-1 text-slate-600 hover:text-slate-900 transition-colors flex-1 h-full min-w-[60px] px-1 relative z-10"
            >
              <span className="text-base">☰</span>
              <span className="text-[9px] uppercase tracking-wide font-bold text-center leading-tight">
                Menu
              </span>
            </button>
          </div>

          {/* Mobile Menu Popup */}
          {mobileMenuOpen && (
            <div 
              className="mobile-menu-popup absolute bottom-full left-0 right-0 bg-white border border-slate-200 shadow-2xl backdrop-blur-sm max-h-[60vh] overflow-y-auto z-50"
              style={{ bottom: '100%' }}
            >
              <div className="flex flex-col py-4">
                {/* Student Dashboard Links Section */}
                {isSignedIn && (
                  <>
                    <div className="px-4 py-2 border-b border-slate-200">
                      <h3 className="text-xs uppercase tracking-wide font-bold text-slate-500 mb-2">Student Dashboard</h3>
                    </div>
                    {studentDashboardLinks.map((link) => (
                      link.tab ? (
                        <button
                          key={`${link.href}-${link.tab}`}
                          onClick={(e) => handleDashboardLinkClick(e, link.href, link.tab)}
                          className="flex items-center gap-3 text-slate-700 hover:text-slate-900 px-6 py-3 hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide font-medium w-full text-left"
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span>{link.label}</span>
                        </button>
                      ) : (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={(e) => {
                            e.stopPropagation()
                            setMobileMenuOpen(false)
                          }}
                          className="flex items-center gap-3 text-slate-700 hover:text-slate-900 px-6 py-3 hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide font-medium"
                        >
                          <span className="text-lg">{link.icon}</span>
                          <span>{link.label}</span>
                        </Link>
                      )
                    ))}
                    <div className="px-4 py-2 border-b border-slate-200 my-2"></div>
                  </>
                )}
                
                {/* Other Menu Links */}
                {mobileMenuLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 text-slate-700 hover:text-slate-900 px-6 py-3 hover:bg-slate-50 transition-colors text-sm uppercase tracking-wide font-medium"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

