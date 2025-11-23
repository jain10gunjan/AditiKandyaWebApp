import { useEffect, useState, useRef } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost } from '../lib/api'
import toast from 'react-hot-toast'

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
                {menuItems.map((item) => {
                  // Only Overview and My Courses should change tabs, others should navigate
                  const isDashboardTab = item.id === 'overview' || item.id === 'courses'
                  
                  return (
                    <li key={item.id}>
                      <a
                        href={item.href}
                        onClick={(e) => {
                          if (isDashboardTab) {
                            e.preventDefault()
                            onTabChange(item.id)
                          }
                          onClose()
                        }}
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
                  )
                })}
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

function DashboardContent({ activeTab, items, pending, loading, onMenuClick, schedules, attendanceSummary, courseProgress }) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  // My Courses View
  if (activeTab === 'courses') {
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
              <span className="font-bold text-slate-900">My Courses</span>
            </div>
            <div className="w-8"></div>
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 lg:mb-8">
          <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
            My Courses
          </h1>
          <p className="text-slate-600 text-sm lg:text-base">
            All your enrolled courses in one place.
          </p>
        </div>

        {/* Enrolled Courses List */}
        {items.filter(it => it.course && it.course._id).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {items.filter(it => it.course && it.course._id).map((it) => {
              const prog = courseProgress[it.course._id] || { pct: 0, completed: 0, total: 0 }
              return (
                <a 
                  key={it.course._id} 
                  href={`/dashboard/course/${it.course._id}`}
                  className="group bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative">
                    <img 
                      src={it.course.thumbnailPath || it.course.image || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop'} 
                      className="h-40 lg:h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                      alt={it.course.title}
                    />
                    <div className="absolute top-3 right-3 lg:top-4 lg:right-4 bg-green-500 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-medium">
                      Enrolled
                    </div>
                  </div>
                  <div className="p-4 lg:p-6">
                    <h3 className="font-bold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors text-sm lg:text-base">
                      {it.course.title}
                    </h3>
                    <p className="text-xs lg:text-sm text-slate-600 mb-4 line-clamp-2">
                      {it.course.description || 'Continue your musical journey with this course.'}
                    </p>
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-slate-600">Progress</span>
                        <span className="text-xs font-semibold text-sky-700">{prog.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500" 
                          style={{ width: `${prog.pct}%` }} 
                        />
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {prog.completed} of {prog.total} lessons completed
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs lg:text-sm text-slate-500">Click to continue</span>
                      <span className="text-sky-600 group-hover:text-sky-700">→</span>
                    </div>
                  </div>
                </a>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
            <div className="text-4xl lg:text-6xl mb-4">🎵</div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Courses Yet</h3>
            <p className="text-sm lg:text-base text-slate-600 mb-6">Start your musical journey by enrolling in a course!</p>
            <a 
              href="/courses" 
              className="inline-block px-4 py-2 lg:px-6 lg:py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium text-sm lg:text-base"
            >
              Browse Courses
            </a>
          </div>
        )}
      </div>
    )
  }

  // Overview View (default)
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
            <span className="font-bold text-slate-900">Dashboard</span>
          </div>
          <div className="w-8"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, Welcome back! 👋
        </h1>
        <p className="text-slate-600 text-sm lg:text-base">
          Here's what's happening with your music learning journey today.
        </p>
      </div>

      {/* Pending Enrollments Alert */}
      {pending.length > 0 && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-2xl">⏳</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">Enrollment Under Review</h3>
              <p className="text-amber-700 text-sm mb-3">
                We received your enrollment request. An admin will approve it shortly. 
                For assistance contact: support@example.com • +91-98765-43210
              </p>
              <div className="space-y-1">
                {pending.map((p) => (
                  <div key={p.enrollmentId} className="text-sm text-amber-700">
                    • {p.course?.title || 'Course'} (Pending)
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-slate-600">Enrolled Courses</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900">{items.length}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-lg lg:rounded-xl flex items-center justify-center ml-2 flex-shrink-0">
              <span className="text-sm lg:text-lg">📚</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-slate-600">Pending</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900">{pending.length}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-amber-100 rounded-lg lg:rounded-xl flex items-center justify-center ml-2 flex-shrink-0">
              <span className="text-sm lg:text-lg">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-slate-600">This Week</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900">{schedules.length}</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-green-100 rounded-lg lg:rounded-xl flex items-center justify-center ml-2 flex-shrink-0">
              <span className="text-sm lg:text-lg">📅</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs lg:text-sm text-slate-600">Attendance</p>
              <p className="text-lg lg:text-2xl font-bold text-slate-900">{attendanceSummary?.overallPct || 0}%</p>
            </div>
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-purple-100 rounded-lg lg:rounded-xl flex items-center justify-center ml-2 flex-shrink-0">
              <span className="text-sm lg:text-lg">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Progress */}
      {items.filter(it => it.course && it.course._id).length > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">Course Progress</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {items.filter(it => it.course && it.course._id).map((it) => {
              const prog = courseProgress[it.course._id] || { pct: 0, completed: 0, total: 0 }
              const isComplete = prog.pct === 100
              return (
                <a 
                  key={it.course._id} 
                  href={`/dashboard/course/${it.course._id}`}
                  className="group bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md hover:border-sky-300 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-900 text-sm lg:text-base truncate group-hover:text-sky-700 transition-colors">{it.course.title}</h3>
                    <span className="text-xs text-slate-600">{prog.completed}/{prog.total}</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-3">
                    <div 
                      className="h-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500" 
                      style={{ width: `${prog.pct}%` }} 
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-sky-700">{prog.pct}%</div>
                    <span className="text-xs text-slate-500 group-hover:text-sky-600 transition-colors">
                      {isComplete ? '🎉 Completed' : 'Continue →'}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>
        </div>
      )}

      {/* Attendance Glimpse */}
      {attendanceSummary.total > 0 && (
        <div className="mb-6 lg:mb-8">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">Attendance Overview</h2>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-green-200 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600">{attendanceSummary.present || 0}</div>
                <div className="text-xs text-slate-600">Present</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-600">{attendanceSummary.absent || 0}</div>
                <div className="text-xs text-slate-600">Absent</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600">{attendanceSummary.waived || 0}</div>
                <div className="text-xs text-slate-600">Waived</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-slate-900">{attendanceSummary.overallPct}%</div>
                <div className="text-xs text-slate-600">Rate</div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <a href="/student/attendance" className="text-sm text-green-700 font-medium hover:text-green-800">View Full Report →</a>
              <div className="text-xs text-slate-600">Current Month</div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Classes (This Week) */}
      <div className="mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg lg:text-xl font-bold text-slate-900">Upcoming Classes (This Week)</h2>
          <a href="/student/calendar" className="text-sm text-sky-600 hover:text-sky-700 font-medium">View Full Calendar →</a>
        </div>
        {schedules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {schedules.map((s) => {
              const startDate = new Date(s.startTime)
              const isToday = startDate.toDateString() === new Date().toDateString()
              const isTomorrow = startDate.toDateString() === new Date(Date.now() + 86400000).toDateString()
              
              return (
                <div key={s._id} className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-6 shadow-sm border border-slate-200 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-sm lg:text-base mb-1 truncate">{s.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>🕐 {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                        {s.location && <span>📍 {s.location}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                        isToday ? 'bg-green-100 text-green-700' :
                        isTomorrow ? 'bg-blue-100 text-blue-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  
                  {s.description && (
                    <p className="text-xs text-slate-600 mb-3 line-clamp-2">{s.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-600">
                      {s.instructor && (
                        <span className="flex items-center gap-1">
                          <span>👨‍🏫</span>
                          <span>{s.instructor}</span>
                        </span>
                      )}
                      {s.status && (
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          s.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                          s.status === 'completed' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {s.status}
                        </span>
                      )}
                    </div>
                    {s.meetingLink && (
                      <button 
                        onClick={() => window.open(s.meetingLink, '_blank')} 
                        className="px-4 py-2 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-sky-700 hover:to-blue-700 transition-all shadow-sm hover:shadow-md"
                      >
                        Join Class
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl lg:rounded-2xl p-8 text-center border border-slate-200">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Upcoming Classes</h3>
            <p className="text-sm text-slate-600 mb-4">You don't have any classes scheduled for this week.</p>
            <a href="/student/calendar" className="inline-block px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium">
              View Full Calendar
            </a>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <a href="/student/calendar" className="group bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-sky-300">
            <div className="text-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-sky-100 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:bg-sky-200 transition-colors">
                <span className="text-sm lg:text-lg">📅</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-xs lg:text-sm">View Calendar</h3>
              <p className="text-xs text-slate-600 mt-1">Upcoming classes</p>
            </div>
          </a>

          <a href="/student/attendance" className="group bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-sky-300">
            <div className="text-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:bg-green-200 transition-colors">
                <span className="text-sm lg:text-lg">📊</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-xs lg:text-sm">Attendance</h3>
              <p className="text-xs text-slate-600 mt-1">Track progress</p>
            </div>
          </a>

          <a href="/student/resources" className="group bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-sky-300">
            <div className="text-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:bg-purple-200 transition-colors">
                <span className="text-sm lg:text-lg">📖</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-xs lg:text-sm">Resources</h3>
              <p className="text-xs text-slate-600 mt-1">Study materials</p>
            </div>
          </a>

          <a href="/courses" className="group bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-sky-300">
            <div className="text-center">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-xl lg:rounded-2xl flex items-center justify-center mx-auto mb-2 lg:mb-3 group-hover:bg-orange-200 transition-colors">
                <span className="text-sm lg:text-lg">🎵</span>
              </div>
              <h3 className="font-semibold text-slate-900 text-xs lg:text-sm">Browse Courses</h3>
              <p className="text-xs text-slate-600 mt-1">Enroll in more</p>
            </div>
          </a>
        </div>
      </div>

      {/* Enrolled Courses */}
      <div>
        <h2 className="text-lg lg:text-xl font-bold text-slate-900 mb-4">My Enrolled Courses</h2>
        {items.filter(it => it.course && it.course._id).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {items.filter(it => it.course && it.course._id).map((it) => (
              <a key={it.course._id} href={`/dashboard/course/${it.course._id}`} className="group bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                <div className="relative">
                  <img 
                    src={it.course.thumbnailPath || it.course.image || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=400&auto=format&fit=crop'} 
                    className="h-40 lg:h-48 w-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    alt={it.course.title}
                  />
                  <div className="absolute top-3 right-3 lg:top-4 lg:right-4 bg-green-500 text-white px-2 py-1 lg:px-3 lg:py-1 rounded-full text-xs font-medium">
                    Enrolled
                  </div>
                </div>
                <div className="p-4 lg:p-6">
                  <h3 className="font-bold text-slate-900 mb-2 group-hover:text-sky-700 transition-colors text-sm lg:text-base">
                    {it.course.title}
                  </h3>
                  <p className="text-xs lg:text-sm text-slate-600 mb-4 line-clamp-2">
                    {it.course.description || 'Continue your musical journey with this course.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs lg:text-sm text-slate-500">Click to continue</span>
                    <span className="text-sky-600 group-hover:text-sky-700">→</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
            <div className="text-4xl lg:text-6xl mb-4">🎵</div>
            <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Courses Yet</h3>
            <p className="text-sm lg:text-base text-slate-600 mb-6">Start your musical journey by enrolling in a course!</p>
            <a 
              href="/courses" 
              className="inline-block px-4 py-2 lg:px-6 lg:py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium text-sm lg:text-base"
            >
              Browse Courses
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

// Course Learning View Component
function CourseLearningView({ courseId, onBack }) {
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [progressData, setProgressData] = useState({})
  const [loading, setLoading] = useState(true)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState(new Set())
  const [lastWatched, setLastWatched] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    if (courseId) {
      loadCourse()
    }
  }, [courseId])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'Escape' && isVideoModalOpen) {
        setIsVideoModalOpen(false)
        setCurrentVideo(null)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVideoModalOpen])

  // Scroll to last watched lesson
  useEffect(() => {
    if (lastWatched && expandedModules.has(lastWatched.moduleIndex)) {
      setTimeout(() => {
        const element = document.getElementById(`lesson-${lastWatched.moduleIndex}-${lastWatched.lessonIndex}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }, [lastWatched, expandedModules])

  const loadCourse = async () => {
    try {
      setLoading(true)
      const token = await getToken().catch(() => undefined)
      const courseData = await apiGet(`/courses/${courseId}`)
      setCourse(courseData)

      // Load progress
      if (token) {
        try {
          const progressRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${courseId}/progress`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (progressRes.ok) {
            const progress = await progressRes.json()
            setProgressData(progress)
            // Expand first incomplete module
            const firstIncomplete = findFirstIncompleteModule(courseData, progress)
            if (firstIncomplete !== null) {
              setExpandedModules(new Set([firstIncomplete]))
            }
          }
        } catch (error) {
          console.error('Failed to load progress:', error)
        }
      }
    } catch (error) {
      console.error('Failed to load course:', error)
      toast.error('Failed to load course')
    } finally {
      setLoading(false)
    }
  }

  const findFirstIncompleteModule = (course, progress) => {
    if (!course.modules) return null
    for (let mIdx = 0; mIdx < course.modules.length; mIdx++) {
      const module = course.modules[mIdx]
      if (!module.lessons) continue
      for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
        const completed = progress?.[mIdx]?.[lIdx]?.completed
        if (!completed) return mIdx
      }
    }
    return null
  }

  const toggleModule = (moduleIndex) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moduleIndex)) {
        newSet.delete(moduleIndex)
      } else {
        newSet.add(moduleIndex)
      }
      return newSet
    })
  }

  const handleToggleComplete = async (moduleIndex, lessonIndex, completed) => {
    try {
      const token = await getToken()
      await apiPost(`/courses/${courseId}/progress`, {
        moduleIndex,
        lessonIndex,
        completed
      }, token)
      
      setProgressData(prev => ({
        ...prev,
        [moduleIndex]: {
          ...prev[moduleIndex],
          [lessonIndex]: { completed }
        }
      }))

      if (completed) {
        toast.success('Lesson marked as complete! 🎉')
        setLastWatched({ moduleIndex, lessonIndex })
      }
    } catch (error) {
      console.error('Failed to update progress:', error)
      toast.error('Failed to update progress')
    }
  }

  const handlePlayVideo = (videoData) => {
    setCurrentVideo(videoData)
    setIsVideoModalOpen(true)
    setLastWatched({ moduleIndex: videoData.moduleIndex, lessonIndex: videoData.lessonIndex })
  }

  const handleVideoEnd = async () => {
    if (currentVideo) {
      await handleToggleComplete(currentVideo.moduleIndex, currentVideo.lessonIndex, true)
      toast.success('Great job! Lesson completed! 🎉')
    }
  }

  const getProgressStats = () => {
    if (!course?.modules) return { completed: 0, total: 0, percentage: 0 }
    let total = 0
    let completed = 0
    course.modules.forEach((module, mIdx) => {
      module.lessons?.forEach((lesson, lIdx) => {
        total++
        if (progressData?.[mIdx]?.[lIdx]?.completed) completed++
      })
    })
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const getModuleProgress = (moduleIndex) => {
    const module = course?.modules?.[moduleIndex]
    if (!module?.lessons) return { completed: 0, total: 0, percentage: 0 }
    let completed = 0
    module.lessons.forEach((lesson, lIdx) => {
      if (progressData?.[moduleIndex]?.[lIdx]?.completed) completed++
    })
    return { completed, total: module.lessons.length, percentage: Math.round((completed / module.lessons.length) * 100) }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎵</div>
        <h3 className="text-xl font-semibold text-slate-900 mb-2">Course Not Found</h3>
        <button onClick={onBack} className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700">
          Back to Dashboard
        </button>
      </div>
    )
  }

  const progressStats = getProgressStats()

  return (
    <div className="space-y-6">
      {/* Course Header with Progress */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <span className="text-xl">←</span>
              </button>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{course.title}</h1>
            </div>
            <p className="text-slate-600 mb-4">{course.description}</p>
            
            {/* Overall Progress */}
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                <div className="flex items-center gap-2">
                  {progressStats.percentage > 0 && progressStats.percentage < 100 && (
                    <button
                      onClick={() => {
                        const firstIncomplete = findFirstIncompleteModule(course, progressData)
                        if (firstIncomplete !== null) {
                          setExpandedModules(new Set([firstIncomplete]))
                          setTimeout(() => {
                            const module = course.modules[firstIncomplete]
                            if (module?.lessons) {
                              for (let lIdx = 0; lIdx < module.lessons.length; lIdx++) {
                                if (!progressData?.[firstIncomplete]?.[lIdx]?.completed) {
                                  const element = document.getElementById(`lesson-${firstIncomplete}-${lIdx}`)
                                  if (element) {
                                    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                                    break
                                  }
                                }
                              }
                            }
                          }, 300)
                        }
                      }}
                      className="text-xs px-2 py-1 bg-sky-600 text-white rounded hover:bg-sky-700 transition-colors"
                      title="Continue Learning"
                    >
                      Continue →
                    </button>
                  )}
                  <span className="text-sm font-bold text-sky-700">{progressStats.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden relative">
                <div 
                  className="h-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${progressStats.percentage}%` }}
                >
                  {progressStats.percentage > 0 && progressStats.percentage < 100 && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-white opacity-50"></div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-slate-600">
                <span>{progressStats.completed} of {progressStats.total} lessons completed</span>
                <span className="font-semibold text-sky-600">
                  {progressStats.total - progressStats.completed} remaining
                </span>
              </div>
              {progressStats.percentage === 100 && (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg text-center">
                  <span className="text-sm font-semibold text-green-800">🎉 Congratulations! Course Completed!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Course Modules */}
      <div className="space-y-4">
        {course.modules?.map((module, moduleIndex) => {
          const moduleProgress = getModuleProgress(moduleIndex)
          const isExpanded = expandedModules.has(moduleIndex)
          const isLastWatched = lastWatched?.moduleIndex === moduleIndex

          return (
            <div 
              key={moduleIndex} 
              className={`bg-white rounded-xl border-2 transition-all duration-300 ${
                isLastWatched ? 'border-sky-400 shadow-lg' : 'border-slate-200 hover:border-sky-200'
              }`}
            >
              {/* Module Header */}
              <div 
                className="p-4 lg:p-6 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => toggleModule(moduleIndex)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 bg-sky-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-sky-600 font-bold">{moduleIndex + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900 text-lg mb-1">{module.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        <span>{module.lessons?.length || 0} lessons</span>
                        {moduleProgress.total > 0 && (
                          <span className="text-sky-600 font-medium">
                            {moduleProgress.completed}/{moduleProgress.total} completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {moduleProgress.total > 0 && (
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-2 bg-green-500 transition-all duration-300"
                          style={{ width: `${moduleProgress.percentage}%` }}
                        />
                      </div>
                    )}
                    <span className="text-slate-400 text-xl transform transition-transform duration-300">
                      {isExpanded ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Module Lessons */}
              {isExpanded && module.lessons && (
                <div className="border-t border-slate-100 divide-y divide-slate-100">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const completed = progressData?.[moduleIndex]?.[lessonIndex]?.completed || false
                    const isLastWatchedLesson = lastWatched?.moduleIndex === moduleIndex && lastWatched?.lessonIndex === lessonIndex
                    const videoUrl = lesson.type === 'video' 
                      ? `${import.meta.env.VITE_API_BASE_URL}/media/video/${courseId}/${moduleIndex}/${lessonIndex}`
                      : null
                    const pdfUrl = lesson.type === 'pdf'
                      ? `${import.meta.env.VITE_API_BASE_URL}/media/pdf/${courseId}/${moduleIndex}/${lessonIndex}`
                      : null

                    return (
                      <div 
                        id={`lesson-${moduleIndex}-${lessonIndex}`}
                        key={lessonIndex}
                        className={`p-4 lg:p-6 hover:bg-slate-50 transition-colors ${
                          isLastWatchedLesson ? 'bg-sky-50 border-l-4 border-sky-400' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Completion Checkbox */}
                          <button
                            onClick={() => handleToggleComplete(moduleIndex, lessonIndex, !completed)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-1 ${
                              completed 
                                ? 'bg-green-500 border-green-500 text-white' 
                                : 'border-slate-300 hover:border-green-400 hover:bg-green-50'
                            }`}
                            title={completed ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            {completed && <span className="text-xs">✓</span>}
                          </button>

                          {/* Lesson Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-slate-900">{lesson.title}</h4>
                              {completed && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                  ✓ Completed
                                </span>
                              )}
                              {lesson.freePreview && (
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                                  Free Preview
                                </span>
                              )}
                              {isLastWatchedLesson && (
                                <span className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs font-medium animate-pulse">
                                  Last Watched
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-600 mb-3">
                              <span className="flex items-center gap-1">
                                {lesson.type === 'video' ? '🎥' : '📄'} {lesson.type}
                              </span>
                              {lesson.durationSec && (
                                <span>⏱️ {Math.round(lesson.durationSec / 60)} min</span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                              {lesson.type === 'video' && videoUrl && (
                                <button
                                  onClick={() => handlePlayVideo({
                                    url: videoUrl,
                                    title: lesson.title,
                                    moduleIndex,
                                    lessonIndex
                                  })}
                                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
                                >
                                  ▶ Play Video
                                </button>
                              )}
                              {lesson.type === 'pdf' && pdfUrl && (
                                <a
                                  href={pdfUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-all font-medium text-sm shadow-sm hover:shadow-md active:scale-95"
                                >
                                  📄 Open PDF
                                </a>
                              )}
                              {completed && (
                                <button
                                  onClick={() => handleToggleComplete(moduleIndex, lessonIndex, false)}
                                  className="px-3 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-all text-sm font-medium"
                                  title="Mark as incomplete"
                                >
                                  ↺ Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Video Modal */}
      {isVideoModalOpen && currentVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsVideoModalOpen(false)
              setCurrentVideo(null)
            }
          }}
        >
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-800">{currentVideo.title}</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Module {currentVideo.moduleIndex + 1} • Lesson {currentVideo.lessonIndex + 1}
                </p>
                {progressData?.[currentVideo.moduleIndex]?.[currentVideo.lessonIndex]?.completed && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                    ✓ Completed
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setIsVideoModalOpen(false)
                  setCurrentVideo(null)
                }}
                className="p-2 hover:bg-slate-200 rounded-lg transition-colors ml-4"
                title="Close (ESC)"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
            <div className="relative bg-black">
              <video
                ref={videoRef}
                className="w-full h-auto max-h-[70vh]"
                controls
                autoPlay
                onEnded={handleVideoEnd}
                src={currentVideo.url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Press ESC to close</span>
                <button
                  onClick={async () => {
                    await handleToggleComplete(currentVideo.moduleIndex, currentVideo.lessonIndex, true)
                    toast.success('Lesson marked as complete! 🎉')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  ✓ Mark as Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { id: courseId } = useParams()
  const navigate = useNavigate()
  const { getToken } = useAuth()
  const [items, setItems] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [schedules, setSchedules] = useState([])
  const [attendanceSummary, setAttendanceSummary] = useState({ overallPct: 0, present: 0, absent: 0, waived: 0, total: 0 })
  const [courseProgress, setCourseProgress] = useState({})

  // If courseId is present, show course learning view
  if (courseId) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
        <SignedIn>
          <div className="flex h-screen">
            <Sidebar 
              activeTab="courses" 
              onTabChange={setActiveTab} 
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />
            <div className="lg:ml-16 xl:ml-20 flex-1 overflow-y-auto h-screen">
              <CourseLearningView 
                courseId={courseId} 
                onBack={() => navigate('/dashboard')}
              />
            </div>
          </div>
        </SignedIn>
        <SignedOut>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-6xl mb-6">🎶</div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Please Sign In</h1>
              <SignInButton>
                <button className="px-8 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium">
                  Sign In
                </button>
              </SignInButton>
            </div>
          </div>
        </SignedOut>
      </div>
    )
  }

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        const token = await getToken().catch(() => undefined)
        const user = window.Clerk?.user
        const userHint = user?.id
        const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/enrollments`)
        if (!token && userHint) url.searchParams.set('userHint', userHint)
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(url.toString(), { headers })
        let enrollmentsData = []
        if (res.ok) {
          enrollmentsData = await res.json()
          setItems(enrollmentsData)
        }
        const urlP = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/enrollments/pending`)
        if (!token && userHint) urlP.searchParams.set('userHint', userHint)
        const resP = await fetch(urlP.toString(), { headers })
        if (resP.ok) setPending(await resP.json())
        // Load upcoming schedules (this week)
        const urlS = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/schedules`)
        if (!token && userHint) urlS.searchParams.set('userHint', userHint)
        const resS = await fetch(urlS.toString(), { headers })
        if (resS.ok) {
          const all = await resS.json()
          const now = new Date()
          now.setHours(0, 0, 0, 0) // Start of today
          const end = new Date()
          end.setDate(end.getDate() + 7)
          end.setHours(23, 59, 59, 999) // End of 7 days from now
          const week = all
            .filter(s => {
              const d = new Date(s.startTime)
              return d >= now && d <= end && s.status === 'scheduled'
            })
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .slice(0, 6)
          console.log('Loaded schedules:', week.length, 'from total:', all.length)
          setSchedules(week)
        } else {
          console.error('Failed to load schedules:', resS.status)
        }
        // Load attendance summary (average across courses, current month)
        const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear()
        let total=0, present=0, absent=0, waived=0
        if (enrollmentsData.length > 0) {
          for (const it of enrollmentsData) {
            // Skip if course is missing (might have been deleted)
            if (!it.course || !it.course._id) {
              console.warn('Skipping enrollment with missing course:', it.enrollmentId)
              continue
            }
            const attUrl = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/attendance/${it.course._id}`)
            if (!token && userHint) attUrl.searchParams.set('userHint', userHint)
            attUrl.searchParams.set('month', month); attUrl.searchParams.set('year', year)
            const r = await fetch(attUrl.toString(), { headers })
            if (r.ok) {
              const data = await r.json()
              total += data.length
              present += data.filter(a => a.status === 'present').length
              absent += data.filter(a => a.status === 'absent').length
              waived += data.filter(a => a.status === 'waived').length
            }
          }
          const overallPct = total > 0 ? Math.round((present/total)*100) : 0
          setAttendanceSummary({ overallPct, present, absent, waived, total })
        }
        // Load course progress per course (if available)
        if (enrollmentsData.length > 0) {
          const progressMap = {}
          for (const it of enrollmentsData) {
            // Skip if course is missing (might have been deleted)
            if (!it.course || !it.course._id) {
              console.warn('Skipping enrollment with missing course for progress:', it.enrollmentId)
              continue
            }
            try {
              const tokenAuth = token
              if (!tokenAuth) continue
              const pr = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${it.course._id}/progress`, { headers })
              if (pr.ok) {
                const data = await pr.json()
                // Count lessons in course (support both modules and chapters structure)
                const modules = it.course.modules || []
                const chapters = it.course.chapters || []
                let totalLessons = 0
                
                // Count from modules (old structure)
                modules.forEach(m => totalLessons += (m.lessons||[]).length)
                
                // Count from chapters (new structure)
                chapters.forEach(chapter => {
                  if (chapter.modules) {
                    chapter.modules.forEach(m => {
                      totalLessons += (m.lessons||[]).length
                    })
                  }
                })
                
                let completed = 0
                Object.values(data || {}).forEach(lessonMap => {
                  Object.values(lessonMap).forEach(v => { if (v.completed) completed++ })
                })
                const pct = totalLessons>0 ? Math.round((completed/totalLessons)*100) : 0
                progressMap[it.course._id] = { pct, completed, total: totalLessons }
              }
            } catch (err) {
              console.error('Error loading progress for course:', it.course._id, err)
            }
          }
          setCourseProgress(progressMap)
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 overflow-hidden">
      <SignedOut>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-6xl mb-6">🎶</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Welcome to Music Academy</h1>
            <p className="text-slate-600 mb-6">Please sign in to access your dashboard</p>
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
            <DashboardContent 
              activeTab={activeTab} 
              items={items} 
              pending={pending} 
              loading={loading}
              schedules={schedules}
              attendanceSummary={attendanceSummary}
              courseProgress={courseProgress}
              onMenuClick={() => setSidebarOpen(true)}
            />
          </div>
        </div>
      </SignedIn>
    </div>
  )
}


