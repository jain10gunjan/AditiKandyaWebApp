import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import aditiProfileImage01 from '../assets/profileImages/image1.jpg'

export default function AboutPage() {
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
       
        {/* Large ABOUT Title with Image Collage */}
        <section className="relative w-full h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden mb-16">
          <div className="absolute inset-0 grid grid-cols-3 gap-0">
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
                className="w-full h-full object-cover"
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
          </div>
          
          {/* Overlay with ABOUT Title */}
           
        </section>

        {/* Introduction Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
           
          <p className="text-2xl md:text-3xl text-black leading-relaxed max-w-3xl mx-auto" 
          style=
          {{ fontFamily: "'Satisfy', cursive" }}>
            Bridging the gap between Western classical piano and Indian classical vocal traditions. Musinest creates a unique musical journey for every student.
          </p>
        </section>

        {/* Two Column Layout Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Column - Text Content */}
            <div className="space-y-8">
              {/* The Beginning */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  The Beginning
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  My musical journey began with a deep fascination for the piano and its beautiful sounds. What started as curiosity for Western classical music evolved into a lifelong passion — until a turning point came with Indian classical vocal music. The realization that music transcends boundaries inspired the birth of Musinest by Aditi.
                </p>
              </div>

              {/* My Vision for Musinest */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  My Vision for Musinest
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed mb-4" style={{ fontFamily: "'Bitter', serif" }}>
                  At Musinest, my vision is for every lesson to be warm and encouraging. Right now, Musinest is a "one-girl gig": every class, lesson plan, and note of encouragement comes directly from me. This personal connection allows me to understand each student's strengths and guide them at their own pace, striking the perfect balance between structure and creativity.
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  I want Musinest to be a space where students feel free to experiment, explore, and make music on their own terms, building strong technical foundations and expressing themselves.
                </p>
              </div>

              {/* My Mission */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  My Mission
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  My mission with Musinest is to make music learning personal, enjoyable, and deeply rewarding. I strive for every student—curious beginner or aspiring performer—to feel empowered, inspired, and confident.
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed mt-4" style={{ fontFamily: "'Bitter', serif" }}>
                  Through patient guidance, interactive lessons, and a balance of discipline and creativity, I help build strong technical skills, encourage self-expression, and foster a safe space where mistakes are part of the journey, not something to fear.
                </p>
              </div>
 

              {/* Teaching Philosophy */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Teaching Philosophy
                </h3>
                <div className="space-y-4">
                  <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                    "Music is not just about technical proficiency—it's about emotional expression, cultural connection, and personal growth. My teaching approach combines rigorous ABRSM training with creative exploration of diverse musical styles."
                  </p>
                  <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                    "Every student brings a unique perspective and set of experiences. My role is to help them discover their authentic voice while building strong foundations in both Western classical and Indian classical traditions."
                  </p>
                  <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                    "At Musinest, we believe in creating a warm, encouraging space where mistakes are part of the journey. My mission is to make music learning personal, joyful, and confidence-building for every student."
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column - Image and Inspiration */}
            <div className="sticky top-8">
              <div className="mb-8">
                <img
                  src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80"
                  alt="Music inspiration"
                  className="w-full h-[500px] object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

       
      </main>

      <Footer />
    </div>
  )
}
