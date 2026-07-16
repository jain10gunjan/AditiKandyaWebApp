import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPut, apiDelete, apiPatch } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

const EMPTY_FORM = {
  courseId: '',
  title: '',
  description: '',
  type: 'video',
  isPublic: false,
  order: 0,
}

function getResourceIcon(type) {
  switch (type) {
    case 'video': return '🎥'
    case 'pdf': return '📄'
    case 'document': return '📝'
    case 'audio': return '🎵'
    default: return '📁'
  }
}

function getResourceTypeColor(type) {
  switch (type) {
    case 'video': return 'bg-red-100 text-red-800'
    case 'pdf': return 'bg-blue-100 text-blue-800'
    case 'document': return 'bg-green-100 text-green-800'
    case 'audio': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

export default function AdminResources() {
  const { getToken, isSignedIn } = useAuth()
  const fileInputRef = useRef(null)

  const [courses, setCourses] = useState([])
  const [resources, setResources] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [sharedFilter, setSharedFilter] = useState('all') // all | shared | private
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_FORM })

  const courseTitleById = useMemo(() => {
    const map = {}
    for (const c of courses || []) {
      const id = String(c?._id || '')
      if (id) map[id] = c.title || 'Untitled Course'
    }
    return map
  }, [courses])

  const stats = useMemo(() => {
    const total = resources.length
    const shared = resources.filter(r => r.isPublic).length
    return {
      total,
      shared,
      private: total - shared,
      video: resources.filter(r => r.type === 'video').length,
      pdf: resources.filter(r => r.type === 'pdf').length,
    }
  }, [resources])

  const filteredResources = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return (resources || []).filter(r => {
      if (sharedFilter === 'shared' && !r.isPublic) return false
      if (sharedFilter === 'private' && r.isPublic) return false
      if (typeFilter !== 'all' && r.type !== typeFilter) return false
      if (!q) return true
      return (
        String(r.title || '').toLowerCase().includes(q) ||
        String(r.description || '').toLowerCase().includes(q) ||
        String(r.courseTitle || courseTitleById[String(r.courseId)] || '').toLowerCase().includes(q)
      )
    })
  }, [resources, sharedFilter, typeFilter, searchTerm, courseTitleById])

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false)
      return
    }
    loadInitial()
  }, [isSignedIn])

  useEffect(() => {
    if (!isSignedIn) return
    loadResources()
  }, [isSignedIn, selectedCourse])

  const loadInitial = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await apiGet('/courses', token)
      const list = Array.isArray(data) ? data : []
      setCourses(list)
      setSelectedCourse('all')
    } catch (error) {
      console.error('Failed to load courses', error)
      toast.error(error.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    try {
      const token = await getToken()
      const params = new URLSearchParams()
      if (selectedCourse && selectedCourse !== 'all') {
        params.set('courseId', selectedCourse)
      }
      const path = `/admin/resources${params.toString() ? `?${params}` : ''}`
      const data = await apiGet(path, token)
      setResources(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error(error.message || 'Failed to load resources')
      setResources([])
    }
  }

  const resetForm = () => {
    setFormData({
      ...EMPTY_FORM,
      courseId: selectedCourse !== 'all' ? selectedCourse : (courses[0]?._id || ''),
    })
    setEditingResource(null)
    setShowForm(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddResource = () => {
    const defaultCourse =
      selectedCourse !== 'all' ? selectedCourse : String(courses[0]?._id || '')
    if (!defaultCourse) {
      toast.error('Create a course first before uploading resources')
      return
    }
    setEditingResource(null)
    setFormData({ ...EMPTY_FORM, courseId: defaultCourse })
    setShowForm(true)
  }

  const handleEdit = (resource) => {
    setEditingResource(resource)
    setFormData({
      courseId: resource.courseId || '',
      title: resource.title || '',
      description: resource.description || '',
      type: resource.type || 'video',
      isPublic: Boolean(resource.isPublic),
      order: resource.order || 0,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!formData.courseId) {
      toast.error('Please select a course')
      return
    }

    setSaving(true)
    try {
      const token = await getToken()

      if (editingResource) {
        await apiPut(
          `/admin/resources/${editingResource._id}`,
          {
            title: formData.title,
            description: formData.description,
            type: formData.type,
            isPublic: formData.isPublic,
            order: formData.order,
            courseId: formData.courseId,
          },
          token
        )
        toast.success('Resource updated')
      } else {
        const file = fileInputRef.current?.files?.[0]
        if (!file) {
          toast.error('Please choose a file to upload')
          setSaving(false)
          return
        }

        const body = new FormData()
        body.append('courseId', formData.courseId)
        body.append('title', formData.title)
        body.append('description', formData.description || '')
        body.append('type', formData.type)
        body.append('isPublic', String(formData.isPublic))
        body.append('order', String(formData.order || 0))
        body.append('file', file)

        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/resources`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        })
        if (!res.ok) {
          let message = 'Failed to upload resource'
          try {
            const err = await res.json()
            message = err.error || err.message || message
          } catch (_) {}
          throw new Error(message)
        }
        toast.success(
          formData.isPublic
            ? 'Resource uploaded and added to Shared Library'
            : 'Resource uploaded'
        )
      }

      resetForm()
      await loadResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      toast.error(error.message || 'Failed to save resource')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleShared = async (resource) => {
    if (togglingId) return
    const next = !resource.isPublic
    setTogglingId(resource._id)
    // Optimistic update
    setResources(prev =>
      prev.map(r => (r._id === resource._id ? { ...r, isPublic: next } : r))
    )
    try {
      const token = await getToken()
      await apiPatch(`/admin/resources/${resource._id}/shared`, { isPublic: next }, token)
      toast.success(next ? 'Added to Shared Library' : 'Removed from Shared Library')
    } catch (error) {
      setResources(prev =>
        prev.map(r => (r._id === resource._id ? { ...r, isPublic: resource.isPublic } : r))
      )
      toast.error(error.message || 'Failed to update shared status')
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async (resourceId) => {
    if (!confirm('Delete this resource? This cannot be undone.')) return
    setDeletingId(resourceId)
    try {
      const token = await getToken()
      await apiDelete(`/admin/resources/${resourceId}`, token)
      setResources(prev => prev.filter(r => r._id !== resourceId))
      toast.success('Resource deleted')
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error(error.message || 'Failed to delete resource')
    } finally {
      setDeletingId(null)
    }
  }

  const selectedCourseTitle =
    selectedCourse === 'all'
      ? 'All courses'
      : courseTitleById[String(selectedCourse)] || 'Selected course'

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Resource Management</h1>
            <p className="text-slate-600 mt-1 text-sm">
              Manage course files and the Shared Library for signed-in students.
            </p>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm">
            <a href="/student/resources" className="text-slate-700 hover:text-sky-700">
              Student view
            </a>
            <a href="/admin" className="text-slate-700 hover:text-sky-700">
              Admin Panel
            </a>
            <a href="/" className="text-slate-700 hover:text-sky-700">
              Home
            </a>
          </nav>
        </div>

        <SignedOut>
          <div className="mt-6">
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-slate-900 text-white">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {loading ? (
            <div className="mt-10 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-600" />
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-xs text-slate-600">Total</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-green-700">{stats.shared}</div>
                  <div className="text-xs text-slate-600">Shared Library</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-slate-700">{stats.private}</div>
                  <div className="text-xs text-slate-600">Private</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-red-600">{stats.video}</div>
                  <div className="text-xs text-slate-600">Videos</div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <div className="text-2xl font-bold text-blue-600">{stats.pdf}</div>
                  <div className="text-xs text-slate-600">PDFs</div>
                </div>
              </div>

              <div className="mt-6 bg-white rounded-2xl shadow border border-slate-200 p-6">
                <div className="flex flex-col lg:flex-row lg:items-end gap-4 justify-between">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="all">All courses</option>
                        {courses.map((course) => (
                          <option key={course._id} value={String(course._id)}>
                            {course.title}
                            {course.isFree ? ' (Free)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Visibility</label>
                      <select
                        value={sharedFilter}
                        onChange={(e) => setSharedFilter(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="all">All</option>
                        <option value="shared">Shared only</option>
                        <option value="private">Private only</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="all">All types</option>
                        <option value="video">Video</option>
                        <option value="pdf">PDF</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Search</label>
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Title, description, course..."
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={loadResources}
                      disabled={saving}
                      className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                    >
                      Refresh
                    </button>
                    <button
                      onClick={handleAddResource}
                      disabled={saving || courses.length === 0}
                      className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50"
                    >
                      + Add Resource
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  Showing <strong>{filteredResources.length}</strong> of {resources.length} in{' '}
                  <strong>{selectedCourseTitle}</strong>. Shared items appear in the student Shared Library.
                </p>
              </div>

              {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-xl font-bold text-slate-900">
                        {editingResource ? 'Edit Resource' : 'Add New Resource'}
                      </h2>
                      <button
                        onClick={resetForm}
                        className="text-slate-500 hover:text-slate-700 text-2xl leading-none"
                        type="button"
                      >
                        ×
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Course *</label>
                        <select
                          value={formData.courseId}
                          onChange={(e) => setFormData(prev => ({ ...prev, courseId: e.target.value }))}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                          required
                          disabled={saving}
                        >
                          <option value="">Select a course</option>
                          {courses.map((course) => (
                            <option key={course._id} value={String(course._id)}>
                              {course.title}
                              {course.isFree ? ' (Free)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                            disabled={saving}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                            disabled={saving}
                          >
                            <option value="video">Video</option>
                            <option value="pdf">PDF</option>
                            <option value="document">Document</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                          rows="3"
                          disabled={saving}
                        />
                      </div>

                      {!editingResource && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">File *</label>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={
                              formData.type === 'video'
                                ? 'video/*'
                                : formData.type === 'pdf'
                                  ? '.pdf'
                                  : '*'
                            }
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
                            disabled={saving}
                          />
                          <p className="text-sm text-slate-500 mt-1">
                            {formData.type === 'video' && 'Supported formats: MP4, AVI, MOV, etc.'}
                            {formData.type === 'pdf' && 'Supported format: PDF'}
                            {formData.type === 'document' && 'Supported formats: DOC, DOCX, TXT, etc.'}
                          </p>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                          <input
                            type="number"
                            value={formData.order}
                            onChange={(e) =>
                              setFormData(prev => ({ ...prev, order: parseInt(e.target.value, 10) || 0 }))
                            }
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            min="0"
                            disabled={saving}
                          />
                        </div>
                        <div className="flex items-start">
                          <label className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.isPublic}
                              onChange={(e) =>
                                setFormData(prev => ({ ...prev, isPublic: e.target.checked }))
                              }
                              className="mt-1"
                              disabled={saving}
                            />
                            <span className="text-sm text-slate-700">
                              <span className="font-medium">Shared with all signed-in students</span>
                              <span className="block text-slate-500 text-xs mt-0.5">
                                Shows in student Shared Library. Private resources stay limited to
                                enrolled / free-course access.
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={resetForm}
                          disabled={saving}
                          className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                        >
                          {saving
                            ? editingResource
                              ? 'Saving…'
                              : 'Uploading…'
                            : editingResource
                              ? 'Update Resource'
                              : 'Upload Resource'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <div className="mt-6">
                {filteredResources.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow border border-slate-200 p-8 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resources Found</h3>
                    <p className="text-slate-600 mb-4">
                      {resources.length === 0
                        ? 'Upload your first resource to get started.'
                        : 'No resources match your current filters.'}
                    </p>
                    {resources.length > 0 && (
                      <button
                        onClick={() => {
                          setSharedFilter('all')
                          setTypeFilter('all')
                          setSearchTerm('')
                        }}
                        className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredResources.map((resource) => {
                      const courseLabel =
                        resource.courseTitle ||
                        courseTitleById[String(resource.courseId)] ||
                        'Unknown course'
                      return (
                        <div
                          key={resource._id}
                          className={`bg-white rounded-2xl shadow border p-6 hover:shadow-lg transition-shadow ${
                            resource.isPublic ? 'border-green-200' : 'border-slate-200'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="font-bold text-slate-900 truncate">{resource.title}</h3>
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}
                                >
                                  {String(resource.type || '').toUpperCase()}
                                </span>
                                {resource.isPublic && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    SHARED
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500 mb-2">Course: {courseLabel}</p>

                              {resource.description && (
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                  {resource.description}
                                </p>
                              )}

                              <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                                <span>Order: {resource.order ?? 0}</span>
                                {resource.duration ? (
                                  <span>
                                    Duration:{' '}
                                    {Math.floor(resource.duration / 60)}:
                                    {(resource.duration % 60).toString().padStart(2, '0')}
                                  </span>
                                ) : null}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <button
                                  onClick={() => handleToggleShared(resource)}
                                  disabled={togglingId === resource._id || saving}
                                  className={`px-3 py-1 text-xs rounded font-medium transition-colors disabled:opacity-50 ${
                                    resource.isPublic
                                      ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                  }`}
                                >
                                  {togglingId === resource._id
                                    ? 'Updating…'
                                    : resource.isPublic
                                      ? 'Unshare'
                                      : 'Share'}
                                </button>
                                <button
                                  onClick={() => handleEdit(resource)}
                                  disabled={saving || deletingId === resource._id}
                                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(resource._id)}
                                  disabled={saving || deletingId === resource._id}
                                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50"
                                >
                                  {deletingId === resource._id ? 'Deleting…' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </SignedIn>
      </div>
      <Footer />
    </div>
  )
}
