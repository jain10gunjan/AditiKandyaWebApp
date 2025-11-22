import { useEffect } from 'react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AboutPage() {
  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="pb-20 md:pb-16">
        {/* Hero Section */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4">
                About MusiNest
              </h1>
              <div className="w-24 h-1 bg-[#FFD700] mx-auto mb-6"></div>
              <p className="text-xl md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed">
                Bridging the gap between Western classical piano and Indian classical vocal traditions, MusiNest creates a unique musical journey for every student.
              </p>
            </div>
          </div>
        </section>

        {/* At a Glance Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-black text-center mb-12">
              At a Glance
            </h2>
            <div className="bg-black rounded-2xl shadow-2xl p-8 md:p-12 border border-[#FFD700]/30 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#FFD700]/30">
                    <th className="text-white font-bold text-lg pb-4 pr-8">Achievement/Experience</th>
                    <th className="text-white font-bold text-lg pb-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#FFD700]/20">
                  <tr>
                    <td className="text-white/90 font-semibold py-4 pr-8">ABRSM Grade 8</td>
                    <td className="text-white/80 font-medium py-4">Piano certification</td>
                  </tr>
                  <tr>
                    <td className="text-white/90 font-semibold py-4 pr-8">50+ Students</td>
                    <td className="text-white/80 font-medium py-4">Taught across various ages</td>
                  </tr>
                  <tr>
                    <td className="text-white/90 font-semibold py-4 pr-8">Indian Classical</td>
                    <td className="text-white/80 font-medium py-4">Vocal training completed</td>
                  </tr>
                  <tr>
                    <td className="text-white/90 font-semibold py-4 pr-8">4+ Years</td>
                    <td className="text-white/80 font-medium py-4">Teaching experience</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Qualifications & Expertise Section */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white text-center mb-12">
              My Qualifications & Expertise
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎹</div>
                <h3 className="text-xl font-bold text-black mb-2">ABRSM Grade 8 Piano</h3>
                <p className="text-black/70 font-medium">Highest level certification in piano performance (Completed 2023)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎤</div>
                <h3 className="text-xl font-bold text-black mb-2">Indian Classical Vocal</h3>
                <p className="text-black/70 font-medium">Trained in traditional ragas and compositions (Completed 2021)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="text-xl font-bold text-black mb-2">Composition Course</h3>
                <p className="text-black/70 font-medium">21-day intensive at KM Music Conservatory, Chennai (2022)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎚️</div>
                <h3 className="text-xl font-bold text-black mb-2">Sound Engineering</h3>
                <p className="text-black/70 font-medium">2-week intensive technical course (Completed 2022)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">👩‍🏫</div>
                <h3 className="text-xl font-bold text-black mb-2">Teaching Experience</h3>
                <p className="text-black/70 font-medium">4+ years of personalized instruction, 50+ students taught</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">❤️</div>
                <h3 className="text-xl font-bold text-black mb-2">Passion for Music</h3>
                <p className="text-black/70 font-medium">Dedicated to nurturing musical talent, lifelong commitment</p>
              </div>
            </div>
          </div>
        </section>

        {/* Music Genres & Styles Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-black text-center mb-12">
              Music Genres & Styles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">🎼</div>
                <h3 className="text-xl font-bold text-white mb-2">Western Classical</h3>
                <p className="text-white/80 font-medium text-sm">From Baroque to Romantic periods, structured ABRSM curriculum (Grades 1-8)</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-xl font-bold text-white mb-2">Bollywood Piano</h3>
                <p className="text-white/80 font-medium text-sm">Popular Hindi film songs, focusing on melody, harmony, and rhythm (All Levels)</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">🎵</div>
                <h3 className="text-xl font-bold text-white mb-2">Indian Classical Vocal</h3>
                <p className="text-white/80 font-medium text-sm">Traditional ragas, tala patterns, classical compositions (Beginner to Advanced)</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">🎸</div>
                <h3 className="text-xl font-bold text-white mb-2">Rock & Pop</h3>
                <p className="text-white/80 font-medium text-sm">Contemporary music styles, chord progressions, modern piano techniques (Intermediate to Advanced)</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">Music Theory</h3>
                <p className="text-white/80 font-medium text-sm">Harmony, rhythm, notation, and musical structure integrated into learning</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-6 border border-[#FFD700]/30">
                <div className="text-3xl mb-3">🎭</div>
                <h3 className="text-xl font-bold text-white mb-2">Performance Skills</h3>
                <p className="text-white/80 font-medium text-sm">Stage presence, confidence building, and audience engagement (Regular concerts)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white text-center mb-12">
              Story - Timeline - Values
            </h2>

            {/* The Beginning */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 mb-8">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-4">
                The Beginning
              </h3>
              <p className="text-lg text-black/80 font-medium leading-relaxed">
                My musical journey began with a deep fascination for the piano and its beautiful sounds. What started as curiosity for Western classical music evolved into a lifelong passion — until a turning point came with Indian classical vocal music. The realization that music transcends boundaries inspired the birth of MusiNest by Aditi.
              </p>
            </div>

            {/* The Vision */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 mb-8">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-4">
                The Vision
              </h3>
              <p className="text-lg text-black/80 font-medium leading-relaxed">
                Today, MusiNest is more than music education — it's a nurturing space where every student feels seen, heard, and supported in their unique musical journey. Here, traditional techniques meet creative expression, and everyone becomes part of a family dedicated to building strong foundations, exploring diverse styles, and discovering their authentic voice.
              </p>
            </div>

            {/* My Vision for MusiNest */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 mb-8">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-4">
                My Vision for MusiNest
              </h3>
              <p className="text-lg text-black/80 font-medium leading-relaxed mb-4">
                At MusiNest, my vision is for every lesson to be warm and encouraging. Right now, MusiNest is a "one-girl gig": every class, lesson plan, and note of encouragement comes directly from me. This personal connection allows me to understand each student's strengths and guide them at their own pace, striking the perfect balance between structure and creativity.
              </p>
              <p className="text-lg text-black/80 font-medium leading-relaxed">
                I want MusiNest to be a space where students feel free to experiment, explore, and make music on their own terms, building strong technical foundations and expressing themselves.
              </p>
            </div>

            {/* My Mission */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20 mb-8">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-4">
                My Mission
              </h3>
              <p className="text-lg text-black/80 font-medium leading-relaxed">
                My mission with MusiNest is to make music learning personal, enjoyable, and deeply rewarding. I strive for every student—curious beginner or aspiring performer—to feel empowered, inspired, and confident.
              </p>
              <p className="text-lg text-black/80 font-medium leading-relaxed mt-4">
                Through patient guidance, interactive lessons, and a balance of discipline and creativity, I help build strong technical skills, encourage self-expression, and foster a safe space where mistakes are part of the journey, not something to fear.
              </p>
            </div>

            {/* Mission Statement */}
            <div className="bg-[#FFD700] rounded-2xl shadow-2xl p-8 md:p-12 border border-[#FFD700] mb-8">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-4 text-center">
                Mission Statement
              </h3>
              <p className="text-xl text-black font-bold text-center italic leading-relaxed">
                "To make music learning personal, joyful, and confidence-building for every student."
              </p>
            </div>

            {/* Teaching Philosophy */}
            <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 border border-white/20">
              <h3 className="text-2xl md:text-3xl font-cinema font-bold text-black mb-6">
                Teaching Philosophy
              </h3>
              <div className="space-y-4">
                <p className="text-lg text-black/80 font-medium leading-relaxed">
                  "Music is not just about technical proficiency—it's about emotional expression, cultural connection, and personal growth. My teaching approach combines rigorous ABRSM training with creative exploration of diverse musical styles."
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed">
                  "Every student brings a unique perspective and set of experiences. My role is to help them discover their authentic voice while building strong foundations in both Western classical and Indian classical traditions."
                </p>
                <p className="text-lg text-black/80 font-medium leading-relaxed">
                  "At MusiNest, we believe in creating a warm, encouraging space where mistakes are part of the journey. My mission is to make music learning personal, joyful, and confidence-building for every student."
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

