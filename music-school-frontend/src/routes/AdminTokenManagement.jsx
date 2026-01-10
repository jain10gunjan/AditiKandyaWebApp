import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'
import toast from 'react-hot-toast'

function AdminTokenManagement() {
  const { getToken, isLoaded } = useAuth()
  const [loading, setLoading] = useState(false)
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [tokens, setTokens] = useState({})
  const [attendanceData, setAttendanceData] = useState({})
  const [debugInfo, setDebugInfo] = useState({})
  const [editingToken, setEditingToken] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isLoaded) {
      loadCourses()
      loadEnrollments()
    }
  }, [isLoaded])

  useEffect(() => {
    if (selectedCourse) {
      loadTokens()
      loadAttendanceForMonth()
    }
  }, [selectedCourse, selectedYear, selectedMonth])

  const loadCourses = async () => {
    try {
      const data = await apiGet('/courses')
      setCourses(data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses')
    }
  }

  const loadEnrollments = async () => {
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data || [])
      }
    } catch (error) {
      console.error('Error loading enrollments:', error)
    }
  }

  const loadTokens = async () => {
    if (!selectedCourse) return
    setLoading(true)
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return

      const tokensMap = {}
      const debugMap = {}
      const studentsInCourse = enrollments.filter(e => e.courseId === selectedCourse)
      
      for (const enrollment of studentsInCourse) {
        try {
          const tokenUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/tokens/${enrollment.userId}/${selectedCourse}?year=${selectedYear}&month=${selectedMonth}`
          const startTime = Date.now()
          const res = await fetch(tokenUrl, { 
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store'
          })
          const fetchTime = Date.now() - startTime
          
          if (res.ok) {
            const tokenData = await res.json()
            tokensMap[enrollment.userId] = tokenData
            
            // Calculate used tokens
            const usedTokens = tokenData.totalTokens - tokenData.remainingTokens - (tokenData.waivedTokens || 0)
            
            debugMap[enrollment.userId] = {
              fetchTime,
              status: res.status,
              data: tokenData,
              calculatedUsed: usedTokens,
              studentId: enrollment.userId,
              courseId: selectedCourse,
              year: selectedYear,
              month: selectedMonth
            }
          } else {
            const errorText = await res.text()
            debugMap[enrollment.userId] = {
              fetchTime,
              status: res.status,
              error: errorText,
              studentId: enrollment.userId,
              courseId: selectedCourse
            }
            console.error('Failed to load tokens for student:', enrollment.userId, res.status, errorText)
          }
        } catch (err) {
          debugMap[enrollment.userId] = {
            error: err.message,
            studentId: enrollment.userId
          }
          console.error('Error loading tokens for student:', enrollment.userId, err)
        }
      }
      
      setTokens(tokensMap)
      setDebugInfo(debugMap)
    } finally {
      setLoading(false)
    }
  }

  const loadAttendanceForMonth = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const year = selectedYear
      const month = selectedMonth
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month, 0).toISOString().split('T')[0]
      
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/attendance/${selectedCourse}/${startDate}/${endDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      if (res.ok) {
        const data = await res.json()
        // Group by studentId
        const attendanceMap = {}
        data.forEach(att => {
          if (!attendanceMap[att.studentId]) {
            attendanceMap[att.studentId] = []
          }
          attendanceMap[att.studentId].push(att)
        })
        setAttendanceData(attendanceMap)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  const handleSaveToken = async (studentId, courseId, updates) => {
    setSaving(true)
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/admin/tokens/${studentId}/${courseId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            ...updates,
            year: selectedYear,
            month: selectedMonth
          })
        }
      )

      if (res.ok) {
        const updated = await res.json()
        setTokens(prev => ({ ...prev, [studentId]: updated }))
        setEditingToken(null)
        toast.success('Token updated successfully')
        // Reload to get fresh data
        setTimeout(() => loadTokens(), 500)
      } else {
        const errorText = await res.text()
        toast.error(`Failed to update token: ${errorText}`)
      }
    } catch (err) {
      console.error('Error updating token:', err)
      toast.error('Error updating token')
    } finally {
      setSaving(false)
    }
  }

  const refreshToken = async (studentId) => {
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const tokenUrl = `${import.meta.env.VITE_API_BASE_URL}/admin/tokens/${studentId}/${selectedCourse}?year=${selectedYear}&month=${selectedMonth}`
      const res = await fetch(tokenUrl, { 
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })
      
      if (res.ok) {
        const tokenData = await res.json()
        setTokens(prev => ({ ...prev, [studentId]: tokenData }))
        toast.success('Token refreshed')
      } else {
        toast.error('Failed to refresh token')
      }
    } catch (err) {
      console.error('Error refreshing token:', err)
      toast.error('Error refreshing token')
    }
  }

  const course = courses.find(c => c._id === selectedCourse)
  const studentsInCourse = enrollments.filter(e => e.courseId === selectedCourse)

  return (
    <div className="min-h-screen bg-slate-50">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
            <SignInButton>
              <button className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
          <nav className="max-w-7xl mx-auto flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <a href="/admin" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎫</span>
                </div>
                <div>
                  <span className="font-extrabold text-slate-800 text-lg">Token Management</span>
                  <div className="text-xs text-slate-500">Debug & Manage Tokens</div>
                </div>
              </a>
            </div>
            <div className="flex items-center gap-4">
              <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">Admin</a>
              <a href="/admin/attendance" className="hover:text-sky-700 font-medium transition-colors">Attendance</a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </nav>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">Select a course</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>{course.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleDateString('en-US', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={loadTokens}
                disabled={loading || !selectedCourse}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Refresh Tokens'}
              </button>
            </div>
          </div>

          {/* Token Data Table */}
          {selectedCourse && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                <h2 className="text-lg font-semibold text-slate-900">
                  Token Data - {course?.title || selectedCourse}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Period: {new Date(selectedYear, selectedMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto"></div>
                  <p className="mt-2 text-slate-600">Loading tokens...</p>
                </div>
              ) : studentsInCourse.length === 0 ? (
                <div className="p-8 text-center text-slate-600">
                  No students enrolled in this course
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Remaining</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Used</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Waived</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Manual Adj</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Attendance Count</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {studentsInCourse.map((enrollment) => {
                        const tokenData = tokens[enrollment.userId] || {
                          remainingTokens: 4,
                          totalTokens: 4,
                          waivedTokens: 0,
                          manualAdjustment: 0
                        }
                        const usedTokens = tokenData.totalTokens - tokenData.remainingTokens - (tokenData.waivedTokens || 0)
                        const attendance = attendanceData[enrollment.userId] || []
                        const presentCount = attendance.filter(a => a.status === 'present').length
                        const absentCount = attendance.filter(a => a.status === 'absent').length
                        const waivedCount = attendance.filter(a => a.status === 'waived').length
                        const isEditing = editingToken === enrollment.userId
                        const debug = debugInfo[enrollment.userId]

                        return (
                          <tr key={enrollment.userId} className="hover:bg-slate-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-slate-900">{enrollment.userName || enrollment.userId}</div>
                              <div className="text-xs text-slate-500">{enrollment.userId}</div>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  defaultValue={tokenData.totalTokens}
                                  onBlur={(e) => {
                                    const newValue = parseInt(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      handleSaveToken(enrollment.userId, selectedCourse, { totalTokens: newValue })
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                />
                              ) : (
                                <span className="font-semibold">{tokenData.totalTokens}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  defaultValue={tokenData.remainingTokens}
                                  onBlur={(e) => {
                                    const newValue = parseInt(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      handleSaveToken(enrollment.userId, selectedCourse, { remainingTokens: newValue })
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                />
                              ) : (
                                <span className={`font-semibold ${
                                  tokenData.remainingTokens === 0 ? 'text-red-600' :
                                  tokenData.remainingTokens <= 1 ? 'text-amber-600' :
                                  'text-green-600'
                                }`}>
                                  {tokenData.remainingTokens}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-semibold text-red-600">{usedTokens}</span>
                            </td>
                            <td className="px-4 py-3">
                              {isEditing ? (
                                <input
                                  type="number"
                                  defaultValue={tokenData.waivedTokens || 0}
                                  onBlur={(e) => {
                                    const newValue = parseInt(e.target.value)
                                    if (!isNaN(newValue) && newValue >= 0) {
                                      handleSaveToken(enrollment.userId, selectedCourse, { waivedTokens: newValue })
                                    }
                                  }}
                                  className="w-20 px-2 py-1 border border-slate-300 rounded text-sm"
                                />
                              ) : (
                                <span className="font-semibold text-blue-600">{tokenData.waivedTokens || 0}</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm">{tokenData.manualAdjustment || 0}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-xs">
                                <div>P: {presentCount} | A: {absentCount} | W: {waivedCount}</div>
                                <div className="text-slate-500">Total: {attendance.length}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => setEditingToken(isEditing ? null : enrollment.userId)}
                                  className="px-3 py-1 text-xs bg-sky-100 text-sky-700 rounded hover:bg-sky-200"
                                >
                                  {isEditing ? 'Save' : 'Edit'}
                                </button>
                                <button
                                  onClick={() => refreshToken(enrollment.userId)}
                                  className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                                >
                                  Refresh
                                </button>
                                {debug && (
                                  <button
                                    onClick={() => {
                                      console.log('Debug info for', enrollment.userId, ':', debug)
                                      alert(`Debug Info:\n\n${JSON.stringify(debug, null, 2)}`)
                                    }}
                                    className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                                    title="View debug info"
                                  >
                                    Debug
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Debug Info Panel */}
          {Object.keys(debugInfo).length > 0 && (
            <div className="mt-6 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Debug Information</h3>
              <div className="space-y-2">
                <div className="text-sm text-slate-600">
                  <strong>Total Students:</strong> {Object.keys(debugInfo).length}
                </div>
                <div className="text-sm text-slate-600">
                  <strong>Successful Fetches:</strong> {Object.values(debugInfo).filter(d => d.status === 200).length}
                </div>
                <div className="text-sm text-slate-600">
                  <strong>Failed Fetches:</strong> {Object.values(debugInfo).filter(d => d.status !== 200).length}
                </div>
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                    View Full Debug Data
                  </summary>
                  <pre className="mt-2 p-4 bg-slate-100 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(debugInfo, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )}
        </main>
      </SignedIn>
    </div>
  )
}

export default AdminTokenManagement


