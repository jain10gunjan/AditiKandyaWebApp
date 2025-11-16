import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
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
        // Also check environment variable for additional admin emails
        const email = user?.emailAddresses?.[0]?.emailAddress || ''
        const adminEmails = (import.meta.env.VITE_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase())
        if (adminEmails.length > 0 && adminEmails[0] !== '') {
          setIsAdmin(adminEmails.includes(email.toLowerCase()))
        } else {
          setIsAdmin(false)
        }
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
          <SignInButton mode="modal">
            <button className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    const userEmail = user?.emailAddresses?.[0]?.emailAddress || 'Not detected'
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-pink-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h1>
          <p className="text-slate-600 mb-2">You don't have permission to access this page.</p>
          <p className="text-sm text-slate-500 mb-6">
            Logged in as: <span className="font-mono text-slate-700">{userEmail}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <a href="/admin" className="px-6 py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium inline-block">
              Back to Admin
            </a>
            <a href="/" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium inline-block">
              Go Home
            </a>
          </div>
        </div>
      </div>
    )
  }

  return children
}

function TeacherForm({ teacher, onSave, onCancel, loading }) {
  const [formData, setFormData] = useState({
    name: teacher?.name || '',
    instrument: teacher?.instrument || '',
    avatar: teacher?.avatar || ''
  })
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (teacher) {
      setFormData({
        name: teacher.name || '',
        instrument: teacher.instrument || '',
        avatar: teacher.avatar || ''
      })
    } else {
      setFormData({
        name: '',
        instrument: '',
        avatar: ''
      })
    }
    // Auto-focus name field when form opens
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 100)
  }, [teacher])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.instrument.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    await onSave(formData)
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
          {teacher ? 'Edit Teacher' : 'Add New Teacher'}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          title="Cancel"
        >
          <span className="text-xl">✕</span>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Teacher Name <span className="text-red-500">*</span>
          </label>
          <input
            ref={nameInputRef}
            name="name"
            type="text"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter teacher's full name"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Instrument <span className="text-red-500">*</span>
          </label>
          <input
            name="instrument"
            type="text"
            value={formData.instrument}
            onChange={handleChange}
            placeholder="e.g., Guitar, Piano, Vocals, Violin"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
            required
          />
          <p className="text-sm text-slate-500 mt-1">The primary instrument this teacher specializes in</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Avatar URL <span className="text-slate-400 text-xs">(Optional)</span>
          </label>
          <input
            name="avatar"
            type="url"
            value={formData.avatar}
            onChange={handleChange}
            placeholder="https://example.com/avatar.jpg"
            className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
          />
          <p className="text-sm text-slate-500 mt-1">URL to the teacher's profile picture</p>
          {formData.avatar && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">Preview:</p>
              <div className="flex items-center gap-3">
                <img 
                  src={formData.avatar} 
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-green-300"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-2xl border-2 border-green-300 hidden">
                  👩‍🏫
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{formData.name || 'Teacher'}</p>
                  <p className="text-xs text-slate-600">🎵 {formData.instrument || 'Instrument'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl disabled:opacity-50 active:scale-95"
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
                <span>✅</span>
                <span>{teacher ? 'Update Teacher' : 'Create Teacher'}</span>
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
      </form>
    </div>
  )
}

