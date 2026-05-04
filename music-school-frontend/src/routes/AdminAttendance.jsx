import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost } from '../lib/api'
import { toLocalDateString, toLocalMonthString, parseLocalDate } from '../lib/dateUtils'

// Helper function to generate days for a month (uses local dates for consistency)
const generateDaysForMonth = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      day,
      date: toLocalDateString(date),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  return days
}

function AttendanceGrid({
  students,
  attendance,
  onMarkAttendance,
  saving,
  selectedDate,
  selectedMonth,
  selectedCourse,
  allowedDates, // { openDates: Record<string, true>, byStudent: Record<string, Record<string, true>> }
}) {
  const getAttendanceForStudent = (studentId, date) => {
    return attendance.find(a =>
      a.studentId === studentId &&
      a.date === date &&
      a.courseId === selectedCourse
    )
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 border-green-300'
      case 'absent': return 'bg-red-100 text-red-800 border-red-300'
      case 'waived': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const getStatusLetter = (status) => {
    switch (status) {
      case 'present': return 'P'
      case 'absent': return 'A'
      case 'waived': return 'W'
      default: return ''
    }
  }

  const currentDate = new Date()
  const firstOfMonth = selectedMonth ? parseLocalDate(selectedMonth + '-01') : currentDate
  const currentYear = firstOfMonth.getFullYear()
  const currentMonth = firstOfMonth.getMonth()
  const allDays = generateDaysForMonth(currentYear, currentMonth)

  // Only show "open" dates where at least one student has a schedule
  const openDatesMap = allowedDates?.openDates || {}
  const days = allDays.filter(d => openDatesMap[d.date])

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-900">
          Attendance Grid - {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Enter: P = Present, A = Absent, W = Waived. Click cells to mark attendance.
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b border-slate-300 bg-slate-100">
            {/* Student Info Column */}
            <div className="w-48 p-3 border-r border-slate-300 bg-slate-200">
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Student</div>
            </div>
            
            {/* Date Columns */}
            {days.map((day) => (
              <div 
                key={day.day} 
                className={`w-12 p-2 text-center border-r border-slate-300 ${
                  day.isWeekend ? 'bg-slate-200' : 'bg-slate-100'
                }`}
              >
                <div className="text-xs font-semibold text-slate-600">{day.dayName}</div>
                <div className="text-xs font-bold text-slate-800">{day.day}</div>
              </div>
            ))}
          </div>

          {/* Student Rows */}
          {students.map((student, index) => {
            console.log('Processing student:', student)
            const studentAllowed = allowedDates?.byStudent?.[student.userId] || {}
            return (
              <div key={student._id} className="flex border-b border-slate-200 hover:bg-slate-50">
              {/* Student Info */}
              <div className="w-48 p-3 border-r border-slate-300 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {student.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {student.name || 'Unknown Student'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {student.instrument || 'No instrument'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Attendance Cells */}
              {days.map((day) => {
                const studentAttendance = getAttendanceForStudent(student.userId, day.date)
                const isToday = day.date === selectedDate
                const isAllowed = Boolean(studentAllowed[day.date])
                
                return (
                  <div 
                    key={`${student._id}-${day.day}`}
                    className={`w-12 h-12 border-r border-slate-300 flex items-center justify-center transition-colors ${
                      !isAllowed
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : day.isWeekend ? 'bg-slate-100 cursor-pointer' : 'bg-white cursor-pointer'
                    } ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''}`}
                    onClick={() => {
                      if (!saving && isAllowed) {
                        // Cycle through statuses: empty -> present -> waived -> absent -> empty
                        const currentStatus = studentAttendance?.status
                        let nextStatus = 'present'
                        
                        if (currentStatus === 'present') nextStatus = 'waived'
                        else if (currentStatus === 'waived') nextStatus = 'absent'
                        else if (currentStatus === 'absent') nextStatus = 'present'
                        
                        onMarkAttendance(student.userId, nextStatus, '', day.date)
                      }
                    }}
                    title={!isAllowed ? 'No schedule for this student on this date' : 'Click to mark attendance'}
                  >
                    {studentAttendance && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${getStatusColor(studentAttendance.status)}`}>
                        {getStatusLetter(studentAttendance.status)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            )
          })}
        </div>
      </div>

      {days.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scheduled Classes</h3>
          <p className="text-slate-600">There are no student schedules for this course in the selected month.</p>
        </div>
      )}
      
      {students.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Found</h3>
          <p className="text-slate-600">This course doesn't have any enrolled students yet.</p>
        </div>
      )}
    </div>
  )
}

function AttendanceStats({ stats }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Total Students</p>
            <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Present</p>
            <p className="text-2xl font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">✅</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Absent</p>
            <p className="text-2xl font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">❌</span>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Waived</p>
            <p className="text-2xl font-bold text-blue-600">{stats.waived}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📋</span>
          </div>
        </div>
      </div>
      
      
    </div>
  )
}

export default function AdminAttendance() {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dayRows, setDayRows] = useState([]) // daily roster across all courses for selectedDate
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()))
  const [selectedMonth, setSelectedMonth] = useState(() => toLocalMonthString(new Date()))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCourseData, setSelectedCourseData] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [allowedDates, setAllowedDates] = useState({ openDates: {}, byStudent: {} })
  const [loadingScheduleDates, setLoadingScheduleDates] = useState(false)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadStudents()
      loadAttendance()
      const courseData = courses.find(c => c._id === selectedCourse)
      setSelectedCourseData(courseData)
    }
  }, [selectedCourse, selectedMonth, courses])

  // Load daily roster for selectedDate across all courses (Daily Table View)
  useEffect(() => {
    if (viewMode !== 'table') return
    if (!selectedDate) return
    loadAttendanceDay()
  }, [viewMode, selectedDate])

  useEffect(() => {
    if (selectedCourse && selectedMonth) {
      loadScheduleDatesForMonth()
    } else {
      setAllowedDates({ openDates: {}, byStudent: {} })
    }
  }, [selectedCourse, selectedMonth, students.length])

  const loadScheduleDatesForMonth = async () => {
    if (!selectedCourse || !selectedMonth) return

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`

    const first = parseLocalDate(selectedMonth + '-01')
    const startDate = toLocalDateString(new Date(first.getFullYear(), first.getMonth(), 1))
    const endDate = toLocalDateString(new Date(first.getFullYear(), first.getMonth() + 1, 0))

    const studentIds = (students || [])
      .map(s => String(s.userId || '').trim())
      .filter(Boolean)

    try {
      setLoadingScheduleDates(true)
      const token = await getToken()
      const params = new URLSearchParams({
        courseId: String(selectedCourse),
        startDate,
        endDate,
      })
      if (studentIds.length > 0) {
        params.set('studentIds', studentIds.join(','))
      }

      const res = await fetch(`${baseUrl}/admin/student-schedules-range?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setAllowedDates({ openDates: {}, byStudent: {} })
        return
      }

      const schedules = await res.json()

      // Build indexes:
      // - openDates: dates where at least one student has a schedule
      // - byStudent: for each studentId, dates where they have schedule
      const openDates = {}
      const byStudent = {}

      for (const s of schedules || []) {
        const sid = String(s.studentId || '').trim()
        if (!sid) continue
        const d = s.startTime ? toLocalDateString(new Date(s.startTime)) : ''
        if (!d) continue

        openDates[d] = true
        if (!byStudent[sid]) byStudent[sid] = {}
        byStudent[sid][d] = true
      }

      setAllowedDates({ openDates, byStudent })
    } catch (e) {
      console.error('Error loading schedule dates for month:', e)
      setAllowedDates({ openDates: {}, byStudent: {} })
    } finally {
      setLoadingScheduleDates(false)
    }
  }

  // Keep selectedDate inside selected month when month changes
  useEffect(() => {
    if (!selectedMonth || !selectedDate) return
    const first = parseLocalDate(selectedMonth + '-01')
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0)
    const current = parseLocalDate(selectedDate)
    if (current < first || current > last) {
      setSelectedDate(toLocalDateString(first))
    }
  }, [selectedMonth])

  const loadCourses = async () => {
    try {
      setLoading(true)
      const data = await apiGet('/courses')
      setCourses(data)
      if (data.length > 0) {
        setSelectedCourse(data[0]._id)
      }
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStudents = async () => {
    if (!selectedCourse) return

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`

    try {
      const token = await getToken()
      const res = await fetch(`${baseUrl}/admin/courses/${selectedCourse}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      } else {
        // Fallback: get students from enrollments
        const enrollmentsRes = await fetch(`${baseUrl}/admin/enrollments`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (enrollmentsRes.ok) {
          const enrollments = await enrollmentsRes.json()
          const courseEnrollments = enrollments.filter(e => e.courseId === selectedCourse && e.approved)
          setStudents(courseEnrollments.map(e => ({
            _id: e._id,
            userId: e.userId,
            name: e.name,
            email: e.email,
            instrument: e.instrument,
            enrolledAt: e.createdAt
          })))
        }
      }
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const loadAttendance = async () => {
    if (!selectedCourse || !selectedMonth) return

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`

    try {
      const token = await getToken()
      const year = parseLocalDate(selectedMonth + '-01').getFullYear()
      const month = parseLocalDate(selectedMonth + '-01').getMonth()
      const startDate = toLocalDateString(new Date(year, month, 1))
      const endDate = toLocalDateString(new Date(year, month + 1, 0))

      const res = await fetch(`${baseUrl}/admin/attendance/${selectedCourse}/${startDate}/${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        setAttendance(data)
      } else {
        const today = toLocalDateString(new Date())
        const fallbackRes = await fetch(`${baseUrl}/admin/attendance/${selectedCourse}/${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          setAttendance(fallbackData)
        } else {
          setAttendance([])
        }
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendance([])
    }
  }

  const loadAttendanceDay = async () => {
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
    const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`

    try {
      const token = await getToken()
      const res = await fetch(`${baseUrl}/admin/attendance-day/${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) {
        setDayRows([])
        return
      }
      const data = await res.json()
      setDayRows(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading attendance day:', error)
      setDayRows([])
    }
  }

  const markAttendance = async (studentId, status, notes = '', date = null, courseIdOverride = null) => {
    const courseIdToUse = courseIdOverride || selectedCourse
    if (!courseIdToUse) return
    
    const attendanceDate = date || selectedDate
    setSaving(true)
    try {
      const token = await getToken()
      const response = await apiPost('/admin/attendance', {
        studentId,
        courseId: courseIdToUse,
        date: attendanceDate,
        status,
        notes
      }, token)
      
      // Update local state immediately for better UX
      setAttendance(prev => {
        const existingIndex = prev.findIndex(a => 
          a.studentId === studentId && 
          a.date === attendanceDate &&
          a.courseId === courseIdToUse
        )
        
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], status, notes }
          return updated
        } else {
          return [...prev, { studentId, courseId: courseIdToUse, status, notes, date: attendanceDate }]
        }
      })

      // If we're in daily mode, update dayRows too
      if (viewMode === 'table') {
        setDayRows(prev => prev.map(r => {
          if (String(r.studentId) === String(studentId) && String(r.courseId) === String(courseIdToUse) && String(r.date) === String(attendanceDate)) {
            return { ...r, status, notes }
          }
          return r
        }))
      }
      
      // Don't auto-reload immediately to prevent reset
      // setTimeout(() => {
      //   loadAttendance()
      // }, 1000)
      
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Failed to mark attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const byStudent = allowedDates?.byStudent || {}
    const openDates = allowedDates?.openDates || {}

    // Only count sessions that have schedules (studentId + date)
    let totalPossibleRecords = 0
    for (const s of students) {
      const sid = String(s.userId || '').trim()
      const datesForStudent = byStudent[sid] || {}
      totalPossibleRecords += Object.keys(datesForStudent).length
    }
    
    const eligibleAttendance = attendance.filter(a => {
      const sid = String(a.studentId || '').trim()
      const d = String(a.date || '').trim()
      return Boolean(byStudent[sid]?.[d]) || Boolean(openDates[d])
    })

    const present = eligibleAttendance.filter(a => a.status === 'present').length
    const absent = eligibleAttendance.filter(a => a.status === 'absent').length
    const waived = eligibleAttendance.filter(a => a.status === 'waived').length
    const marked = eligibleAttendance.length
    const unmarked = Math.max(0, totalPossibleRecords - marked)
    
    return { total, present, absent, waived, marked, unmarked }
  }

  const stats = getAttendanceStats()

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <a href="/admin" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎶</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg">Attendance Management</span>
                <div className="text-xs text-slate-500">Admin Panel</div>
              </div>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">Admin</a>
            <a href="/courses" className="hover:text-sky-700 font-medium transition-colors">Courses</a>
            <a href="/dashboard" className="hover:text-sky-700 font-medium transition-colors">Dashboard</a>
            <UserButton afterSignOutUrl="/" />
          </div>
        </nav>
      </header>

      <main className="pb-16">
        <div className="max-w-6xl mx-auto px-4 pt-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
              Attendance Management
            </h1>
            <p className="text-slate-600">Track and manage student attendance for your courses</p>
          </div>

          <SignedOut>
            <div className="text-center py-12">
              <div className="text-6xl mb-6">🔒</div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Authentication Required</h2>
              <p className="text-slate-600 mb-6">Please sign in to access attendance management</p>
              <SignInButton>
                <button className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </SignedOut>

          <SignedIn>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
              </div>
            ) : (
              <>
                {/* Course and Date Selection */}
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-900">Select Course and Time Period</h2>
                     
                  </div>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Course</label>
                      <select 
                        value={selectedCourse} 
                        onChange={(e) => setSelectedCourse(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        {courses.map((course) => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Month</label>
                      <input 
                        type="month" 
                        value={selectedMonth} 
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">View Mode</label>
                      <select 
                        value={viewMode} 
                        onChange={(e) => setViewMode(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="grid">Excel Grid View</option>
                        <option value="table">Daily Table View</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <div className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-sm text-slate-600">Selected Course</div>
                        <div className="font-semibold text-slate-900">
                          {selectedCourseData?.title || 'No course selected'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Date selector for daily view */}
                  <div className="mt-6 grid md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div className="md:col-span-3 flex items-end">
                      {viewMode === 'table' && (
                        <div className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700">
                          Showing all students who have a scheduled class on this date (grouped by course).
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                 

                {/* Attendance Statistics */}
                {selectedCourse && students.length > 0 && (
                  <AttendanceStats stats={stats} />
                )}

                {/* Attendance Display */}
                {selectedCourse && students.length > 0 && (
                  <>
                    {viewMode === 'grid' ? (
                      <AttendanceGrid
                        students={students}
                        attendance={attendance}
                        onMarkAttendance={markAttendance}
                        saving={saving}
                        selectedDate={selectedDate}
                        selectedMonth={selectedMonth}
                        selectedCourse={selectedCourse}
                        allowedDates={allowedDates}
                      />
                    ) : (
                      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Attendance - {selectedDate}</h3>

                        {dayRows.length === 0 ? (
                          <div className="text-center py-10 text-slate-600">
                            No scheduled classes found for this date.
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {Object.entries(
                              dayRows.reduce((acc, row) => {
                                const key = row.courseTitle || 'Unknown Course'
                                if (!acc[key]) acc[key] = []
                                acc[key].push(row)
                                return acc
                              }, {})
                            ).map(([courseTitle, rows]) => (
                              <div key={courseTitle} className="border border-slate-200 rounded-xl overflow-hidden">
                                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                                  <div className="font-semibold text-slate-900">{courseTitle}</div>
                                  <div className="text-xs text-slate-600">{rows.length} student(s)</div>
                                </div>

                                <div className="divide-y divide-slate-200">
                                  {rows.map((row) => {
                                    const status = row.status
                                    const statusLabel = status
                                      ? status.charAt(0).toUpperCase() + status.slice(1)
                                      : 'Not Marked'
                                    const badgeClass = !status
                                      ? 'bg-gray-100 text-gray-800 border-gray-200'
                                      : status === 'present'
                                        ? 'bg-green-100 text-green-800 border-green-200'
                                        : status === 'absent'
                                          ? 'bg-red-100 text-red-800 border-red-200'
                                          : status === 'late'
                                            ? 'bg-amber-100 text-amber-900 border-amber-200'
                                            : 'bg-blue-100 text-blue-800 border-blue-200'

                                    return (
                                      <div key={`${row.courseId}-${row.studentId}`} className="flex items-center justify-between p-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                          <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                            {row.studentName?.charAt(0)?.toUpperCase() || 'U'}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-medium text-slate-900 truncate">{row.studentName}</div>
                                            <div className="text-sm text-slate-600 truncate">
                                              {row.studentEmail || row.instrument || ''}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${badgeClass}`}>
                                            {statusLabel}
                                          </span>

                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => markAttendance(row.studentId, 'present', '', selectedDate, row.courseId)}
                                              disabled={saving}
                                              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                status === 'present'
                                                  ? 'bg-green-600 text-white'
                                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                              } disabled:opacity-50`}
                                            >
                                              Present
                                            </button>
                                            <button
                                              onClick={() => markAttendance(row.studentId, 'late', '', selectedDate, row.courseId)}
                                              disabled={saving}
                                              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                status === 'late'
                                                  ? 'bg-amber-600 text-white'
                                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                                              } disabled:opacity-50`}
                                            >
                                              Late
                                            </button>
                                            <button
                                              onClick={() => markAttendance(row.studentId, 'absent', '', selectedDate, row.courseId)}
                                              disabled={saving}
                                              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                                status === 'absent'
                                                  ? 'bg-red-600 text-white'
                                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                                              } disabled:opacity-50`}
                                            >
                                              Absent
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Empty States */}
                {selectedCourse && students.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                    <div className="text-6xl mb-6">👥</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">No Students Enrolled</h3>
                    <p className="text-slate-600 mb-6">This course doesn't have any enrolled students yet.</p>
                    <a 
                      href="/admin" 
                      className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                    >
                      Back to Admin Panel
                    </a>
                  </div>
                )}

                {courses.length === 0 && (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                    <div className="text-6xl mb-6">📚</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">No Courses Available</h3>
                    <p className="text-slate-600 mb-6">Create some courses first to manage attendance.</p>
                    <a 
                      href="/admin" 
                      className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                    >
                      Create Course
                    </a>
                  </div>
                )}
              </>
            )}
          </SignedIn>
        </div>
      </main>

      {/* Enhanced Footer */}
      <footer className="border-t mt-20 bg-gradient-to-r from-slate-50 to-sky-50">
        <div className="max-w-6xl mx-auto p-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🎶</span>
                </div>
                <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
              </div>
              <p className="text-slate-600 text-sm">Making music education accessible and fun for everyone.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="/courses" className="hover:text-sky-700 transition-colors">Courses</a></li>
                <li><a href="/teachers" className="hover:text-sky-700 transition-colors">Teachers</a></li>
                <li><a href="/schedule" className="hover:text-sky-700 transition-colors">Schedule</a></li>
                <li><a href="/dashboard" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Contact</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li>📧 support@themusinest.com</li>
                <li>📞 +91-98765-43210</li>
                <li>📍 Mumbai, India</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-4">Admin Tools</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li><a href="/admin" className="hover:text-sky-700 transition-colors">Dashboard</a></li>
                <li><a href="/admin/attendance" className="hover:text-sky-700 transition-colors">Attendance</a></li>
                <li><a href="/admin/calendar" className="hover:text-sky-700 transition-colors">Calendar</a></li>
                <li><a href="/admin/resources" className="hover:text-sky-700 transition-colors">Resources</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
          </div>
        </div>
      </footer>
    </div>
  )
}

