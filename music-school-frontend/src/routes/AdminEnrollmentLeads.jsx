import { useEffect, useState } from 'react'
import { useAuth, useUser, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'

export default function AdminEnrollmentLeads() {
  const { getToken } = useAuth()
  const { user } = useUser()
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  const loadLeads = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/leads`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setLeads(await res.json())
      }
    } catch (e) {
      console.error('Failed to load leads', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLeads() }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-slate-900">New Enrollment Leads</h1>
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
                <h2 className="font-bold text-lg text-slate-900">Leads</h2>
                <p className="text-sm text-slate-600">Latest first</p>
              </div>
              <button onClick={loadLeads} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 text-sm">Refresh</button>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
              </div>
            ) : leads.length === 0 ? (
              <div className="p-8 text-center text-slate-600">No leads yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Full Name</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Email</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">WhatsApp</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Country</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-3">Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {leads.map((lead) => (
                      <tr key={lead._id} className="hover:bg-slate-50">
                        <td className="px-6 py-3 text-slate-900 font-medium">{lead.fullName}</td>
                        <td className="px-6 py-3"><a href={`mailto:${lead.email}`} className="text-sky-700 hover:underline">{lead.email}</a></td>
                        <td className="px-6 py-3">{lead.whatsapp || '-'}</td>
                        <td className="px-6 py-3">{lead.country || '-'}</td>
                        <td className="px-6 py-3 text-slate-600 text-sm">{new Date(lead.createdAt).toLocaleString()}</td>
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


