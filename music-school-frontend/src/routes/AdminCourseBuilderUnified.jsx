import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth, useUser, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut } from '../lib/api'
import toast from 'react-hot-toast'

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-6">You don't have permission to access this page.</p>
          <a href="/admin" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium inline-block">
            Back to Admin
          </a>
        </div>
      </div>
    )
  }

  return children
}

function CourseBasicInfoForm({ course, teachers, onSave, loading }) {
  const [formData, setFormData] = useState({
    title: course?.title || '',
    description: course?.description || '',
    price: course?.price || 0,
    level: course?.level || 'Beginner',
    image: course?.image || '',
    teacherId: course?.teacherId || '',
    studentCount: course?.studentCount || 0,
    rating: course?.rating || 4.8,
    teacherName: course?.teacherName || '',
    teacherDescription: course?.teacherDescription || '',
    teacherAvatar: course?.teacherAvatar || '',
    teacherInstrument: course?.teacherInstrument || '',
    scales: course?.scales || '',
    arpeggios: course?.arpeggios || '',
    performanceTips: course?.performanceTips || ''
  })

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title || '',
        description: course.description || '',
        price: course.price || 0,
        level: course.level || 'Beginner',
        image: course.image || '',
        teacherId: course.teacherId || '',
        studentCount: course.studentCount || 0,
        rating: course.rating || 4.8,
        teacherName: course.teacherName || '',
        teacherDescription: course.teacherDescription || '',
        teacherAvatar: course.teacherAvatar || '',
        teacherInstrument: course.teacherInstrument || '',
        scales: course.scales || '',
        arpeggios: course.arpeggios || '',
        performanceTips: course.performanceTips || ''
      })
    }
  }, [course])

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await onSave(formData)
  }

  const selectedTeacher = formData.teacherId ? teachers.find(t => t._id === formData.teacherId) : null

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Course Information</h2>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span>💾</span>
              <span>Save Course Info</span>
            </span>
          )}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>📝</span>
            <span>Basic Information</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Guitar Basics for Beginners"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Price (₹) <span className="text-red-500">*</span>
              </label>
              <input
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                placeholder="2999"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                required
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                name="level"
                value={formData.level}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="All Levels">All Levels</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Image URL
              </label>
              <input
                name="image"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what students will learn in this course..."
              rows={4}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              required
            />
          </div>
        </div>

        {/* Teacher Assignment */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>👩‍🏫</span>
            <span>Assign Teacher</span>
          </h3>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Select Teacher <span className="text-slate-400 text-xs">(Optional)</span>
            </label>
            <select
              name="teacherId"
              value={formData.teacherId}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            >
              <option value="">-- Select a teacher --</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.name} - {teacher.instrument}
                </option>
              ))}
            </select>
            {selectedTeacher && (
              <div className="mt-3 p-4 bg-green-50 rounded-lg border border-green-200 flex items-center gap-3 animate-fade-in">
                {selectedTeacher.avatar ? (
                  <img 
                    src={selectedTeacher.avatar} 
                    alt={selectedTeacher.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-green-300"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center ring-2 ring-green-300">
                    👩‍🏫
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{selectedTeacher.name}</p>
                  <p className="text-sm text-slate-600">🎵 {selectedTeacher.instrument}</p>
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
            )}
            {teachers.length === 0 && (
              <p className="text-xs text-slate-500 mt-1">
                No teachers available. <a href="/admin/teachers" className="text-green-600 hover:text-green-700 underline">Add teachers first</a>
              </p>
            )}
          </div>
        </div>

        {/* Course Metrics */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>📊</span>
            <span>Course Metrics</span>
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Student Count
              </label>
              <input
                name="studentCount"
                type="number"
                value={formData.studentCount}
                onChange={handleChange}
                placeholder="1200"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Rating (0-5)
              </label>
              <input
                name="rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={formData.rating}
                onChange={handleChange}
                placeholder="4.8"
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Additional Content */}
        <div>
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span>📚</span>
            <span>Additional Content</span>
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Scales
              </label>
              <textarea
                name="scales"
                value={formData.scales}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the scales covered in this course..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Arpeggios
              </label>
              <textarea
                name="arpeggios"
                value={formData.arpeggios}
                onChange={handleChange}
                rows={3}
                placeholder="Describe the arpeggios covered in this course..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Performance Tips
              </label>
              <textarea
                name="performanceTips"
                value={formData.performanceTips}
                onChange={handleChange}
                rows={3}
                placeholder="Share performance tips and techniques..."
                className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

function ModuleCard({ module, moduleIndex, courseId, onAddLesson, onDeleteModule, onReload, getToken }) {
  const [expanded, setExpanded] = useState(true)
  const [showLessonForm, setShowLessonForm] = useState({ type: null })
  const [uploading, setUploading] = useState(false)

  const handleAddLesson = async (formData, file) => {
    try {
      setUploading(true)
      const token = await getToken()
      const uploadForm = new FormData()
      if (file) uploadForm.append('file', file)
      uploadForm.append('title', formData.title)
      uploadForm.append('type', formData.type)
      uploadForm.append('freePreview', String(formData.freePreview))
      uploadForm.append('durationSec', String(Number(formData.durationSec || 0)))
      uploadForm.append('description', formData.description || '')

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${courseId}/modules/${moduleIndex}/lessons`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: uploadForm,
      })
      
      if (!res.ok) {
        throw new Error('Failed to upload lesson')
      }
      
      toast.success('Lesson added successfully! ✅')
      setShowLessonForm({ type: null })
      onReload()
    } catch (error) {
      console.error('Failed to add lesson:', error)
      toast.error('Failed to add lesson. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-slate-200 hover:border-sky-300 transition-all duration-300 shadow-sm hover:shadow-md">
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-sky-600 font-bold">{moduleIndex + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-lg mb-1">{module.title}</h3>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <span>{module.lessons?.length || 0} lessons</span>
                <span className="text-sky-600 font-medium">
                  {module.lessons?.filter(l => l.type === 'video').length || 0} videos
                </span>
                <span className="text-emerald-600 font-medium">
                  {module.lessons?.filter(l => l.type === 'pdf').length || 0} PDFs
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xl transform transition-transform duration-300">
              {expanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 p-4 space-y-4">
          {/* Add Lesson Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setShowLessonForm({ type: 'video' })}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>🎥</span>
              <span>Add Video</span>
            </button>
            <button
              onClick={() => setShowLessonForm({ type: 'pdf' })}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95 flex items-center gap-2"
            >
              <span>📄</span>
              <span>Add PDF</span>
            </button>
            <button
              onClick={async () => {
                if (confirm(`Delete module "${module.title}"? This will also delete all lessons in this module.`)) {
                  // Delete module logic would go here
                  toast.error('Module deletion not implemented yet')
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
            >
              Delete Module
            </button>
          </div>

          {/* Lesson Form */}
          {showLessonForm.type && (
            <LessonForm
              lessonType={showLessonForm.type}
              onSubmit={handleAddLesson}
              onCancel={() => setShowLessonForm({ type: null })}
              loading={uploading}
            />
          )}

          {/* Lessons List */}
          {module.lessons && module.lessons.length > 0 ? (
            <div className="space-y-3">
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonCard
                  key={lessonIndex}
                  lesson={lesson}
                  lessonIndex={lessonIndex}
                  moduleIndex={moduleIndex}
                  courseId={courseId}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-500 bg-slate-50 rounded-lg">
              <div className="text-3xl mb-2">📚</div>
              <p className="text-sm">No lessons yet. Add videos or PDFs to get started.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function LessonForm({ lessonType, onSubmit, onCancel, loading }) {
  const [formData, setFormData] = useState({
    title: '',
    type: lessonType,
    freePreview: false,
    durationSec: '',
    description: ''
  })
  const [file, setFile] = useState(null)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setFile(files?.[0] || null)
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file && !formData.title) {
      toast.error('Please provide a title and upload a file')
      return
    }
    await onSubmit(formData, file)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lesson Title <span className="text-red-500">*</span>
          </label>
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder={`Enter ${lessonType} lesson title`}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Upload {lessonType.toUpperCase()} File <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={lessonType === 'video' ? 'video/*' : 'application/pdf'}
            onChange={handleChange}
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
            required
          />
          {file && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
              <span>✓</span>
              <span>Selected: {file.name}</span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Duration (seconds)
            </label>
            <input
              name="durationSec"
              type="number"
              value={formData.durationSec}
              onChange={handleChange}
              placeholder="300"
              className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
              min="0"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                name="freePreview"
                type="checkbox"
                checked={formData.freePreview}
                onChange={handleChange}
                className="w-5 h-5 text-sky-600 rounded focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700">Free Preview</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={2}
            placeholder="Add a brief description of this lesson..."
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Add Lesson'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}

function LessonCard({ lesson, lessonIndex, moduleIndex, courseId }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  
  const getResourceUrl = () => {
    if (lesson.type === 'video' && lesson.videoPath) {
      return `${import.meta.env.VITE_API_BASE_URL}/media/video/${courseId}/${moduleIndex}/${lessonIndex}`
    } else if (lesson.type === 'pdf' && lesson.pdfPath) {
      return `${import.meta.env.VITE_API_BASE_URL}/media/pdf/${courseId}/${moduleIndex}/${lessonIndex}`
    }
    return null
  }

  return (
    <>
      <div className="bg-white rounded-lg p-4 border border-slate-200 hover:border-sky-300 hover:shadow-sm transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              lesson.type === 'video' ? 'bg-sky-100' : 'bg-emerald-100'
            }`}>
              <span className="text-lg">{lesson.type === 'video' ? '🎥' : '📄'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 mb-1">{lesson.title}</h4>
              <div className="flex items-center gap-3 text-sm text-slate-600 flex-wrap">
                {lesson.durationSec && (
                  <span>⏱️ {Math.round(lesson.durationSec / 60)} min</span>
                )}
                {lesson.freePreview && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    Free Preview
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => setPreviewOpen(true)}
            className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            Preview
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">{lesson.title}</h3>
              <button
                onClick={() => setPreviewOpen(false)}
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
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-slate-600 mb-4">PDF Preview</p>
                  <a
                    href={getResourceUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors inline-block"
                  >
                    Open PDF
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default function AdminCourseBuilderUnified() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [course, setCourse] = useState(null)
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mTitle, setMTitle] = useState('')
  const [mOrder, setMOrder] = useState('')
  const [addingModule, setAddingModule] = useState(false)

  const reload = async () => {
    try {
      setLoading(true)
      const [courseData, teachersData] = await Promise.all([
        apiGet(`/courses/${id}`),
        apiGet('/teachers')
      ])
      setCourse(courseData)
      setTeachers(teachersData)
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load course data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      reload()
    }
  }, [id])

  const handleSaveCourseInfo = async (formData) => {
    try {
      setSaving(true)
      const token = await getToken()
      await apiPut(`/courses/${id}`, formData, token)
      toast.success('Course information saved successfully! ✅')
      reload()
    } catch (error) {
      console.error('Failed to save course:', error)
      toast.error('Failed to save course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleAddModule = async (e) => {
    e.preventDefault()
    try {
      setAddingModule(true)
      const token = await getToken()
      await apiPost(`/courses/${id}/modules`, { 
        title: mTitle, 
        order: Number(mOrder || course.modules?.length || 0) 
      }, token)
      toast.success('Module added successfully! ✅')
      setMTitle('')
      setMOrder('')
      reload()
    } catch (error) {
      console.error('Failed to add module:', error)
      toast.error('Failed to add module. Please try again.')
    } finally {
      setAddingModule(false)
    }
  }

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </AdminGuard>
    )
  }

  if (!course) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h1>
            <a href="/admin" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
              Back to Admin
            </a>
          </div>
        </div>
      </AdminGuard>
    )
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const totalVideos = course.modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.type === 'video').length || 0), 0) || 0
  const totalPDFs = course.modules?.reduce((acc, m) => acc + (m.lessons?.filter(l => l.type === 'pdf').length || 0), 0) || 0

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50">
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
          <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
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
              <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">← Back to Admin</a>
              <a 
                href={`/courses/${course._id}`} 
                target="_blank"
                rel="noreferrer"
                className="hover:text-sky-700 font-medium transition-colors"
              >
                Preview Course
              </a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </header>

        <main className="pb-16">
          <div className="max-w-7xl mx-auto px-4 pt-8">
            {/* Course Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                    {course.title || 'Untitled Course'}
                  </h1>
                  <p className="text-slate-600">{course.description || 'No description yet'}</p>
                </div>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm text-slate-600 mb-1">Modules</div>
                  <div className="text-2xl font-bold text-slate-900">{course.modules?.length || 0}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm text-slate-600 mb-1">Total Lessons</div>
                  <div className="text-2xl font-bold text-slate-900">{totalLessons}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm text-slate-600 mb-1">Videos</div>
                  <div className="text-2xl font-bold text-sky-600">{totalVideos}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className="text-sm text-slate-600 mb-1">PDFs</div>
                  <div className="text-2xl font-bold text-emerald-600">{totalPDFs}</div>
                </div>
              </div>
            </div>

            {/* Course Information Form */}
            <div className="mb-8">
              <CourseBasicInfoForm
                course={course}
                teachers={teachers}
                onSave={handleSaveCourseInfo}
                loading={saving}
              />
            </div>

            {/* Modules Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Course Modules & Resources</h2>
              </div>

              {/* Add Module Form */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <span>➕</span>
                  <span>Add New Module</span>
                </h3>
                <form onSubmit={handleAddModule} className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Module Title</label>
                    <input
                      value={mTitle}
                      onChange={(e) => setMTitle(e.target.value)}
                      placeholder="e.g., Introduction to Guitar"
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                    <input
                      value={mOrder}
                      onChange={(e) => setMOrder(e.target.value)}
                      placeholder="Auto"
                      type="number"
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={addingModule}
                      className="w-full px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95"
                    >
                      {addingModule ? 'Adding...' : 'Add Module'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Modules List */}
              {course.modules && course.modules.length > 0 ? (
                <div className="space-y-4">
                  {course.modules.map((module, moduleIndex) => (
                    <ModuleCard
                      key={moduleIndex}
                      module={module}
                      moduleIndex={moduleIndex}
                      courseId={course._id}
                      onAddLesson={() => {}}
                      onDeleteModule={() => {}}
                      onReload={reload}
                      getToken={getToken}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                  <div className="text-6xl mb-6">📖</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-4">No Modules Yet</h3>
                  <p className="text-slate-600 mb-6">Start building your course by adding modules and lessons</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}

