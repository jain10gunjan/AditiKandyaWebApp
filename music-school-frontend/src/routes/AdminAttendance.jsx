import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet, apiPost } from '../lib/api'

// Helper function to generate days for a month
const generateDaysForMonth = (year, month) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      day,
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6
    })
  }
  return days
}

function AttendanceGrid({ students, attendance, onMarkAttendance, saving, selectedDate, selectedMonth, selectedCourse }) {
  const getAttendanceForStudent = (studentId, date) => {
    console.log('getAttendanceForStudent called with:', { studentId, date, courseId: selectedCourse })
    console.log('Available attendance records:', attendance)
    
    const record = attendance.find(a => {
      const matches = a.studentId === studentId && 
                     a.date === date &&
                     a.courseId === selectedCourse
      console.log('Checking record:', a, 'matches:', matches)
      return matches
    })
    
    console.log('Found record:', record)
    return record
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
  const currentYear = selectedMonth ? new Date(selectedMonth).getFullYear() : currentDate.getFullYear()
  const currentMonth = selectedMonth ? new Date(selectedMonth).getMonth() : currentDate.getMonth()
  const days = generateDaysForMonth(currentYear, currentMonth)

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
                
                console.log(`Checking attendance for student ${student.userId} on ${day.date}:`, studentAttendance)
                
                return (
                  <div 
                    key={`${student._id}-${day.day}`}
                    className={`w-12 h-12 border-r border-slate-300 flex items-center justify-center cursor-pointer transition-colors ${
                      day.isWeekend ? 'bg-slate-100' : 'bg-white'
                    } ${isToday ? 'ring-2 ring-sky-500 ring-inset' : ''}`}
                    onClick={() => {
                      if (!saving) {
                        // Cycle through statuses: empty -> present -> waived -> absent -> empty
                        const currentStatus = studentAttendance?.status
                        let nextStatus = 'present'
                        
                        if (currentStatus === 'present') nextStatus = 'waived'
                        else if (currentStatus === 'waived') nextStatus = 'absent'
                        else if (currentStatus === 'absent') nextStatus = 'present'
                        
                        onMarkAttendance(student.userId, nextStatus, '', day.date)
                      }
                    }}
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM format
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCourseData, setSelectedCourseData] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'table'

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadStudents()
      loadAttendance()
      // Find selected course data
      const courseData = courses.find(c => c._id === selectedCourse)
      setSelectedCourseData(courseData)
    }
  }, [selectedCourse, selectedMonth, courses])

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
    
    try {
      const token = await getToken()
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/courses/${selectedCourse}/students`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setStudents(data)
      } else {
        // Fallback: get students from enrollments
        const enrollmentsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/enrollments`, {
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
    
    try {
      const token = await getToken()
      // Load attendance for the entire month
      const year = new Date(selectedMonth).getFullYear()
      const month = new Date(selectedMonth).getMonth()
      const startDate = new Date(year, month, 1).toISOString().split('T')[0]
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      
      console.log('Loading attendance for:', { courseId: selectedCourse, startDate, endDate })
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/attendance/${selectedCourse}/${startDate}/${endDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        console.log('Loaded attendance data:', data)
        console.log('Setting attendance state with', data.length, 'records')
        setAttendance(data)
      } else {
        console.error('Failed to load attendance:', res.status, res.statusText)
        // Try fallback to single date endpoint
        const today = new Date().toISOString().split('T')[0]
        const fallbackRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/attendance/${selectedCourse}/${today}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json()
          console.log('Loaded fallback attendance data:', fallbackData)
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

  const markAttendance = async (studentId, status, notes = '', date = null) => {
    if (!selectedCourse) return
    
    const attendanceDate = date || selectedDate
    console.log('Marking attendance:', { studentId, status, date: attendanceDate, courseId: selectedCourse })
    
    setSaving(true)
    try {
      const token = await getToken()
      const response = await apiPost('/admin/attendance', {
        studentId,
        courseId: selectedCourse,
        date: attendanceDate,
        status,
        notes
      }, token)
      
      console.log('Attendance API response:', response)
      
      // Update local state immediately for better UX
      setAttendance(prev => {
        const existingIndex = prev.findIndex(a => 
          a.studentId === studentId && 
          a.date === attendanceDate &&
          a.courseId === selectedCourse
        )
        
        if (existingIndex >= 0) {
          // Update existing record
          const updated = [...prev]
          updated[existingIndex] = { ...updated[existingIndex], status, notes }
          console.log('Updated existing attendance record:', updated[existingIndex])
          return updated
        } else {
          // Add new record
          const newRecord = { studentId, courseId: selectedCourse, status, notes, date: attendanceDate }
          console.log('Added new attendance record:', newRecord)
          return [...prev, newRecord]
        }
      })
      
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
    const totalDays = generateDaysForMonth(
      new Date(selectedMonth).getFullYear(), 
      new Date(selectedMonth).getMonth()
    ).length
    const totalPossibleRecords = total * totalDays
    
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const waived = attendance.filter(a => a.status === 'waived').length
    const marked = attendance.length
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
                      />
                    ) : (
                      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Daily Attendance - {selectedDate}</h3>
                        <div className="space-y-3">
                          {students.map((student) => {
                            const studentAttendance = attendance.find(a => 
                              a.studentId === student.userId && 
                              a.date === selectedDate &&
                              a.courseId === selectedCourse
                            )
                            return (
                              <div key={student._id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                                    {student.name?.charAt(0)?.toUpperCase() || 'U'}
                                  </div>
                                  <div>
                                    <div className="font-medium text-slate-900">
                                      {student.name || 'Unknown Student'}
                                    </div>
                                    <div className="text-sm text-slate-600">
                                      {student.email || 'No email provided'}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {studentAttendance ? (
                                    <div className="flex items-center gap-3">
                                      <span className="text-xl">
                                        {studentAttendance.status === 'present' ? '✅' : 
                                         studentAttendance.status === 'absent' ? '❌' : '📋'}
                                      </span>
                                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
                                        studentAttendance.status === 'present' ? 'bg-green-100 text-green-800 border-green-200' :
                                        studentAttendance.status === 'absent' ? 'bg-red-100 text-red-800 border-red-200' :
                                        'bg-blue-100 text-blue-800 border-blue-200'
                                      }`}>
                                        {studentAttendance.status.charAt(0).toUpperCase() + studentAttendance.status.slice(1)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium border border-gray-200">
                                      Not Marked
                                    </span>
                                  )}
                                  
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => markAttendance(student.userId, 'present')}
                                      disabled={saving}
                                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                        studentAttendance?.status === 'present'
                                          ? 'bg-green-600 text-white'
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      } disabled:opacity-50`}
                                    >
                                      Present
                                    </button>
                                    <button
                                      onClick={() => markAttendance(student.userId, 'waived')}
                                      disabled={saving}
                                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                        studentAttendance?.status === 'waived'
                                          ? 'bg-blue-600 text-white'
                                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                      } disabled:opacity-50`}
                                    >
                                      Waived
                                    </button>
                                    <button
                                      onClick={() => markAttendance(student.userId, 'absent')}
                                      disabled={saving}
                                      className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                                        studentAttendance?.status === 'absent'
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

