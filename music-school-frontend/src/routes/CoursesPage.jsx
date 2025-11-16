import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'

function CourseCard({ course }) {
  const [isHovered, setIsHovered] = useState(false)
  
  return (
    <a 
      key={course._id} 
      href={`/courses/${course._id}`} 
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-sky-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden rounded-xl mb-4">
        <img 
          src={course.image || course.thumbnailPath || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'} 
          alt={course.title} 
          className="h-48 w-full object-cover group-hover:scale-105 transition-transform duration-300" 
        />
        <div className="absolute top-3 right-3 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-medium">
          {course.level || 'All Levels'}
        </div>
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur text-slate-700 px-2 py-1 rounded-full text-xs font-medium">
          {course.price === 0 ? 'Free' : `₹${course.price}`}
        </div>
      </div>
      
      <div className="space-y-3">
        <h3 className="font-bold text-xl text-slate-800 group-hover:text-sky-700 transition-colors">
          {course.title}
        </h3>
        <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
          {course.description || 'Learn this amazing instrument with our expert instructors. Perfect for beginners and intermediate players.'}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <div className="flex text-yellow-400 text-sm">
              {'★'.repeat(5)}
            </div>
            <span className="text-xs text-slate-500">(4.8)</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>📚</span>
            <span>{course.modules?.length || course.chapters?.length || 8} Lessons</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4 text-sm text-slate-600">
            <span className="flex items-center">
              <span className="mr-1">👥</span>
              {Math.floor(Math.random() * 200) + 50} students
            </span>
            <span className="flex items-center">
              <span className="mr-1">⏱️</span>
              {Math.floor(Math.random() * 20) + 10} hours
            </span>
          </div>
          <span className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium group-hover:from-sky-700 group-hover:to-blue-700 transition-all duration-300">
            View Details
          </span>
        </div>
      </div>
    </a>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
        active 
          ? 'bg-sky-600 text-white shadow-md' 
          : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-700'
      }`}
    >
      {children}
    </button>
  )
}

export default function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [filteredCourses, setFilteredCourses] = useState([])
  const [activeFilter, setActiveFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        const data = await apiGet('/courses')
        setCourses(data)
        setFilteredCourses(data)
      } catch (error) {
        console.error('Failed to load courses:', error)
        // Fallback demo courses
        const demoCourses = [
          {
            _id: 'demo1',
            title: 'Guitar Basics',
            description: 'Master the fundamentals of guitar playing. Learn chords, strumming patterns, and basic songs.',
            price: 2999,
            level: 'Beginner',
            image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          },
          {
            _id: 'demo2',
            title: 'Piano Pro',
            description: 'Advanced piano techniques, scales, arpeggios, and performance tips for intermediate players.',
            price: 3499,
            level: 'Intermediate',
            image: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop'
          },
          {
            _id: 'demo3',
            title: 'Vocal Coaching',
            description: 'Develop your singing voice with breathing techniques, pitch control, and performance confidence.',
            price: 2799,
            level: 'All Levels',
            image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop'
          },
          {
            _id: 'demo4',
            title: 'Drum Mastery',
            description: 'Learn rhythm patterns, fills, and advanced drumming techniques for all skill levels.',
            price: 3299,
            level: 'Intermediate',
            image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=600&auto=format&fit=crop'
          },
          {
            _id: 'demo5',
            title: 'Violin Fundamentals',
            description: 'Classical violin techniques, bowing, fingering, and beautiful melodies for beginners.',
            price: 3799,
            level: 'Beginner',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&auto=format&fit=crop'
          },
          {
            _id: 'demo6',
            title: 'Saxophone Jazz',
            description: 'Jazz saxophone techniques, improvisation, and classic jazz standards.',
            price: 3999,
            level: 'Advanced',
            image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=600&auto=format&fit=crop'
          }
        ]
        setCourses(demoCourses)
        setFilteredCourses(demoCourses)
      } finally {
        setLoading(false)
      }
    }
    
    loadCourses()
  }, [])

  const handleFilter = (filter) => {
    setActiveFilter(filter)
    if (filter === 'all') {
      setFilteredCourses(courses)
    } else {
      setFilteredCourses(courses.filter(course => 
        course.level?.toLowerCase() === filter.toLowerCase()
      ))
    }
  }

  const filters = [
    { key: 'all', label: 'All Courses' },
    { key: 'beginner', label: 'Beginner' },
    { key: 'intermediate', label: 'Intermediate' },
    { key: 'advanced', label: 'Advanced' },
    { key: 'all levels', label: 'All Levels' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎶</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
                <div className="text-xs text-slate-500">Music Academy</div>
              </div>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            <a href="/" className="hover:text-sky-700 font-medium transition-colors">Home</a>
            <a href="/courses" className="hover:text-sky-700 font-medium transition-colors text-sky-600">Courses</a>
            <a href="/teachers" className="hover:text-sky-700 font-medium transition-colors">Teachers</a>
            <a href="/schedule" className="hover:text-sky-700 font-medium transition-colors">Schedule</a>
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
        <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
              <span className="mr-2">🎵</span>
              {courses.length} Courses Available
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-slate-900 mb-6">
              Explore Our 
              <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"> Music Courses</span>
            </h1>
            <p className="text-xl text-slate-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover your musical passion with our comprehensive courses designed for all skill levels. 
              Learn from expert instructors and join our community of music lovers.
            </p>
          </div>

          {/* Filter Section */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {filters.map((filter) => (
              <FilterButton
                key={filter.key}
                active={activeFilter === filter.key}
                onClick={() => handleFilter(filter.key)}
              >
                {filter.label}
              </FilterButton>
            ))}
          </div>

          {/* Courses Grid */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCourses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          )}

          {filteredCourses.length === 0 && !loading && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses found</h3>
              <p className="text-slate-600 mb-6">Try adjusting your filter or check back later for new courses.</p>
              <button 
                onClick={() => handleFilter('all')}
                className="px-6 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 transition-colors font-medium"
              >
                Show All Courses
              </button>
            </div>
          )}
        </section>

        {/* Call to Action Section */}
        <section className="max-w-6xl mx-auto px-4 mt-20">
          <div className="bg-gradient-to-r from-sky-600 to-blue-600 rounded-3xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Your Musical Journey?</h2>
            <p className="text-xl mb-8 opacity-90">Join thousands of students who have discovered their passion for music with us.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#enroll" className="px-8 py-4 rounded-full bg-white text-sky-600 hover:bg-slate-50 font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                Enroll Now
              </a>
              <a href="/teachers" className="px-8 py-4 rounded-full bg-transparent border-2 border-white text-white hover:bg-white hover:text-sky-600 font-semibold text-lg transition-all duration-300">
                Meet Our Teachers
              </a>
            </div>
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


