import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost, apiDelete } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import TimeSlotPicker from '../components/TimeSlotPicker.jsx'

export default function AdminStudentSchedules() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState([])
  const [courses, setCourses] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [allSchedulesForDate, setAllSchedulesForDate] = useState([]) // All schedules for the selected date (for conflict detection)
  const [loadingSchedules, setLoadingSchedules] = useState(false)
  const [showEventForm, setShowEventForm] = useState(false)
  const [showDuplicateDates, setShowDuplicateDates] = useState(false)
  const [selectedDuplicateDates, setSelectedDuplicateDates] = useState([])
  const [duplicateMode, setDuplicateMode] = useState('dateRange') // 'dateRange' or 'daysOfWeek'
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState([])
  const [duplicateStartDate, setDuplicateStartDate] = useState('')
  const [duplicateEndDate, setDuplicateEndDate] = useState('')
  const [duplicateWeeks, setDuplicateWeeks] = useState(4) // Number of weeks to generate
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    courseId: '',
    studentId: '',
    type: 'class',
    meetingLink: '',
    meetingType: 'none'
  })

  useEffect(() => {
    loadCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadEnrollments(selectedCourse)
      loadEvents()
    } else {
      setEnrollments([])
      setEvents([])
    }
  }, [selectedCourse, selectedStudent, selectedDate])

  const loadEvents = async () => {
    if (!selectedCourse) {
      setEvents([])
      return
    }
    try {
      setLoading(true)
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      // Use ISO date format to ensure proper timezone handling
      const params = new URLSearchParams({ date: selectedDate })
      if (selectedCourse) params.append('courseId', selectedCourse)
      if (selectedStudent) params.append('studentId', selectedStudent)
      
      const response = await fetch(`${baseUrl}/admin/student-schedules?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load events')
      const data = await response.json()
      
      // Sort events by start time and ensure proper date handling
      const sortedEvents = (data || []).map(event => ({
        ...event,
        startTime: event.startTime ? new Date(event.startTime).toISOString() : event.startTime,
        endTime: event.endTime ? new Date(event.endTime).toISOString() : event.endTime
      })).sort((a, b) => {
        const timeA = a.startTime ? new Date(a.startTime).getTime() : 0
        const timeB = b.startTime ? new Date(b.startTime).getTime() : 0
        return timeA - timeB
      })
      
      setEvents(sortedEvents)
    } catch (error) {
      console.error('Error loading events:', error)
      toast.error('Failed to load events. Please try again.')
    } finally {
      setLoading(false)
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

  const loadEnrollments = async (courseId) => {
    try {
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const response = await fetch(`${baseUrl}/admin/courses/${courseId}/enrollments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to load enrollments')
      const data = await response.json()
      setEnrollments(data || [])
    } catch (error) {
      console.error('Error loading enrollments:', error)
      toast.error('Failed to load enrollments.')
    }
  }

  // Load all schedules for the selected date (for conflict detection in time picker)
  const loadAllSchedulesForDate = async (date) => {
    if (!date) {
      setAllSchedulesForDate([])
      return
    }
    try {
      setLoadingSchedules(true)
      const token = await getToken()
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      // Fetch all student schedules for this date (no course/student filter)
      const params = new URLSearchParams({ date })
      const response = await fetch(`${baseUrl}/admin/student-schedules?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (!response.ok) throw new Error('Failed to load schedules')
      const data = await response.json()
      
      // Format schedules with student and course info
      const formattedSchedules = await Promise.all((data || []).map(async (schedule) => {
        let studentInfo = 'Unknown Student'
        let courseInfo = 'Unknown Course'
        
        // Get student info
        if (schedule.studentId) {
          const enrollment = enrollments.find(e => e.userId === schedule.studentId)
          if (enrollment) {
            studentInfo = enrollment.name || enrollment.email || 'Unknown Student'
          } else {
            // Try to fetch from all enrollments
            try {
              const token = await getToken()
              const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
              const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
              const enrollRes = await fetch(`${baseUrl}/admin/courses/${schedule.courseId}/enrollments`, {
                headers: { Authorization: `Bearer ${token}` }
              })
              if (enrollRes.ok) {
                const enrollData = await enrollRes.json()
                const foundEnroll = enrollData.find(e => e.userId === schedule.studentId)
                if (foundEnroll) {
                  studentInfo = foundEnroll.name || foundEnroll.email || 'Unknown Student'
                }
              }
            } catch (e) {
              console.warn('Could not fetch enrollment info:', e)
            }
          }
        }
        
        // Get course info
        if (schedule.courseId) {
          const course = courses.find(c => c._id === schedule.courseId)
          if (course) {
            courseInfo = course.title
          }
        }
        
        return {
          ...schedule,
          startTime: schedule.startTime ? new Date(schedule.startTime).toISOString() : schedule.startTime,
          endTime: schedule.endTime ? new Date(schedule.endTime).toISOString() : schedule.endTime,
          student: studentInfo,
          course: courseInfo
        }
      }))
      
      setAllSchedulesForDate(formattedSchedules)
    } catch (error) {
      console.error('Error loading all schedules:', error)
      // Don't show error toast, just set empty array
      setAllSchedulesForDate([])
    } finally {
      setLoadingSchedules(false)
    }
  }

  // Load schedules when date changes in the form
  useEffect(() => {
    if (showEventForm && newEvent.date) {
      loadAllSchedulesForDate(newEvent.date)
    } else {
      setAllSchedulesForDate([])
    }
  }, [newEvent.date, showEventForm])

  const handleDateSelect = (date) => {
    if (selectedDuplicateDates.includes(date)) {
      setSelectedDuplicateDates(selectedDuplicateDates.filter(d => d !== date))
    } else {
      setSelectedDuplicateDates([...selectedDuplicateDates, date])
    }
  }

  const generateDateRange = (startDate, endDate) => {
    const dates = []
    const start = new Date(startDate)
    const end = new Date(endDate)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0])
    }
    return dates
  }

  const generateDatesFromDaysOfWeek = (startDate, daysOfWeek, weeks) => {
    if (!startDate || daysOfWeek.length === 0) return []
    
    const dates = []
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + (weeks * 7))
    
    // Day of week mapping: 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayMapping = {
      'sunday': 0,
      'monday': 1,
      'tuesday': 2,
      'wednesday': 3,
      'thursday': 4,
      'friday': 5,
      'saturday': 6
    }
    
    const targetDays = daysOfWeek.map(day => dayMapping[day.toLowerCase()])
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (targetDays.includes(d.getDay())) {
        dates.push(new Date(d).toISOString().split('T')[0])
      }
    }
    
    return dates
  }

  const handleDayOfWeekToggle = (day) => {
    if (selectedDaysOfWeek.includes(day)) {
      setSelectedDaysOfWeek(selectedDaysOfWeek.filter(d => d !== day))
    } else {
      setSelectedDaysOfWeek([...selectedDaysOfWeek, day])
    }
  }

  const validateMeetingLink = (link, type) => {
    if (!link) return true
    if (type === 'meet') {
      return link.includes('meet.google.com') || link.includes('meet/')
    }
    if (type === 'teams') {
      return link.includes('teams.microsoft.com') || link.includes('teams.live.com')
    }
    return true
  }

  const createEvent = async (e) => {
    e.preventDefault()
    
    if (!selectedCourse || !selectedStudent) {
      toast.error('Please select a course and student')
      return
    }

    if (!newEvent.title || !newEvent.date || !newEvent.time || !newEvent.endTime) {
      toast.error('Please fill in all required fields')
      return
    }

    // Validate that end time is after start time
    if (newEvent.endTime <= newEvent.time) {
      toast.error('End time must be after start time')
      return
    }

    if (newEvent.meetingType !== 'none' && !newEvent.meetingLink) {
      toast.error('Please provide a meeting link when selecting a meeting type')
      return
    }

    if (newEvent.meetingLink && !validateMeetingLink(newEvent.meetingLink, newEvent.meetingType)) {
      toast.error('Invalid meeting link format. Please check your Google Meet or Teams link.')
      return
    }

    try {
      setSubmitting(true)
      const token = await getToken()
      
      // Generate duplicate dates based on mode
      let duplicateDatesToUse = []
      if (showDuplicateDates) {
        if (duplicateMode === 'dateRange' && selectedDuplicateDates.length > 0) {
          duplicateDatesToUse = selectedDuplicateDates
        } else if (duplicateMode === 'daysOfWeek' && selectedDaysOfWeek.length > 0 && duplicateStartDate) {
          duplicateDatesToUse = generateDatesFromDaysOfWeek(duplicateStartDate, selectedDaysOfWeek, duplicateWeeks)
        }
      }

      // Construct proper ISO datetime strings with timezone handling
      // Create Date objects in user's local timezone, then convert to UTC ISO strings
      // This ensures the time is interpreted correctly regardless of server timezone
      // Without this, a time like "14:00" would be interpreted as server local time (e.g., UTC in production)
      // causing a time shift. By converting to ISO string here, we preserve the user's intended time.
      const localStartDate = new Date(`${newEvent.date}T${newEvent.time}:00`)
      const localEndDate = new Date(`${newEvent.date}T${newEvent.endTime}:00`)
      
      // Validate dates were created successfully
      if (isNaN(localStartDate.getTime()) || isNaN(localEndDate.getTime())) {
        toast.error('Invalid date or time format')
        return
      }
      
      // Convert to UTC ISO strings to ensure consistent storage
      const startDateTime = localStartDate.toISOString()
      const endDateTime = localEndDate.toISOString()
      
      const payload = {
        title: newEvent.title,
        description: newEvent.description || '',
        startTime: startDateTime,
        endTime: endDateTime,
        courseId: selectedCourse,
        studentId: selectedStudent,
        type: newEvent.type,
        meetingLink: newEvent.meetingLink || '',
        duplicateDates: duplicateDatesToUse.length > 0 ? duplicateDatesToUse : undefined
      }

      const result = await apiPost('/admin/schedules', payload, token)
      
      const eventCount = Array.isArray(result) ? result.length : 1
      toast.success(`Successfully created ${eventCount} event${eventCount > 1 ? 's' : ''} for student!`)
      
      setShowEventForm(false)
      setShowDuplicateDates(false)
      setSelectedDuplicateDates([])
      setSelectedDaysOfWeek([])
      setDuplicateMode('dateRange')
      setDuplicateStartDate('')
      setDuplicateEndDate('')
      setDuplicateWeeks(4)
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        endTime: '',
        courseId: '',
        studentId: '',
        type: 'class',
        meetingLink: '',
        meetingType: 'none'
      })
      loadEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      
      // Handle conflict errors specifically
      if (error.response?.status === 409 || error.message?.includes('conflict') || error.message?.includes('already booked')) {
        const errorData = error.response?.data || error
        let conflictMessage = errorData.message || error.message || 'This time slot is already booked for another student.'
        
        // Show detailed conflict information
        if (errorData.conflicts && Array.isArray(errorData.conflicts) && errorData.conflicts.length > 0) {
          const conflictDetails = errorData.conflicts.map((c, idx) => {
            const startTime = new Date(c.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            const endTime = new Date(c.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            return `\n${idx + 1}. "${c.title}" - ${c.student} (${c.course})\n   Time: ${startTime} - ${endTime}`
          }).join('')
          
          conflictMessage = `⚠️ Time Slot Conflict!\n\nThis time slot is already booked:${conflictDetails}`
        }
        
        toast.error(conflictMessage, { 
          duration: 10000,
          style: {
            maxWidth: '500px',
            whiteSpace: 'pre-line',
            fontSize: '14px'
          }
        })
      } else {
        toast.error(error.message || 'Failed to create event. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return
    }

    try {
      const token = await getToken()
      await apiDelete(`/admin/schedules/${eventId}`, token)
      toast.success('Event deleted successfully!')
      loadEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
      toast.error('Failed to delete event. Please try again.')
    }
  }

  const getEventTypeColor = (type) => {
    switch (type) {
      case 'class': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'exam': return 'bg-red-100 text-red-800 border-red-200'
      case 'holiday': return 'bg-green-100 text-green-800 border-green-200'
      case 'event': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'class': return '📚'
      case 'exam': return '📝'
      case 'holiday': return '🎉'
      case 'event': return '🎪'
      default: return '📅'
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return ''
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString // Return original if invalid date
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    } catch (error) {
      return dateString
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const getStudentName = (enrollment) => {
    return enrollment.name || enrollment.email || 'Unknown Student'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">Individual Student Schedules</h1>
            <p className="text-slate-600 mt-1">Create and manage schedules for individual students</p>
          </div>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="text-slate-700 hover:text-sky-700 font-medium">← Admin Panel</a>
            <a href="/admin/calendar" className="text-slate-700 hover:text-sky-700 font-medium">Course Schedules →</a>
          </nav>
        </div>
        
        <SignedOut>
          <div className="mt-6 bg-white rounded-2xl shadow p-8 text-center">
            <p className="text-slate-600 mb-4">Please sign in to access the student schedules</p>
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700 font-medium transition-colors">
                Sign In
              </button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          {/* Course and Student Selection */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => {
                    setSelectedCourse(e.target.value)
                    setSelectedStudent('')
                    setEvents([])
                  }}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                >
                  <option value="">Choose a course...</option>
                  {courses.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Select Student</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => {
                    setSelectedStudent(e.target.value)
                    loadEvents()
                  }}
                  disabled={!selectedCourse || enrollments.length === 0}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Choose a student...</option>
                  {enrollments.map(enrollment => (
                    <option key={enrollment._id} value={enrollment.userId}>
                      {getStudentName(enrollment)} {enrollment.email ? `(${enrollment.email})` : ''}
                    </option>
                  ))}
                </select>
                {selectedCourse && enrollments.length === 0 && (
                  <p className="text-xs text-slate-500 mt-1">No enrolled students found for this course</p>
                )}
              </div>
            </div>

            {selectedCourse && selectedStudent && (
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex gap-4 items-center flex-wrap">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">View Date</label>
                    <input 
                      type="date" 
                      value={selectedDate} 
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setShowEventForm(true)
                      setNewEvent(prev => ({ 
                        ...prev, 
                        date: selectedDate, 
                        courseId: selectedCourse, 
                        studentId: selectedStudent,
                        time: '',
                        endTime: ''
                      }))
                    }}
                    className="px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 mt-6 sm:mt-0"
                  >
                    <span className="flex items-center gap-2">
                      <span>+</span>
                      <span>Add Schedule</span>
                    </span>
                  </button>
                </div>
                
                <div className="text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-lg">
                  <span className="font-semibold text-slate-900">{events.length}</span> event{events.length !== 1 ? 's' : ''} on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            )}
          </div>

          {!selectedCourse && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-100">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Course</h3>
              <p className="text-slate-600">Please select a course to view and manage individual student schedules.</p>
            </div>
          )}

          {selectedCourse && !selectedStudent && enrollments.length > 0 && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-8 text-center border border-slate-100">
              <div className="text-6xl mb-4">👤</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Student</h3>
              <p className="text-slate-600">Please select a student to view and manage their individual schedules.</p>
            </div>
          )}

          {/* Event Creation Form */}
          {showEventForm && selectedCourse && selectedStudent && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg p-6 border border-slate-100 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-xl text-slate-900">Create Schedule for Student</h2>
                <button
                  onClick={() => {
                    setShowEventForm(false)
                    setShowDuplicateDates(false)
                    setSelectedDuplicateDates([])
                    setSelectedDaysOfWeek([])
                    setDuplicateMode('dateRange')
                    setDuplicateStartDate('')
                    setDuplicateEndDate('')
                    setDuplicateWeeks(4)
                  }}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                  title="Close"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <form onSubmit={createEvent} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Event Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      placeholder="e.g., Individual Guitar Lesson"
                      required
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                    <select
                      value={newEvent.type}
                      onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    >
                      <option value="class">📚 Class</option>
                      <option value="exam">📝 Exam</option>
                      <option value="holiday">🎉 Holiday</option>
                      <option value="event">🎪 Special Event</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value, time: '', endTime: ''})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <TimeSlotPicker
                      selectedDate={newEvent.date}
                      startTime={newEvent.time}
                      endTime={newEvent.endTime}
                      onStartTimeChange={(time) => setNewEvent({...newEvent, time, endTime: ''})}
                      onEndTimeChange={(endTime) => setNewEvent({...newEvent, endTime})}
                      bookedSlots={allSchedulesForDate}
                      intervalMinutes={30}
                      startHour={8}
                      endHour={22}
                    />
                    {loadingSchedules && (
                      <p className="text-xs text-slate-500 mt-1">Loading available slots...</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Meeting Type</label>
                    <select
                      value={newEvent.meetingType}
                      onChange={(e) => setNewEvent({...newEvent, meetingType: e.target.value, meetingLink: e.target.value === 'none' ? '' : newEvent.meetingLink})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    >
                      <option value="none">No Meeting Link</option>
                      <option value="meet">🔵 Google Meet</option>
                      <option value="teams">💼 Microsoft Teams</option>
                    </select>
                  </div>
                </div>

                {newEvent.meetingType !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Meeting Link <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={newEvent.meetingLink}
                      onChange={(e) => setNewEvent({...newEvent, meetingLink: e.target.value})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                      placeholder={newEvent.meetingType === 'meet' ? 'https://meet.google.com/xxx-xxxx-xxx' : 'https://teams.microsoft.com/l/meetup-join/...'}
                      required={newEvent.meetingType !== 'none'}
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      {newEvent.meetingType === 'meet' 
                        ? 'Paste your Google Meet link here' 
                        : 'Paste your Microsoft Teams meeting link here'}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all"
                    rows="3"
                    placeholder="Enter event description (optional)"
                  />
                </div>

                {/* Duplicate Event Section */}
                <div className="border-t border-slate-200 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Duplicate Event to Multiple Days
                      </label>
                      <p className="text-xs text-slate-500">
                        Create the same event on multiple selected dates or days of the week
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowDuplicateDates(!showDuplicateDates)
                        if (!showDuplicateDates) {
                          setSelectedDuplicateDates([])
                          setSelectedDaysOfWeek([])
                          setDuplicateStartDate(newEvent.date)
                          setDuplicateEndDate('')
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        showDuplicateDates
                          ? 'bg-sky-600 text-white hover:bg-sky-700'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {showDuplicateDates ? '✓ Enabled' : 'Enable'}
                    </button>
                  </div>

                  {showDuplicateDates && (
                    <div className="bg-slate-50 rounded-lg p-4 space-y-4 animate-fade-in">
                      {/* Mode Selection */}
                      <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">Duplicate Mode</label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDuplicateMode('dateRange')
                              setSelectedDaysOfWeek([])
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              duplicateMode === 'dateRange'
                                ? 'bg-sky-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Date Range
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDuplicateMode('daysOfWeek')
                              setSelectedDuplicateDates([])
                              if (!duplicateStartDate) {
                                setDuplicateStartDate(newEvent.date)
                              }
                            }}
                            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                              duplicateMode === 'daysOfWeek'
                                ? 'bg-sky-600 text-white'
                                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            Days of Week
                          </button>
                        </div>
                      </div>

                      {/* Date Range Mode */}
                      {duplicateMode === 'dateRange' && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-700 mb-2">Start Date</label>
                              <input
                                type="date"
                                value={selectedDuplicateDates[0] || newEvent.date}
                                onChange={(e) => {
                                  const startDate = e.target.value
                                  const endDate = selectedDuplicateDates[selectedDuplicateDates.length - 1] || startDate
                                  if (startDate <= endDate) {
                                    setSelectedDuplicateDates(generateDateRange(startDate, endDate))
                                  }
                                }}
                                min={newEvent.date}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-medium text-slate-700 mb-2">End Date</label>
                              <input
                                type="date"
                                value={selectedDuplicateDates[selectedDuplicateDates.length - 1] || newEvent.date}
                                onChange={(e) => {
                                  const endDate = e.target.value
                                  const startDate = selectedDuplicateDates[0] || newEvent.date
                                  if (startDate <= endDate) {
                                    setSelectedDuplicateDates(generateDateRange(startDate, endDate))
                                  }
                                }}
                                min={selectedDuplicateDates[0] || newEvent.date}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                              />
                            </div>
                          </div>
                          
                          {selectedDuplicateDates.length > 0 && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs font-medium text-slate-700 mb-2">
                                Selected Dates ({selectedDuplicateDates.length}):
                              </p>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {selectedDuplicateDates.map((date) => (
                                  <span
                                    key={date}
                                    className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-medium"
                                  >
                                    {formatDate(date)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Days of Week Mode */}
                      {duplicateMode === 'daysOfWeek' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">Start Date</label>
                              <input
                                type="date"
                                value={duplicateStartDate || newEvent.date}
                                onChange={(e) => setDuplicateStartDate(e.target.value)}
                                min={newEvent.date}
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-2">Number of Weeks</label>
                              <input
                                type="number"
                                value={duplicateWeeks}
                                onChange={(e) => setDuplicateWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                                min="1"
                                max="52"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-700 mb-2">Select Days of Week</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() => handleDayOfWeekToggle(day)}
                                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                    selectedDaysOfWeek.includes(day)
                                      ? 'bg-sky-600 text-white'
                                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                                  }`}
                                >
                                  {day.slice(0, 3)}
                                </button>
                              ))}
                            </div>
                          </div>

                          {selectedDaysOfWeek.length > 0 && duplicateStartDate && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <p className="text-xs font-medium text-slate-700 mb-2">
                                Generated Dates ({generateDatesFromDaysOfWeek(duplicateStartDate, selectedDaysOfWeek, duplicateWeeks).length}):
                              </p>
                              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                                {generateDatesFromDaysOfWeek(duplicateStartDate, selectedDaysOfWeek, duplicateWeeks).map((date) => (
                                  <span
                                    key={date}
                                    className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs font-medium"
                                  >
                                    {formatDate(date)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg hover:from-sky-700 hover:to-blue-700 font-medium shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Creating...</span>
                      </>
                    ) : (
                      <>
                        <span>✓</span>
                        <span>Create Schedule{
                          showDuplicateDates ? (
                            duplicateMode === 'dateRange' && selectedDuplicateDates.length > 0 
                              ? `s (${selectedDuplicateDates.length + 1})`
                              : duplicateMode === 'daysOfWeek' && selectedDaysOfWeek.length > 0 && duplicateStartDate
                                ? `s (${generateDatesFromDaysOfWeek(duplicateStartDate, selectedDaysOfWeek, duplicateWeeks).length + 1})`
                                : ''
                          ) : ''
                        }</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventForm(false)
                      setShowDuplicateDates(false)
                      setSelectedDuplicateDates([])
                      setSelectedDaysOfWeek([])
                      setDuplicateMode('dateRange')
                      setDuplicateStartDate('')
                      setDuplicateEndDate('')
                      setDuplicateWeeks(4)
                    }}
                    className="px-5 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Events List */}
          {selectedCourse && selectedStudent && (
            <div className="mt-6 bg-white rounded-2xl shadow-lg border border-slate-100">
              <div className="p-6 border-b border-slate-200">
                <h2 className="font-bold text-xl text-slate-900">
                  Schedules for {enrollments.find(e => e.userId === selectedStudent) ? getStudentName(enrollments.find(e => e.userId === selectedStudent)) : 'Student'} on {new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Individual schedules for this student
                </p>
              </div>
              
              {loading && events.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading events...</p>
                </div>
              ) : events.length > 0 ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {events.map((event) => (
                      <div key={event._id} className="flex items-start gap-4 p-5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all duration-300">
                        <div className="text-3xl">{getEventTypeIcon(event.type || 'class')}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="font-semibold text-lg text-slate-900">{event.title}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type || 'class')}`}>
                              {event.type ? event.type.charAt(0).toUpperCase() + event.type.slice(1) : 'Class'}
                            </span>
                            <span className="px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              Individual Schedule
                            </span>
                            {event.status && (
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                event.status === 'completed' ? 'bg-green-100 text-green-800' :
                                event.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {event.status}
                              </span>
                            )}
                          </div>
                          
                          <div className="text-sm text-slate-600 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400">🕐</span>
                              <span className="font-medium">{formatTime(event.startTime)}</span>
                              {event.endTime && (
                                <>
                                  <span className="text-slate-300">-</span>
                                  <span>{formatTime(event.endTime)}</span>
                                </>
                              )}
                            </div>
                            
                            {event.courseId && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">📚</span>
                                <span>{courses.find(c => c._id === event.courseId)?.title || 'Unknown Course'}</span>
                              </div>
                            )}
                            
                            {event.meetingLink && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400">🔗</span>
                                <a
                                  href={event.meetingLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sky-600 hover:text-sky-700 hover:underline font-medium"
                                >
                                  {event.meetingLink.includes('meet.google.com') ? 'Join Google Meet' : 
                                   event.meetingLink.includes('teams.microsoft.com') || event.meetingLink.includes('teams.live.com') ? 'Join Teams Meeting' :
                                   'Join Meeting'}
                                </a>
                              </div>
                            )}
                            
                            {event.description && (
                              <div className="mt-2 text-slate-700 bg-slate-50 p-3 rounded-lg">
                                {event.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteEvent(event._id)}
                          className="text-red-400 hover:text-red-600 transition-colors p-2 hover:bg-red-50 rounded-lg"
                          title="Delete event"
                        >
                          <span className="text-xl">🗑️</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">No Schedules Found</h3>
                  <p className="text-slate-600 mb-6">No individual schedules are scheduled for this student on this date. Create one using the "Add Schedule" button above.</p>
                  <button
                    onClick={() => {
                      setShowEventForm(true)
                      setNewEvent(prev => ({ 
                        ...prev, 
                        date: selectedDate, 
                        courseId: selectedCourse, 
                        studentId: selectedStudent,
                        time: '',
                        endTime: ''
                      }))
                    }}
                    className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium transition-colors"
                  >
                    Create Schedule
                  </button>
                </div>
              )}
            </div>
          )}
        </SignedIn>
      </div>

      <Footer showAdminTools={true} />
    </div>
  )
}

