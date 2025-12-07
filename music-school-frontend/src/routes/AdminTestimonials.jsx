import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
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

function TestimonialForm({ testimonial, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: testimonial?.name || '',
    role: testimonial?.role || '',
    content: testimonial?.content || '',
    avatar: testimonial?.avatar || 'https://i.pravatar.cc/150',
    isActive: testimonial?.isActive !== undefined ? testimonial.isActive : true,
    order: testimonial?.order || 0
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.role || !formData.content) {
      toast.error('Please fill in all required fields')
      return
    }
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Student Name *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Role/Title *</label>
        <input
          type="text"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="e.g., Guitar Student, Piano Student"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Testimonial Content *</label>
        <textarea
          value={formData.content}
          onChange={(e) => setFormData({ ...formData, content: e.target.value })}
          rows={4}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="What the student said..."
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Avatar URL</label>
        <input
          type="url"
          value={formData.avatar}
          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          placeholder="https://i.pravatar.cc/150"
        />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
          />
          <label className="ml-2 text-sm text-slate-700">Active</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Order</label>
          <input
            type="number"
            value={formData.order}
            onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
            className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>
      </div>
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium disabled:opacity-50"
        >
          {loading ? 'Saving...' : testimonial ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

export default function AdminTestimonials() {
  const { getToken } = useAuth()
  const [testimonials, setTestimonials] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTestimonial, setEditingTestimonial] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadTestimonials = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await apiGet('/admin/testimonials', token)
      setTestimonials(data)
    } catch (error) {
      console.error('Failed to load testimonials:', error)
      toast.error('Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTestimonials()
  }, [])

  const handleSave = async (formData) => {
    try {
      setSaving(true)
      const token = await getToken()
      if (editingTestimonial) {
        await apiPut(`/admin/testimonials/${editingTestimonial._id}`, formData, token)
        toast.success('Testimonial updated successfully')
      } else {
        await apiPost('/admin/testimonials', formData, token)
        toast.success('Testimonial created successfully')
      }
      setShowForm(false)
      setEditingTestimonial(null)
      loadTestimonials()
    } catch (error) {
      console.error('Failed to save testimonial:', error)
      toast.error(error.message || 'Failed to save testimonial')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return
    try {
      const token = await getToken()
      await apiDelete(`/admin/testimonials/${id}`, token)
      toast.success('Testimonial deleted successfully')
      loadTestimonials()
    } catch (error) {
      console.error('Failed to delete testimonial:', error)
      toast.error('Failed to delete testimonial')
    }
  }

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingTestimonial(null)
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
        <Navbar subtitle="Admin Panel" />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Manage Testimonials</h1>
              <p className="text-slate-600">Manage what students say section on homepage</p>
            </div>
            <button
              onClick={() => {
                setEditingTestimonial(null)
                setShowForm(true)
              }}
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
            >
              + Add Testimonial
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {editingTestimonial ? 'Edit Testimonial' : 'New Testimonial'}
              </h2>
              <TestimonialForm
                testimonial={editingTestimonial}
                onSave={handleSave}
                onCancel={handleCancel}
                loading={saving}
              />
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Order</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Role</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Content</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {testimonials.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                          No testimonials yet. Click "Add Testimonial" to create one.
                        </td>
                      </tr>
                    ) : (
                      testimonials.map((testimonial) => (
                        <tr key={testimonial._id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{testimonial.order}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <img
                                src={testimonial.avatar}
                                alt={testimonial.name}
                                className="h-10 w-10 rounded-full object-cover mr-3"
                                onError={(e) => {
                                  e.target.src = 'https://i.pravatar.cc/150'
                                }}
                              />
                              <span className="text-sm font-medium text-slate-900">{testimonial.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{testimonial.role}</td>
                          <td className="px-6 py-4 text-sm text-slate-600 max-w-md">
                            <p className="truncate">{testimonial.content}</p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              testimonial.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {testimonial.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(testimonial)}
                              className="text-sky-600 hover:text-sky-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(testimonial._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
        <Footer />
      </div>
    </AdminGuard>
  )
}

