import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import { useAuth } from '@clerk/clerk-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function CourseCard({ course, isEnrolled = false }) {
  // Calculate actual metrics from course data
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const totalDurationSec = course.modules?.reduce((acc, m) => 
    acc + (m.lessons?.reduce((a, l) => a + (l.durationSec || 0), 0) || 0), 0) || 0
  const totalHours = Math.round(totalDurationSec / 3600) || Math.round(totalDurationSec / 60 / 60) || 0
  const studentCount = course.studentCount || 0
  const rating = course.rating || 4.8
  const studentDisplay = studentCount > 0 
    ? (studentCount >= 1000 ? `${(studentCount / 1000).toFixed(1)}k+` : `${studentCount}+`)
    : 'New'
  
  // Check if teacher is assigned - check both teacherId and teacherName
  const hasTeacher = (course.teacherId && course.teacherId.trim() !== '') || 
                     (course.teacherName && course.teacherName.trim() !== '' && course.teacherName !== 'Expert Instructor')
  
  return (
    <a 
      key={course._id} 
      href={`/courses/${course._id}`} 
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 border border-white/20 hover:border-[#F5E6E0] relative overflow-hidden"
    >
      <div className="relative overflow-hidden rounded-xl">
        <img 
          src={(() => {
            // Build image URL - handle both full URLs and relative paths
            if (course.image && (course.image.startsWith('http://') || course.image.startsWith('https://'))) {
              return course.image
            }
            if (course.thumbnailPath) {
              // thumbnailPath is stored as /uploads/filename, need to prepend API base URL
              const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
              return `${baseUrl}${course.thumbnailPath}`
            }
            if (course.image) {
              // If image is a relative path, prepend API base URL
              const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
              return course.image.startsWith('/') ? `${baseUrl}${course.image}` : `${baseUrl}/${course.image}`
            }
            return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          })()}
          alt={course.title} 
          className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-500" 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          }}
        />
        <div className="absolute top-3 right-3 bg-black text-[#F5E6E0] px-3 py-1 rounded-full text-xs font-bold z-10">
          {course.level || 'All Levels'}
        </div>
        {!isEnrolled && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-bold shadow-md z-10">
            {course.price === 0 ? 'Free' : `₹${course.price?.toLocaleString() || 0}`}
          </div>
        )}
        {isEnrolled && (
          <div className="absolute bottom-3 right-3 bg-[#F5E6E0] text-gray-700 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 z-10 animate-fade-in shadow-lg">
            <span className="text-sm">✓</span>
            <span>Already Enrolled</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-cinema font-bold text-lg text-gray-700 group-hover:text-gray-700 transition-colors mb-1">
          {course.title}
        </h3>
        {hasTeacher && (
          <p className="text-xs text-gray-700 flex items-center gap-1 mb-2 font-medium">
            <span>👩‍🏫</span>
            <span>{course.teacherName || 'Assigned Teacher'}</span>
            {course.teacherInstrument && (
              <>
                <span className="text-gray-500">•</span>
                <span>{course.teacherInstrument}</span>
              </>
            )}
          </p>
        )}
        <p className="text-gray-700 text-sm line-clamp-2 leading-relaxed mb-3 font-medium">
          {course.description || 'Learn this amazing instrument with our expert instructors. Perfect for beginners and intermediate players.'}
        </p>
        
        <div className="flex items-center justify-between pt-2 border-t border-gray-300">
          <div className="flex items-center space-x-2">
            <div className="flex text-[#F5E6E0] text-sm">
              {'★'.repeat(Math.floor(rating))}
              {rating % 1 >= 0.5 && <span className="text-[#F5E6E0]">½</span>}
            </div>
            <span className="text-xs text-gray-600 font-medium">({rating.toFixed(1)})</span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600 font-medium">
            <span>📚</span>
            <span>{totalLessons || 0} {totalLessons === 1 ? 'Lesson' : 'Lessons'}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center space-x-4 text-sm text-gray-700 font-medium">
            <span className="flex items-center gap-1">
              <span>👥</span>
              <span>{studentDisplay}</span>
            </span>
            {totalHours > 0 && (
              <span className="flex items-center gap-1">
                <span>⏱️</span>
                <span>{totalHours}h</span>
              </span>
            )}
          </div>
          {!isEnrolled ? (
            <span className="px-4 py-1.5 rounded-full bg-black text-[#F5E6E0] text-sm font-bold group-hover:bg-[#F5E6E0] group-hover:text-gray-700 transition-all duration-300">
              View Details →
            </span>
          ) : (
            <span className="px-4 py-1.5 rounded-full bg-[#F5E6E0] text-gray-700 text-sm font-bold group-hover:bg-black group-hover:text-[#F5E6E0] transition-all duration-300 flex items-center gap-1.5">
              <span>✓</span>
              <span>Continue Learning →</span>
            </span>
          )}
        </div>
      </div>
    </a>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
        active 
          ? 'bg-[#F5E6E0] text-gray-700 shadow-md hover:shadow-lg transform hover:scale-105' 
          : 'bg-white text-gray-700 border border-gray-300 hover:border-[#F5E6E0] hover:text-[#F5E6E0]'
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
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true)
        const data = await apiGet('/courses')
        // Ensure we have an array and filter out any invalid courses
        const validCourses = Array.isArray(data) ? data.filter(course => course && course._id) : []
        setCourses(validCourses)
        setFilteredCourses(validCourses)
        
        // Load enrollment status if user is signed in
        if (isSignedIn) {
          try {
            const token = await getToken().catch(() => undefined)
            if (token) {
              const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/me/enrollments`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              if (response.ok) {
                const enrollments = await response.json()
                // The endpoint returns an array of { enrollmentId, course } objects
                const enrolledIds = new Set(
                  Array.isArray(enrollments) 
                    ? enrollments.map(e => {
                        const id = e.course?._id || e.courseId
                        return id ? String(id) : null
                      }).filter(Boolean)
                    : []
                )
                console.log('Enrolled course IDs:', Array.from(enrolledIds))
                setEnrolledCourseIds(enrolledIds)
              }
            }
          } catch (error) {
            console.error('Failed to load enrollments:', error)
          }
        }
      } catch (error) {
        console.error('Failed to load courses:', error)
        // Set empty arrays if API fails - no demo courses
        setCourses([])
        setFilteredCourses([])
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
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#F5E6E0]/20 text-[#F5E6E0] text-sm font-bold mb-6 border border-[#F5E6E0]/30"
              style={{
                fontFamily: "'Dancing Script', cursive"
              }}>
                <span className="mr-2">🎵</span>
                {courses.length} Courses Available
              </div>
              <h1 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4"
              style={{
                fontFamily: "'Dancing Script', cursive"
              }}>
                Explore Our Music Courses
              </h1>
              <div className="w-24 h-1 bg-[#F5E6E0] mx-auto mb-6"></div>
              <p className="text-xl md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily: "'Satisfy', cursive"
              }}>
                Discover your musical passion with our comprehensive courses designed for all skill levels. 
                Learn from expert instructors and join our community of music lovers.
              </p>
            </div>
          </div>
        </section>

        {/* Filter Section */}
        <section className="bg-white py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-3 mb-8">
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
          </div>
        </section>

        {/* Courses Grid Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-black/10 animate-pulse">
                    <div className="h-40 bg-black/10 rounded-xl mb-4"></div>
                    <div className="h-6 bg-black/10 rounded mb-2"></div>
                    <div className="h-4 bg-black/10 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-black/10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => {
                  const courseId = String(course._id)
                  const isEnrolled = enrolledCourseIds.has(courseId) || enrolledCourseIds.has(course._id)
                  if (isEnrolled) {
                    console.log('Course enrolled:', course.title, 'ID:', courseId)
                  }
                  return (
                    <CourseCard 
                      key={course._id} 
                      course={course} 
                      isEnrolled={isEnrolled}
                    />
                  )
                })}
              </div>
            )}

            {filteredCourses.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎵</div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No courses found</h3>
                <p className="text-gray-700 mb-6 font-medium">Try adjusting your filter or check back later for new courses.</p>
                <button 
                  onClick={() => handleFilter('all')}
                  className="px-6 py-3 rounded-full bg-[#F5E6E0] text-gray-700 hover:bg-[#F5E6E0]/80 transition-colors font-bold shadow-lg hover:shadow-xl"
                >
                  Show All Courses
                </button>
              </div>
            )}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}


