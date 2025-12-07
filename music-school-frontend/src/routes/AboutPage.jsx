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
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-bold text-white/90 tracking-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>
              ABOUT
            </h1>
          </div>
        </section>

        {/* Introduction Section */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 text-center">
          <h2 className="text-xs md:text-sm font-sans uppercase tracking-widest text-black/70 mb-6" style={{ fontFamily: "'Satisfy', cursive" }}>
            MUSIC EDUCATION
          </h2>
          <p className="text-2xl md:text-3xl text-black leading-relaxed max-w-3xl mx-auto" style={{ fontFamily: "'Bitter', serif" }}>
            Bridging the gap between Western classical piano and Indian classical vocal traditions, MusiNest creates a unique musical journey for every student.
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
                  My musical journey began with a deep fascination for the piano and its beautiful sounds. What started as curiosity for Western classical music evolved into a lifelong passion — until a turning point came with Indian classical vocal music. The realization that music transcends boundaries inspired the birth of MusiNest by Aditi.
                </p>
              </div>

              {/* The Vision */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  The Vision
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  Today, MusiNest is more than music education — it's a nurturing space where every student feels seen, heard, and supported in their unique musical journey. Here, traditional techniques meet creative expression, and everyone becomes part of a family dedicated to building strong foundations, exploring diverse styles, and discovering their authentic voice.
                </p>
              </div>

              {/* My Vision for MusiNest */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  My Vision for MusiNest
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed mb-4" style={{ fontFamily: "'Bitter', serif" }}>
                  At MusiNest, my vision is for every lesson to be warm and encouraging. Right now, MusiNest is a "one-girl gig": every class, lesson plan, and note of encouragement comes directly from me. This personal connection allows me to understand each student's strengths and guide them at their own pace, striking the perfect balance between structure and creativity.
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  I want MusiNest to be a space where students feel free to experiment, explore, and make music on their own terms, building strong technical foundations and expressing themselves.
                </p>
              </div>

              {/* My Mission */}
              <div>
                <h3 className="text-3xl md:text-4xl font-bold text-black mb-4" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  My Mission
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  My mission with MusiNest is to make music learning personal, enjoyable, and deeply rewarding. I strive for every student—curious beginner or aspiring performer—to feel empowered, inspired, and confident.
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed mt-4" style={{ fontFamily: "'Bitter', serif" }}>
                  Through patient guidance, interactive lessons, and a balance of discipline and creativity, I help build strong technical skills, encourage self-expression, and foster a safe space where mistakes are part of the journey, not something to fear.
                </p>
              </div>

              {/* Mission Statement */}
              <div className="bg-[#F5E6E0] rounded-2xl p-8 md:p-10 border border-[#F5E6E0]">
                <h3 className="text-2xl md:text-3xl font-bold text-black mb-4 text-center" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Mission Statement
                </h3>
                <p className="text-xl text-black font-bold text-center italic leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  "To make music learning personal, joyful, and confidence-building for every student."
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
                    "At MusiNest, we believe in creating a warm, encouraging space where mistakes are part of the journey. My mission is to make music learning personal, joyful, and confidence-building for every student."
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
              <div>
                <h3 className="text-xs md:text-sm font-sans uppercase tracking-widest text-black/70 mb-4" style={{ fontFamily: "'Satisfy', cursive" }}>
                  FINDING INSPIRATION FROM
                </h3>
                <p className="text-lg text-black/80 font-medium leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  Slow mornings, time in the countryside, good skincare, Spotify, local cafe's and really great hats.
                </p>
              </div>

              {/* Qualifications Section */}
              <div className="mt-12 space-y-6">
                <h3 className="text-2xl md:text-3xl font-bold text-black mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Qualifications & Expertise
                </h3>
                <div className="space-y-4">
                  <div className="bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                    <div className="text-3xl mb-3">🎹</div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>ABRSM Grade 8 Piano</h4>
                    <p className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Highest level certification in piano performance (Completed 2023)</p>
                  </div>
                  <div className="bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                    <div className="text-3xl mb-3">🎤</div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Indian Classical Vocal</h4>
                    <p className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Trained in traditional ragas and compositions (Completed 2021)</p>
                  </div>
                  <div className="bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                    <div className="text-3xl mb-3">📝</div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Composition Course</h4>
                    <p className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>21-day intensive at KM Music Conservatory, Chennai (2022)</p>
                  </div>
                  <div className="bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                    <div className="text-3xl mb-3">🎚️</div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Sound Engineering</h4>
                    <p className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>2-week intensive technical course (Completed 2022)</p>
                  </div>
                  <div className="bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                    <div className="text-3xl mb-3">👩‍🏫</div>
                    <h4 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Teaching Experience</h4>
                    <p className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>4+ years of personalized instruction, 50+ students taught</p>
                  </div>
                </div>
              </div>

              {/* At a Glance Table */}
              <div className="mt-12 bg-black rounded-lg p-6 border border-[#F5E6E0]/30">
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  At a Glance
                </h3>
                <div className="space-y-4">
                  <div className="border-b border-[#F5E6E0]/30 pb-4">
                    <div className="text-white/90 font-semibold mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>ABRSM Grade 8</div>
                    <div className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Piano certification</div>
                  </div>
                  <div className="border-b border-[#F5E6E0]/30 pb-4">
                    <div className="text-white/90 font-semibold mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>50+ Students</div>
                    <div className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Taught across various ages</div>
                  </div>
                  <div className="border-b border-[#F5E6E0]/30 pb-4">
                    <div className="text-white/90 font-semibold mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>Indian Classical</div>
                    <div className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Vocal training completed</div>
                  </div>
                  <div className="pb-4">
                    <div className="text-white/90 font-semibold mb-1" style={{ fontFamily: "'Dancing Script', cursive" }}>4+ Years</div>
                    <div className="text-white/80 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Teaching experience</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Music Genres Section */}
        <section className="bg-black py-16 md:py-20 mb-0">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12" style={{ fontFamily: "'Dancing Script', cursive" }}>
              Music Genres & Styles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎼</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Western Classical</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>From Baroque to Romantic periods, structured ABRSM curriculum (Grades 1-8)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Bollywood Piano</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Popular Hindi film songs, focusing on melody, harmony, and rhythm (All Levels)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎵</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Indian Classical Vocal</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Traditional ragas, tala patterns, classical compositions (Beginner to Advanced)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎸</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Rock & Pop</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Contemporary music styles, chord progressions, modern piano techniques (Intermediate to Advanced)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Music Theory</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Harmony, rhythm, notation, and musical structure integrated into learning</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎭</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>Performance Skills</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>Stage presence, confidence building, and audience engagement (Regular concerts)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dark Footer with Founder */}
        <section className="bg-black py-16 md:py-20 relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1/3 opacity-10">
            <div className="h-full w-full bg-gradient-to-r from-[#F5E6E0] to-transparent"></div>
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end">
              <div className="mb-8 md:mb-0">
                {/* Optional decorative element */}
              </div>
              <div className="text-right">
                <p className="text-sm md:text-base font-sans uppercase tracking-widest text-white/70 mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
                  the founder
                </p>
                <h2 className="text-4xl md:text-6xl font-bold text-white" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  ADITI KANDYA
                </h2>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
