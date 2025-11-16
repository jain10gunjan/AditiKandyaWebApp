import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'

import logo from '../assets/logo.png'

export default function Navbar({ subtitle = 'Music Academy' }) {
  const { user } = useUser()
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com'

  return (
    <header className="sticky top-0 z-50 bg-slate-100 border-b border-slate-700 shadow-lg">
      <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img 
              src={logo} 
              alt="Themusinest Logo" 
              className="h-16 w-auto object-contain rounded-lg"
            />
            <div>
              <span className="font-extrabold text-lg">Themusinest.com</span>
              <div className="text-xs text-slate-600">{subtitle}</div>
            </div>
          </a>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="/" className="hover:text-sky-400 font-medium transition-colors">Home</a>
          <a href="/courses" className="hover:text-sky-400 font-medium transition-colors">Courses</a>
          <a href="/teachers" className="hover:text-sky-400 font-medium transition-colors">Teachers</a>
          <a href="/schedule" className="hover:text-sky-400 font-medium transition-colors">Schedule</a>
          <a href="/dashboard" className="hover:text-sky-400 font-medium transition-colors">Dashboard</a>
          {isAdmin && (
            <a href="/admin" className="hover:text-sky-400 font-medium transition-colors">Admin</a>
          )}
          <SignedOut>
            <SignInButton>
              <button className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium hover:from-sky-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg">
                Sign In
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </nav>
    </header>
  )
}

