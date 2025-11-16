import { useEffect, useState } from 'react'
import { useUser, useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'

function AdminGuard({ children }) {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
      setChecking(false)
    }
  }, [user, isLoaded])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-6">You don't have permission to access the admin panel.</p>
          <a href="/" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return children
}

function CourseForm({ course, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    level: course?.level || 'Beginner',
    image: course?.image || '',
    thumbnail: null
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value, files } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }))
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">
        {course ? 'Edit Course' : 'Create New Course'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Course Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Guitar Basics for Beginners"
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Price (₹)</label>
            <input
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="2999"
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what students will learn in this course..."
            rows={4}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            required
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Level</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
            <input
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg"
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Course Thumbnail</label>
          <input
            name="thumbnail"
            type="file"
            onChange={handleChange}
            accept="image/*"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <p className="text-sm text-slate-500 mt-1">Upload a thumbnail image for the course</p>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Saving...' : (course ? 'Update Course' : 'Create Course')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

function CourseCard({ course, onEdit, onDelete, onView }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{course.description}</p>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full">{course.level}</span>
            <span className="font-semibold text-slate-800">₹{course.price?.toLocaleString()}</span>
          </div>
        </div>
        {course.image && (
          <img 
            src={course.image} 
            alt={course.title}
            className="w-20 h-20 object-cover rounded-lg ml-4"
          />
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={() => onView(course)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
        >
          View
        </button>
        <button
          onClick={() => onEdit(course)}
          className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
        >
          Edit
        </button>
        <a
          href={`/admin/courses/${course._id}`}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
        >
          Build
        </a>
        <button
          onClick={() => onDelete(course)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCourseForm, setShowCourseForm] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [uploading, setUploading] = useState(false)

  const reload = async () => {
    try {
      setLoading(true)
      const token = await getToken().catch(() => undefined)
      const [c, t] = await Promise.all([apiGet('/courses'), apiGet('/teachers')])
      setCourses(c)
      setTeachers(t)
      
      if (token) {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments`, { 
          headers: { Authorization: `Bearer ${token}` } 
        })
        if (res.ok) setEnrollments(await res.json())
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [])

  const handleSaveCourse = async (formData) => {
    try {
      setUploading(true)
      const token = await getToken()
      
      let courseData
      if (editingCourse) {
        courseData = await apiPut(`/courses/${editingCourse._id}`, {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          level: formData.level,
          image: formData.image
        }, token)
      } else {
        courseData = await apiPost('/courses', {
          title: formData.title,
          description: formData.description,
          price: Number(formData.price),
          level: formData.level,
          image: formData.image
        }, token)
      }

      // Upload thumbnail if provided
      if (formData.thumbnail) {
        const uploadForm = new FormData()
        uploadForm.append('file', formData.thumbnail)
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${courseData._id}/thumbnail`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        })
      }

      setShowCourseForm(false)
      setEditingCourse(null)
      reload()
    } catch (error) {
      console.error('Failed to save course:', error)
      alert('Failed to save course. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleEditCourse = (course) => {
    setEditingCourse(course)
    setShowCourseForm(true)
  }

  const handleDeleteCourse = async (course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"?`)) return
    
    try {
      const token = await getToken()
      await apiDelete(`/courses/${course._id}`, token)
      reload()
    } catch (error) {
      console.error('Failed to delete course:', error)
      alert('Failed to delete course. Please try again.')
    }
  }

  const handleViewCourse = (course) => {
    window.open(`/courses/${course._id}`, '_blank')
  }

  const handleApproveEnrollment = async (enrollmentId) => {
    try {
      const token = await getToken()
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments/${enrollmentId}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
      reload()
    } catch (error) {
      console.error('Failed to approve enrollment:', error)
      alert('Failed to approve enrollment. Please try again.')
    }
  }

  return (
    <AdminGuard>
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
                  <div className="text-xs text-slate-500">Admin Panel</div>
                </div>
              </a>
            </div>
            <div className="hidden md:flex items-center gap-6 text-slate-700">
              <a href="/" className="hover:text-sky-700 font-medium transition-colors">Home</a>
              <a href="/courses" className="hover:text-sky-700 font-medium transition-colors">Courses</a>
              <a href="/dashboard" className="hover:text-sky-700 font-medium transition-colors">Dashboard</a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </header>

        <main className="pb-16">
          <div className="max-w-6xl mx-auto px-4 pt-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Welcome back, {user?.firstName || 'Admin'}! 👋
              </h1>
              <p className="text-slate-600">Manage your music academy with ease</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <StatsCard title="Total Courses" value={courses.length} icon="📚" color="bg-blue-100" />
              <StatsCard title="Active Teachers" value={teachers.length} icon="👩‍🏫" color="bg-green-100" />
              <StatsCard title="Pending Enrollments" value={enrollments.filter(e => !e.approved).length} icon="⏳" color="bg-yellow-100" />
              <StatsCard title="Total Students" value={enrollments.filter(e => e.approved).length} icon="👥" color="bg-purple-100" />
            </div>

            {/* Course Management */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                <button
                  onClick={() => setShowCourseForm(true)}
                  className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                >
                  + Create New Course
                </button>
              </div>

              {showCourseForm && (
                <div className="mb-8">
                  <CourseForm
                    course={editingCourse}
                    onSave={handleSaveCourse}
                    onCancel={() => {
                      setShowCourseForm(false)
                      setEditingCourse(null)
                    }}
                    loading={uploading}
                  />
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <CourseCard
                      key={course._id}
                      course={course}
                      onEdit={handleEditCourse}
                      onDelete={handleDeleteCourse}
                      onView={handleViewCourse}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Enrollment Management */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Enrollment Management</h2>
              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                {enrollments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>No enrollments yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {enrollments.map((enrollment) => (
                      <div key={enrollment._id} className="p-6 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-slate-800">
                                {enrollment.name || 'Anonymous User'}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                enrollment.approved 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {enrollment.approved ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-sm text-slate-600 space-y-1">
                              <p>Email: {enrollment.email || 'Not provided'}</p>
                              <p>Course: {courses.find(c => c._id === enrollment.courseId)?.title || enrollment.courseId}</p>
                              <p>Instrument: {enrollment.instrument || 'Not specified'}</p>
                              <p>Enrolled: {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          {!enrollment.approved && (
                            <button
                              onClick={() => handleApproveEnrollment(enrollment._id)}
                              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Actions</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <a href="/admin/attendance" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📊</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Attendance</h3>
                  <p className="text-sm text-slate-600">Mark and manage student attendance</p>
                </a>
                <a href="/admin/calendar" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📅</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Schedule</h3>
                  <p className="text-sm text-slate-600">Create and manage class schedules</p>
                </a>
                <a href="/admin/resources" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📚</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Resources</h3>
                  <p className="text-sm text-slate-600">Upload and manage course resources</p>
                </a>
                <a href="/admin/courses/new" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200 group">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">➕</div>
                  <h3 className="font-semibold text-slate-900 mb-2">Course Builder</h3>
                  <p className="text-sm text-slate-600">Build detailed course content</p>
                </a>
              <a href="/admin/enrollment-leads" className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-200 group">
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📝</div>
                <h3 className="font-semibold text-slate-900 mb-2">New Enrollment Leads</h3>
                <p className="text-sm text-slate-600">View recently submitted leads</p>
              </a>
              </div>
            </div>
          </div>
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
                <h3 className="font-semibold text-slate-800 mb-4">Admin Tools</h3>
                <ul className="space-y-2 text-sm text-slate-600">
                  <li><a href="/admin" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
                  <li><a href="/admin/attendance" className="hover:text-sky-700 transition-colors">Attendance</a></li>
                  <li><a href="/admin/calendar" className="hover:text-sky-700 transition-colors">Calendar</a></li>
                  <li><a href="/admin/resources" className="hover:text-sky-700 transition-colors">Resources</a></li>
                  <li><a href="/admin/enrollment-leads" className="hover:text-sky-700 transition-colors">New Enrollment Leads</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm">
              © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
            </div>
          </div>
        </footer>
      </div>
    </AdminGuard>
  )
}