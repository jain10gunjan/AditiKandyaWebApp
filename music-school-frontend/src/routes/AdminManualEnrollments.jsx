import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AdminManualEnrollments() {
  const { getToken } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    courseId: '',
    approved: true,
    instrument: ''
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      // Load manual enrollments
      const resEnrollments = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments/manual`, { headers })
      if (resEnrollments.ok) {
        const data = await resEnrollments.json()
        setEnrollments(data)
      }

      // Load courses
      const resCourses = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses`, { headers })
      if (resCourses.ok) {
        const coursesData = await resCourses.json()
        setCourses(coursesData)
      }
    } catch (e) {
      console.error('Failed to load data', e)
      toast.error('Failed to load enrollments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleEdit = (enrollment) => {
    setFormData({
      name: enrollment.name || '',
      email: enrollment.email || '',
      courseId: enrollment.courseId || '',
      approved: enrollment.approved !== undefined ? enrollment.approved : true,
      instrument: enrollment.instrument || ''
    })
    setEditingId(enrollment._id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this enrollment? This action cannot be undone.')) {
      return
    }

    try {
      const token = await getToken()
      await apiDelete(`/admin/enrollments/${id}`, token)
      toast.success('Enrollment deleted successfully')
      loadData()
    } catch (error) {
      console.error('Failed to delete enrollment:', error)
      toast.error('Failed to delete enrollment')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      
      if (editingId) {
        // Update existing enrollment
        await apiPut(`/admin/enrollments/${editingId}`, formData, token)
        toast.success('Enrollment updated successfully')
      } else {
        // Create new manual enrollment
        await apiPost('/admin/enrollments/manual', {
          email: formData.email,
          courseId: formData.courseId,
          name: formData.name
        }, token)
        toast.success('Enrollment created successfully')
      }
      
      setShowForm(false)
      setEditingId(null)
      setFormData({ name: '', email: '', courseId: '', approved: true, instrument: '' })
      loadData()
    } catch (error) {
      console.error('Failed to save enrollment:', error)
      toast.error(error.message || 'Failed to save enrollment')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: '', email: '', courseId: '', approved: true, instrument: '' })
  }

  const getCourseName = (courseId) => {
    if (!courseId) return 'N/A'
    const course = courses.find(c => c._id === courseId)
    return course ? course.title : 'Unknown Course'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Manual Enrollments</h1>
            <p className="text-slate-600 mt-1">Manage manually created student enrollments</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingId(null)
                setFormData({ name: '', email: '', courseId: '', approved: true, instrument: '' })
                setShowForm(true)
              }}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
            >
              + Add Enrollment
            </button>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            >
              Refresh
            </button>
            <a href="/admin" className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium">
              Admin Panel
            </a>
          </div>
        </div>

        <SignedOut>
          <div className="bg-white rounded-2xl shadow border border-slate-200 p-8 text-center">
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-slate-900 text-white">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Add/Edit Form */}
          {showForm && (
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {editingId ? 'Edit Enrollment' : 'Add New Enrollment'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Student Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Course <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.courseId}
                      onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      required
                    >
                      <option value="">Select a course</option>
                      {courses.map(course => (
                        <option key={course._id} value={course._id}>
                          {course.title} - ₹{course.price}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Instrument (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.instrument}
                      onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      placeholder="e.g., Guitar, Piano"
                    />
                  </div>
                  {editingId && (
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="approved"
                        checked={formData.approved}
                        onChange={(e) => setFormData({ ...formData, approved: e.target.checked })}
                        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                      />
                      <label htmlFor="approved" className="ml-2 text-sm font-medium text-slate-700">
                        Approved
                      </label>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                  >
                    {editingId ? 'Update' : 'Create'} Enrollment
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Enrollments Table */}
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-900">Manual Enrollments</h2>
              <p className="text-sm text-slate-600 mt-1">Total: {enrollments.length}</p>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              </div>
            ) : enrollments.length === 0 ? (
              <div className="p-8 text-center text-slate-600">
                No manual enrollments found. Click "Add Enrollment" to create one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Student Name
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Email
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Course
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Instrument
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Created
                      </th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-900 font-medium">
                          {enrollment.name || 'N/A'}
                        </td>
                        <td className="px-6 py-3">
                          <a
                            href={`mailto:${enrollment.email}`}
                            className="text-sky-700 hover:underline"
                          >
                            {enrollment.email}
                          </a>
                        </td>
                        <td className="px-6 py-3 text-slate-700">
                          {enrollment.course ? (
                            <a
                              href={`/courses/${enrollment.courseId}`}
                              className="text-sky-700 hover:underline"
                            >
                              {enrollment.course.title}
                            </a>
                          ) : (
                            <span className="text-slate-400">
                              {getCourseName(enrollment.courseId)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {enrollment.instrument || '-'}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              enrollment.approved
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {enrollment.approved ? 'Approved' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-slate-600 text-sm">
                          {new Date(enrollment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(enrollment)}
                              className="px-3 py-1 bg-sky-100 text-sky-700 rounded hover:bg-sky-200 transition-colors text-sm font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(enrollment._id)}
                              className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors text-sm font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SignedIn>
      </div>

      <Footer />
    </div>
  )
}