export default function AdminTeachersPage() {
  const { user } = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const reload = async () => {
    try {
      setLoading(true)
      const teachersData = await apiGet('/teachers')
      setTeachers(teachersData)
    } catch (error) {
      console.error('Failed to load teachers:', error)
      toast.error('Failed to load teachers')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const handleSaveTeacher = async (formData) => {
    try {
      setSaving(true)
      const token = await getToken()
      
      if (editingTeacher) {
        await apiPut(`/teachers/${editingTeacher._id}`, formData, token)
        toast.success('Teacher updated successfully! ✅', {
          duration: 2000,
          icon: '🎉'
        })
      } else {
        await apiPost('/teachers', formData, token)
        toast.success('Teacher created successfully! 🎉', {
          duration: 2000,
          icon: '✅'
        })
      }
      
      setShowForm(false)
      setEditingTeacher(null)
      reload()
    } catch (error) {
      console.error('Failed to save teacher:', error)
      toast.error('Failed to save teacher. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTeacher = (teacher) => {
    setEditingTeacher(teacher)
    setShowForm(true)
    // Scroll to form
    setTimeout(() => {
      document.getElementById('teacher-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDeleteTeacher = async (teacher) => {
    if (!confirm(`Are you sure you want to delete "${teacher.name}"? This action cannot be undone.`)) return
    
    try {
      const token = await getToken()
      await apiDelete(`/teachers/${teacher._id}`, token)
      toast.success(`Teacher "${teacher.name}" deleted successfully! ✅`)
      reload()
    } catch (error) {
      console.error('Failed to delete teacher:', error)
      toast.error('Failed to delete teacher. Please try again.')
    }
  }

  const handleNewTeacher = () => {
    setEditingTeacher(null)
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('teacher-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const filteredTeachers = teachers.filter(teacher => {
    const query = searchQuery.toLowerCase()
    return teacher.name.toLowerCase().includes(query) || 
           teacher.instrument.toLowerCase().includes(query)
  })

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
          <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <a href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">👩‍🏫</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-lg">Teacher Management</span>
                  <div className="text-xs text-slate-500">Admin Panel</div>
                </div>
              </a>
            </div>
            <div className="hidden md:flex items-center gap-6 text-slate-700">
              <a href="/admin" className="hover:text-green-700 font-medium transition-colors">← Back to Admin</a>
              <a href="/" className="hover:text-green-700 font-medium transition-colors">Home</a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </header>

        <main className="pb-16">
          <div className="max-w-7xl mx-auto px-4 pt-8">
            {/* Welcome Section */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                  Teacher Management 👩‍🏫
                </h1>
                <p className="text-slate-600">Add, edit, and manage your music academy teachers</p>
              </div>
              <button
                onClick={reload}
                disabled={loading}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all font-medium text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm hover:shadow-md active:scale-95"
                title="Refresh"
              >
                <span className={`text-lg ${loading ? 'animate-spin' : ''}`}>🔄</span>
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Total Teachers</p>
                    <p className="text-3xl font-bold text-slate-900">{teachers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">👩‍🏫</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Active Teachers</p>
                    <p className="text-3xl font-bold text-slate-900">{teachers.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 mb-1">Instruments</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {new Set(teachers.map(t => t.instrument)).size}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">🎵</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Teacher Form */}
            {showForm && (
              <div id="teacher-form" className="mb-8 scroll-mt-8">
                <TeacherForm
                  teacher={editingTeacher}
                  onSave={handleSaveTeacher}
                  onCancel={() => {
                    setShowForm(false)
                    setEditingTeacher(null)
                  }}
                  loading={saving}
                />
              </div>
            )}

            {/* Teachers List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">All Teachers</h2>
                <button
                  onClick={handleNewTeacher}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>Add New Teacher</span>
                </button>
              </div>

              {/* Search */}
              {teachers.length > 0 && (
                <div className="mb-6">
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      placeholder="Search teachers by name or instrument..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 pl-10 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">🔍</span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
              ) : filteredTeachers.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-12 text-center">
                  {searchQuery ? (
                    <>
                      <div className="text-6xl mb-4">🔍</div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No teachers found</h3>
                      <p className="text-slate-600 mb-6">Try adjusting your search query</p>
                      <button
                        onClick={() => setSearchQuery('')}
                        className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                      >
                        Clear Search
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-6xl mb-4">👩‍🏫</div>
                      <h3 className="text-xl font-semibold text-slate-900 mb-2">No teachers yet</h3>
                      <p className="text-slate-600 mb-6">Get started by adding your first teacher</p>
                      <button
                        onClick={handleNewTeacher}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                      >
                        + Add First Teacher
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredTeachers.map((teacher) => (
                    <div 
                      key={teacher._id} 
                      className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-200 hover:border-green-300 group"
                    >
                      <div className="flex flex-col items-center text-center mb-4">
                        {teacher.avatar ? (
                          <img 
                            src={teacher.avatar} 
                            alt={teacher.name}
                            className="w-20 h-20 rounded-full object-cover mb-3 ring-2 ring-green-200 group-hover:ring-green-400 transition-all"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl mb-3 ring-2 ring-green-200 group-hover:ring-green-400 transition-all">
                            👩‍🏫
                          </div>
                        )}
                        <h3 className="font-bold text-lg text-slate-900 mb-1 group-hover:text-green-700 transition-colors">
                          {teacher.name}
                        </h3>
                        <p className="text-sm text-slate-600 flex items-center justify-center gap-1">
                          <span>🎵</span>
                          <span>{teacher.instrument}</span>
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTeacher(teacher)}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all shadow-sm hover:shadow-md active:scale-95 font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTeacher(teacher)}
                          className="flex-1 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all shadow-sm hover:shadow-md active:scale-95 font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}

