import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut } from '../lib/api'

function ResourcePreview({ lesson, courseId, moduleIndex, lessonIndex }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  
  const getResourceUrl = () => {
    if (lesson.type === 'video' && lesson.videoPath) {
      return `${import.meta.env.VITE_API_BASE_URL}/media/video/${courseId}/${moduleIndex}/${lessonIndex}`
    } else if (lesson.type === 'pdf' && lesson.pdfPath) {
      return `${import.meta.env.VITE_API_BASE_URL}/media/pdf/${courseId}/${moduleIndex}/${lessonIndex}`
    }
    return null
  }

  const getFileSize = (path) => {
    // This would need to be implemented on the backend to get actual file sizes
    return '2.5 MB' // Placeholder
  }

  const getFileExtension = (path) => {
    if (!path) return ''
    return path.split('.').pop().toUpperCase()
  }

  return (
    <div className="mt-3 p-4 bg-slate-50 rounded-lg border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
            {lesson.type === 'video' ? (
              <span className="text-sky-600 text-sm">🎥</span>
            ) : (
              <span className="text-sky-600 text-sm">📄</span>
            )}
          </div>
          <div>
            <div className="font-medium text-slate-800">{lesson.title}</div>
            <div className="text-sm text-slate-500">
              {lesson.type.toUpperCase()} • {lesson.durationSec ? `${Math.round(lesson.durationSec/60)} min` : 'No duration'} • {getFileSize(lesson.videoPath || lesson.pdfPath)}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {lesson.freePreview && (
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
              Free Preview
            </span>
          )}
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Resource Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-600">File Type:</span>
          <span className="ml-2 font-medium">{getFileExtension(lesson.videoPath || lesson.pdfPath)}</span>
        </div>
        <div>
          <span className="text-slate-600">Duration:</span>
          <span className="ml-2 font-medium">{lesson.durationSec ? `${Math.round(lesson.durationSec/60)} min` : 'Not set'}</span>
        </div>
        <div>
          <span className="text-slate-600">Access:</span>
          <span className="ml-2 font-medium">{lesson.freePreview ? 'Free Preview' : 'Enrolled Only'}</span>
        </div>
        <div>
          <span className="text-slate-600">Status:</span>
          <span className="ml-2 font-medium text-green-600">✓ Uploaded</span>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">Preview: {lesson.title}</h3>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
            <div className="p-6">
              {lesson.type === 'video' ? (
                <video
                  controls
                  className="w-full rounded-lg shadow-lg"
                  src={getResourceUrl()}
                  poster={lesson.thumbnailPath}
                >
                  Your browser does not support the video tag.
                </video>
              ) : lesson.type === 'pdf' ? (
                <div className="w-full h-96 border border-slate-200 rounded-lg overflow-hidden">
                  <iframe
                    src={getResourceUrl()}
                    className="w-full h-full"
                    title={lesson.title}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-slate-600">Preview not available for this file type</p>
                  <a
                    href={getResourceUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LessonForm({ moduleIndex, lessonType, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    type: lessonType,
    freePreview: false,
    durationSec: '',
    description: ''
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    try {
      await onSubmit(formData, file)
    } finally {
      setUploading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-6 bg-slate-50 rounded-lg border">
      <div className="text-lg font-semibold mb-4">Add New {lessonType.toUpperCase()} Lesson</div>
      
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Lesson Title</label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter lesson title"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Duration (seconds)</label>
          <input
            name="durationSec"
            type="number"
            value={formData.durationSec}
            onChange={handleChange}
            placeholder="300"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of what students will learn..."
          rows={3}
          className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Upload {lessonType === 'video' ? 'Video' : 'PDF'} File
        </label>
        <input
          type="file"
          accept={lessonType === 'pdf' ? 'application/pdf' : 'video/*'}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          required
        />
        <p className="text-sm text-slate-500 mt-1">
          {lessonType === 'video' ? 'Supported formats: MP4, MOV, AVI' : 'Supported format: PDF'}
        </p>
      </div>

      <div className="flex items-center space-x-4 mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="freePreview"
            checked={formData.freePreview}
            onChange={handleChange}
            className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-sm text-slate-700">Make this a free preview lesson</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={uploading}
          className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Add Lesson'}
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
  )
}

function CourseDetailsEditForm({ course, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    level: course?.level || 'Beginner',
    image: course?.image || '',
    studentCount: course?.studentCount || 0,
    rating: course?.rating || 4.8,
    teacherName: course?.teacherName || '',
    teacherDescription: course?.teacherDescription || '',
    teacherAvatar: course?.teacherAvatar || '',
    teacherInstrument: course?.teacherInstrument || '',
    scales: course?.scales || '',
    arpeggios: course?.arpeggios || '',
    performanceTips: course?.performanceTips || '',
  })

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        level: course.level || 'Beginner',
        image: course.image || '',
        studentCount: course.studentCount || 0,
        rating: course.rating || 4.8,
        teacherName: course.teacherName || '',
        teacherDescription: course.teacherDescription || '',
        teacherAvatar: course.teacherAvatar || '',
        teacherInstrument: course.teacherInstrument || '',
        scales: course.scales || '',
        arpeggios: course.arpeggios || '',
        performanceTips: course.performanceTips || '',
      })
    }
  }, [course])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(formData)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'studentCount' || name === 'rating' 
        ? Number(value) || 0 
        : value
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">Edit Course Details</h2>
      
      <div className="space-y-6">
        {/* Basic Course Info */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Basic Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Course Title</label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
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
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                required
              />
            </div>
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
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        {/* Course Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Course Metrics</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Student Count</label>
              <input
                name="studentCount"
                type="number"
                value={formData.studentCount}
                onChange={handleChange}
                placeholder="1200"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rating (0-5)</label>
              <input
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.8"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Teacher Information */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Teacher Information</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Name</label>
              <input
                name="teacherName"
                value={formData.teacherName}
                onChange={handleChange}
                placeholder="e.g., Aarav Sharma"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Instrument</label>
              <input
                name="teacherInstrument"
                value={formData.teacherInstrument}
                onChange={handleChange}
                placeholder="e.g., Guitar, Piano, Vocals"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Avatar URL</label>
              <input
                name="teacherAvatar"
                value={formData.teacherAvatar}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-2">Teacher Description</label>
              <textarea
                name="teacherDescription"
                value={formData.teacherDescription}
                onChange={handleChange}
                rows={3}
                placeholder="Expert musician with 10+ years of teaching experience..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Additional Course Content */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Additional Course Content</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Scales</label>
              <textarea
                name="scales"
                value={formData.scales}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the scales covered in this course..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Arpeggios</label>
              <textarea
                name="arpeggios"
                value={formData.arpeggios}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the arpeggios covered in this course..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Performance Tips</label>
              <textarea
                name="performanceTips"
                value={formData.performanceTips}
                onChange={handleChange}
                rows={3}
                placeholder="Share performance tips and techniques..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Course Details'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

export default function AdminCourseBuilder() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mTitle, setMTitle] = useState('')
  const [mOrder, setMOrder] = useState('')
  const [showLessonForm, setShowLessonForm] = useState({ moduleIndex: null, type: null })
  const [showEditForm, setShowEditForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const c = await apiGet(`/courses/${id}`)
      setCourse(c)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { reload() }, [id])

  const addModule = async (e) => {
    e.preventDefault()
    const token = await getToken()
    await apiPost(`/courses/${id}/modules`, { title: mTitle, order: Number(mOrder || 0) }, token)
    setMTitle('')
    setMOrder('')
    reload()
  }

  const addLesson = async (formData, file) => {
    const token = await getToken()
    const uploadForm = new FormData()
    if (file) uploadForm.append('file', file)
    uploadForm.append('title', formData.title)
    uploadForm.append('type', formData.type)
    uploadForm.append('freePreview', String(formData.freePreview))
    uploadForm.append('durationSec', String(Number(formData.durationSec || 0)))
    uploadForm.append('description', formData.description || '')

    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${id}/modules/${showLessonForm.moduleIndex}/lessons`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: uploadForm,
    })
    
    if (!res.ok) {
      throw new Error('Failed to upload lesson')
    }
    
    await res.json()
    setShowLessonForm({ moduleIndex: null, type: null })
    reload()
  }

  const startAddLesson = (moduleIndex, type) => {
    setShowLessonForm({ moduleIndex, type })
  }

  const cancelAddLesson = () => {
    setShowLessonForm({ moduleIndex: null, type: null })
  }

  const handleSaveCourseDetails = async (formData) => {
    try {
      setSaving(true)
      const token = await getToken()
      await apiPut(`/courses/${id}`, formData, token)
      setShowEditForm(false)
      reload()
    } catch (error) {
      console.error('Failed to save course details:', error)
      alert('Failed to save course details. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎵</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h1>
          <p className="text-slate-600 mb-6">The course you're looking for doesn't exist.</p>
          <a href="/admin" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            Back to Admin
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <a href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎶</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg">Course Builder</span>
                <div className="text-xs text-slate-500">Admin Panel</div>
              </div>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">Admin</a>
            <a href="/courses" className="hover:text-sky-700 font-medium transition-colors">Courses</a>
            <a href="/dashboard" className="hover:text-sky-700 font-medium transition-colors">Dashboard</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </nav>
      </header>

      <main className="pb-16">
        <div className="max-w-6xl mx-auto px-4 pt-8">
          {/* Course Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Course Builder: {course.title}
                </h1>
                <p className="text-slate-600">Build and manage your course content</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditForm(!showEditForm)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  {showEditForm ? 'Hide Edit Form' : 'Edit Course Details'}
                </button>
                <a
                  href={`/courses/${course._id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Preview Course
                </a>
                <a
                  href="/admin"
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Back to Admin
                </a>
              </div>
            </div>
            
            {/* Course Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600">Modules</div>
                <div className="text-2xl font-bold text-slate-900">{course.modules?.length || 0}</div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600">Total Lessons</div>
                <div className="text-2xl font-bold text-slate-900">
                  {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600">Videos</div>
                <div className="text-2xl font-bold text-slate-900">
                  {course.modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.type === 'video').length || 0), 0) || 0}
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="text-sm text-slate-600">PDFs</div>
                <div className="text-2xl font-bold text-slate-900">
                  {course.modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.type === 'pdf').length || 0), 0) || 0}
                </div>
              </div>
            </div>
          </div>

          <SignedOut>
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h2>
              <p className="text-slate-600 mb-6">Please sign in to access the course builder</p>
              <SignInButton>
                <button className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {/* Course Details Edit Form */}
            {showEditForm && (
              <div className="mb-8">
                <CourseDetailsEditForm
                  course={course}
                  onSave={handleSaveCourseDetails}
                  onCancel={() => setShowEditForm(false)}
                  loading={saving}
                />
              </div>
            )}

            {/* Add Module Form */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Add New Module</h2>
              <form onSubmit={addModule} className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Module Title</label>
                  <input
                    value={mTitle}
                    onChange={(e) => setMTitle(e.target.value)}
                    placeholder="e.g., Introduction to Guitar"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                  <input
                    value={mOrder}
                    onChange={(e) => setMOrder(e.target.value)}
                    placeholder="1"
                    type="number"
                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                  >
                    Add Module
                  </button>
                </div>
              </form>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
              {(course.modules || []).map((module, moduleIndex) => (
                <div key={moduleIndex} className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{module.title}</h3>
                        <div className="text-sm text-slate-500 mt-1">
                          Module {moduleIndex + 1} • {module.lessons?.length || 0} lessons
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startAddLesson(moduleIndex, 'video')}
                          className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                        >
                          + Add Lessons
                        </button>
                        <button
                          onClick={() => startAddLesson(moduleIndex, 'pdf')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                        >
                          + Add PDF
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Lesson Form */}
                  {showLessonForm.moduleIndex === moduleIndex && (
                    <div className="p-6 border-b border-slate-200">
                      <LessonForm
                        moduleIndex={moduleIndex}
                        lessonType={showLessonForm.type}
                        onSubmit={addLesson}
                        onCancel={cancelAddLesson}
                      />
                    </div>
                  )}

                  {/* Lessons List */}
                  <div className="p-6">
                    {module.lessons && module.lessons.length > 0 ? (
                      <div className="space-y-4">
                        {module.lessons.map((lesson, lessonIndex) => (
                          <ResourcePreview
                            key={lessonIndex}
                            lesson={lesson}
                            courseId={course._id}
                            moduleIndex={moduleIndex}
                            lessonIndex={lessonIndex}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <div className="text-4xl mb-4">📚</div>
                        <p>No lessons added yet</p>
                        <p className="text-sm">Add videos or PDFs to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(!course.modules || course.modules.length === 0) && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                  <div className="text-6xl mb-6">📖</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">No Modules Yet</h3>
                  <p className="text-slate-600 mb-6">Start building your course by adding modules and lessons</p>
                </div>
              )}
            </div>
          </SignedIn>
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
              </ul>
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
