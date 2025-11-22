import { useState } from 'react'
import logo from '../assets/logo.png'

export default function Footer({ showAdminTools = false }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <footer className="border-t border-[#F5E6E0]/30 mt-20 bg-black">
      <div className="max-w-6xl mx-auto p-8">
        {/* Desktop Footer */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={logo} 
                alt="Themusinest Logo" 
                className="h-14 w-auto object-contain"
              />
              <span className="font-cinema font-bold text-white text-lg">The Musinest.com</span>
            </div>
            <p className="text-white/70 text-sm font-medium">Bringing Music Lessons to Your Screen.</p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="/" className="hover:text-[#F5E6E0] transition-colors font-medium">Home</a></li>
              <li><a href="/workshops" className="hover:text-[#F5E6E0] transition-colors font-medium">Workshops</a></li>
              <li><a href="/courses" className="hover:text-[#F5E6E0] transition-colors font-medium">Courses</a></li>
              <li><a href="/teachers" className="hover:text-[#F5E6E0] transition-colors font-medium">Meet the Teacher</a></li>
              <li><a href="/about" className="hover:text-[#F5E6E0] transition-colors font-medium">About</a></li>
              <li><a href="/contact" className="hover:text-[#F5E6E0] transition-colors font-medium">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-white/70 font-medium">
              <li>📧 aditikandya@gmail.com</li>
              <li>📞 +91 7024403520</li>
              <li>📍 Virtual Studio, Based in MP India</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4">Follow Us</h3>
            <div className="flex gap-3 mb-4">
              <a 
                href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#F5E6E0] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D5CC] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Follow us on Instagram"
              >
                <span className="text-black text-lg">📷</span>
              </a>
              <a 
                href="https://www.youtube.com/@themusinest" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#F5E6E0] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D5CC] transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Subscribe to our YouTube channel"
              >
                <span className="text-black text-lg">📺</span>
              </a>
            </div>
            {showAdminTools && (
              <>
                <h3 className="font-bold text-white mb-4">Admin Tools</h3>
                <ul className="space-y-2 text-sm text-white/70">
                  <li><a href="/admin" className="hover:text-[#F5E6E0] transition-colors font-medium">Dashboard</a></li>
                  <li><a href="/admin/teachers" className="hover:text-[#F5E6E0] transition-colors font-medium">Teachers</a></li>
                  <li><a href="/admin/attendance" className="hover:text-[#F5E6E0] transition-colors font-medium">Attendance</a></li>
                  <li><a href="/admin/calendar" className="hover:text-[#F5E6E0] transition-colors font-medium">Calendar</a></li>
                  <li><a href="/admin/resources" className="hover:text-[#F5E6E0] transition-colors font-medium">Resources</a></li>
                  <li><a href="/admin/enrollment-leads" className="hover:text-[#F5E6E0] transition-colors font-medium">New Enrollment Leads</a></li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden">
          {/* Always visible contact info */}
          <div className="mb-4 pb-4 border-b border-[#F5E6E0]/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <img 
                  src={logo} 
                  alt="Themusinest Logo" 
                  className="h-10 w-auto object-contain"
                />
                <span className="font-cinema font-bold text-white text-sm">Themusinest</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#F5E6E0] p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Toggle footer menu"
              >
                {mobileMenuOpen ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
            <div>
              <h3 className="font-bold text-white mb-2 text-sm">Contact</h3>
              <ul className="space-y-1 text-sm text-white/70 font-medium">
                <li>📧 aditikandya@gmail.com</li>
                <li>📞 +91 7024403520</li>
                <li>📍 Virtual Studio, Based in MP India</li>
              </ul>
            </div>
          </div>
          
          {/* Expandable menu */}
          {mobileMenuOpen && (
            <div className="space-y-4 pb-4">
              <div>
                <h3 className="font-bold text-white mb-2 text-sm">Quick Links</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  <li><a href="/" className="hover:text-[#F5E6E0] transition-colors font-medium">Home</a></li>
                  <li><a href="/workshops" className="hover:text-[#F5E6E0] transition-colors font-medium">Workshops</a></li>
                  <li><a href="/courses" className="hover:text-[#F5E6E0] transition-colors font-medium">Courses</a></li>
                  <li><a href="/teachers" className="hover:text-[#F5E6E0] transition-colors font-medium">Meet the Teacher</a></li>
                  <li><a href="/about" className="hover:text-[#F5E6E0] transition-colors font-medium">About</a></li>
                  <li><a href="/contact" className="hover:text-[#F5E6E0] transition-colors font-medium">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 text-sm">Follow Us</h3>
                <div className="flex gap-3">
                  <a 
                    href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#F5E6E0] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D5CC] transition-all duration-300"
                    title="Follow us on Instagram"
                  >
                    <span className="text-black text-lg">📷</span>
                  </a>
                  <a 
                    href="https://www.youtube.com/@themusinest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-[#F5E6E0] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#E8D5CC] transition-all duration-300"
                    title="Subscribe to our YouTube channel"
                  >
                    <span className="text-black text-lg">📺</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-[#F5E6E0]/30 mt-8 pt-6 text-center text-white/70 text-sm font-medium">
          © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
        </div>
      </div>
    </footer>
  )
}

