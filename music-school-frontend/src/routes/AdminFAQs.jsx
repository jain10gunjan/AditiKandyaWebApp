import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api.js'
import toast from 'react-hot-toast'

export default function AdminFAQs() {
  const { getToken } = useAuth()
  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    order: 0,
    isActive: true
  })

  const loadFAQs = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await apiGet('/admin/faqs', token)
      setFaqs(data)
    } catch (e) {
      console.error('Failed to load FAQs', e)
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (faq) => {
    setEditingId(faq._id)
    setFormData({
      question: faq.question,
      answer: faq.answer,
      order: faq.order || 0,
      isActive: faq.isActive !== undefined ? faq.isActive : true
    })
    setShowForm(true)
  }

  const handleNew = () => {
    setEditingId(null)
    setFormData({
      question: '',
      answer: '',
      order: 0,
      isActive: true
    })
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      if (editingId) {
        await apiPut(`/admin/faqs/${editingId}`, formData, token)
        toast.success('FAQ updated')
      } else {
        await apiPost('/admin/faqs', formData, token)
        toast.success('FAQ created')
      }
      setShowForm(false)
      setEditingId(null)
      loadFAQs()
    } catch (e) {
      console.error('Failed to save FAQ', e)
      toast.error('Failed to save FAQ')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return
    try {
      const token = await getToken()
      await apiDelete(`/admin/faqs/${id}`, token)
      toast.success('FAQ deleted')
      loadFAQs()
    } catch (e) {
      console.error('Failed to delete FAQ', e)
      toast.error('Failed to delete FAQ')
    }
  }

  useEffect(() => { loadFAQs() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Manage FAQs</h1>
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
          <div className="mb-6">
            <button
              onClick={handleNew}
              className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-semibold"
            >
              + Add New FAQ
            </button>
          </div>

          {showForm && (
            <div className="bg-white rounded-2xl shadow border border-slate-200 p-6 mb-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                {editingId ? 'Edit FAQ' : 'Create New FAQ'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Question *</label>
                  <input
                    type="text"
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Answer *</label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-3"
                    rows="4"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg p-3"
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-slate-700">Active</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm font-semibold"
                  >
                    {editingId ? 'Update FAQ' : 'Create FAQ'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false)
                      setEditingId(null)
                    }}
                    className="px-5 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 text-sm font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">FAQs</h2>
                <p className="text-sm text-slate-600">Manage frequently asked questions</p>
              </div>
              <button onClick={loadFAQs} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm">Refresh</button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              </div>
            ) : faqs.length === 0 ? (
              <div className="p-8 text-center text-slate-600">No FAQs yet. Click "Add New FAQ" to create one.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Order</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Question</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Answer</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {faqs.map((faq) => (
                      <tr key={faq._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-900 font-medium">{faq.order || 0}</td>
                        <td className="px-6 py-3 text-slate-900 font-medium">{faq.question}</td>
                        <td className="px-6 py-3 text-slate-600 text-sm max-w-md truncate">{faq.answer}</td>
                        <td className="px-6 py-3">
                          <span className={`text-xs px-2 py-1 rounded ${faq.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {faq.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => handleEdit(faq)}
                            className="text-sky-700 hover:text-sky-900 text-sm mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(faq._id)}
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
    </div>
  )
}

