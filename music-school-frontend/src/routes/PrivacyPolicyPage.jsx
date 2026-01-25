import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function PrivacyPolicyPage() {
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
              Privacy Policy
            </h1>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              <p className="text-lg md:text-xl text-black/80 leading-relaxed mb-8" 
                style={{ fontFamily: "'Bona Nova', serif" }}>
                Musinest respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you use our website, services, or sign in using Google authentication.
              </p>

              <div className="space-y-8">
                {/* Information We Collect */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Information We Collect
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mb-3" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    When you use Musinest, we may collect:
                  </p>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li><strong>Personal Information:</strong> Name, email address, profile photo (when you sign in using Google).</li>
                    <li><strong>Usage Information:</strong> Pages visited, interactions, and basic analytics data.</li>
                    <li><strong>Communication Data:</strong> Messages or inquiries sent through our website or email.</li>
                  </ul>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mt-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We do not collect passwords for Google-authenticated users.
                  </p>
                </div>

                {/* How We Use Your Information */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    How We Use Your Information
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mb-3" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We use your information to:
                  </p>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li>Authenticate users via Google Sign-In</li>
                    <li>Provide and improve our music education services</li>
                    <li>Communicate important updates or responses</li>
                    <li>Maintain website security and prevent misuse</li>
                  </ul>
                </div>

                {/* Google Authentication */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Google Authentication
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    Musinest uses Google OAuth for secure login. We only access basic profile information as permitted by Google and do not sell or misuse this data.
                  </p>
                </div>

                {/* Data Sharing */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Data Sharing
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We do not sell, trade, or rent your personal information to third parties. Data may be shared only if required by law or to protect our legal rights.
                  </p>
                </div>

                {/* Data Security */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Data Security
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We implement reasonable security measures to protect your data. However, no online system is 100% secure.
                  </p>
                </div>

                {/* Your Rights */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Your Rights
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mb-3" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    You may:
                  </p>
                  <ul className="space-y-3 text-base md:text-lg text-black/70 leading-relaxed list-disc list-inside ml-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    <li>Request access or deletion of your personal data</li>
                    <li>Withdraw consent by discontinuing use of the service</li>
                  </ul>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed mt-4" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    For requests, contact us at: <a href="mailto:themusinest@gmail.com" className="text-[#8B7355] hover:underline">themusinest@gmail.com</a>
                  </p>
                </div>

                {/* Changes to This Policy */}
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-black mb-4" 
                    style={{ fontFamily: "'Bona Nova SC', serif" }}>
                    Changes to This Policy
                  </h2>
                  <p className="text-base md:text-lg text-black/70 leading-relaxed" 
                    style={{ fontFamily: "'Bona Nova', serif" }}>
                    We may update this policy from time to time. Changes will be posted on this page.
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
