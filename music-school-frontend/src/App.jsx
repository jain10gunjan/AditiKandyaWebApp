import './App.css'
import { apiGet, apiPost } from './lib/api.js'
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react'
import { useEffect, useState } from 'react'

function SectionTitle({ emoji, title, subtitle }) {
  return (
    <div className="max-w-5xl mx-auto text-center mb-8">
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-sky-600">
        <span className="mr-2">{emoji}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 mt-2">{subtitle}</p>
      )}
    </div>
  )
}

function CourseCard({ title, level, price, image, _id }) {
  return (
    <a href={`/courses/${_id}`} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-slate-100 hover:border-sky-200">
      <div className="relative overflow-hidden rounded-xl">
        <img src={image} alt={title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 right-3 bg-sky-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          {level}
        </div>
      </div>
      <div className="mt-3">
        <h3 className="font-bold text-lg text-slate-800 group-hover:text-sky-700 transition-colors">{title}</h3>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sky-600 font-semibold text-lg">₹{price}</span>
          <span className="px-3 py-1.5 rounded-full bg-sky-600 text-white text-sm group-hover:bg-sky-700 transition-colors">
            View Details
          </span>
        </div>
      </div>
    </a>
  )
}

function TeacherCard({ name, instrument, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 text-center group">
      <div className="relative inline-block">
        <img src={avatar} alt={name} className="h-20 w-20 rounded-full object-cover mx-auto group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      <h3 className="mt-4 font-bold text-slate-800">{name}</h3>
      <p className="text-sm text-slate-600">{instrument} Expert</p>
      <div className="mt-2 flex justify-center">
        <div className="flex text-yellow-400">
          {'★'.repeat(5)}
        </div>
      </div>
    </div>
  )
}

function StatCard({ number, label, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center border border-slate-100">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-2">{number}</div>
      <div className="text-slate-600">{label}</div>
    </div>
  )
}

function TestimonialCard({ name, role, content, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-100">
      <div className="flex items-center mb-4">
        <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
        <div className="ml-3">
          <div className="font-semibold text-slate-800">{name}</div>
          <div className="text-sm text-slate-600">{role}</div>
        </div>
      </div>
      <p className="text-slate-700 italic">"{content}"</p>
      <div className="mt-3 flex text-yellow-400">
        {'★'.repeat(5)}
      </div>
    </div>
  )
}

function EnrollForm() {
	const handleSubmit = async (e) => {
		e.preventDefault()
		const form = new FormData(e.currentTarget)
		const payload = {
			fullName: form.get('fullName'),
			email: form.get('email'),
			whatsapp: form.get('whatsapp'),
			country: form.get('country'),
		}
		await apiPost('/leads', payload)
		alert('Thanks! We\'ll contact you soon.')
		e.currentTarget.reset()
	}
	return (
		<form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 grid md:grid-cols-2 gap-6 border border-slate-100">
			<div className="md:col-span-2 text-center mb-4">
				<h3 className="text-xl font-bold text-slate-800">Start Your Musical Journey</h3>
				<p className="text-slate-600 mt-2">Join hundreds of students learning music with us</p>
			</div>
			<input name="fullName" placeholder="Full Name" className="border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" required />
			<input name="email" type="email" placeholder="Email Address" className="border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" required />
			<input name="whatsapp" placeholder="WhatsApp Number" className="border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" />
			<input name="country" placeholder="Country" className="border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all" />
			<button type="submit" className="md:col-span-2 px-6 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold hover:from-sky-700 hover:to-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl">
				Submit Enrollment Request
			</button>
		</form>
	)
}

function App() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])

  useEffect(() => {
    // Load courses and teachers from API
    apiGet('/courses').then(setCourses).catch(() => setCourses([]))
    apiGet('/teachers').then(setTeachers).catch(() => setTeachers([]))
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎶</span>
            </div>
            <div>
              <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
              <div className="text-xs text-slate-500">Music Academy</div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            <a href="/courses" className="hover:text-sky-700 font-medium transition-colors">Courses</a>
            <a href="/teachers" className="hover:text-sky-700 font-medium transition-colors">Teachers</a>
            <a href="/schedule" className="hover:text-sky-700 font-medium transition-colors">Schedule</a>
            <a href="#enroll" className="hover:text-sky-700 font-medium transition-colors">Enroll</a>
            <a href="/dashboard" className="hover:text-sky-700 font-medium transition-colors">Dashboard</a>
            <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">Admin</a>
            <SignedOut>
              <SignInButton>
                <button className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium hover:from-sky-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="pb-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
                <span className="mr-2">🎵</span>
                Trusted by 500+ Students
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-900 mb-6">
                Learn, Play, and 
                <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"> Shine</span>
              </h1>
              <p className="text-xl text-slate-700 mb-8 leading-relaxed">
                Fun and modern music lessons for ages 9–22. Master Guitar 🎸, Piano 🎹, Vocals 🎤 and more with our expert instructors!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href="#enroll" className="px-8 py-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center">
                  Start Learning Today
                </a>
                <a href="#courses" className="px-8 py-4 rounded-full bg-white border-2 border-slate-200 hover:border-sky-300 font-semibold text-slate-800 text-lg transition-all duration-300 text-center">
                  Browse Courses
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎸</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎹</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎤</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🥁</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎻</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎷</div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto px-4 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard number="500+" label="Happy Students" icon="👥" color="bg-blue-100" />
            <StatCard number="15+" label="Expert Teachers" icon="👩‍🏫" color="bg-green-100" />
            <StatCard number="6" label="Instruments" icon="🎵" color="bg-purple-100" />
            <StatCard number="95%" label="Success Rate" icon="⭐" color="bg-yellow-100" />
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="🎵" title="Featured Courses" subtitle="Choose your instrument and start your musical journey" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.length > 0 ? (
              courses.slice(0, 6).map((course) => (
                <CourseCard 
                  key={course._id}
                  title={course.title} 
                  level={course.level} 
                  price={course.price} 
                  image={course.image || course.thumbnailPath}
                  _id={course._id}
                />
              ))
            ) : (
              <>
                <CourseCard title="Guitar Basics" level="Beginner" price={2999} image="https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop" _id="demo1" />
                <CourseCard title="Piano Pro" level="Intermediate" price={3499} image="https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop" _id="demo2" />
                <CourseCard title="Vocal Coaching" level="All Levels" price={2799} image="https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop" _id="demo3" />
              </>
            )}
          </div>
          <div className="text-center mt-8">
            <a href="/courses" className="inline-flex items-center px-6 py-3 rounded-full bg-white border-2 border-sky-200 text-sky-700 font-semibold hover:border-sky-300 hover:bg-sky-50 transition-all duration-300">
              View All Courses
              <span className="ml-2">→</span>
            </a>
          </div>
        </section>

        {/* Teachers Section */}
        <section id="teachers" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="👩‍🏫" title="Meet Our Expert Teachers" subtitle="Learn from the best musicians and educators" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.length > 0 ? (
              teachers.map((teacher) => (
                <TeacherCard 
                  key={teacher._id}
                  name={teacher.name} 
                  instrument={teacher.instrument} 
                  avatar={teacher.avatar} 
                />
              ))
            ) : (
              <>
                <TeacherCard name="Aarav" instrument="Guitar" avatar="https://i.pravatar.cc/150?img=12" />
                <TeacherCard name="Maya" instrument="Piano" avatar="https://i.pravatar.cc/150?img=32" />
                <TeacherCard name="Kabir" instrument="Vocals" avatar="https://i.pravatar.cc/150?img=22" />
              </>
            )}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="💬" title="What Our Students Say" subtitle="Real feedback from our music community" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard 
              name="Priya Sharma" 
              role="Guitar Student" 
              content="The guitar lessons here are amazing! My instructor Aarav is patient and makes learning so much fun. I've improved so much in just 3 months!"
              avatar="https://i.pravatar.cc/150?img=1"
            />
            <TestimonialCard 
              name="Arjun Patel" 
              role="Piano Student" 
              content="Maya's piano teaching style is incredible. She breaks down complex pieces into easy steps. Highly recommended for anyone wanting to learn piano!"
              avatar="https://i.pravatar.cc/150?img=2"
            />
            <TestimonialCard 
              name="Sneha Reddy" 
              role="Vocal Student" 
              content="Kabir's vocal coaching helped me discover my voice. The techniques I learned here have boosted my confidence tremendously!"
              avatar="https://i.pravatar.cc/150?img=3"
            />
          </div>
        </section>

        {/* Schedule Section */}
        <section id="schedule" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📅" title="Class Schedule" subtitle="Flexible timings for after-school and weekend learning" />
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-sky-50">
                <div className="text-2xl mb-2">🎸</div>
                <div className="font-semibold text-slate-800">Guitar</div>
                <div className="text-sm text-slate-600 mt-1">Mon & Wed</div>
                <div className="text-sm text-slate-600">5:00 PM - 6:30 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <div className="text-2xl mb-2">🎹</div>
                <div className="font-semibold text-slate-800">Piano</div>
                <div className="text-sm text-slate-600 mt-1">Tue & Thu</div>
                <div className="text-sm text-slate-600">5:00 PM - 6:30 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50">
                <div className="text-2xl mb-2">🎤</div>
                <div className="font-semibold text-slate-800">Vocals</div>
                <div className="text-sm text-slate-600 mt-1">Saturday</div>
                <div className="text-sm text-slate-600">10:00 AM - 12:00 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-orange-50">
                <div className="text-2xl mb-2">🥁</div>
                <div className="font-semibold text-slate-800">Drums</div>
                <div className="text-sm text-slate-600 mt-1">Sunday</div>
                <div className="text-sm text-slate-600">11:00 AM - 1:00 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* Enrollment Section */}
        <section id="enroll" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📝" title="Ready to Start?" subtitle="Join our music family today" />
          <div className="max-w-4xl mx-auto">
            <EnrollForm />
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📸" title="Gallery" subtitle="Moments from our classes and performances" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <img
                  className="h-full w-full object-cover"
                  src={`https://picsum.photos/seed/music-${i}/400/400`}
                  alt="gallery"
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t mt-20 bg-gradient-to-r from-slate-50 to-sky-50">
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎶</span>
                </div>
                <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
              </div>
              <p className="text-slate-600 text-sm">Making music education accessible and fun for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="/courses" className="hover:text-sky-700 transition-colors">Courses</a></li>
                <li><a href="/teachers" className="hover:text-sky-700 transition-colors">Teachers</a></li>
                <li><a href="/schedule" className="hover:text-sky-700 transition-colors">Schedule</a></li>
                <li><a href="/dashboard" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>📧 support@themusinest.com</li>
                <li>📞 +91-98765-43210</li>
                <li>📍 Mumbai, India</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">f</span>
                </div>
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">📷</span>
                </div>
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">📺</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

