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
            <p className="text-white/70 text-sm font-medium pt-4"
            style={{
              fontFamily: "'Satisfy', cursive"
            }}>Bringing Music Lessons to Your Screen.</p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4"
            style={{
              fontFamily: "'Dancing Script', cursive"
            }}>Quick Links</h3>
            <ul className="space-y-2 text-sm text-white/70">
              <li><a href="/" className="hover:text-[#F5E6E0] transition-colors font-medium"
              style={{
                fontFamily: "'Cinzel', serif"
              }}              >Home</a></li>
              <li><a href="/workshops" className="hover:text-[#F5E6E0] transition-colors font-medium"
              style={{
                fontFamily: "'Cinzel', serif"
              }}       >Workshops</a></li>
              <li><a href="/courses" className="hover:text-[#F5E6E0] transition-colors font-medium"style={{
                fontFamily: "'Cinzel', serif"
              }}       >Courses</a></li>
              <li><a href="/teachers" className="hover:text-[#F5E6E0] transition-colors font-medium"style={{
                fontFamily: "'Cinzel', serif"
              }}       >Meet the Teacher</a></li>
              <li><a href="/about" className="hover:text-[#F5E6E0] transition-colors font-medium"style={{
                fontFamily: "'Cinzel', serif"
              }}       >About</a></li>
              <li><a href="/contact" className="hover:text-[#F5E6E0] transition-colors font-medium"style={{
                fontFamily: "'Cinzel', serif"
              }}       >Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4"
            style={{
              fontFamily: "'Dancing Script', cursive"
            }}       >Contact</h3>
            <ul className="space-y-2 text-sm text-white/70 font-medium"
            style={{
              fontFamily: "'Satisfy', cursive"
            }}       >
              <li>📧 aditikandya@gmail.com</li>
              <li>📞 +91 7024403520</li>
              <li>📍 Virtual Studio, Based in MP India</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-white mb-4"
            style={{
              fontFamily: "'Dancing Script', cursive"
            }}       >Follow Us</h3>
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
              <h3 className="font-bold text-white mb-2 text-sm"
              style={{
                fontFamily: "'Dancing Script', cursive"
              }}
              >Contact</h3>
              <ul className="space-y-1 text-sm text-white/70 font-medium"
              style={{
                fontFamily: "'Satisfy', cursive"
              }}
              >
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
                <h3 className="font-bold text-white mb-2 text-sm"
                style={{
                  fontFamily: "'Dancing Script', cursive"
                }}
                >Quick Links</h3>
                <ul className="space-y-1 text-sm text-white/70">
                  <li><a href="/" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >Home</a></li>
                  <li><a href="/workshops" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >Workshops</a></li>
                  <li><a href="/courses" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >Courses</a></li>
                  <li><a href="/teachers" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >Meet the Teacher</a></li>
                  <li><a href="/about" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >About</a></li>
                  <li><a href="/contact" className="hover:text-[#F5E6E0] transition-colors font-medium"
                  style={{
                    fontFamily: "'Cinzel', serif"
                  }}
                  >Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-white mb-2 text-sm"
                style={{
                  fontFamily: "'Dancing Script', cursive"
                }}
                >Follow Us</h3>
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

        <div className="border-t border-[#F5E6E0]/30 mt-8 pt-6 text-center text-white/70 text-sm font-medium"
        style={{
          fontFamily: "'Satisfy', cursive"
        }}
        >
          © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
        </div>
      </div>
    </footer>
  )
}

