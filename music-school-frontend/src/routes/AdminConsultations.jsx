import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPut, apiDelete } from '../lib/api.js'
import toast from 'react-hot-toast'

export default function AdminConsultations() {
  const { getToken } = useAuth()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const data = await apiGet('/admin/consultations', token)
      setConsultations(data)
    } catch (e) {
      console.error('Failed to load consultations', e)
      toast.error('Failed to load consultations')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id, status) => {
    try {
      const token = await getToken()
      await apiPut(`/admin/consultations/${id}`, { status }, token)
      toast.success('Status updated')
      loadConsultations()
    } catch (e) {
      console.error('Failed to update status', e)
      toast.error('Failed to update status')
    }
  }

  const deleteConsultation = async (id) => {
    if (!confirm('Are you sure you want to delete this consultation request?')) return
    try {
      const token = await getToken()
      await apiDelete(`/admin/consultations/${id}`, token)
      toast.success('Consultation deleted')
      loadConsultations()
    } catch (e) {
      console.error('Failed to delete consultation', e)
      toast.error('Failed to delete consultation')
    }
  }

  useEffect(() => { loadConsultations() }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'new': return 'bg-green-100 text-green-800'
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">Consultation Requests</h1>
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
          <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-lg text-slate-900">Consultation Requests</h2>
                <p className="text-sm text-slate-600">Latest first</p>
              </div>
              <button onClick={loadConsultations} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm">Refresh</button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              </div>
            ) : consultations.length === 0 ? (
              <div className="p-8 text-center text-slate-600">No consultation requests yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Name</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Email</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Phone</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Preferred Date</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Preferred Time</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Status</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Received</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {consultations.map((consultation) => (
                      <tr key={consultation._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-900 font-medium">{consultation.name}</td>
                        <td className="px-6 py-3"><a href={`mailto:${consultation.email}`} className="text-sky-700 hover:underline">{consultation.email}</a></td>
                        <td className="px-6 py-3"><a href={`tel:${consultation.phone}`} className="text-sky-700 hover:underline">{consultation.phone}</a></td>
                        <td className="px-6 py-3">{consultation.preferredDate ? new Date(consultation.preferredDate).toLocaleDateString() : '-'}</td>
                        <td className="px-6 py-3">{consultation.preferredTime || '-'}</td>
                        <td className="px-6 py-3">
                          <select
                            value={consultation.status || 'new'}
                            onChange={(e) => updateStatus(consultation._id, e.target.value)}
                            className={`text-xs px-2 py-1 rounded ${getStatusColor(consultation.status || 'new')} border-0`}
                          >
                            <option value="new">New</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-3 text-slate-600 text-sm">{new Date(consultation.createdAt).toLocaleString()}</td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => {
                              const details = `Name: ${consultation.name}\nEmail: ${consultation.email}\nPhone: ${consultation.phone}\nPreferred Date: ${consultation.preferredDate}\nPreferred Time: ${consultation.preferredTime}\n\nMessage:\n${consultation.message || 'N/A'}`
                              alert(details)
                            }}
                            className="text-sky-700 hover:text-sky-900 text-sm mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => deleteConsultation(consultation._id)}
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

