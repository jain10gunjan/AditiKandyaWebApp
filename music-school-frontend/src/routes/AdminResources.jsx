import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AdminResources() {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [resources, setResources] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingResource, setEditingResource] = useState(null)
  const [uploading, setUploading] = useState(false)
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
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadResources()
      setFormData(prev => ({ ...prev, courseId: selectedCourse }))
    }
  }, [selectedCourse])

  const loadCourses = async () => {
    try {
      const token = await getToken()
      const data = await apiGet('/courses')
      setCourses(data)
      if (data.length > 0) {
        setSelectedCourse(data[0]._id)
        setFormData(prev => ({ ...prev, courseId: data[0]._id }))
      }
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/resources/${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setResources(data)
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    setUploading(true)
    try {
      const token = await getToken()
      const formDataToSend = new FormData()
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (key !== 'file') {
          formDataToSend.append(key, formData[key])
        }
      })
      
      // Add file if present
      const fileInput = document.getElementById('resourceFile')
      if (fileInput && fileInput.files[0]) {
        formDataToSend.append('file', fileInput.files[0])
      }
      
      if (editingResource) {
        // For editing, we'll update without file upload for now
        await apiPut(`/admin/resources/${editingResource._id}`, formData, token)
      } else {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/resources`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formDataToSend
        })
        
        if (!res.ok) {
          throw new Error('Failed to upload resource')
        }
      }
      
      resetForm()
      loadResources()
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (resource) => {
    setEditingResource(resource)
    setFormData({
      courseId: resource.courseId,
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      isPublic: resource.isPublic || false,
      order: resource.order || 0
    })
    setShowForm(true)
  }

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    
    try {
      const token = await getToken()
      await apiDelete(`/admin/resources/${resourceId}`, token)
      loadResources()
    } catch (error) {
      console.error('Error deleting resource:', error)
      alert('Failed to delete resource. Please try again.')
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
    setShowForm(false)
    
    // Reset file input
    const fileInput = document.getElementById('resourceFile')
    if (fileInput) fileInput.value = ''
  }

  const handleAddResource = () => {
    setFormData({
      courseId: selectedCourse,
      title: '',
      description: '',
      type: 'video',
      isPublic: false,
      order: 0
    })
    setEditingResource(null)
    setShowForm(true)
  }

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'document': return '📝'
      default: return '📁'
    }
  }

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800'
      case 'pdf': return 'bg-blue-100 text-blue-800'
      case 'document': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-900">Resource Management</h1>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="text-slate-700 hover:text-sky-700">Admin Panel</a>
            <a href="/" className="text-slate-700 hover:text-sky-700">Home</a>
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
            <div className="mt-6">Loading...</div>
          ) : (
            <>
              {/* Course Selection and Add Button */}
              <div className="mt-6 bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                      <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddResource}
                    className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
                  >
                    + Add Resource
                  </button>
                </div>
              </div>

              {/* Resource Form Modal */}
              {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between p-6 border-b">
                      <h2 className="text-xl font-bold text-slate-900">
                        {editingResource ? 'Edit Resource' : 'Add New Resource'}
                      </h2>
                      <button
                        onClick={resetForm}
                        className="text-slate-500 hover:text-slate-700 text-2xl"
                      >
                        ×
                      </button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                      <div className="bg-sky-50 p-3 rounded-lg mb-4">
                        <p className="text-sm text-sky-700">
                          <strong>Course:</strong> {courses.find(c => c._id === selectedCourse)?.title || 'Unknown Course'}
                        </p>
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
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Type *</label>
                          <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            required
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
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          File {!editingResource && '*'}
                        </label>
                        <input
                          id="resourceFile"
                          type="file"
                          accept={formData.type === 'video' ? 'video/*' : formData.type === 'pdf' ? '.pdf' : '*'}
                          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                          required={!editingResource}
                        />
                        <p className="text-sm text-slate-500 mt-1">
                          {formData.type === 'video' && 'Supported formats: MP4, AVI, MOV, etc.'}
                          {formData.type === 'pdf' && 'Supported format: PDF'}
                          {formData.type === 'document' && 'Supported formats: DOC, DOCX, TXT, etc.'}
                        </p>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                          <input
                            type="number"
                            value={formData.order}
                            onChange={(e) => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500"
                            min="0"
                          />
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={formData.isPublic}
                              onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                              className="mr-2"
                            />
                            <span className="text-sm text-slate-700">Public (Free Preview)</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={resetForm}
                          className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={uploading}
                          className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50"
                        >
                          {uploading ? 'Uploading...' : editingResource ? 'Update' : 'Upload'} Resource
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Resources Grid */}
              <div className="mt-6">
                {resources.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow p-8 text-center">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Resources Found</h3>
                    <p className="text-slate-600">Upload your first resource to get started.</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map((resource) => (
                      <div key={resource._id} className="bg-white rounded-2xl shadow p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{getResourceIcon(resource.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-slate-900">{resource.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                                {resource.type.toUpperCase()}
                              </span>
                              {resource.isPublic && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  PUBLIC
                                </span>
                              )}
                            </div>
                            {resource.description && (
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{resource.description}</p>
                            )}
                            <div className="flex items-center justify-between text-sm text-slate-500 mb-3">
                              <span>Order: {resource.order}</span>
                              {resource.duration && (
                                <span>Duration: {Math.floor(resource.duration / 60)}:{(resource.duration % 60).toString().padStart(2, '0')}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(resource)}
                                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(resource._id)}
                                className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
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
