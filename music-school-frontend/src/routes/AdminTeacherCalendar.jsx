import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function AdminTeacherCalendar() {
  const { getToken } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('day') // 'day', 'week', 'month'
  const [allEnrollments, setAllEnrollments] = useState([]) // Cache all enrollments

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (courses.length > 0) {
      loadAllEnrollments()
    }
  }, [courses.length])

  useEffect(() => {
    if (allEnrollments.length > 0 || courses.length > 0) {
      loadSchedules()
    }
  }, [selectedDate, viewMode, allEnrollments.length, courses.length])

  const loadAllEnrollments = async () => {
    try {
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      // Fetch all enrollments at once using admin endpoint
      const response = await fetch(`${baseUrl}/admin/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const enrollData = await response.json()
        
        // Create a map of courseId to course title for quick lookup
        const courseMap = new Map(courses.map(c => [String(c._id), c.title]))
        
        // Enrich enrollments with course title
        const allEnrolls = enrollData.map(e => {
          const courseId = String(e.courseId || '')
          const courseTitle = courseMap.get(courseId) || 'Unknown Course'
          
          return {
            ...e,
            courseId: courseId,
            courseTitle: courseTitle,
            // Normalize userId for matching
            userId: String(e.userId || ''),
            email: (e.email || '').toLowerCase(),
            name: e.name || e.email || 'Unknown Student'
          }
        })
        
        console.log('Loaded enrollments:', allEnrolls.length)
        setAllEnrollments(allEnrolls)
      } else {
        console.error('Failed to load enrollments:', response.status)
      }
    } catch (error) {
      console.error('Error loading enrollments:', error)
    }
  }

  const loadCourses = async () => {
    try {
      const data = await apiGet('/courses')
      setCourses(data || [])
    } catch (error) {
      console.error('Error loading courses:', error)
      toast.error('Failed to load courses.')
    }
  }

  const loadSchedules = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      let schedulesData = []
      
      if (viewMode === 'day') {
        // Load schedules for selected date
        const params = new URLSearchParams({ date: selectedDate })
        const response = await fetch(`${baseUrl}/admin/student-schedules?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (response.ok) {
          schedulesData = await response.json()
        }
      } else if (viewMode === 'week') {
        // Load schedules for the week
        const startDate = new Date(selectedDate)
        const dayOfWeek = startDate.getDay()
        const weekStart = new Date(startDate)
        weekStart.setDate(startDate.getDate() - dayOfWeek)
        
        const allWeekSchedules = []
        for (let i = 0; i < 7; i++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          const dateStr = date.toISOString().split('T')[0]
          
          const params = new URLSearchParams({ date: dateStr })
          const response = await fetch(`${baseUrl}/admin/student-schedules?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const daySchedules = await response.json()
            allWeekSchedules.push(...daySchedules)
          }
        }
        schedulesData = allWeekSchedules
      } else if (viewMode === 'month') {
        // Load schedules for the month
        const startDate = new Date(selectedDate)
        const year = startDate.getFullYear()
        const month = startDate.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const allMonthSchedules = []
        for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          const params = new URLSearchParams({ date: dateStr })
          const response = await fetch(`${baseUrl}/admin/student-schedules?${params}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const daySchedules = await response.json()
            allMonthSchedules.push(...daySchedules)
          }
        }
        schedulesData = allMonthSchedules
      }
      
      // Enrich schedules with student and course info
      const enrichedSchedules = schedulesData.map(schedule => {
        let studentInfo = 'Unknown Student'
        let courseInfo = 'Unknown Course'
        
        // Normalize IDs for matching - handle both string and object formats
        const scheduleStudentId = schedule.studentId 
          ? (typeof schedule.studentId === 'object' ? String(schedule.studentId._id || schedule.studentId) : String(schedule.studentId)).trim()
          : null
        const scheduleCourseId = schedule.courseId 
          ? (typeof schedule.courseId === 'object' ? String(schedule.courseId._id || schedule.courseId) : String(schedule.courseId)).trim()
          : null
        
        // Find student from enrollments - match by userId AND courseId
        if (scheduleStudentId && scheduleCourseId) {
          // Try exact match first (userId + courseId)
          let enrollment = allEnrollments.find(e => {
            const eUserId = String(e.userId || '').trim()
            const eCourseId = String(e.courseId || '').trim()
            return eUserId === scheduleStudentId && eCourseId === scheduleCourseId
          })
          
          if (enrollment) {
            studentInfo = enrollment.name || enrollment.email || 'Unknown Student'
            // Also get course info from enrollment if available
            if (enrollment.courseTitle) {
              courseInfo = enrollment.courseTitle
            }
          } else {
            // Fallback: try to find by userId only (in case courseId doesn't match)
            const enrollmentByUser = allEnrollments.find(e => {
              const eUserId = String(e.userId || '').trim()
              return eUserId === scheduleStudentId
            })
            if (enrollmentByUser) {
              studentInfo = enrollmentByUser.name || enrollmentByUser.email || 'Unknown Student'
              // If we found by userId, also try to get course info
              if (enrollmentByUser.courseTitle && !courseInfo) {
                courseInfo = enrollmentByUser.courseTitle
              }
            } else {
              // Debug: log when we can't find enrollment
              console.warn('Could not find enrollment for schedule:', {
                scheduleId: schedule._id,
                scheduleStudentId,
                scheduleCourseId,
                totalEnrollments: allEnrollments.length
              })
            }
          }
        }
        
        // Find course - try direct match first
        if (scheduleCourseId) {
          // Only try course match if we haven't found it from enrollment
          if (courseInfo === 'Unknown Course') {
            const course = courses.find(c => {
              const cId = String(c._id || '').trim()
              return cId === scheduleCourseId
            })
            
            if (course) {
              courseInfo = course.title
            } else {
              // Try from enrollment cache
              const enrollment = allEnrollments.find(e => {
                const eCourseId = String(e.courseId || '').trim()
                return eCourseId === scheduleCourseId
              })
              if (enrollment && enrollment.courseTitle) {
                courseInfo = enrollment.courseTitle
              } else {
                console.warn('Could not find course for schedule:', {
                  scheduleId: schedule._id,
                  scheduleCourseId,
                  totalCourses: courses.length
                })
              }
            }
          }
        }
        
        return {
          ...schedule,
          studentName: studentInfo,
          courseName: courseInfo,
          startTime: schedule.startTime ? new Date(schedule.startTime) : null,
          endTime: schedule.endTime ? new Date(schedule.endTime) : null
        }
      })
      
      // Filter out invalid schedules and remove duplicates
      const validSchedules = enrichedSchedules.filter(s => {
        if (!s.startTime || isNaN(s.startTime.getTime())) return false
        if (!s._id) return false
        return true
      })
      
      // Remove duplicates by _id
      const uniqueSchedules = []
      const seenIds = new Set()
      for (const schedule of validSchedules) {
        const scheduleId = String(schedule._id)
        if (!seenIds.has(scheduleId)) {
          seenIds.add(scheduleId)
          uniqueSchedules.push(schedule)
        }
      }
      
      // Sort by start time
      uniqueSchedules.sort((a, b) => {
        if (!a.startTime) return 1
        if (!b.startTime) return -1
        return a.startTime.getTime() - b.startTime.getTime()
      })
      
      console.log('Loaded schedules:', uniqueSchedules.length, 'Total fetched:', schedulesData.length, 'Valid:', validSchedules.length)
      setSchedules(uniqueSchedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
      toast.error('Failed to load schedules. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch (e) {
      return ''
    }
  }

  const formatDate = (date) => {
    if (!date) return ''
    try {
      const d = new Date(date)
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    } catch (e) {
      return ''
    }
  }

  const getDateRange = () => {
    if (viewMode === 'day') {
      return [selectedDate]
    } else if (viewMode === 'week') {
      const startDate = new Date(selectedDate)
      const dayOfWeek = startDate.getDay()
      const weekStart = new Date(startDate)
      weekStart.setDate(startDate.getDate() - dayOfWeek)
      const dates = []
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + i)
        dates.push(date.toISOString().split('T')[0])
      }
      return dates
    } else {
      const startDate = new Date(selectedDate)
      const year = startDate.getFullYear()
      const month = startDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const dates = []
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().split('T')[0])
      }
      return dates
    }
  }

  const getSchedulesForDate = (date) => {
    return schedules.filter(schedule => {
      if (!schedule.startTime) return false
      const scheduleDate = schedule.startTime.toISOString().split('T')[0]
      return scheduleDate === date
    })
  }

  const groupSchedulesByTime = (dateSchedules) => {
    const grouped = {}
    dateSchedules.forEach(schedule => {
      if (!schedule.startTime) return
      const timeKey = formatTime(schedule.startTime)
      if (!grouped[timeKey]) {
        grouped[timeKey] = []
      }
      grouped[timeKey].push(schedule)
    })
    return grouped
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Teacher Calendar</h1>
            <p className="text-slate-600 mt-1">View all student bookings and class schedules</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="text-slate-700 hover:text-sky-700 font-medium">← Admin Panel</a>
          </nav>
        </div>

        <SignedOut>
          <div className="mt-6 bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-slate-600 mb-4">Please sign in to access the teacher calendar</p>
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>

        <SignedIn>
          {/* Controls */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex gap-3 items-center">
                <label className="text-sm font-medium text-slate-700">View:</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('day')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'day'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Day
                  </button>
                  <button
                    onClick={() => setViewMode('week')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'week'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => setViewMode('month')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      viewMode === 'month'
                        ? 'bg-sky-600 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Month
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 items-center">
                <button
                  onClick={() => {
                    const date = new Date(selectedDate)
                    if (viewMode === 'day') {
                      date.setDate(date.getDate() - 1)
                    } else if (viewMode === 'week') {
                      date.setDate(date.getDate() - 7)
                    } else {
                      date.setMonth(date.getMonth() - 1)
                    }
                    setSelectedDate(date.toISOString().split('T')[0])
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  ← Previous
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
                <button
                  onClick={() => {
                    const date = new Date(selectedDate)
                    if (viewMode === 'day') {
                      date.setDate(date.getDate() + 1)
                    } else if (viewMode === 'week') {
                      date.setDate(date.getDate() + 7)
                    } else {
                      date.setMonth(date.getMonth() + 1)
                    }
                    setSelectedDate(date.toISOString().split('T')[0])
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  Next →
                </button>
                <button
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors"
                >
                  Today
                </button>
              </div>
            </div>
          </div>

          {/* Calendar View */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : viewMode === 'day' ? (
            <DayView schedules={schedules} selectedDate={selectedDate} formatTime={formatTime} />
          ) : viewMode === 'week' ? (
            <WeekView schedules={schedules} selectedDate={selectedDate} getSchedulesForDate={getSchedulesForDate} formatTime={formatTime} />
          ) : (
            <MonthView schedules={schedules} selectedDate={selectedDate} getSchedulesForDate={getSchedulesForDate} formatTime={formatTime} />
          )}
        </SignedIn>
      </div>

      <Footer showAdminTools={true} />
    </div>
  )
}

// Day View Component
function DayView({ schedules, selectedDate, formatTime }) {
  // Filter schedules for the selected date and sort by start time
  const daySchedules = schedules
    .filter(schedule => {
      if (!schedule.startTime) return false
      const scheduleDate = schedule.startTime.toISOString().split('T')[0]
      return scheduleDate === selectedDate
    })
    .sort((a, b) => {
      if (!a.startTime) return 1
      if (!b.startTime) return -1
      return a.startTime.getTime() - b.startTime.getTime()
    })

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50 flex-shrink-0">
        <h2 className="text-xl font-bold text-slate-900">
          {new Date(selectedDate).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {daySchedules.length} booking{daySchedules.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ scrollBehavior: 'smooth', WebkitOverflowScrolling: 'touch' }}>
        {daySchedules.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Bookings</h3>
            <p className="text-slate-600">No student bookings scheduled for this date.</p>
          </div>
        ) : (
          daySchedules.map((schedule) => (
            <div key={schedule._id} className="border-b border-slate-100 p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-24 text-sm font-semibold text-slate-700 pt-1">
                  {formatTime(schedule.startTime)}
                </div>
                <div className="flex-1">
                  <div
                    className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-lg p-4 border border-sky-200 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-slate-900">{schedule.title}</h3>
                          <span className="px-2 py-1 bg-sky-100 text-sky-700 rounded-full text-xs font-medium">
                            {schedule.type || 'class'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">👤 Student:</span>
                            <span>{schedule.studentName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">📚 Course:</span>
                            <span>{schedule.courseName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">🕐 Time:</span>
                            <span>
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </span>
                          </div>
                          {schedule.meetingLink && (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">🔗 Meeting:</span>
                              <a
                                href={schedule.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sky-600 hover:text-sky-700 hover:underline"
                              >
                                Join Meeting
                              </a>
                            </div>
                          )}
                          {schedule.description && (
                            <div className="mt-2 text-slate-700 bg-white p-2 rounded border border-slate-200">
                              {schedule.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Week View Component
function WeekView({ schedules, selectedDate, getSchedulesForDate, formatTime }) {
  const startDate = new Date(selectedDate)
  const dayOfWeek = startDate.getDay()
  const weekStart = new Date(startDate)
  weekStart.setDate(startDate.getDate() - dayOfWeek)
  
  const weekDays = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    weekDays.push(date.toISOString().split('T')[0])
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
        <h2 className="text-xl font-bold text-slate-900">Week View</h2>
        <p className="text-sm text-slate-600 mt-1">
          {schedules.length} total booking{schedules.length !== 1 ? 's' : ''} this week
        </p>
      </div>
      
      <div className="grid grid-cols-7 gap-0">
        {weekDays.map((date) => {
          const daySchedules = getSchedulesForDate(date)
          const isToday = date === new Date().toISOString().split('T')[0]
          
          return (
            <div
              key={date}
              className={`border-r border-slate-200 last:border-r-0 min-h-[500px] ${
                isToday ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className={`p-3 border-b border-slate-200 text-center ${
                isToday ? 'bg-blue-100 font-bold' : 'bg-slate-50'
              }`}>
                <div className="text-xs text-slate-600">
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className={`text-lg ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                  {new Date(date).getDate()}
                </div>
              </div>
              
              <div className="p-2 space-y-2 max-h-[450px] overflow-y-auto">
                {daySchedules.map((schedule) => (
                  <div
                    key={schedule._id}
                    className="bg-sky-100 border border-sky-300 rounded-lg p-2 text-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="font-semibold text-sky-900 mb-1">
                      {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                    </div>
                    <div className="text-sky-700 font-medium truncate">
                      {schedule.studentName || 'Unknown'}
                    </div>
                    <div className="text-sky-600 truncate">
                      {schedule.courseName || 'Unknown'}
                    </div>
                    <div className="text-sky-500 truncate mt-1">
                      {schedule.title}
                    </div>
                  </div>
                ))}
                {daySchedules.length === 0 && (
                  <div className="text-center text-slate-400 text-xs py-4">
                    No bookings
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Month View Component
function MonthView({ schedules, selectedDate, getSchedulesForDate, formatTime }) {
  const startDate = new Date(selectedDate)
  const year = startDate.getFullYear()
  const month = startDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDayOfWeek = firstDay.getDay()
  
  const calendarDays = []
  
  // Add empty cells for days before month starts
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add all days of the month
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d)
    calendarDays.push(date.toISOString().split('T')[0])
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
        <h2 className="text-xl font-bold text-slate-900">
          {new Date(selectedDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          {schedules.length} total booking{schedules.length !== 1 ? 's' : ''} this month
        </p>
      </div>
      
      <div className="grid grid-cols-7 gap-0">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="p-3 bg-slate-100 border-b border-slate-200 text-center font-semibold text-slate-700">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="min-h-[120px] border-r border-b border-slate-200 bg-slate-50"></div>
          }
          
          const daySchedules = getSchedulesForDate(date)
          const isToday = date === new Date().toISOString().split('T')[0]
          
          return (
            <div
              key={date}
              className={`min-h-[120px] border-r border-b border-slate-200 p-2 ${
                isToday ? 'bg-blue-50 border-blue-300 border-2' : 'bg-white'
              }`}
            >
              <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-700' : 'text-slate-900'}`}>
                {new Date(date).getDate()}
              </div>
              
              <div className="space-y-1 max-h-[90px] overflow-y-auto">
                {daySchedules.slice(0, 3).map((schedule) => (
                  <div
                    key={schedule._id}
                    className="bg-sky-100 border border-sky-300 rounded px-1.5 py-0.5 text-[10px] hover:shadow-sm transition-all"
                    title={`${formatTime(schedule.startTime)} - ${schedule.studentName} (${schedule.courseName})`}
                  >
                    <div className="font-semibold text-sky-900 truncate">
                      {formatTime(schedule.startTime)}
                    </div>
                    <div className="text-sky-700 truncate">
                      {schedule.studentName || 'Unknown'}
                    </div>
                  </div>
                ))}
                {daySchedules.length > 3 && (
                  <div className="text-[10px] text-slate-500 font-medium">
                    +{daySchedules.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

