import { useEffect, useState, useRef } from 'react'
import { useUser, useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

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

function CourseForm({ course, onSave, onCancel, loading, teachers = [] }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    level: course?.level || 'Beginner',
    image: course?.image || '',
    thumbnail: null,
    teacherId: course?.teacherId || ''
  })

  useEffect(() => {
    if (course) {
      setFormData(prev => ({
        ...prev,
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        level: course.level || 'Beginner',
        image: course.image || '',
        teacherId: course.teacherId || ''
      }))
    }
  }, [course])

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
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Assign Teacher <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            >
              <option value="">-- Select a teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} - {teacher.instrument}
                </option>
              ))}
            </select>
            {formData.teacherId && (() => {
              const selectedTeacher = teachers.find(t => t._id === formData.teacherId)
              return selectedTeacher ? (
                <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3 animate-fade-in hover:bg-green-100 transition-colors">
                  {selectedTeacher.avatar ? (
                    <img 
                      src={selectedTeacher.avatar} 
                      alt={selectedTeacher.name}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-green-300"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center ring-2 ring-green-300">
                      👩‍🏫
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{selectedTeacher.name}</p>
                    <p className="text-xs text-slate-600">🎵 {selectedTeacher.instrument}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, teacherId: '' }))}
                    className="p-1 hover:bg-green-200 rounded-full transition-colors"
                    title="Remove teacher assignment"
                  >
                    <span className="text-red-500 text-sm">✕</span>
                  </button>
                </div>
              ) : null
            })()}
            {teachers.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">
                No teachers available. <span className="text-green-600 font-medium">Add a teacher from Quick Actions → Manage Teachers</span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
          <input
            name="image"
            value={formData.image}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
          />
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

function CourseCard({ course, onEdit, onDelete, onView, teachers = [] }) {
  const assignedTeacher = course.teacherId ? teachers.find(t => t._id === course.teacherId) : null
  
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 hover:border-sky-300 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-slate-800 mb-2">{course.title}</h3>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3">{course.description}</p>
          <div className="flex items-center space-x-4 text-sm text-slate-500 mb-2">
            <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full">{course.level}</span>
            <span className="font-semibold text-slate-800">₹{course.price?.toLocaleString()}</span>
          </div>
          {assignedTeacher && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
              {assignedTeacher.avatar ? (
                <img 
                  src={assignedTeacher.avatar} 
                  alt={assignedTeacher.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <span>👩‍🏫</span>
              )}
              <span className="font-medium">{assignedTeacher.name}</span>
              <span className="text-slate-400">•</span>
              <span>{assignedTeacher.instrument}</span>
            </div>
          )}
        </div>
        {course.image && (
          <img 
            src={course.image} 
            alt={course.title}
            className="w-20 h-20 object-cover rounded-lg ml-4"
          />
        )}
      </div>
      
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onView(course)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          View
        </button>
        <button
          onClick={() => onEdit(course)}
          className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          Edit
        </button>
        <a
          href={`/admin/courses/${course._id}`}
          className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all shadow-sm hover:shadow-md active:scale-95 text-center"
        >
          Build
        </a>
        <button
          onClick={() => onDelete(course)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function StatsCard({ title, value, icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-6 border border-slate-200 hover:border-sky-300 hover:shadow-lg transition-all duration-300 w-full text-left group cursor-pointer active:scale-95"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900 group-hover:text-sky-700 transition-colors">{value}</p>
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className="mt-3 flex items-center text-xs text-slate-500 group-hover:text-sky-600 transition-colors">
        <span>Click to view details</span>
        <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
      </div>
    </button>
  )
}

// Metric Detail Modals
function MetricModal({ isOpen, onClose, title, icon, children }) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose()
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  if (!isOpen) return null

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl border border-slate-200 transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{icon}</span>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 rounded-lg hover:bg-slate-200 transition-colors"
            title="Close (ESC)"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

function CoursesDetailModal({ isOpen, onClose, courses, onView, onEdit, onDelete }) {
  return (
    <MetricModal isOpen={isOpen} onClose={onClose} title="All Courses" icon="📚">
      {courses.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-slate-600">No courses available</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div key={course._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{course.title}</h3>
                    <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                      {course.level}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-3 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="font-semibold text-slate-800">₹{course.price?.toLocaleString() || 0}</span>
                    <span className="text-slate-500">{course.modules?.length || 0} modules</span>
                    <span className="text-slate-500">
                      {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} lessons
                    </span>
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
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => onView(course)}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-all active:scale-95"
                >
                  View
                </button>
                <button
                  onClick={() => { onEdit(course); onClose(); }}
                  className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-all active:scale-95"
                >
                  Edit
                </button>
                <a
                  href={`/admin/courses/${course._id}`}
                  className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all active:scale-95 text-center"
                >
                  Build
                </a>
                <button
                  onClick={() => { onDelete(course); }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all active:scale-95"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MetricModal>
  )
}

function TeachersDetailModal({ isOpen, onClose, teachers }) {
  return (
    <MetricModal isOpen={isOpen} onClose={onClose} title="Active Teachers" icon="👩‍🏫">
      {teachers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👩‍🏫</div>
          <p className="text-slate-600">No teachers added yet</p>
          <p className="text-sm text-slate-500 mt-2">Add teachers from Quick Actions → Manage Teachers</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {teachers.map((teacher) => (
            <div key={teacher._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-green-300 hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                {teacher.avatar ? (
                  <img 
                    src={teacher.avatar} 
                    alt={teacher.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl">
                    👩‍🏫
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-slate-900">{teacher.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">🎵 {teacher.instrument}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </MetricModal>
  )
}

function EnrollmentsDetailModal({ isOpen, onClose, enrollments, courses, onApprove }) {
  const pending = enrollments.filter(e => !e.approved)
  
  return (
    <MetricModal isOpen={isOpen} onClose={onClose} title="Pending Enrollments" icon="⏳">
      {pending.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-slate-600 font-medium">All enrollments are approved!</p>
          <p className="text-sm text-slate-500 mt-2">No pending enrollments at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.map((enrollment) => {
            const course = courses.find(c => c._id === enrollment.courseId)
            return (
              <div key={enrollment._id} className="bg-yellow-50 rounded-xl p-4 border-2 border-yellow-200 hover:border-yellow-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-slate-900">{enrollment.name || 'Anonymous User'}</h3>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        ⏳ Pending
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>📧 {enrollment.email || 'Not provided'}</p>
                      <p>📚 {course?.title || enrollment.courseId}</p>
                      {enrollment.instrument && <p>🎵 {enrollment.instrument}</p>}
                      <p>📅 {new Date(enrollment.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { onApprove(enrollment._id); }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md active:scale-95 ml-4"
                  >
                    ✓ Approve
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MetricModal>
  )
}

function StudentsDetailModal({ isOpen, onClose, enrollments, courses }) {
  const students = enrollments.filter(e => e.approved)
  
  return (
    <MetricModal isOpen={isOpen} onClose={onClose} title="Total Students" icon="👥">
      {students.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-slate-600">No enrolled students yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((enrollment) => {
            const course = courses.find(c => c._id === enrollment.courseId)
            const isManual = enrollment.paymentId === 'manual-enrollment'
            return (
              <div key={enrollment._id} className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-purple-300 hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{enrollment.name || 'Anonymous User'}</h3>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ✓ Enrolled
                      </span>
                      {isManual && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          👤 Manual
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>📧 {enrollment.email || 'Not provided'}</p>
                      <p>📚 {course?.title || enrollment.courseId}</p>
                      {enrollment.instrument && <p>🎵 {enrollment.instrument}</p>}
                      <p>📅 Enrolled: {new Date(enrollment.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric'
                      })}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </MetricModal>
  )
}

function ManualEnrollmentForm({ courses, onEnroll, onCancel, loading }) {
  const [formData, setFormData] = useState({
    email: '',
    courseId: '',
    name: ''
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const emailInputRef = useRef(null)

  useEffect(() => {
    if (emailInputRef.current) {
      setTimeout(() => {
        emailInputRef.current?.focus()
      }, 100)
    }
  }, [])

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const validateCourse = (courseId) => {
    if (!courseId || courseId.trim().length === 0) {
      return 'Please select a course'
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    let error = null
    if (name === 'email') {
      error = validateEmail(value)
    } else if (name === 'courseId') {
      error = validateCourse(value)
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      email: true,
      courseId: true,
      name: true
    })
    
    // Validate
    const emailError = validateEmail(formData.email)
    const courseError = validateCourse(formData.courseId)
    
    const currentErrors = {}
    if (emailError) currentErrors.email = emailError
    if (courseError) currentErrors.courseId = courseError
    
    setErrors(currentErrors)
    
    if (Object.keys(currentErrors).length > 0) {
      toast.error('Please fix the errors in the form')
      // Scroll to first error
      const firstErrorField = Object.keys(currentErrors)[0]
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstErrorField}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }, 100)
      }
      return
    }

    await onEnroll({
      email: formData.email.trim().toLowerCase(),
      courseId: formData.courseId,
      name: formData.name.trim() || undefined
    })
    
    // Reset form on success
    setFormData({
      email: '',
      courseId: '',
      name: ''
    })
    setErrors({})
    setTouched({})
  }

  const selectedCourse = courses.find(c => c._id === formData.courseId)

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 lg:p-8 mb-6 border-2 border-green-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Manual Student Enrollment
          </h3>
          <p className="text-sm text-slate-600">Enroll a student directly by their email address</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          title="Close"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Input */}
        <div>
          <label htmlFor="manual-email" className="block text-sm font-medium text-slate-700 mb-2">
            Student Email Address <span className="text-red-500">*</span>
          </label>
          <input
            ref={emailInputRef}
            id="manual-email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="student@example.com"
            className={`w-full border rounded-lg p-3 transition-all duration-200 ${
              errors.email && touched.email
                ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : formData.email && !errors.email
                ? 'border-green-400 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                : 'border-slate-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
            }`}
            required
            aria-invalid={errors.email && touched.email ? 'true' : 'false'}
          />
          {errors.email && touched.email ? (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
              <span>⚠️</span> {errors.email}
            </p>
          ) : formData.email && !errors.email ? (
            <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
              <span>✓</span> Valid email address
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Enter the student's email address</p>
          )}
        </div>

        {/* Course Selection */}
        <div>
          <label htmlFor="manual-course" className="block text-sm font-medium text-slate-700 mb-2">
            Select Course <span className="text-red-500">*</span>
          </label>
          <select
            id="manual-course"
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            onBlur={handleBlur}
            className={`w-full border rounded-lg p-3 transition-all duration-200 ${
              errors.courseId && touched.courseId
                ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                : formData.courseId && !errors.courseId
                ? 'border-green-400 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
                : 'border-slate-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500'
            }`}
            required
            aria-invalid={errors.courseId && touched.courseId ? 'true' : 'false'}
          >
            <option value="">-- Select a course --</option>
            {courses.map((course) => (
              <option key={course._id} value={course._id}>
                {course.title} {course.price > 0 ? `(₹${course.price})` : '(Free)'}
              </option>
            ))}
          </select>
          {errors.courseId && touched.courseId ? (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
              <span>⚠️</span> {errors.courseId}
            </p>
          ) : selectedCourse ? (
            <div className="mt-2 p-3 bg-white rounded-lg border border-green-200">
              <div className="flex items-center gap-3">
                {selectedCourse.image && (
                  <img 
                    src={selectedCourse.image} 
                    alt={selectedCourse.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{selectedCourse.title}</p>
                  <p className="text-xs text-slate-600">{selectedCourse.level} • {selectedCourse.modules?.length || 0} modules</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Optional Name */}
        <div>
          <label htmlFor="manual-name" className="block text-sm font-medium text-slate-700 mb-2">
            Student Name <span className="text-slate-400 text-xs">(Optional)</span>
          </label>
          <input
            id="manual-name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Student's full name (auto-detected if available)"
            className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
          />
          <p className="mt-1 text-xs text-slate-500">
            If left empty, the system will try to find the student's name from their account
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm ${
              loading
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 hover:shadow-md active:scale-95'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enrolling...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>✅</span>
                <span>Enroll Student</span>
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 flex items-start gap-2">
            <span className="text-sm">💡</span>
            <span>
              <strong>Note:</strong> The student will be automatically enrolled and approved. 
              If the email exists in Clerk, their account will be linked. Otherwise, enrollment will work with email only.
            </span>
          </p>
        </div>
      </form>
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
  const [showManualEnroll, setShowManualEnroll] = useState(false)
  const [enrolling, setEnrolling] = useState(false)
  const [enrollmentSearch, setEnrollmentSearch] = useState('')
  const [enrollmentFilter, setEnrollmentFilter] = useState('all') // 'all', 'approved', 'pending'
  const [activeModal, setActiveModal] = useState(null) // 'courses', 'teachers', 'enrollments', 'students'

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
      
      const coursePayload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        level: formData.level,
        image: formData.image
      }
      
      // Add teacherId if selected
      if (formData.teacherId) {
        coursePayload.teacherId = formData.teacherId
      }
      
      let courseData
      if (editingCourse) {
        courseData = await apiPut(`/courses/${editingCourse._id}`, coursePayload, token)
      } else {
        courseData = await apiPost('/courses', coursePayload, token)
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
      toast.success(editingCourse ? 'Course updated successfully! ✅' : 'Course created successfully! 🎉')
      reload()
    } catch (error) {
      console.error('Failed to save course:', error)
      toast.error('Failed to save course. Please try again.')
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
      toast.success(`Course "${course.title}" deleted successfully! ✅`)
      reload()
    } catch (error) {
      console.error('Failed to delete course:', error)
      toast.error('Failed to delete course. Please try again.')
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
      toast.success('Enrollment approved! ✅')
      reload()
    } catch (error) {
      console.error('Failed to approve enrollment:', error)
      toast.error('Failed to approve enrollment. Please try again.')
    }
  }

  const handleManualEnroll = async (formData) => {
    try {
      setEnrolling(true)
      const token = await getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments/manual`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll student')
      }
      
      toast.success(data.message || 'Student enrolled successfully! 🎉', {
        duration: 3000,
        icon: '✅'
      })
      
      setShowManualEnroll(false)
      reload()
    } catch (error) {
      console.error('Failed to enroll student:', error)
      toast.error(error.message || 'Failed to enroll student. Please try again.')
    } finally {
      setEnrolling(false)
    }
  }


  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
        <Navbar subtitle="Admin Panel" />

        <main className="pb-16">
          <div className="max-w-6xl mx-auto px-4 pt-8">
            {/* Welcome Section */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Welcome back, {user?.firstName || 'Admin'}! 👋
                </h1>
                <p className="text-slate-600">Manage your music academy with ease</p>
              </div>
              <button
                onClick={reload}
                disabled={loading}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                title="Refresh data"
              >
                <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <StatsCard 
                title="Total Courses" 
                value={courses.length} 
                icon="📚" 
                color="bg-blue-100" 
                onClick={() => setActiveModal('courses')}
              />
              <StatsCard 
                title="Active Teachers" 
                value={teachers.length} 
                icon="👩‍🏫" 
                color="bg-green-100"
                onClick={() => setActiveModal('teachers')}
              />
              <StatsCard 
                title="Pending Enrollments" 
                value={enrollments.filter(e => !e.approved).length} 
                icon="⏳" 
                color="bg-yellow-100"
                onClick={() => setActiveModal('enrollments')}
              />
              <StatsCard 
                title="Total Students" 
                value={enrollments.filter(e => e.approved).length} 
                icon="👥" 
                color="bg-purple-100"
                onClick={() => setActiveModal('students')}
              />
            </div>

            {/* Quick Actions - Moved to Top */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span>⚡</span>
                <span>Quick Actions</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <a href="/admin/attendance" className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-sky-300 active:scale-95">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📊</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">Attendance</h3>
                  <p className="text-sm text-slate-600">Mark and manage student attendance</p>
                </a>
                <a href="/admin/calendar" className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-sky-300 active:scale-95">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📅</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">Schedule</h3>
                  <p className="text-sm text-slate-600">Create and manage class schedules</p>
                </a>
                <a href="/admin/resources" className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-sky-300 active:scale-95">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📚</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">Resources</h3>
                  <p className="text-sm text-slate-600">Upload and manage course resources</p>
                </a>
                <a href="/admin/courses/new" className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-sky-300 active:scale-95">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">➕</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">Course Builder</h3>
                  <p className="text-sm text-slate-600">Build detailed course content</p>
                </a>
                <a 
                  href="/admin/teachers"
                  className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-green-300 active:scale-95 text-left relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 to-green-50/0 group-hover:from-green-50/50 group-hover:to-emerald-50/50 transition-all duration-300"></div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">👩‍🏫</div>
                    <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-green-700 transition-colors">Manage Teachers</h3>
                    <p className="text-sm text-slate-600">Add, edit, and manage teachers</p>
                  </div>
                </a>
                <a href="/admin/enrollment-leads" className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 group hover:border-sky-300 active:scale-95">
                  <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">📝</div>
                  <h3 className="font-semibold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors">New Enrollment Leads</h3>
                  <p className="text-sm text-slate-600">View recently submitted leads</p>
                </a>
              </div>
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
                    teachers={teachers}
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
                      teachers={teachers}
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
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Enrollment Management</h2>
                <button
                  onClick={() => setShowManualEnroll(!showManualEnroll)}
                  className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>{showManualEnroll ? 'Cancel' : 'Manual Enroll'}</span>
                </button>
              </div>

              {/* Manual Enrollment Form */}
              {showManualEnroll && (
                <ManualEnrollmentForm
                  courses={courses}
                  onEnroll={handleManualEnroll}
                  onCancel={() => setShowManualEnroll(false)}
                  loading={enrolling}
                />
              )}

              {/* Search and Filter */}
              {enrollments.length > 0 && (
                <div className="mb-4 flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Search by email, name, or course..."
                      value={enrollmentSearch}
                      onChange={(e) => setEnrollmentSearch(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                  </div>
                  <select
                    value={enrollmentFilter}
                    onChange={(e) => setEnrollmentFilter(e.target.value)}
                    className="border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                  >
                    <option value="all">All Enrollments</option>
                    <option value="approved">Approved Only</option>
                    <option value="pending">Pending Only</option>
                  </select>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                {enrollments.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <div className="text-4xl mb-4">📝</div>
                    <p>No enrollments yet</p>
                  </div>
                ) : (() => {
                  // Filter enrollments
                  let filtered = enrollments
                  
                  // Apply status filter
                  if (enrollmentFilter === 'approved') {
                    filtered = filtered.filter(e => e.approved)
                  } else if (enrollmentFilter === 'pending') {
                    filtered = filtered.filter(e => !e.approved)
                  }
                  
                  // Apply search filter
                  if (enrollmentSearch.trim()) {
                    const searchLower = enrollmentSearch.toLowerCase()
                    filtered = filtered.filter(e => {
                      const email = (e.email || '').toLowerCase()
                      const name = (e.name || '').toLowerCase()
                      const courseTitle = (courses.find(c => c._id === e.courseId)?.title || '').toLowerCase()
                      return email.includes(searchLower) || name.includes(searchLower) || courseTitle.includes(searchLower)
                    })
                  }
                  
                  if (filtered.length === 0) {
                    return (
                      <div className="p-8 text-center text-slate-500">
                        <div className="text-4xl mb-4">🔍</div>
                        <p>No enrollments match your search</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="divide-y divide-slate-200">
                      {filtered.map((enrollment) => {
                        const course = courses.find(c => c._id === enrollment.courseId)
                        const isManual = enrollment.paymentId === 'manual-enrollment'
                        
                        return (
                          <div key={enrollment._id} className="p-6 hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2 flex-wrap">
                                  <h3 className="font-semibold text-slate-800">
                                    {enrollment.name || 'Anonymous User'}
                                  </h3>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    enrollment.approved 
                                      ? 'bg-green-100 text-green-700' 
                                      : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {enrollment.approved ? '✓ Approved' : '⏳ Pending'}
                                  </span>
                                  {isManual && (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                      👤 Manual
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-slate-600 space-y-1">
                                  <p className="flex items-center gap-2">
                                    <span>📧</span>
                                    <span>{enrollment.email || 'Not provided'}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <span>📚</span>
                                    <span>{course?.title || enrollment.courseId}</span>
                                    {course && (
                                      <span className="text-xs text-slate-400">
                                        ({course.level})
                                      </span>
                                    )}
                                  </p>
                                  {enrollment.instrument && (
                                    <p className="flex items-center gap-2">
                                      <span>🎵</span>
                                      <span>{enrollment.instrument}</span>
                                    </p>
                                  )}
                                  <p className="flex items-center gap-2">
                                    <span>📅</span>
                                    <span>Enrolled: {new Date(enrollment.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}</span>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 ml-4">
                                {!enrollment.approved && (
                                  <button
                                    onClick={() => handleApproveEnrollment(enrollment._id)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md active:scale-95"
                                  >
                                    ✓ Approve
                                  </button>
                                )}
                                {enrollment.approved && (
                                  <span className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                                    ✓ Enrolled
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </main>

        {/* Metric Detail Modals */}
        <CoursesDetailModal
          isOpen={activeModal === 'courses'}
          onClose={() => setActiveModal(null)}
          courses={courses}
          onView={handleViewCourse}
          onEdit={handleEditCourse}
          onDelete={handleDeleteCourse}
        />
        <TeachersDetailModal
          isOpen={activeModal === 'teachers'}
          onClose={() => setActiveModal(null)}
          teachers={teachers}
        />
        <EnrollmentsDetailModal
          isOpen={activeModal === 'enrollments'}
          onClose={() => setActiveModal(null)}
          enrollments={enrollments}
          courses={courses}
          onApprove={handleApproveEnrollment}
        />
        <StudentsDetailModal
          isOpen={activeModal === 'students'}
          onClose={() => setActiveModal(null)}
          enrollments={enrollments}
          courses={courses}
        />

        <Footer showAdminTools={true} />
      </div>
    </AdminGuard>
  )
}