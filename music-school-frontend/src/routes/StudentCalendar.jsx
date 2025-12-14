import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'
import StudentNavbar from '../components/StudentNavbar.jsx'
import StudentFooter from '../components/StudentFooter.jsx'
import StudentSidebar from '../components/StudentSidebar.jsx'

function CalendarGrid({ schedules, selectedDate, onDateSelect, view }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Filter to show only individual schedules
  const individualSchedules = schedules.filter(schedule => {
    return schedule.studentId && schedule.studentId !== null && schedule.studentId !== ''
  })
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  const getEventsForDate = (date) => {
    return individualSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      return scheduleDate.toDateString() === date.toDateString()
    })
  }
  
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }
  
  const isToday = (date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }
  
  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString()
  }
  
  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const days = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
  }
  
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  
  return (
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-3 sm:p-4 lg:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Previous month"
            >
              <span className="text-lg">‹</span>
            </button>
            <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Next month"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors whitespace-nowrap"
          >
            Today
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-2 sm:p-4 lg:p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-slate-500 py-1 sm:py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-12 sm:h-16 lg:h-20"></div>
            }
            
            const events = getEventsForDate(date)
            const isCurrentDay = isToday(date)
            const isSelectedDay = isSelected(date)
            
            return (
              <div
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`h-12 sm:h-16 lg:h-20 p-1 cursor-pointer rounded-lg transition-all duration-200 ${
                  isCurrentDay 
                    ? 'bg-sky-100 border-2 border-sky-500' 
                    : isSelectedDay
                    ? 'bg-sky-50 border border-sky-300'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs sm:text-sm font-medium mb-0.5 ${
                  isCurrentDay ? 'text-sky-700' : 'text-slate-900'
                }`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {events.slice(0, 1).map(event => {
                    return (
                      <div
                        key={event._id}
                        className="text-[10px] sm:text-xs px-1 py-0.5 rounded truncate bg-purple-500 text-white"
                        title={`${event.title} (Individual)`}
                      >
                        {formatTime(event.startTime)}
                      </div>
                    )
                  })}
                  {events.length > 1 && (
                    <div className="text-[10px] sm:text-xs text-slate-500">
                      +{events.length - 1}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function EventDetail({ selectedDate, schedules, onClose, isMobile = false }) {
  // Filter to show only individual schedules
  const individualSchedules = schedules.filter(schedule => {
    return schedule.studentId && schedule.studentId !== null && schedule.studentId !== ''
  })
  
  const getEventsForDate = (date) => {
    if (!date) return []
    const now = new Date()
    return individualSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      const sameDay = scheduleDate.toDateString() === date.toDateString()
      if (!sameDay) return false
      // Show recent (upcoming) events for the selected date
      if (date.toDateString() === now.toDateString()) {
        return scheduleDate >= now
      }
      return true
    })
  }
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  // Check if join button should be enabled (15 minutes before start time)
  const canJoinClass = (startTime, endTime) => {
    if (!startTime) return false
    const now = new Date()
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : null
    
    // Calculate 15 minutes before start time
    const fifteenMinutesBefore = new Date(start.getTime() - 15 * 60 * 1000)
    
    // Enable if current time is 15 minutes before start or later
    // And if current time is before or within the class duration (allow 30 minutes after end for late joiners)
    const isAfterFifteenMinBefore = now >= fifteenMinutesBefore
    const isBeforeOrDuringClass = !end || now <= new Date(end.getTime() + 30 * 60 * 1000)
    
    return isAfterFifteenMinBefore && isBeforeOrDuringClass
  }
  
  const joinMeeting = (meetingLink) => {
    if (meetingLink) {
      window.open(meetingLink, '_blank')
    }
  }
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  
  const events = getEventsForDate(selectedDate)
  
  if (!selectedDate) return null
  
  return (
    <div className={`bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 ${isMobile ? 'fixed inset-x-4 bottom-4 top-auto max-h-[70vh] overflow-y-auto z-50' : ''}`}>
      <div className="p-3 sm:p-4 lg:p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">
            {formatDate(selectedDate)}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>
      
      <div className="p-3 sm:p-4 lg:p-6">
        {events.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {events.map(event => {
              return (
                <div key={event._id} className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-lg sm:text-xl">📅</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h4 className="font-semibold text-slate-900 text-sm sm:text-base">{event.title}</h4>
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Individual
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span>{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
                      </div>
                      {event.instructor && (
                        <div className="flex items-center gap-2">
                          <span>👨‍🏫</span>
                          <span>Instructor: {event.instructor}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{event.location}</span>
                        </div>
                      )}
                      {event.description && (
                        <div className="mt-2 text-slate-700 text-xs sm:text-sm">{event.description}</div>
                      )}
                    </div>
                    {event.meetingLink && (
                      <div className="mt-3">
                        {canJoinClass(event.startTime, event.endTime) ? (
                          <button
                            onClick={() => joinMeeting(event.meetingLink)}
                            className="w-full sm:w-auto px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                          >
                            Join Class
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full sm:w-auto px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm font-medium"
                            title="Join button will be available 15 minutes before class starts"
                          >
                            Join Class (Available 15 min before)
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8">
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">📅</div>
            <h4 className="text-base sm:text-lg font-semibold text-slate-900 mb-2">No Classes Scheduled</h4>
            <p className="text-xs sm:text-sm text-slate-600">You don't have any classes on this date.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarContent({ schedules, enrollments, loading, onMenuClick }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showMobileEventDetail, setShowMobileEventDetail] = useState(false)
  
  // Filter to show only individual schedules (where studentId exists and is not null/empty)
  // Backend still fetches both types, but UI only displays individual schedules
  const individualSchedules = schedules.filter(schedule => {
    return schedule.studentId && schedule.studentId !== null && schedule.studentId !== ''
  })
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
  
  // Check if join button should be enabled (15 minutes before start time)
  const canJoinClass = (startTime, endTime) => {
    if (!startTime) return false
    const now = new Date()
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : null
    
    // Calculate 15 minutes before start time
    const fifteenMinutesBefore = new Date(start.getTime() - 15 * 60 * 1000)
    
    // Enable if current time is 15 minutes before start or later
    // And if current time is before or within the class duration (allow 30 minutes after end for late joiners)
    const isAfterFifteenMinBefore = now >= fifteenMinutesBefore
    const isBeforeOrDuringClass = !end || now <= new Date(end.getTime() + 30 * 60 * 1000)
    
    return isAfterFifteenMinBefore && isBeforeOrDuringClass
  }
  
  const getUpcomingSchedules = () => {
    const now = new Date()
    return individualSchedules.filter(schedule => new Date(schedule.startTime) > now).slice(0, 3)
  }
  
  const getTodaysSchedules = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return individualSchedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      return scheduleDate >= today && scheduleDate < tomorrow
    })
  }
  
  const handleDateSelect = (date) => {
    setSelectedDate(date)
    setShowMobileEventDetail(true)
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }
  
  const upcomingSchedules = getUpcomingSchedules()
  const todaysSchedules = getTodaysSchedules()
  
  return (
    <div className="flex-1 p-3 sm:p-4 lg:p-6 xl:p-8 pb-20 sm:pb-8">
      {/* Mobile Header */}
      <div className="lg:hidden mb-4 sm:mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-100 hidden"
            style={{ display: 'none' }}
            aria-label="Open menu"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🎶</span>
            </div>
            <span className="font-bold text-slate-900 text-sm sm:text-base">Calendar</span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, Your Calendar 📅
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm lg:text-base">
          View your individual class schedules and practice sessions.
        </p>
      </div>

      {/* Check if student has enrollments */}
      {enrollments.length === 0 && !loading && (
        <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl sm:rounded-2xl">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="text-xl sm:text-2xl">🎓</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2 text-sm sm:text-base">No Enrollments Found</h3>
              <p className="text-amber-700 text-xs sm:text-sm mb-4">
                You need to be enrolled in courses to see your class schedule.
              </p>
              <a 
                href="/courses" 
                className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium text-xs sm:text-sm"
              >
                Browse Courses
              </a>
            </div>
          </div>
        </div>
      )}

      {enrollments.length > 0 && (
        <>
          {/* Today's Classes Quick View */}
          {todaysSchedules.length > 0 && (
            <div className="mb-4 sm:mb-6 lg:mb-8">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Today's Classes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {todaysSchedules.map(schedule => {
                  return (
                    <div key={schedule._id} className="bg-green-50 border border-green-200 rounded-xl p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-green-600 text-sm sm:text-base">📚</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{schedule.title}</h3>
                            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                              Individual
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-green-600 mt-0.5">
                            {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                      {schedule.meetingLink && (
                        canJoinClass(schedule.startTime, schedule.endTime) ? (
                          <button
                            onClick={() => window.open(schedule.meetingLink, '_blank')}
                            className="w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Join Class
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-xs sm:text-sm font-medium"
                            title="Join button will be available 15 minutes before class starts"
                          >
                            Join Class (Available 15 min before)
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Calendar and Events Split - Responsive */}
          <div className="mb-4 sm:mb-6 lg:mb-8">
            <div className="lg:flex lg:gap-6">
              <div className="lg:w-2/3 mb-4 lg:mb-0">
                <CalendarGrid
                  schedules={individualSchedules}
                  selectedDate={selectedDate}
                  onDateSelect={handleDateSelect}
                  view="month"
                />
              </div>
              {/* Desktop Event Detail */}
              <div className="hidden lg:block lg:w-1/3">
                <EventDetail
                  selectedDate={selectedDate}
                  schedules={individualSchedules}
                  onClose={() => setSelectedDate(new Date())}
                  isMobile={false}
                />
              </div>
            </div>
          </div>

          {/* Mobile Event Detail - Bottom Sheet */}
          {showMobileEventDetail && (
            <>
              <div 
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowMobileEventDetail(false)}
              />
              <div className="lg:hidden">
                <EventDetail
                  selectedDate={selectedDate}
                  schedules={individualSchedules}
                  onClose={() => {
                    setShowMobileEventDetail(false)
                    setSelectedDate(new Date())
                  }}
                  isMobile={true}
                />
              </div>
            </>
          )}

          {/* Upcoming Classes */}
          {upcomingSchedules.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 mb-3 sm:mb-4">Upcoming Classes</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {upcomingSchedules.map(schedule => {
                  return (
                    <div key={schedule._id} className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 text-sm sm:text-base">📅</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <h3 className="font-semibold text-slate-900 truncate text-sm sm:text-base">{schedule.title}</h3>
                            <span className="px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium bg-purple-100 text-purple-800 flex-shrink-0">
                              Individual
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                            {new Date(schedule.startTime).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            })} at {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                      {schedule.instructor && (
                        <p className="text-xs sm:text-sm text-slate-500 mb-2 sm:mb-3">Instructor: {schedule.instructor}</p>
                      )}
                      {schedule.meetingLink && (
                        canJoinClass(schedule.startTime, schedule.endTime) ? (
                          <button
                            onClick={() => window.open(schedule.meetingLink, '_blank')}
                            className="w-full px-3 sm:px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            Join Class
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-xs sm:text-sm font-medium"
                            title="Join button will be available 15 minutes before class starts"
                          >
                            Join Class (Available 15 min before)
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* No Classes Message */}
          {individualSchedules.length === 0 && (
            <div className="bg-white rounded-xl lg:rounded-2xl p-6 sm:p-8 lg:p-12 text-center border border-slate-200">
              <div className="text-3xl sm:text-4xl lg:text-6xl mb-3 sm:mb-4">📅</div>
              <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Individual Classes Scheduled</h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 sm:mb-6">You don't have any individual classes scheduled yet.</p>
              <p className="text-xs sm:text-sm text-slate-500">
                Your instructor will create individual schedules for you soon.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function StudentCalendar() {
  const { getToken } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [enrollments, setEnrollments] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('calendar')

  useEffect(() => {
    loadEnrollments()
  }, [])

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
          loadSchedules()
        }
      }
    } catch (error) {
      console.error('Error loading enrollments:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSchedules = async () => {
    try {
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/schedules`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const res = await fetch(url.toString(), { headers })
      if (res.ok) {
        const data = await res.json()
        setSchedules(data)
      }
    } catch (error) {
      console.error('Error loading schedules:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <StudentNavbar />
      
      <SignedOut>
        <div className="flex items-center justify-center min-h-screen py-20">
          <div className="text-center px-4">
            <div className="text-6xl mb-6">🎶</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to Music Academy</h1>
            <p className="text-slate-600 mb-6">Please sign in to access your calendar</p>
            <SignInButton>
              <button className="px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </SignedOut>
      
      <SignedIn>
        <div className="flex min-h-screen pt-20">
          <StudentSidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="flex-1 overflow-y-auto pb-16 md:pb-0 md:ml-64">
            <CalendarContent 
              schedules={schedules}
              enrollments={enrollments}
              loading={loading}
              onMenuClick={() => setSidebarOpen(true)}
            />
          </div>
        </div>
      </SignedIn>
      
      <StudentFooter />
    </div>
  )
}
