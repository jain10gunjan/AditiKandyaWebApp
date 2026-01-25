import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function DisclaimerPage() {
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-0">
        {/* Hero Section */}
        <section className="relative w-full bg-gradient-to-b from-[#F5E6E0]/20 to-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 text-center" 
              style={{ fontFamily: "'Bona Nova SC', serif" }}>
              Disclaimer
            </h1>
            <p className="text-xl md:text-2xl text-black/70 text-center mb-8" 
              style={{ fontFamily: "'Bona Nova', serif" }}>
              Musinest
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-black/80 leading-relaxed mb-8" 
                style={{ fontFamily: "'Bona Nova', serif" }}>
                The information and services provided on Musinest are for educational and informational purposes only.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
