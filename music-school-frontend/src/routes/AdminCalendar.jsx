import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'
import { apiGet, apiPost } from '../lib/api'

export default function AdminCalendar() {
  const { getToken } = useAuth()
  const [events, setEvents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [showEventForm, setShowEventForm] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    courseId: '',
    type: 'class' // class, exam, holiday, event
  })

  useEffect(() => {
    loadEvents()
    loadCourses()
  }, [selectedDate])

  const loadEvents = async () => {
    try {
      const token = await getToken()
      const data = await apiGet('/admin/events')
      setEvents(data.filter(event => event.date.startsWith(selectedDate)))
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCourses = async () => {
    try {
      const data = await apiGet('/courses')
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    }
  }

  const createEvent = async (e) => {
    e.preventDefault()
    if (!newEvent.title || !newEvent.date || !newEvent.time) {
      alert('Please fill in all required fields')
      return
    }

    try {
      const token = await getToken()
      await apiPost('/admin/events', {
        ...newEvent,
        dateTime: `${newEvent.date}T${newEvent.time}:00.000Z`
      }, token)
      
      setShowEventForm(false)
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        courseId: '',
        type: 'class'
      })
      loadEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Failed to create event. Please try again.')
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-slate-900">Calendar Management</h1>
          <nav className="flex gap-3 text-sm">
            <a href="/admin" className="text-slate-700 hover:text-sky-700">Admin Panel</a>
            <a href="/" className="text-slate-700 hover:text-sky-700">Home</a>
          </nav>
        </div>
        
        <SignedOut>
          <div className="mt-6">
            <SignInButton>
              <button className="px-5 py-3 rounded-full bg-slate-900 text-white">Sign in</button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
          {loading ? (
            <div className="mt-6">Loading...</div>
          ) : (
            <>
              {/* Date Selection and Event Creation */}
              <div className="mt-6 bg-white rounded-2xl shadow p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <div className="flex gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">View Date</label>
                      <input 
                        type="date" 
                        value={selectedDate} 
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <button
                      onClick={() => setShowEventForm(true)}
                      className="px-4 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium"
                    >
                      + Add Event
                    </button>
                  </div>
                  
                  <div className="text-sm text-slate-600">
                    {events.length} event{events.length !== 1 ? 's' : ''} on {new Date(selectedDate).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Event Creation Form */}
              {showEventForm && (
                <div className="mt-6 bg-white rounded-2xl shadow p-6">
                  <h2 className="font-bold text-lg mb-4">Create New Event</h2>
                  <form onSubmit={createEvent} className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Event Title *</label>
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        placeholder="Enter event title"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Event Type</label>
                      <select
                        value={newEvent.type}
                        onChange={(e) => setNewEvent({...newEvent, type: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="class">Class</option>
                        <option value="exam">Exam</option>
                        <option value="holiday">Holiday</option>
                        <option value="event">Special Event</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date *</label>
                      <input
                        type="date"
                        value={newEvent.date}
                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Time *</label>
                      <input
                        type="time"
                        value={newEvent.time}
                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Course (Optional)</label>
                      <select
                        value={newEvent.courseId}
                        onChange={(e) => setNewEvent({...newEvent, courseId: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      >
                        <option value="">Select a course</option>
                        {courses.map(course => (
                          <option key={course._id} value={course._id}>
                            {course.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                        rows="3"
                        placeholder="Enter event description (optional)"
                      />
                    </div>

                    <div className="sm:col-span-2 flex gap-3">
                      <button
                        type="submit"
                        className="px-5 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 font-medium"
                      >
                        Create Event
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEventForm(false)}
                        className="px-5 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Events List */}
              <div className="mt-6 bg-white rounded-2xl shadow">
                <div className="p-6 border-b">
                  <h2 className="font-bold text-lg">Events for {new Date(selectedDate).toLocaleDateString()}</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    View and manage scheduled events
                  </p>
                </div>
                
                {events.length > 0 ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      {events.map((event, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                          <div className="text-2xl">{getEventTypeIcon(event.type)}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-slate-900">{event.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getEventTypeColor(event.type)}`}>
                                {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                              </span>
                            </div>
                            
                            <div className="text-sm text-slate-600 space-y-1">
                              <div className="flex items-center gap-2">
                                <span>🕐</span>
                                <span>{new Date(event.dateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                              </div>
                              
                              {event.courseId && (
                                <div className="flex items-center gap-2">
                                  <span>📚</span>
                                  <span>{courses.find(c => c._id === event.courseId)?.title || 'Unknown Course'}</span>
                                </div>
                              )}
                              
                              {event.description && (
                                <div className="mt-2 text-slate-700">
                                  {event.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-4xl mb-4">📅</div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No Events Scheduled</h3>
                    <p className="text-slate-600">No events are scheduled for this date. Create one using the "Add Event" button above.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </SignedIn>
      </div>
    </div>
  )
}
