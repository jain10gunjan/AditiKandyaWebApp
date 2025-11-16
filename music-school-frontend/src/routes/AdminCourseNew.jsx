import { useAuth, SignedIn, SignedOut, SignInButton, useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { apiPost } from '../lib/api'
import { useState, useEffect } from 'react'
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

export default function AdminCourseNew() {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    image: '',
    level: 'Beginner'
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? (value === '' ? 0 : Number(value)) : value
    }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    
    setSaving(true)
    try {
      const token = await getToken()
      const created = await apiPost('/courses', formData, token)
      toast.success('Course created successfully! 🎉', {
        duration: 2000,
        icon: '✅'
      })
      navigate(`/admin/courses/${created._id}`)
    } catch (error) {
      console.error('Failed to create course:', error)
      toast.error('Failed to create course. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-pink-50">
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
          <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <a href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎶</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-lg">Create New Course</span>
                  <div className="text-xs text-slate-500">Admin Panel</div>
                </div>
              </a>
            </div>
            <div className="hidden md:flex items-center gap-6 text-slate-700">
              <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">← Back to Admin</a>
            </div>
          </nav>
        </header>

        <main className="pb-16">
          <div className="max-w-3xl mx-auto px-4 pt-8">
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                Create New Course 🎵
              </h1>
              <p className="text-slate-600">Start by adding basic course information</p>
            </div>

            <form onSubmit={onSubmit} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-slate-200 space-y-6">
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

              <div className="grid md:grid-cols-2 gap-4">
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

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95"
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span>✨</span>
                      <span>Create Course</span>
                    </span>
                  )}
                </button>
                <a
                  href="/admin"
                  className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                >
                  Cancel
                </a>
              </div>
            </form>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}


