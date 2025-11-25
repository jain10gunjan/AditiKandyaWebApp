import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
//import logo from '../assets/logo.jpg'
import logo3 from '../assets/logo3.jpg'
import logo4 from '../assets/logo4.jpg'

export default function Navbar({ subtitle = 'Aditi Kandya' }) {
  const { user, isSignedIn } = useUser()
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com'
  const [dropdownOpen, setDropdownOpen] = useState(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      <header className="sticky top-0 z-50 bg-black border-b border-[#F5E6E0]/30 shadow-lg backdrop-blur-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navbar */}
          <div className="hidden md:flex items-center justify-center h-20 relative">
            {/* Logo - Absolute Left */}
            <div className="absolute left-4 flex items-center gap-3">
      <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        <div className="relative bg-black px-8 py-2 flex flex-col items-center justify-center">
          {/* Top full border */}
          <div className="absolute top-0 left-0 right-0 h-0 border-t-2 border-white"></div>
          
          {/* Left side border */}
          <div className="absolute top-0 left-0 bottom-0 w-0 border-l-2 border-white"></div>
          
          {/* Right side border */}
          <div className="absolute top-0 right-0 bottom-0 w-0 border-r-2 border-white"></div>
          
          {/* Bottom left corner */}
          <div className="absolute bottom-0 left-0 w-16 h-0 border-b-2 border-white"></div>
          
          {/* Bottom right corner */}
          <div className="absolute bottom-0 right-0 w-16 h-0 border-b-2 border-white"></div>
          
          <span 
            className="text-white text-3xl leading-none"
            style={{
              fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
              fontWeight: 400,
              fontStyle: 'italic'
            }}
          >
            The Musinest
          </span>
          <div className="w-full flex justify-center mt-1">
            <span 
              className="text-white text-sm leading-none"
              style={{
                fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
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
                  className="text-white/90 hover:text-[#F5E6E0] transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
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
                  className="text-white/90 hover:text-[#F5E6E0] transition-colors text-sm uppercase tracking-wide whitespace-nowrap flex items-center gap-1"
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
                  <div className="absolute top-full left-0 mt-2 w-48 bg-black border border-[#F5E6E0]/30 rounded-lg shadow-xl py-2 z-50">
                    {programsDropdown.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-white/90 hover:text-[#F5E6E0] hover:bg-white/10 transition-colors text-sm font-medium"
                        onClick={() => setDropdownOpen(null)}
                        style={{
                          fontFamily: "'Dancing Script', cursive"
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
                  className="text-white/90 hover:text-[#F5E6E0] font-bold transition-colors text-sm uppercase tracking-wide whitespace-nowrap flex items-center gap-1"
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
                  <div className="absolute top-full left-0 mt-2 w-56 bg-black border border-[#F5E6E0]/30 rounded-lg shadow-xl py-2 z-50">
                    {aboutDropdown.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-white/90 hover:text-[#F5E6E0] hover:bg-white/10 transition-colors text-sm font-medium"
                        onClick={() => setDropdownOpen(null)}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>

              <a
                href="/contact"
                className="text-white/90 hover:text-[#F5E6E0] font-bold transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
                style={{
                  fontFamily: "'Cinzel', serif",
                }}
              >
                Contact
              </a>

              {isSignedIn && (
                <a
                  href="/dashboard"
                  className="text-white/90 hover:text-[#F5E6E0] font-bold transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
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
                  className="text-white/90 hover:text-[#F5E6E0] font-bold transition-colors text-sm uppercase tracking-wide whitespace-nowrap"
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
                  <button className="px-5 py-2 rounded-lg bg-[#F5E6E0] text-gray-700 text-sm font-bold hover:bg-[#E8D4C8] transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap">
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
          {/* Mobile Logo */}
      <div className="md:hidden flex items-center justify-between h-16 w-full px-0">
        <a href="/" className="flex items-center gap-2">
          <div className="relative bg-black px-4 py-1.5 flex flex-col items-center justify-center">
            {/* Top full border */}
            <div className="absolute top-0 left-0 right-0 h-0 border-t-2 border-white"></div>
            
            {/* Left side border */}
            <div className="absolute top-0 left-0 bottom-0 w-0 border-l-2 border-white"></div>
            
            {/* Right side border */}
            <div className="absolute top-0 right-0 bottom-0 w-0 border-r-2 border-white"></div>
            
            {/* Bottom left corner */}
            <div className="absolute bottom-0 left-0 w-12 h-0 border-b-2 border-white"></div>
            
            {/* Bottom right corner */}
            <div className="absolute bottom-0 right-0 w-12 h-0 border-b-2 border-white"></div>
            
            <span 
              className="text-white text-lg leading-none"
              style={{
                fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
                fontWeight: 400,
                fontStyle: 'italic'
              }}
            >
              The Musinest
            </span>
            <div className="w-full flex justify-center mt-0.5">
              <span 
                className="text-white text-xs leading-none"
                style={{
                  fontFamily: "'Brush Script MT', 'Lucida Handwriting', cursive",
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
          {/* Add your SignedOut/SignedIn components here */}
          <button className="px-4 py-2 rounded-lg bg-[#F5E6E0] text-gray-700 text-sm font-bold hover:bg-[#E8D4C8] transition-all duration-300 shadow-md whitespace-nowrap">
            Sign In
          </button>
        </div>
      </div>
        </nav>
      </header>

      {/* Mobile Bottom Menu */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-black border-t border-[#F5E6E0]/30 shadow-2xl backdrop-blur-sm">
        <div className="relative">
          <div className="flex items-center justify-around h-16">
            {/* Left side links */}
            {mobileBottomLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex flex-col items-center justify-center gap-1 text-white/70 hover:text-[#F5E6E0] transition-colors flex-1 h-full min-w-[60px] px-1"
              >
                <span className="text-base">{link.icon}</span>
                <span className="text-[9px] uppercase tracking-wide font-bold text-center leading-tight">
                  {link.label}
                </span>
              </a>
            ))}
            
            {/* Menu Button in the middle */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setMobileMenuOpen(prev => !prev)
              }}
              className="mobile-menu-button flex flex-col items-center justify-center gap-1 text-white/70 hover:text-[#F5E6E0] transition-colors flex-1 h-full min-w-[60px] px-1 relative z-10"
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
              className="mobile-menu-popup absolute bottom-full left-0 right-0 bg-black border border-[#F5E6E0]/30 shadow-2xl backdrop-blur-sm max-h-[60vh] overflow-y-auto z-50"
              style={{ bottom: '100%' }}
            >
              <div className="flex flex-col py-4">
                {mobileMenuLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => {
                      e.stopPropagation()
                      setMobileMenuOpen(false)
                    }}
                    className="flex items-center gap-3 text-white/90 hover:text-[#F5E6E0] px-6 py-3 hover:bg-white/10 transition-colors text-sm uppercase tracking-wide font-bold"
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}
