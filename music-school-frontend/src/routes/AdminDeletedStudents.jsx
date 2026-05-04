import { useEffect, useMemo, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AdminDeletedStudents() {
  const { getToken } = useAuth()
  const [deleted, setDeleted] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [restoringId, setRestoringId] = useState(null)
  const [search, setSearch] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const headers = { Authorization: `Bearer ${token}` }

      const [deletedRes, coursesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments/deleted`, { headers }),
        apiGet('/courses'),
      ])

      if (!deletedRes.ok) throw new Error('Failed to load deleted students')
      const deletedData = await deletedRes.json()
      setDeleted(Array.isArray(deletedData) ? deletedData : [])
      setCourses(Array.isArray(coursesRes) ? coursesRes : [])
    } catch (e) {
      console.error('Failed to load deleted students:', e)
      toast.error('Failed to load deleted students')
      setDeleted([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const courseNameById = useMemo(() => {
    const m = new Map()
    for (const c of courses || []) m.set(String(c._id), c.title)
    return m
  }, [courses])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return deleted
    return (deleted || []).filter(e => {
      const name = String(e.name || '').toLowerCase()
      const email = String(e.email || '').toLowerCase()
      const course = String(e.course?.title || courseNameById.get(String(e.courseId)) || '').toLowerCase()
      return name.includes(q) || email.includes(q) || course.includes(q)
    })
  }, [deleted, search, courseNameById])

  const restore = async (enrollmentId) => {
    try {
      setRestoringId(enrollmentId)
      const token = await getToken()
      await apiPost(`/admin/enrollments/${enrollmentId}/restore`, {}, token)
      toast.success('Student restored and re-enrolled')
      await load()
    } catch (e) {
      console.error('Failed to restore enrollment:', e)
      toast.error('Failed to restore student')
    } finally {
      setRestoringId(null)
    }
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return String(value)
    return d.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Deleted Students</h1>
            <p className="text-slate-600 mt-1">Soft-deleted enrollments are preserved here and can be restored.</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="text-slate-700 hover:text-sky-700 font-medium">← Admin Panel</a>
          </nav>
        </div>

        <SignedOut>
          <div className="mt-6 bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-slate-600 mb-4">Please sign in to access deleted students</p>
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Total deleted: <span className="font-semibold text-slate-900">{deleted.length}</span>
              </div>
              <div className="flex gap-3 items-center">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name/email/course..."
                  className="w-72 max-w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                />
                <button
                  onClick={load}
                  disabled={loading}
                  className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors text-sm disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-600">
                Loading deleted students...
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center">
                <div className="text-6xl mb-4">🗑️</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Deleted Students</h3>
                <p className="text-slate-600">Deleted students will appear here for restoration.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {filtered.map((e) => {
                  const courseTitle = e.course?.title || courseNameById.get(String(e.courseId)) || 'Unknown Course'
                  return (
                    <div key={e._id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <div className="font-semibold text-slate-900 truncate">{e.name || e.email || 'Unknown Student'}</div>
                          {e.email && (
                            <span className="text-sm text-slate-600 truncate">{e.email}</span>
                          )}
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                            Deleted
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-slate-600 grid sm:grid-cols-2 gap-2">
                          <div><span className="text-slate-500">Course:</span> {courseTitle}</div>
                          <div><span className="text-slate-500">Instrument:</span> {e.instrument || '—'}</div>
                          <div><span className="text-slate-500">Enrolled:</span> {formatDateTime(e.createdAt)}</div>
                          <div><span className="text-slate-500">Deleted:</span> {formatDateTime(e.deletedAt)}</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => restore(e._id)}
                          disabled={restoringId === e._id}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-sm disabled:opacity-50"
                        >
                          {restoringId === e._id ? 'Restoring...' : 'Restore'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </SignedIn>
      </div>

      <Footer showAdminTools={true} />
    </div>
  )
}

