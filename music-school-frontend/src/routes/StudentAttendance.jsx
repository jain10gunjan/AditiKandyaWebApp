import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'

// Simple Bar Chart Component
function BarChart({ data, height = 200 }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  
  return (
    <div className="flex items-end justify-between gap-2 h-[200px]">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-2">
          <div className="relative w-full h-full flex items-end">
            <div
              className="w-full bg-gradient-to-t from-sky-500 to-blue-600 rounded-t-lg transition-all hover:from-sky-600 hover:to-blue-700"
              style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: item.value > 0 ? '4px' : '0' }}
            />
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-slate-700">
              {item.value}
            </div>
          </div>
          <div className="text-xs text-slate-600 text-center mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// Simple Line Chart Component
function LineChart({ data, height = 200 }) {
  const maxValue = Math.max(...data.map(d => d.value), 1)
  const width = 100
  const heightPx = height
  
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1 || 1)) * width
    const y = heightPx - (item.value / maxValue) * heightPx
    return `${x},${y}`
  }).join(' ')
  
  return (
    <div className="relative" style={{ height: `${heightPx}px` }}>
      <svg width="100%" height={heightPx} className="overflow-visible">
        <polyline
          fill="none"
          stroke="rgb(14, 165, 233)"
          strokeWidth="3"
          points={points}
          className="drop-shadow-sm"
        />
        {data.map((item, index) => {
          const x = (index / (data.length - 1 || 1)) * width
          const y = heightPx - (item.value / maxValue) * heightPx
          return (
            <g key={index}>
              <circle cx={`${x}%`} cy={y} r="4" fill="rgb(14, 165, 233)" />
              <text x={`${x}%`} y={y - 10} textAnchor="middle" className="text-xs fill-slate-600">
                {item.value}
              </text>
            </g>
          )
        })}
      </svg>
      <div className="flex justify-between mt-2 text-xs text-slate-600">
        {data.map((item, index) => (
          <span key={index} className="text-center">{item.label}</span>
        ))}
      </div>
    </div>
  )
}

// Pie Chart Component (using CSS)
function PieChart({ data, size = 150 }) {
  let cumulativePercentage = 0
  
  const segments = data.map((item, index) => {
    const start = cumulativePercentage
    const end = cumulativePercentage + item.percentage
    cumulativePercentage = end
    
    const colors = ['#0ea5e9', '#10b981', '#ef4444', '#f59e0b', '#8b5cf6']
    return {
      ...item,
      start,
      end,
      color: colors[index % colors.length]
    }
  })
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={size / 2 - 10} fill="none" stroke="#e5e7eb" strokeWidth="20" />
        {segments.map((segment, index) => {
          const circumference = 2 * Math.PI * (size / 2 - 10)
          const offset = circumference - (segment.start / 100) * circumference
          const dashArray = `${(segment.percentage / 100) * circumference} ${circumference}`
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={size / 2 - 10}
              fill="none"
              stroke={segment.color}
              strokeWidth="20"
              strokeDasharray={dashArray}
              strokeDashoffset={offset}
              className="transition-all"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-slate-900">{data.reduce((sum, item) => sum + item.value, 0)}</div>
          <div className="text-xs text-slate-600">Total</div>
        </div>
      </div>
    </div>
  )
}

function AttendanceTrends({ attendance, selectedCourse }) {
  // Group by month for trend analysis
  const monthlyData = attendance.reduce((acc, record) => {
    const date = new Date(record.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { present: 0, absent: 0, waived: 0, total: 0 }
    }
    if (record.status === 'present') acc[monthKey].present++
    else if (record.status === 'absent') acc[monthKey].absent++
    else if (record.status === 'waived') acc[monthKey].waived++
    acc[monthKey].total++
    return acc
  }, {})
  
  const trendData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6) // Last 6 months
    .map(([month, data]) => ({
      label: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short' }),
      present: data.present,
      absent: data.absent,
      waived: data.waived,
      total: data.total
    }))
  
  if (trendData.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Attendance Trends</h3>
        <div className="text-center py-8 text-slate-500">Not enough data to show trends</div>
      </div>
    )
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📈 6-Month Attendance Trends</h3>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Monthly Overview</h4>
          <BarChart
            data={trendData.map(month => ({
              label: month.label,
              value: month.present
            }))}
          />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-700 mb-3">Attendance Rate Trend</h4>
          <LineChart
            data={trendData.map(month => ({
              label: month.label,
              value: month.total > 0 ? Math.round((month.present / month.total) * 100) : 0
            }))}
          />
        </div>
      </div>
    </div>
  )
}

