import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

// Admin guard component
function AdminGuard({ children }) {
  const { user } = useUser()
  const isAdmin = user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com' || 
                 (import.meta.env.VITE_ADMIN_EMAILS?.split(',').includes(user?.emailAddresses?.[0]?.emailAddress))
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-4">You need admin privileges to access this page.</p>
          <p className="text-sm text-slate-500">Logged in as: {user?.emailAddresses?.[0]?.emailAddress || 'Not signed in'}</p>
          <a href="/admin" className="inline-block mt-6 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            Go to Admin Panel
          </a>
        </div>
      </div>
    )
  }
  
  return children
}

export default function AdminFreeCourses() {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [freeCourses, setFreeCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResourceForm, setShowResourceForm] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [formData, setFormData] = useState({
    courseId: '',
    title: '',
    description: '',
    type: 'video',
    isPublic: false,
    order: 0
  })

  useEffect(() => {
    loadCourses()
    loadFreeCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadResources()
      setFormData(prev => ({ ...prev, courseId: selectedCourse }))
    }
  }, [selectedCourse])

  const loadCourses = async () => {
    try {
      const data = await apiGet('/courses')
      setCourses(data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    } finally {
      setLoading(false)
    }
  }

  const loadFreeCourses = async () => {
    try {
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const response = await fetch(`${baseUrl}/free-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFreeCourses(data || [])
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0]._id)
        }
      }
    } catch (error) {
      console.error('Error loading free courses:', error)
    }
  }

  const loadResources = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const response = await fetch(`${baseUrl}/admin/resources/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setResources(data || [])
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      toast.error('Failed to load resources')
    }
  }

  const toggleCourseFree = async (courseId, isCurrentlyFree) => {
    try {
      setSubmitting(true)
      const token = await getToken()
      await apiPut(`/courses/${courseId}`, { isFree: !isCurrentlyFree }, token)
      toast.success(isCurrentlyFree ? 'Course removed from free courses' : 'Course marked as free!')
      await loadCourses()
      await loadFreeCourses()
    } catch (error) {
      console.error('Error toggling course:', error)
      toast.error('Failed to update course')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResourceSubmit = async (e) => {
    e.preventDefault()
    
    setSubmitting(true)
    try {
      const token = await getToken()
      const formDataToSend = new FormData()
      
      Object.keys(formData).forEach(key => {
        if (key !== 'file') {
          formDataToSend.append(key, formData[key])
        }
      })
      
      const fileInput = document.getElementById('resourceFile')
      if (fileInput && fileInput.files[0]) {
        formDataToSend.append('file', fileInput.files[0])
      }
      
      if (editingResource) {
        await apiPut(`/admin/resources/${editingResource._id}`, formData, token)
        toast.success('Resource updated!')
      } else {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
        const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
        const response = await fetch(`${baseUrl}/admin/resources`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend
        })
        
        if (!response.ok) throw new Error('Failed to upload resource')
        toast.success('Resource added successfully!')
      }
      
      resetForm()
      loadResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      toast.error('Failed to save resource. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditResource = (resource) => {
    setEditingResource(resource)
    setFormData({
      courseId: resource.courseId,
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      isPublic: resource.isPublic || false,
      order: resource.order || 0
    })
    setShowResourceForm(true)
  }

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return
    
    try {
      const token = await getToken()
      await apiDelete(`/admin/resources/${resourceId}`, token)
      toast.success('Resource deleted!')
      loadResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      toast.error('Failed to delete resource')
    }
  }

  const resetForm = () => {
    setFormData({
      courseId: selectedCourse,
      title: '',
      description: '',
      type: 'video',
      isPublic: false,
      order: 0
    })
    setEditingResource(null)
    setShowResourceForm(false)
    const fileInput = document.getElementById('resourceFile')
    if (fileInput) fileInput.value = ''
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'document': return '📝'
      case 'audio': return '🎵'
      default: return '📁'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      
      <AdminGuard>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Free Courses Management</h1>
              <p className="text-slate-600 mt-1">Manage free courses and their resources available to all signed-in users</p>
            </div>
            <nav className="flex gap-3 text-sm">
              <a href="/admin" className="text-slate-700 hover:text-sky-700 font-medium">← Admin Panel</a>
            </nav>
          </div>

          <SignedOut>
            <div className="mt-6 bg-white rounded-2xl shadow p-8 text-center">
              <p className="text-slate-600 mb-4">Please sign in to access this page</p>
              <SignInButton>
                <button className="px-5 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 font-medium transition-colors">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {loading ? (
              <div className="mt-6 bg-white rounded-2xl shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Free Courses Section */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-slate-900">Free Courses</h2>
                    <div className="text-sm text-slate-600 bg-sky-50 px-4 py-2 rounded-lg">
                      {freeCourses.length} free course{freeCourses.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  
                  {freeCourses.length > 0 ? (
                    <div className="space-y-3">
                      {freeCourses.map((course) => (
                        <div key={course._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 transition-all">
                          <div className="flex items-center gap-4">
                            <div className="text-3xl">🎁</div>
                            <div>
                              <h3 className="font-semibold text-slate-900">{course.title}</h3>
                              <p className="text-sm text-slate-600">{course.description?.substring(0, 100)}...</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleCourseFree(course._id, true)}
                            disabled={submitting}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium transition-colors disabled:opacity-50"
                          >
                            Remove from Free
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🎁</div>
                      <p className="text-slate-600">No free courses yet. Mark courses as free below.</p>
                    </div>
                  )}
                </div>

                {/* All Courses - Mark as Free */}
                <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                  <h2 className="text-xl font-bold text-slate-900 mb-4">All Courses - Mark as Free</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {courses.filter(c => !c.isFree).map((course) => (
                      <div key={course._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="text-2xl">📚</div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{course.title}</h3>
                            <p className="text-xs text-slate-600">{course.description?.substring(0, 80)}...</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCourseFree(course._id, false)}
                          disabled={submitting}
                          className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-medium transition-colors disabled:opacity-50"
                        >
                          Mark as Free
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resources Management */}
                {freeCourses.length > 0 && (
                  <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-900">Manage Resources</h2>
                      <button
                        onClick={() => {
                          setShowResourceForm(true)
                          setEditingResource(null)
                          setFormData(prev => ({ ...prev, courseId: selectedCourse || freeCourses[0]?._id }))
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 font-medium transition-all"
                      >
                        + Add Resource
                      </button>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Select Free Course</label>
                      <select
                        value={selectedCourse}
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Select a free course</option>
                        {freeCourses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Resource Form */}
                    {showResourceForm && selectedCourse && (
                      <div className="mb-6 p-6 bg-slate-50 rounded-xl border border-slate-200 animate-fade-in">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-bold text-lg text-slate-900">
                            {editingResource ? 'Edit Resource' : 'Add New Resource'}
                          </h3>
                          <button
                            onClick={resetForm}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            <span className="text-2xl">×</span>
                          </button>
                        </div>
                        
                        <form onSubmit={handleResourceSubmit} className="space-y-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Title *</label>
                              <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({...formData, title: e.target.value})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                              <select
                                value={formData.type}
                                onChange={(e) => setFormData({...formData, type: e.target.value})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              >
                                <option value="video">🎥 Video</option>
                                <option value="pdf">📄 PDF</option>
                                <option value="document">📝 Document</option>
                                <option value="audio">🎵 Audio</option>
                              </select>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                            <textarea
                              value={formData.description}
                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              rows="3"
                            />
                          </div>
                          
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                              <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value) || 0})}
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                              <input
                                type="checkbox"
                                id="isPublic"
                                checked={formData.isPublic}
                                onChange={(e) => setFormData({...formData, isPublic: e.target.checked})}
                                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                              />
                              <label htmlFor="isPublic" className="text-sm font-medium text-slate-700">
                                Make resource public (accessible without sign-in)
                              </label>
                            </div>
                          </div>
                          
                          {!editingResource && (
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">File *</label>
                              <input
                                id="resourceFile"
                                type="file"
                                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                                required={!editingResource}
                              />
                            </div>
                          )}
                          
                          <div className="flex gap-3">
                            <button
                              type="submit"
                              disabled={submitting}
                              className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                              {submitting ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <span>✓ Save Resource</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={resetForm}
                              className="px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Resources List */}
                    {selectedCourse && (
                      <div className="mt-6">
                        {resources.length > 0 ? (
                          <div className="space-y-3">
                            {resources.map((resource) => (
                              <div key={resource._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-sky-300 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                                  <div>
                                    <h3 className="font-semibold text-slate-900">{resource.title}</h3>
                                    <p className="text-sm text-slate-600">{resource.description || 'No description'}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-xs px-2 py-1 bg-sky-100 text-sky-700 rounded">
                                        {resource.type.toUpperCase()}
                                      </span>
                                      {resource.isPublic && (
                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                          Public
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleEditResource(resource)}
                                    className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteResource(resource._id)}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 bg-slate-50 rounded-xl">
                            <div className="text-4xl mb-4">📚</div>
                            <p className="text-slate-600">No resources yet. Add your first resource above.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </SignedIn>
        </div>

        <Footer showAdminTools={true} />
      </AdminGuard>
    </div>
  )
}

