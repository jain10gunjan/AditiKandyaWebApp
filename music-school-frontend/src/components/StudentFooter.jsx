import { useState } from 'react'

export default function StudentFooter() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <footer className="border-t border-slate-200 mt-20 bg-white md:ml-64">
      <div className="max-w-6xl mx-auto p-8">
        {/* Desktop Footer */}
        <div className="hidden md:grid md:grid-cols-4 gap-8">
          <div>
            <a href="/" className="flex items-center gap-2">
              <div className="relative bg-white px-4 py-1.5 flex flex-col items-center justify-center">  
               <span 
              className="text-lg leading-none"
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
                className="text-xs leading-none"
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
            <p className="text-slate-600 text-sm font-medium pt-4"
            style={{
              fontFamily: "'Bona Nova', serif"
            }}>Bringing Music Lessons to Your Screen.</p>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4"
           style={{
            fontFamily: "'Bona Nova SC', serif"
          }}>Quick Links</h3>
            <ul className="space-y-2 text-sm text-slate-600"
           style={{
            fontFamily: "'Bona Nova', serif"
          }} 
            >
              <li><a href="/" className="hover:text-slate-900 transition-colors font-medium">Home</a></li>
              <li><a href="/workshops" className="hover:text-slate-900 transition-colors font-medium">Workshops</a></li>
              <li><a href="/courses" className="hover:text-slate-900 transition-colors font-medium">Courses</a></li>
              <li><a href="/teachers" className="hover:text-slate-900 transition-colors font-medium">Meet the Teacher</a></li>
              <li><a href="/about" className="hover:text-slate-900 transition-colors font-medium">About</a></li>
              <li><a href="/contact" className="hover:text-slate-900 transition-colors font-medium">Contact Us</a></li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4"
            style={{
              fontFamily: "'Bona Nova SC', serif"
            }}>Contact</h3>
            <ul className="space-y-2 text-sm text-slate-600 font-medium"
            style={{
              fontFamily: "'Bona Nova', serif"
            }}>
              <li>📧 themusinest@gmail.com</li>
              <li>📞 +91 7024403520</li>
              <li>📍 Virtual Studio, Based in MP India</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-slate-900 mb-4"
            style={{
              fontFamily: "'Bona Nova SC', serif"
            }}>Follow Us</h3>
            <div className="flex gap-3 mb-4">
              <a 
                href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Follow us on Instagram"
              >
                <span className="text-white text-lg">📷</span>
              </a>
              <a 
                href="https://www.youtube.com/@themusinest" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-110"
                title="Subscribe to our YouTube channel"
              >
                <span className="text-white text-lg">📺</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="md:hidden">
          {/* Always visible contact info */}
          <div className="mb-4 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <a href="/" className="flex items-center gap-2">
                  <div className="relative bg-white border-2 border-slate-900 px-4 py-1.5 flex flex-col items-center justify-center">
                    {/* Top full border */}
                    <div className="absolute top-0 left-0 right-0 h-0 border-t-2 border-slate-900"></div>
                    
                    {/* Left side border */}
                    <div className="absolute top-0 left-0 bottom-0 w-0 border-l-2 border-slate-900"></div>
                    
                    {/* Right side border */}
                    <div className="absolute top-0 right-0 bottom-0 w-0 border-r-2 border-slate-900"></div>
                    
                    {/* Bottom left corner */}
                    <div className="absolute bottom-0 left-0 w-12 h-0 border-b-2 border-slate-900"></div>
                    
                    {/* Bottom right corner */}
                    <div className="absolute bottom-0 right-0 w-12 h-0 border-b-2 border-slate-900"></div>
                    
                    <span 
                      className="text-slate-900 text-lg leading-none"
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
                        className="text-slate-900 text-xs leading-none"
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
                className="text-slate-600 p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
              <h3 className="font-bold text-slate-900 mb-2 text-sm"
              style={{
                fontFamily: "'Bona Nova SC', serif"
              }}
              >Contact</h3>
              <ul className="space-y-1 text-sm text-slate-600 font-medium"
              style={{
                fontFamily: "'Bona Nova', serif"
              }}
              >
                <li>📧 themusinest@gmail.com</li>
                <li>📞 +91 7024403520</li>
                <li>📍 Virtual Studio, Based in MP India</li>
              </ul>
            </div>
          </div>
          
          {/* Expandable menu */}
          {mobileMenuOpen && (
            <div className="space-y-4 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm"
                style={{
                  fontFamily: "'Bona Nova SC', serif"
                }}
                >Quick Links</h3>
                <ul className="space-y-1 text-sm text-slate-600"
                style={{
                  fontFamily: "'Bona Nova', serif"
                }}
                >
                  <li><a href="/" className="hover:text-slate-900 transition-colors font-medium">Home</a></li>
                  <li><a href="/workshops" className="hover:text-slate-900 transition-colors font-medium">Workshops</a></li>
                  <li><a href="/courses" className="hover:text-slate-900 transition-colors font-medium">Courses</a></li>
                  <li><a href="/teachers" className="hover:text-slate-900 transition-colors font-medium">Meet the Teacher</a></li>
                  <li><a href="/about" className="hover:text-slate-900 transition-colors font-medium">About</a></li>
                  <li><a href="/contact" className="hover:text-slate-900 transition-colors font-medium">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 mb-2 text-sm"
                style={{
                  fontFamily: "'Bona Nova SC', serif"
                }}
                >Follow Us</h3>
                <div className="flex gap-3">
                  <a 
                    href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all duration-300"
                    title="Follow us on Instagram"
                  >
                    <span className="text-white text-lg">📷</span>
                  </a>
                  <a 
                    href="https://www.youtube.com/@themusinest" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-all duration-300"
                    title="Subscribe to our YouTube channel"
                  >
                    <span className="text-white text-lg">📺</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm font-medium"
         style={{
          fontFamily: "'Bona Nova SC', serif"
        }}
        >
          © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
        </div>
      </div>
    </footer>
  )
}