function QuickStats({ stats, attendance }) {
  const recentWeek = attendance
    .filter(a => {
      const recordDate = new Date(a.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return recordDate >= weekAgo
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
  
  const weekStats = {
    present: recentWeek.filter(a => a.status === 'present').length,
    absent: recentWeek.filter(a => a.status === 'absent').length,
    waived: recentWeek.filter(a => a.status === 'waived').length,
    total: recentWeek.length
  }
  
  const weekPercentage = weekStats.total > 0 ? Math.round((weekStats.present / weekStats.total) * 100) : 0
  
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 border border-green-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-green-700">Overall Rate</div>
          <div className="text-2xl">📊</div>
        </div>
        <div className="text-3xl font-bold text-green-700">{stats.percentage}%</div>
        <div className="text-xs text-green-600 mt-1">{stats.present}/{stats.total} classes</div>
      </div>
      
      <div className="bg-gradient-to-br from-blue-50 to-sky-100 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-blue-700">This Week</div>
          <div className="text-2xl">📅</div>
        </div>
        <div className="text-3xl font-bold text-blue-700">{weekPercentage}%</div>
        <div className="text-xs text-blue-600 mt-1">{weekStats.present}/{weekStats.total} classes</div>
      </div>
      
      <div className="bg-gradient-to-br from-amber-50 to-yellow-100 rounded-2xl p-6 border border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-amber-700">Best Streak</div>
          <div className="text-2xl">🔥</div>
        </div>
        <div className="text-3xl font-bold text-amber-700">
          {(() => {
            let maxStreak = 0
            let currentStreak = 0
            const sorted = [...attendance].sort((a, b) => new Date(a.date) - new Date(b.date))
            sorted.forEach(record => {
              if (record.status === 'present' || record.status === 'waived') {
                currentStreak++
                maxStreak = Math.max(maxStreak, currentStreak)
              } else {
                currentStreak = 0
              }
            })
            return maxStreak
          })()}
        </div>
        <div className="text-xs text-amber-600 mt-1">consecutive days</div>
      </div>
      
      <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-medium text-purple-700">Status</div>
          <div className="text-2xl">⭐</div>
        </div>
        <div className="text-lg font-bold text-purple-700">
          {stats.percentage >= 90 ? 'Excellent' :
           stats.percentage >= 75 ? 'Good' :
           stats.percentage >= 60 ? 'Fair' : 'Needs Improvement'}
        </div>
        <div className="text-xs text-purple-600 mt-1">Current standing</div>
      </div>
    </div>
  )
}

function AttendanceDistribution({ stats }) {
  const total = stats.present + stats.absent + stats.waived || 1
  const pieData = [
    { label: 'Present', value: stats.present, percentage: Math.round((stats.present / total) * 100) },
    { label: 'Waived', value: stats.waived, percentage: Math.round((stats.waived / total) * 100) },
    { label: 'Absent', value: stats.absent, percentage: Math.round((stats.absent / total) * 100) }
  ].filter(item => item.value > 0)
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4">📊 Attendance Distribution</h3>
      <div className="flex flex-col md:flex-row items-center gap-8">
        <PieChart data={pieData} />
        <div className="flex-1 space-y-3">
          {pieData.map((item, index) => {
            const colors = ['#0ea5e9', '#10b981', '#ef4444', '#f59e0b']
            const color = colors[index % colors.length]
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm font-semibold text-slate-900">{item.value} ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 mt-1">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${item.percentage}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function Sidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const { user } = useAuth()
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', href: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: '📚', href: '/dashboard' },
    { id: 'calendar', label: 'Calendar', icon: '📅', href: '/student/calendar' },
    { id: 'attendance', label: 'Attendance', icon: '📊', href: '/student/attendance' },
    { id: 'resources', label: 'Resources', icon: '📖', href: '/student/resources' },
    { id: 'schedule', label: 'Schedule', icon: '⏰', href: '/student/schedule' },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-56 lg:w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm lg:text-lg">🎶</span>
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 text-sm lg:text-base">Music Academy</h1>
                  <p className="text-xs text-slate-600">Student Dashboard</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg hover:bg-slate-100"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
          </div>

          {/* User Profile */}
          <div className="p-4 lg:p-6 border-b border-slate-200">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm lg:text-lg">
                  {user?.firstName?.[0] || user?.emailAddresses?.[0]?.emailAddress?.[0] || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 truncate text-sm lg:text-base">
                  {user?.firstName || 'Student'}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress || 'student@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 lg:p-4">
            <ul className="space-y-1 lg:space-y-2">
              {menuItems.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={() => onClose()}
                    className={`flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="text-lg lg:text-xl">{item.icon}</span>
                    <span className="font-medium text-sm lg:text-base">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-slate-600 hover:text-slate-900">
                <span className="text-sm lg:text-base">🏠</span>
                <span>Back to Home</span>
              </a>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default function StudentAttendance() {
  const { getToken } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('monthly')
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const activeTab = 'attendance'

  useEffect(() => {
    loadEnrollments()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadAttendance()
    }
  }, [selectedCourse, filter, selectedMonth, selectedYear])

  const loadEnrollments = async () => {
    try {
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/enrollments`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(url.toString(), { headers })
      if (res.ok) {
        const data = await res.json()
        setEnrollments(data)
        if (data.length > 0) {
          setSelectedCourse(data[0].course._id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadAttendance = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      
      let url = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/attendance/${selectedCourse}`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      
      if (filter === 'monthly') {
        url.searchParams.set('month', selectedMonth)
        url.searchParams.set('year', selectedYear)
      } else if (filter === 'yearly') {
        url.searchParams.set('year', selectedYear)
      }
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(url.toString(), { headers })
      
      if (res.ok) {
        const data = await res.json()
        // Sort by date descending
        data.sort((a, b) => new Date(b.date) - new Date(a.date))
        setAttendance(data)
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100 border-green-200'
      case 'absent': return 'text-red-600 bg-red-100 border-red-200'
      case 'waived': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present': return '✅'
      case 'absent': return '❌'
      case 'waived': return '📋'
      default: return '❓'
    }
  }

  const calculateStats = () => {
    const total = attendance.length
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const waived = attendance.filter(a => a.status === 'waived').length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { total, present, absent, waived, percentage }
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-6xl mb-6">🔒</div>
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Sign In Required</h2>
            <p className="text-slate-600 mb-6">Please sign in to view your attendance records</p>
            <SignInButton>
              <button className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="flex">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={() => {}} 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="lg:ml-16 xl:ml-20 flex-1 min-h-screen">
            <div className="flex-1 p-4 lg:p-6 xl:p-8">
              {/* Mobile Header */}
              <div className="lg:hidden mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-100"
                  >
                    <span className="text-xl">☰</span>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">🎶</span>
                    </div>
                    <span className="font-bold text-slate-900">Attendance</span>
                  </div>
                  <div className="w-8"></div> {/* Spacer for centering */}
                </div>
              </div>

              {/* Header */}
              <div className="mb-6 lg:mb-8">
                <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">My Attendance</h1>
                <p className="text-slate-600 text-sm lg:text-base">Track your attendance and view detailed insights</p>
              </div>
        
              <div className="max-w-7xl">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
                  </div>
                ) : (
                  <>
                    {enrollments.length === 0 ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
                        <div className="text-5xl mb-4">🎓</div>
                        <h3 className="text-xl font-semibold text-amber-800 mb-2">No Enrollments Found</h3>
                        <p className="text-amber-700 mb-6">You need to be enrolled in courses to view your attendance records.</p>
                        <a href="/courses" className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium">
                          Browse Courses
                        </a>
                      </div>
                    ) : (
                      <>
                        {/* Course and Filter Selection */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-6">
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                              <select 
                                value={selectedCourse} 
                                onChange={(e) => setSelectedCourse(e.target.value)}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                              >
                                {enrollments.map((enrollment) => (
                                  <option key={enrollment.course._id} value={enrollment.course._id}>
                                    {enrollment.course.title}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                              <select 
                                value={selectedMonth} 
                                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                              >
                                {Array.from({ length: 12 }, (_, i) => (
                                  <option key={i + 1} value={i + 1}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">Year</label>
                              <select 
                                value={selectedYear} 
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
                              >
                                {Array.from({ length: 5 }, (_, i) => {
                                  const year = new Date().getFullYear() - 2 + i
                                  return <option key={year} value={year}>{year}</option>
                                })}
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Quick Stats */}
                        {attendance.length > 0 && (
                          <>
                            <QuickStats stats={stats} attendance={attendance} />
                            
                            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                              <AttendanceDistribution stats={stats} />
                              <AttendanceTrends attendance={attendance} selectedCourse={selectedCourse} />
                            </div>
                          </>
                        )}

                        {/* Attendance Records List */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
                          <div className="p-6 border-b border-slate-200 bg-slate-50">
                            <h2 className="text-xl font-bold text-slate-900">Attendance Records</h2>
                            <p className="text-sm text-slate-600 mt-1">All attendance marked by your instructor</p>
                          </div>
                          <div className="p-6">
                            {attendance.length === 0 ? (
                              <div className="text-center py-12 text-slate-500">
                                <div className="text-5xl mb-4">📋</div>
                                <p className="text-lg font-medium">No attendance records found</p>
                                <p className="text-sm mt-2">Attendance will appear here once your instructor marks it.</p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {attendance.map((record) => (
                                  <div key={record._id} className="flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-white rounded-lg border border-slate-200 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                      <div className="text-3xl">{getStatusIcon(record.status)}</div>
                                      <div>
                                        <div className="font-semibold text-slate-900">
                                          {new Date(record.date).toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                          })}
                                        </div>
                                        {record.notes && (
                                          <div className="text-sm text-slate-600 mt-1">{record.notes}</div>
                                        )}
                                      </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${getStatusColor(record.status)}`}>
                                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SignedIn>
    </div>
  )
}
