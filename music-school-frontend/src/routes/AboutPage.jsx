import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import aditiProfileImage01 from '../assets/profileImages/image1.jpg'
import image1 from '../assets/profileImages/image1.jpeg'
import image2 from '../assets/profileImages/image2.jpeg'
import image3 from '../assets/profileImages/image3.jpeg'

export default function AboutPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  
  const images = [
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
    aditiProfileImage01,
    "https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&q=80"
  ]

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  // Auto-slide images on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }, 4000) // Change image every 4 seconds

    return () => clearInterval(interval)
  }, [images.length])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-0">
       
        {/* Desktop: Large Image Collage with Overlapping Text */}
        {/* Mobile: Single Image Slider with Overlapping Text */}
        <section className="relative w-full h-[60vh] min-h-[500px] max-h-[700px] md:max-h-[700px] overflow-hidden mb-16">
          {/* Desktop: 3 Image Grid */}
          <div className="hidden md:grid absolute inset-0 grid-cols-3 gap-0">
            {/* Left Image - Desaturated */}
            <div className="relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80"
                alt="Music"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            {/* Center Image - Color Portrait */}
            <div className="relative overflow-hidden">
              <img
                src={aditiProfileImage01}
                alt="Aditi Kandya"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            {/* Right Image - Desaturated */}
            <div className="relative overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=800&q=80"
                alt="Music"
                className="w-full h-full object-cover grayscale"
              />
            </div>
            {/* Dark overlay for better text readability on desktop */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>

          {/* Mobile: Single Image Slider */}
          <div className="md:hidden absolute inset-0">
            {images.map((image, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <img
                  src={image}
                  alt={`Music ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {/* Dark overlay for better text readability on mobile */}
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Image indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === currentImageIndex ? 'bg-white w-8' : 'bg-white/50 w-2'
                  }`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          {/* Text Content - Overlapping on Both Desktop and Mobile */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white leading-relaxed drop-shadow-lg" 
                style={{ fontFamily: "'Satisfy', cursive" }}>
                Bridging the gap between Western classical music and Indian classical and music. Musinest creates a unique musical journey for every student.
              </p>
            </div>
          </div>
        </section>

     

        {/* Timeline Section */}
        <section className="py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Timeline Title */}
            <div className="text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-4" style={{ fontFamily: "'Bona Nova SC', serif" }}>
                The Beginning
              </h2>
              <p className="text-lg text-black/70 max-w-2xl mx-auto" style={{ fontFamily: "'Bona Nova', serif" }}>
              The Musinest was created with a simple intention — to make learning music calm, enjoyable, and genuinely meaningful. Founded by pianist and vocalist Aditi Kandya, the studio brings together learners from different countries, age groups, and skill levels. What started as a small space for online learning has now grown into a supportive, structured environment where students feel understood, guided, and inspired.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative">
              {/* Vertical Timeline Line */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-[#8B7355]"></div>

              {/* Timeline Items */}
              <div className="space-y-16 md:space-y-24">
                {/* Timeline Item 1 */}
                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* Image - Left on Desktop */}
                  <div className="w-full md:w-1/2 md:pr-8 order-2 md:order-1">
                    <img
                      src={image1}
                      alt="Timeline event"
                      className="w-full aspect-square object-cover"
                    />
                  </div>

                  {/* Timeline Node - Center */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#8B7355] rounded-full z-10 border-4 border-[#F5F5F0]"></div>

                  {/* Content - Right on Desktop */}
                  <div className="w-full md:w-1/2 md:pl-8 order-1 md:order-2">
                    <div className="text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: "'Bona Nova SC', serif" }}>
                      My Vision for Musinest

                      </h3>
                      <p className="text-base md:text-lg text-black/70 leading-relaxed" style={{ fontFamily: "'Bona Nova', serif" }}>
                      We envision a learning space where music education feels accessible, stress-free, and aligned with each student’s personal goals. Whether a student is preparing for graded exams, learning their favourite pieces, or exploring music for the first time, The Musinest aims to create a nurturing environment where growth feels natural, learning feels joyful, and every student feels motivated to keep going.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Item 2 */}
                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* Content - Left on Desktop */}
                  <div className="w-full md:w-1/2 md:pr-8 order-1">
                    <div className="text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: "'Bona Nova SC', serif" }}>
                      My Mission

                      </h3>
                      <p className="text-base md:text-lg text-black/70 leading-relaxed" style={{ fontFamily: "'Bona Nova', serif" }}>
                      Our mission is to offer clear, personalised, one-on-one online music training that helps every student build strong fundamentals, good technique, musical expression, and confidence. At The Musinest, lessons are carefully designed to feel engaging, balanced, and enjoyable, blending traditional teaching methods with modern learning tools to support steady and meaningful progress.

Through patient guidance, interactive lessons, and a balance of discipline and creativity, I help build strong technical skills, encourage self-expression, and foster a safe space where mistakes are part of the journey, not something to fear.
                      </p>
                    </div>
                  </div>

                  {/* Timeline Node - Center */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#8B7355] rounded-full z-10 border-4 border-[#F5F5F0]"></div>

                  {/* Image - Right on Desktop */}
                  <div className="w-full md:w-1/2 md:pl-8 order-2">
                    <img
                      src={image2}
                      alt="Timeline event"
                      className="w-full aspect-square object-cover"
                    />
                  </div>
                </div>

                {/* Timeline Item 3 - Add more as needed */}
                <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-12">
                  {/* Image - Left on Desktop */}
                  <div className="w-full md:w-1/2 md:pr-8 order-2 md:order-1">
                    <img
                      src={image3}
                      alt="Timeline event"
                      className="w-full aspect-square object-cover"
                    />
                  </div>

                  {/* Timeline Node - Center */}
                  <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#8B7355] rounded-full z-10 border-4 border-[#F5F5F0]"></div>

                  {/* Content - Right on Desktop */}
                  <div className="w-full md:w-1/2 md:pl-8 order-1 md:order-2">
                    <div className="text-left">
                      <h3 className="text-2xl md:text-3xl font-bold text-black mb-3" style={{ fontFamily: "'Bona Nova SC', serif" }}>
                      Teaching Philosophy

                      </h3>
                      <p className="text-base md:text-lg text-black/70 leading-relaxed" style={{ fontFamily: "'Bona Nova', serif" }}>
                      We envision a learning space where music education feels accessible, stress-free, and aligned with each student’s personal goals. Whether a student is preparing for graded exams, learning their favourite pieces, or exploring music for the first time, The Musinest aims to create a nurturing environment where growth feels natural, learning feels joyful, and every student feels motivated to keep going.
                      </p>
                    </div>
                  </div>
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
