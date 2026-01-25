import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function TermsAndConditionsPage() {
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  const currentDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-0">
        {/* Hero Section */}
        <section className="relative w-full bg-gradient-to-b from-[#F5E6E0]/20 to-white py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-6 text-center" 
              style={{ fontFamily: "'Bona Nova SC', serif" }}>
              Terms and Conditions
            </h1>
            <p className="text-lg md:text-xl text-black/70 text-center mb-2" 
              style={{ fontFamily: "'Bona Nova', serif" }}>
              Last updated: {currentDate}
            </p>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-black/80 leading-relaxed mb-8" 
                style={{ fontFamily: "'Bona Nova', serif" }}>
                By accessing or using Musinest, you agree to the following terms:
              </p>

              <div className="space-y-8">
                {/* Use of Website */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Use of Website
                  </h2>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li>Musinest provides music education content, tutorials, and related services.</li>
                    <li>Content is for educational purposes only.</li>
                    <li>You agree not to misuse, copy, or redistribute content without permission.</li>
                  </ul>
                </div>

                {/* User Accounts */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    User Accounts
                  </h2>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li>You are responsible for maintaining the confidentiality of your account.</li>
                    <li>Accounts created using Google Sign-In must provide accurate information.</li>
                  </ul>
                </div>

                {/* Intellectual Property */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Intellectual Property
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    All content on Musinest (videos, text, tutorials, branding) is the intellectual property of Musinest unless stated otherwise. Unauthorized use is prohibited.
                  </p>
                </div>

                {/* Limitation of Liability */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Limitation of Liability
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mb-3" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    Musinest is not liable for:
                  </p>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li>Any indirect or incidental damages</li>
                    <li>Learning outcomes, exam results, or performance guarantees</li>
                  </ul>
                </div>

                {/* Termination */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Termination
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We reserve the right to suspend or terminate access if terms are violated.
                  </p>
                </div>

                {/* Governing Law */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Governing Law
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    These terms are governed by the laws of India.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
