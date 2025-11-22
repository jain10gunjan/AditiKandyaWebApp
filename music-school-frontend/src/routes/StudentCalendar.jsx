import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'

function Sidebar({ activeTab, onTabChange, isOpen, onClose }) {
  const { user } = useAuth()
  
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: '🏠', href: '/dashboard' },
    { id: 'courses', label: 'My Courses', icon: '📚', href: '/dashboard' },
    { id: 'calendar', label: 'Calendar', icon: '📅', href: '/student/calendar' },
    { id: 'attendance', label: 'Attendance', icon: '📊', href: '/student/attendance' },
    { id: 'resources', label: 'Resources', icon: '📖', href: '/student/resources' },
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
      <div className={`fixed inset-y-0 left-0 z-50 w-56 lg:w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-screen flex flex-col">
          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Header */}
            <div className="p-4 lg:p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 lg:gap-3">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-sm lg:text-lg">🎶</span>
                  </div>
                  <div>
                    <h1 className="font-bold text-slate-900 text-sm lg:text-base">TheMusinest</h1>
                    <p className="text-xs text-slate-600">By - Aditi Kandya</p>
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
                    {user?.firstName && user?.lastName 
                      ? `${user.firstName} ${user.lastName}` 
                      : user?.firstName || user?.fullName || 'Student'}
                  </p>
                  <p className="text-xs text-slate-600 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress || 'student@example.com'}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Menu */}
            <nav className="p-3 lg:p-4 pb-20 lg:pb-20">
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
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex-shrink-0 p-3 lg:p-4 border-t border-slate-200 bg-white">
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

function CalendarGrid({ schedules, selectedDate, onDateSelect, view }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }
  
  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }
  
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }
  
  const getEventsForDate = (date) => {
    return schedules.filter(schedule => {
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
      <div className="p-4 lg:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-lg">‹</span>
            </button>
            <h2 className="text-lg lg:text-xl font-bold text-slate-900">
              {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <span className="text-lg">›</span>
            </button>
          </div>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 text-sm bg-sky-100 text-sky-700 rounded-lg hover:bg-sky-200 transition-colors"
          >
            Today
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-4 lg:p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-xs lg:text-sm font-medium text-slate-500 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={index} className="h-16 lg:h-20"></div>
            }
            
            const events = getEventsForDate(date)
            const isCurrentDay = isToday(date)
            const isSelectedDay = isSelected(date)
            
            return (
              <div
                key={date.toISOString()}
                onClick={() => onDateSelect(date)}
                className={`h-16 lg:h-20 p-1 cursor-pointer rounded-lg transition-all duration-200 ${
                  isCurrentDay 
                    ? 'bg-sky-100 border-2 border-sky-500' 
                    : isSelectedDay
                    ? 'bg-sky-50 border border-sky-300'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className={`text-xs lg:text-sm font-medium ${
                  isCurrentDay ? 'text-sky-700' : 'text-slate-900'
                }`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5 mt-1">
                  {events.slice(0, 2).map(event => (
                    <div
                      key={event._id}
                      className="text-xs bg-blue-500 text-white px-1 py-0.5 rounded truncate"
                      title={event.title}
                    >
                      {formatTime(event.startTime)} {event.title}
                    </div>
                  ))}
                  {events.length > 2 && (
                    <div className="text-xs text-slate-500">
                      +{events.length - 2} more
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

function EventDetail({ selectedDate, schedules, onClose }) {
  const getEventsForDate = (date) => {
    if (!date) return []
    const now = new Date()
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      const sameDay = scheduleDate.toDateString() === date.toDateString()
      if (!sameDay) return false
      // Show recent (upcoming) events for the selected date
      if (date.toDateString() === now.toDateString()) {
        return scheduleDate >= now
      }
      // For future dates, show all events on that date; for past dates, none will match since sameDay true but < now is okay since not today
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
    <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200">
      <div className="p-4 lg:p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg lg:text-xl font-bold text-slate-900">
            {formatDate(selectedDate)}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
      </div>
      
      <div className="p-4 lg:p-6">
        {events.length > 0 ? (
          <div className="space-y-4">
            {events.map(event => (
              <div key={event._id} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold">📅</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 mb-1">{event.title}</h4>
                  <div className="text-sm text-slate-600 space-y-1">
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
                      <div className="mt-2 text-slate-700">{event.description}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(event.status)}`}>
                    {event.status}
                  </span>
                  {event.meetingLink && (
                    <button
                      onClick={() => joinMeeting(event.meetingLink)}
                      className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm"
                    >
                      Join Class
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h4 className="text-lg font-semibold text-slate-900 mb-2">No Classes Scheduled</h4>
            <p className="text-slate-600">You don't have any classes on this date.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function CalendarContent({ schedules, enrollments, loading, onMenuClick }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState('month')
  
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }
  
  const getUpcomingSchedules = () => {
    const now = new Date()
    return schedules.filter(schedule => new Date(schedule.startTime) > now).slice(0, 3)
  }
  
  const getTodaysSchedules = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.startTime)
      return scheduleDate >= today && scheduleDate < tomorrow
    })
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
    <div className="flex-1 p-4 lg:p-6 xl:p-8">
      {/* Mobile Header */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🎶</span>
            </div>
            <span className="font-bold text-slate-900">Calendar</span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, Your Calendar 📅
        </h1>
        <p className="text-slate-600 text-sm lg:text-base">
          Stay on top of your music classes and practice schedule.
        </p>
      </div>

      {/* Check if student has enrollments */}
      {enrollments.length === 0 && !loading && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🎓</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">No Enrollments Found</h3>
              <p className="text-amber-700 text-sm mb-4">
                You need to be enrolled in courses to see your class schedule.
              </p>
              <a 
                href="/courses" 
                className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
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
            <div className="mb-6 lg:mb-8">
              <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">Today's Classes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todaysSchedules.map(schedule => (
                  <div key={schedule._id} className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600">📚</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{schedule.title}</h3>
                        <p className="text-sm text-green-600">
                          {new Date(schedule.startTime).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                    {schedule.meetingLink && (
                      <button
                        onClick={() => window.open(schedule.meetingLink, '_blank')}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Join Class
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* Calendar and Events Split 70:30 */}
      <div className="mb-6 lg:mb-8 lg:flex lg:gap-6">
        <div className="lg:w-2/3">
          <CalendarGrid
            schedules={schedules}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            view={view}
          />
        </div>
        <div className="lg:w-1/3 mt-6 lg:mt-0">
          <EventDetail
            selectedDate={selectedDate}
            schedules={schedules}
            onClose={() => setSelectedDate(new Date())}
          />
        </div>
      </div>

          {/* Upcoming Classes */}
          {upcomingSchedules.length > 0 && (
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">Upcoming Classes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingSchedules.map(schedule => (
                  <div key={schedule._id} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600">📅</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate">{schedule.title}</h3>
                        <p className="text-sm text-slate-600">
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
                      <p className="text-sm text-slate-500 mb-3">Instructor: {schedule.instructor}</p>
                    )}
                    {schedule.meetingLink && (
                      <button
                        onClick={() => window.open(schedule.meetingLink, '_blank')}
                        className="w-full px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                      >
                        Join Class
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Classes Message */}
          {schedules.length === 0 && (
            <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
              <div className="text-4xl lg:text-6xl mb-4">📅</div>
              <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Classes Scheduled</h3>
              <p className="text-slate-600 mb-6">You don't have any classes scheduled yet.</p>
              <p className="text-sm text-slate-500">
                Your instructor will create schedules for your enrolled courses soon.
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
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
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
        <div className="flex h-screen overflow-hidden">
          <Sidebar 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
          <div className="lg:ml-16 xl:ml-20 flex-1 overflow-y-auto">
            <CalendarContent 
              schedules={schedules}
              enrollments={enrollments}
              loading={loading}
              onMenuClick={() => setSidebarOpen(true)}
            />
          </div>
        </div>
      </SignedIn>
    </div>
  )
}
