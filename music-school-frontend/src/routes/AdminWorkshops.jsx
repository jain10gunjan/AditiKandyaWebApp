import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AdminWorkshops() {
  const { getToken } = useAuth()
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingWorkshop, setEditingWorkshop] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    price: 0,
    maxParticipants: 20,
    isActive: true
  })

  const loadWorkshops = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await apiGet('/admin/workshops', token)
      setWorkshops(data)
    } catch (e) {
      console.error('Failed to load workshops', e)
      toast.error('Failed to load workshops')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      if (editingWorkshop) {
        await apiPut(`/admin/workshops/${editingWorkshop._id}`, formData, token)
        toast.success('Workshop updated')
      } else {
        await apiPost('/admin/workshops', formData, token)
        toast.success('Workshop created')
      }
      setShowForm(false)
      setEditingWorkshop(null)
      setFormData({
        title: '',
        description: '',
        image: '',
        date: '',
        time: '',
        duration: '',
        location: '',
        price: 0,
        maxParticipants: 20,
        isActive: true
      })
      loadWorkshops()
    } catch (e) {
      console.error('Failed to save workshop', e)
      toast.error('Failed to save workshop')
    }
  }

  const handleEdit = (workshop) => {
    setEditingWorkshop(workshop)
    setFormData({
      title: workshop.title || '',
      description: workshop.description || '',
      image: workshop.image || '',
      date: workshop.date || '',
      time: workshop.time || '',
      duration: workshop.duration || '',
      location: workshop.location || '',
      price: workshop.price || 0,
      maxParticipants: workshop.maxParticipants || 20,
      isActive: workshop.isActive !== undefined ? workshop.isActive : true
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this workshop?')) return
    try {
      const token = await getToken()
      await apiDelete(`/admin/workshops/${id}`, token)
      toast.success('Workshop deleted')
      loadWorkshops()
    } catch (e) {
      console.error('Failed to delete workshop', e)
      toast.error('Failed to delete workshop')
    }
  }

  useEffect(() => { loadWorkshops() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Workshop Management</h1>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setEditingWorkshop(null)
                setFormData({
                  title: '',
                  description: '',
                  image: '',
                  date: '',
                  time: '',
                  duration: '',
                  location: '',
                  price: 0,
                  maxParticipants: 20,
                  isActive: true
                })
                setShowForm(true)
              }}
              className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-sm"
            >
              + New Workshop
            </button>
            <nav className="flex gap-3 text-sm">
              <a href="/admin" className="text-slate-700 hover:text-sky-700">Admin Panel</a>
              <a href="/" className="text-slate-700 hover:text-sky-700">Home</a>
            </nav>
          </div>
        </div>

        <SignedOut>
          <div className="mt-6">
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-slate-900 text-white">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {showForm && (
            <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 mb-6">
              <h2 className="font-bold text-lg text-slate-900 mb-4">
                {editingWorkshop ? 'Edit Workshop' : 'Create New Workshop'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    rows="3"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                    <input
                      type="text"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="e.g., 10:00 AM - 2:00 PM"
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Duration</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 4 hours"
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Max Participants</label>
                    <input
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData({ ...formData, maxParticipants: Number(e.target.value) })}
                      className="w-full border border-slate-300 rounded-lg p-2"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm font-semibold text-slate-700">Active</span>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-full bg-slate-900 text-white hover:bg-slate-800 text-sm"
                  >
                    {editingWorkshop ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingWorkshop(null)
                    }}
                    className="px-5 py-2 rounded-full bg-slate-200 text-slate-700 hover:bg-slate-300 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <h2 className="font-bold text-lg text-slate-900">Workshops</h2>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              </div>
            ) : workshops.length === 0 ? (
              <div className="p-8 text-center text-slate-600">No workshops yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Title</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Date</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Price</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {workshops.map((workshop) => (
                      <tr key={workshop._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-900 font-medium">{workshop.title}</td>
                        <td className="px-6 py-3 text-slate-600">{workshop.date || '-'}</td>
                        <td className="px-6 py-3 text-slate-600">₹{workshop.price || 0}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${workshop.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {workshop.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleEdit(workshop)}
                            className="text-sky-700 hover:text-sky-900 text-sm mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(workshop._id)}
                            className="text-red-700 hover:text-red-900 text-sm"
                          >
                            Delete
                          </button>
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

