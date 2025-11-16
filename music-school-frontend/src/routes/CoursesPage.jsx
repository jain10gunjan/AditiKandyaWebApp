import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import { useAuth } from '@clerk/clerk-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function CourseCard({ course, isEnrolled = false }) {
  const [isHovered, setIsHovered] = useState(false)
  
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
      className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 hover:border-sky-200 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br from-sky-50/0 to-blue-50/0 group-hover:from-sky-50/30 group-hover:to-blue-50/30 transition-all duration-300 pointer-events-none z-0`}></div>
      
      <div className="relative z-10">
        <div className="relative overflow-hidden rounded-xl mb-4">
          <img 
            src={course.image || course.thumbnailPath || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'} 
            alt={course.title} 
            className="h-48 w-full object-cover group-hover:scale-110 transition-transform duration-500" 
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
            }}
          />
          <div className="absolute top-3 right-3 bg-sky-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg group-hover:bg-sky-700 transition-colors z-10">
            {course.level || 'All Levels'}
          </div>
          {/* Hide price badge when enrolled */}
          {!isEnrolled && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-slate-700 px-2 py-1 rounded-full text-xs font-medium shadow-md group-hover:bg-white transition-colors z-10">
              {course.price === 0 ? 'Free' : `₹${course.price?.toLocaleString() || 0}`}
            </div>
          )}
          {isEnrolled && (
            <div className="absolute bottom-3 right-3 bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-medium shadow-lg flex items-center gap-1.5 z-10 animate-fade-in">
              <span className="text-sm">✓</span>
              <span>Already Enrolled</span>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div>
            <h3 className="font-bold text-xl text-slate-800 group-hover:text-sky-700 transition-colors mb-1">
              {course.title}
            </h3>
            {hasTeacher && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <span>👩‍🏫</span>
                <span>{course.teacherName || 'Assigned Teacher'}</span>
                {course.teacherInstrument && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{course.teacherInstrument}</span>
                  </>
                )}
              </p>
            )}
          </div>
          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
            {course.description || 'Learn this amazing instrument with our expert instructors. Perfect for beginners and intermediate players.'}
          </p>
          
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="flex text-yellow-400 text-sm">
                {'★'.repeat(Math.floor(rating))}
                {rating % 1 >= 0.5 && <span className="text-yellow-400">½</span>}
              </div>
              <span className="text-xs text-slate-500">({rating.toFixed(1)})</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>📚</span>
              <span>{totalLessons || 0} {totalLessons === 1 ? 'Lesson' : 'Lessons'}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm text-slate-600">
              <span className="flex items-center gap-1 group-hover:text-sky-600 transition-colors">
                <span>👥</span>
                <span>{studentDisplay} {studentCount === 1 ? 'student' : 'students'}</span>
              </span>
              {totalHours > 0 && (
                <span className="flex items-center gap-1 group-hover:text-sky-600 transition-colors">
                  <span>⏱️</span>
                  <span>{totalHours}h</span>
                </span>
              )}
            </div>
            {!isEnrolled ? (
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium group-hover:from-sky-700 group-hover:to-blue-700 transition-all duration-300 shadow-md group-hover:shadow-lg transform group-hover:scale-105">
                View Details →
              </span>
            ) : (
              <span className="px-4 py-2 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium group-hover:from-green-700 group-hover:to-emerald-700 transition-all duration-300 shadow-md group-hover:shadow-lg transform group-hover:scale-105 flex items-center gap-1.5">
                <span>✓</span>
                <span>Continue Learning →</span>
              </span>
            )}
          </div>
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
          ? 'bg-sky-600 text-white shadow-md hover:shadow-lg transform hover:scale-105' 
          : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50'
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />

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
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 animate-pulse">
                  <div className="h-48 bg-slate-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
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

      </main>

      <Footer />
    </div>
  )
}


