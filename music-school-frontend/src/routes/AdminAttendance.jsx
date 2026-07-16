import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiDelete } from '../lib/api'
import { toLocalDateString, toLocalMonthString, parseLocalDate } from '../lib/dateUtils'

function getApiBaseUrl() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
  return apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
}

function enrollmentKey(studentId, courseId) {
  return `${String(studentId || '').trim()}::${String(courseId || '').trim()}`
}

function buildCourseTitleMap(courses) {
  const map = {}
  for (const c of courses || []) {
    const title = String(c?.title || '').trim() || 'Untitled Course'
    const id = String(c?._id || c?.id || '').trim()
    if (id) map[id] = title
  }
  return map
}

function resolveCourseTitle(courseId, courseTitleById, hint) {
  const cid = String(courseId || '').trim()
  const badHints = new Set(['Unknown Course', 'Removed course', 'No course', ''])
  const hintOk = hint && !badHints.has(String(hint).trim()) ? String(hint).trim() : null
  if (cid && courseTitleById[cid]) return courseTitleById[cid]
  if (hintOk) return hintOk
  if (!cid) return 'No course'
  return 'Removed course'
}

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
  allowedDates, // { openDates, byEnrollment: Record<enrollmentKey, Record<date, true>> }
  showCourseColumn = false,
  courseTitleById = {},
}) {
  const attendanceByKey = useMemo(() => {
    const map = new Map()
    for (const a of attendance || []) {
      const key = `${String(a.studentId || '').trim()}::${String(a.courseId || '').trim()}::${String(a.date || '').trim()}`
      map.set(key, a)
    }
    return map
  }, [attendance])

  const getAttendanceForStudent = (studentId, date, courseId) => {
    return attendanceByKey.get(`${String(studentId || '').trim()}::${String(courseId || '').trim()}::${String(date || '').trim()}`)
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
  const studentColWidth = showCourseColumn ? 'w-64' : 'w-48'

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-900">
          Attendance Grid - {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </h3>
        <p className="text-sm text-slate-600 mt-1">
          Click to cycle: Present → Waived → Absent → Clear.
          {showCourseColumn ? ' Students enrolled in multiple courses appear once per course.' : ''}
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-max">
          {/* Header Row */}
          <div className="flex border-b border-slate-300 bg-slate-100">
            {/* Student Info Column */}
            <div className={`${studentColWidth} p-3 border-r border-slate-300 bg-slate-200`}>
              <div className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {showCourseColumn ? 'Student / Course' : 'Student'}
              </div>
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

          {/* Student Rows — one row per enrollment (student + course) */}
          {students.map((student) => {
            const rowCourseId = String(student.courseId || selectedCourse || '').trim()
            const rowKey = enrollmentKey(student.userId, rowCourseId)
            const studentAllowed = allowedDates?.byEnrollment?.[rowKey] || {}
            const courseTitle = resolveCourseTitle(rowCourseId, courseTitleById, student.courseTitle)

            return (
              <div key={student._id || rowKey} className="flex border-b border-slate-200 hover:bg-slate-50">
              {/* Student Info */}
              <div className={`${studentColWidth} p-3 border-r border-slate-300 bg-white`}>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                    {student.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">
                      {student.name || 'Unknown Student'}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {showCourseColumn
                        ? courseTitle
                        : (student.instrument || 'No instrument')}
                    </div>
                    {showCourseColumn && student.instrument && (
                      <div className="text-xs text-slate-400 truncate">{student.instrument}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Attendance Cells */}
              {days.map((day) => {
                const studentAttendance = getAttendanceForStudent(student.userId, day.date, rowCourseId)
                const isToday = day.date === selectedDate
                const isAllowed = Boolean(studentAllowed[day.date])
                
                return (
                  <div 
                    key={`${student._id || rowKey}-${day.day}`}
                    className={`w-12 h-12 border-r border-slate-300 flex items-center justify-center transition-colors ${
                      !isAllowed
                        ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                        : day.isWeekend ? 'bg-slate-100 cursor-pointer' : 'bg-white cursor-pointer'
                    } ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''}`}
                    onClick={() => {
                      if (!saving && isAllowed && rowCourseId && rowCourseId !== 'all') {
                        const currentStatus = studentAttendance?.status
                        let nextStatus = 'present'

                        if (currentStatus === 'present') nextStatus = 'waived'
                        else if (currentStatus === 'waived') nextStatus = 'absent'
                        else if (currentStatus === 'absent') nextStatus = null // clear / unmarked

                        onMarkAttendance(student.userId, nextStatus, '', day.date, rowCourseId)
                      }
                    }}
                    title={
                      !isAllowed
                        ? 'No schedule for this student on this date'
                        : studentAttendance?.status === 'absent'
                          ? 'Click to clear attendance'
                          : 'Click to mark attendance'
                    }
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

      {days.length === 0 && students.length > 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📅</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Scheduled Classes</h3>
          <p className="text-slate-600">
            {showCourseColumn
              ? 'There are no student schedules for any course in the selected month.'
              : 'There are no student schedules for this course in the selected month.'}
          </p>
        </div>
      )}
      
      {students.length === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Students Found</h3>
          <p className="text-slate-600">
            {showCourseColumn
              ? 'No approved enrollments found across courses yet.'
              : "This course doesn't have any enrolled students yet."}
          </p>
        </div>
      )}
    </div>
  )
}

function AttendanceStats({ stats, isAllCourses = false }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      <div className="bg-white rounded-xl p-6 border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">{isAllCourses ? 'Enrollments' : 'Total Students'}</p>
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
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState([])
  const [dayRows, setDayRows] = useState([]) // daily roster across all courses for selectedDate
  const [selectedDate, setSelectedDate] = useState(() => toLocalDateString(new Date()))
  const [selectedMonth, setSelectedMonth] = useState(() => toLocalMonthString(new Date()))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCourseData, setSelectedCourseData] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'
  const [allowedDates, setAllowedDates] = useState({ openDates: {}, byEnrollment: {} })

  const isAllCourses = selectedCourse === 'all'
  const courseTitleById = useMemo(() => buildCourseTitleMap(courses), [courses])
  const loadGenRef = useRef(0)

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (!selectedCourse) return
    const gen = ++loadGenRef.current
    loadStudents(gen)
    loadAttendance(gen)
    if (isAllCourses) {
      setSelectedCourseData(null)
    } else {
      const courseData = courses.find(c => String(c._id) === String(selectedCourse))
      setSelectedCourseData(courseData || null)
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
      setAllowedDates({ openDates: {}, byEnrollment: {} })
    }
    // Re-fetch schedules when roster size changes (single-course studentIds filter)
  }, [selectedCourse, selectedMonth, students.length])

  const loadScheduleDatesForMonth = async () => {
    if (!selectedCourse || !selectedMonth) return

    const baseUrl = getApiBaseUrl()
    const first = parseLocalDate(selectedMonth + '-01')
    const startDate = toLocalDateString(new Date(first.getFullYear(), first.getMonth(), 1))
    const endDate = toLocalDateString(new Date(first.getFullYear(), first.getMonth() + 1, 0))

    try {
      const token = await getToken()
      const params = new URLSearchParams({
        courseId: String(selectedCourse),
        startDate,
        endDate,
      })

      // For a single course, narrow by roster. For "all", skip studentIds to avoid huge URLs.
      if (!isAllCourses) {
        const studentIds = Array.from(
          new Set(
            (students || [])
              .map(s => String(s.userId || '').trim())
              .filter(Boolean)
          )
        )
        if (studentIds.length > 0) {
          params.set('studentIds', studentIds.join(','))
        }
      }

      const res = await fetch(`${baseUrl}/admin/student-schedules-range?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        setAllowedDates({ openDates: {}, byEnrollment: {} })
        return
      }

      const schedules = await res.json()
      const openDates = {}
      const byEnrollment = {}

      for (const s of schedules || []) {
        const sid = String(s.studentId || '').trim()
        const cid = String(s.courseId || '').trim()
        if (!sid || !cid) continue
        const d = s.startTime ? toLocalDateString(new Date(s.startTime)) : ''
        if (!d) continue

        openDates[d] = true
        const key = enrollmentKey(sid, cid)
        if (!byEnrollment[key]) byEnrollment[key] = {}
        byEnrollment[key][d] = true
      }

      setAllowedDates({ openDates, byEnrollment })
    } catch (e) {
      console.error('Error loading schedule dates for month:', e)
      setAllowedDates({ openDates: {}, byEnrollment: {} })
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
      setCourses(Array.isArray(data) ? data : [])
      setSelectedCourse('all')
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizeStudentRows = (rows) => {
    const titleMap = buildCourseTitleMap(courses)
    const byKey = new Map()
    for (const e of rows || []) {
      const userId = String(e.userId || '').trim()
      const courseId = String(e.courseId || (isAllCourses ? '' : selectedCourse) || '').trim()
      if (!userId || !courseId || courseId === 'all') continue
      const key = enrollmentKey(userId, courseId)
      if (byKey.has(key)) continue
      byKey.set(key, {
        ...e,
        userId,
        courseId,
        courseTitle: resolveCourseTitle(courseId, titleMap, e.courseTitle),
      })
    }
    return Array.from(byKey.values()).sort((a, b) => {
      const ca = String(a.courseTitle || '')
      const cb = String(b.courseTitle || '')
      if (ca !== cb) return ca.localeCompare(cb)
      return String(a.name || '').localeCompare(String(b.name || ''))
    })
  }

  const loadStudents = async (gen) => {
    if (!selectedCourse) return
    const baseUrl = getApiBaseUrl()

    try {
      const token = await getToken()
      const res = await fetch(`${baseUrl}/admin/courses/${selectedCourse}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (gen !== undefined && gen !== loadGenRef.current) return

      if (res.ok) {
        const data = await res.json()
        if (gen !== undefined && gen !== loadGenRef.current) return
        setStudents(normalizeStudentRows(data))
        return
      }

      // Fallback: get students from enrollments
      const enrollmentsRes = await fetch(`${baseUrl}/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (gen !== undefined && gen !== loadGenRef.current) return
      if (!enrollmentsRes.ok) {
        setStudents([])
        return
      }
      const enrollments = await enrollmentsRes.json()
      const filtered = (enrollments || []).filter(e => {
        if (!e.approved || e.status === 'deleted') return false
        if (isAllCourses) return true
        return String(e.courseId) === String(selectedCourse)
      })
      if (gen !== undefined && gen !== loadGenRef.current) return
      setStudents(normalizeStudentRows(filtered.map(e => ({
        _id: e._id,
        userId: e.userId,
        name: e.name,
        email: e.email,
        instrument: e.instrument,
        courseId: e.courseId,
        enrolledAt: e.createdAt,
      }))))
    } catch (error) {
      console.error('Error loading students:', error)
    }
  }

  const loadAttendance = async (gen) => {
    if (!selectedCourse || !selectedMonth) return
    const baseUrl = getApiBaseUrl()

    try {
      const token = await getToken()
      const year = parseLocalDate(selectedMonth + '-01').getFullYear()
      const month = parseLocalDate(selectedMonth + '-01').getMonth()
      const startDate = toLocalDateString(new Date(year, month, 1))
      const endDate = toLocalDateString(new Date(year, month + 1, 0))

      const res = await fetch(`${baseUrl}/admin/attendance/${selectedCourse}/${startDate}/${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (gen !== undefined && gen !== loadGenRef.current) return

      if (res.ok) {
        const data = await res.json()
        if (gen !== undefined && gen !== loadGenRef.current) return
        setAttendance(Array.isArray(data) ? data : [])
      } else {
        setAttendance([])
      }
    } catch (error) {
      console.error('Error loading attendance:', error)
      setAttendance([])
    }
  }

  const loadAttendanceDay = async () => {
    const baseUrl = getApiBaseUrl()

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
      const rows = Array.isArray(data) ? data : []
      setDayRows(rows.map(r => ({
        ...r,
        courseId: String(r.courseId || '').trim(),
        courseTitle: resolveCourseTitle(r.courseId, courseTitleById, r.courseTitle),
      })))
    } catch (error) {
      console.error('Error loading attendance day:', error)
      setDayRows([])
    }
  }

  const markAttendance = async (studentId, status, notes = '', date = null, courseIdOverride = null) => {
    const courseIdToUse = courseIdOverride || (isAllCourses ? null : selectedCourse)
    if (!courseIdToUse) return
    
    const attendanceDate = date || selectedDate
    setSaving(true)
    try {
      const token = await getToken()
      const clearing = status == null || status === ''

      if (clearing) {
        const params = new URLSearchParams({
          studentId: String(studentId),
          courseId: String(courseIdToUse),
          date: String(attendanceDate),
        })
        await apiDelete(`/admin/attendance?${params}`, token)

        setAttendance(prev => prev.filter(a =>
          !(String(a.studentId) === String(studentId) &&
            String(a.date) === String(attendanceDate) &&
            String(a.courseId) === String(courseIdToUse))
        ))

        if (viewMode === 'table') {
          setDayRows(prev => prev.map(r => {
            if (String(r.studentId) === String(studentId) && String(r.courseId) === String(courseIdToUse) && String(r.date) === String(attendanceDate)) {
              return { ...r, status: null, notes: null }
            }
            return r
          }))
        }
      } else {
        await apiPost('/admin/attendance', {
          studentId,
          courseId: courseIdToUse,
          date: attendanceDate,
          status,
          notes
        }, token)
        
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

        if (viewMode === 'table') {
          setDayRows(prev => prev.map(r => {
            if (String(r.studentId) === String(studentId) && String(r.courseId) === String(courseIdToUse) && String(r.date) === String(attendanceDate)) {
              return { ...r, status, notes }
            }
            return r
          }))
        }
      }
      
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert(status == null ? 'Failed to clear attendance. Please try again.' : 'Failed to mark attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getAttendanceStats = () => {
    const total = students.length
    const byEnrollment = allowedDates?.byEnrollment || {}

    // Only count sessions that have schedules (studentId + courseId + date)
    let totalPossibleRecords = 0
    for (const s of students) {
      const key = enrollmentKey(s.userId, s.courseId || selectedCourse)
      const datesForEnrollment = byEnrollment[key] || {}
      totalPossibleRecords += Object.keys(datesForEnrollment).length
    }
    
    const eligibleAttendance = attendance.filter(a => {
      const key = enrollmentKey(a.studentId, a.courseId)
      const d = String(a.date || '').trim()
      return Boolean(byEnrollment[key]?.[d])
    })

    const present = eligibleAttendance.filter(a => a.status === 'present').length
    const absent = eligibleAttendance.filter(a => a.status === 'absent').length
    const waived = eligibleAttendance.filter(a => a.status === 'waived').length
    const marked = eligibleAttendance.length
    const unmarked = Math.max(0, totalPossibleRecords - marked)
    
    return { total, present, absent, waived, marked, unmarked }
  }

  const stats = getAttendanceStats()

  // Daily table: filter by selected course when not "All courses"
  const filteredDayRows = useMemo(() => {
    const rows = isAllCourses
      ? dayRows
      : dayRows.filter(r => String(r.courseId) === String(selectedCourse))
    return rows.map(r => ({
      ...r,
      courseTitle: resolveCourseTitle(r.courseId, courseTitleById, r.courseTitle),
    }))
  }, [dayRows, isAllCourses, selectedCourse, courseTitleById])

  const dayRowsByCourse = useMemo(() => {
    const groups = {}
    for (const row of filteredDayRows) {
      const key = row.courseTitle || 'Removed course'
      if (!groups[key]) groups[key] = []
      groups[key].push(row)
    }
    return Object.entries(groups)
  }, [filteredDayRows])

  const showGridContent = viewMode === 'grid' && selectedCourse && students.length > 0
  const showTableContent = viewMode === 'table' && selectedCourse
  const showEmptyStudents =
    selectedCourse &&
    students.length === 0 &&
    (viewMode === 'grid' || (viewMode === 'table' && filteredDayRows.length === 0 && dayRows.length === 0))

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
                        <option value="all">All courses</option>
                        {courses.map((course) => (
                          <option key={course._id} value={String(course._id)}>
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
                          {isAllCourses ? 'All courses' : (selectedCourseData?.title || 'No course selected')}
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
                          {isAllCourses
                            ? 'Showing all students who have a scheduled class on this date (grouped by course).'
                            : `Showing scheduled students for ${selectedCourseData?.title || 'the selected course'} on this date.`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attendance Statistics (grid roster) */}
                {showGridContent && (
                  <AttendanceStats stats={stats} isAllCourses={isAllCourses} />
                )}

                {/* Attendance Display */}
                {showGridContent && (
                  <AttendanceGrid
                    students={students}
                    attendance={attendance}
                    onMarkAttendance={markAttendance}
                    saving={saving}
                    selectedDate={selectedDate}
                    selectedMonth={selectedMonth}
                    selectedCourse={selectedCourse}
                    allowedDates={allowedDates}
                    showCourseColumn={isAllCourses}
                    courseTitleById={courseTitleById}
                  />
                )}

                {showTableContent && (
                  <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Attendance - {selectedDate}</h3>

                    {filteredDayRows.length === 0 ? (
                      <div className="text-center py-10 text-slate-600">
                        {isAllCourses
                          ? 'No scheduled classes found for this date.'
                          : 'No scheduled classes found for this course on this date.'}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {dayRowsByCourse.map(([courseTitle, rows]) => (
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

                {/* Empty States */}
                {showEmptyStudents && viewMode === 'grid' && (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-slate-200">
                    <div className="text-6xl mb-6">👥</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">No Students Enrolled</h3>
                    <p className="text-slate-600 mb-6">
                      {isAllCourses
                        ? 'There are no approved enrollments across courses yet.'
                        : "This course doesn't have any enrolled students yet."}
                    </p>
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

