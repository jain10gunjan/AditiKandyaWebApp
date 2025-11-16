import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'
import toast from 'react-hot-toast'

function VideoPlayer({ resource, onView, onComplete }) {
  const { getToken } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoKey, setVideoKey] = useState(0)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    loadVideo()
    return () => {
      // Track time spent when component unmounts
      if (startTime && resource) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        if (timeSpent > 5) { // Only track if watched for more than 5 seconds
          onComplete(timeSpent)
        }
      }
    }
  }, [resource._id])

  const loadVideo = async () => {
    try {
      setLoading(true)
      setError(null)
      setStartTime(Date.now())
      
      const token = await getToken().catch(() => undefined)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      const url = new URL(`${baseUrl}/resources/${resource._id}/file`)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await fetch(url.toString(), { 
        method: 'HEAD',
        headers 
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You are not authorized to access this video.')
        } else if (response.status === 404) {
          throw new Error('Video file not found.')
        } else {
          throw new Error(`Failed to load video (${response.status})`)
        }
      }
      
      setVideoUrl(url.toString())
      setVideoKey(prev => prev + 1)
      onView()
    } catch (err) {
      console.error('Error loading video:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVideoError = (e) => {
    console.error('Video playback error:', e)
    setError('Video playback failed. The file may be corrupted or in an unsupported format.')
  }

  const handleVideoEnd = () => {
    if (startTime && resource) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      onComplete(timeSpent)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-96 bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Video Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="relative bg-black rounded-lg overflow-hidden shadow-sm">
        <video
          key={videoKey}
          controls
          className="w-full"
          style={{ maxHeight: '60vh' }}
          onError={handleVideoError}
          onEnded={handleVideoEnd}
          preload="metadata"
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
        </video>
        
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold">{resource.title}</h3>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-4">
            <span>📺 Video Resource</span>
            {resource.duration && (
              <span>⏱️ {Math.floor(resource.duration / 60)}:{(resource.duration % 60).toString().padStart(2, '0')}</span>
            )}
          </div>
          <a 
            href={videoUrl} 
            download 
            className="text-sky-600 hover:text-sky-700 font-medium"
          >
            📥 Download
          </a>
        </div>
      </div>
    </div>
  )
}

function AudioPlayer({ resource, onView, onComplete }) {
  const { getToken } = useAuth()
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    loadAudio()
    return () => {
      if (startTime && resource) {
        const timeSpent = Math.floor((Date.now() - startTime) / 1000)
        if (timeSpent > 5) {
          onComplete(timeSpent)
        }
      }
    }
  }, [resource._id])

  const loadAudio = async () => {
    try {
      setLoading(true)
      setError(null)
      setStartTime(Date.now())
      
      const token = await getToken().catch(() => undefined)
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      const url = new URL(`${baseUrl}/resources/${resource._id}/file`)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      const response = await fetch(url.toString(), { 
        method: 'HEAD',
        headers 
      })
      
      if (!response.ok) {
        throw new Error('Failed to load audio')
      }
      
      setAudioUrl(url.toString())
      onView()
    } catch (err) {
      console.error('Error loading audio:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAudioEnd = () => {
    if (startTime && resource) {
      const timeSpent = Math.floor((Date.now() - startTime) / 1000)
      onComplete(timeSpent)
    }
  }

  if (loading) {
    return (
      <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading audio...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-64 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Audio Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
        <div className="text-center">
          <div className="text-4xl mb-4">🎵</div>
          <h3 className="text-lg font-semibold text-slate-900 mb-4">{resource.title}</h3>
          
          <div className="max-w-md mx-auto">
            <audio
              controls
              className="w-full"
              onEnded={handleAudioEnd}
              preload="metadata"
            >
              <source src={audioUrl} type="audio/mpeg" />
              <source src={audioUrl} type="audio/wav" />
              <source src={audioUrl} type="audio/ogg" />
            </audio>
          </div>
          
          <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span>🎵 Audio Resource</span>
              {resource.duration && (
                <span>⏱️ {Math.floor(resource.duration / 60)}:{(resource.duration % 60).toString().padStart(2, '0')}</span>
              )}
            </div>
            <a 
              href={audioUrl} 
              download 
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              📥 Download
            </a>
          </div>
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
    { id: 'resources', label: 'Free Resources', icon: '🎁', href: '/student/resources' },
    { id: 'schedule', label: 'Schedule', icon: '⏰', href: '/student/schedule' },
  ]

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <div className={`fixed inset-y-0 left-0 z-50 w-56 lg:w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto">
          <div className="p-4 lg:p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm lg:text-lg">🎶</span>
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 text-sm lg:text-base">Music Academy</h1>
                  <p className="text-xs text-slate-300">Student Dashboard</p>
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

function ResourceCard({ resource, onClick, tracking, onToggleComplete }) {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'document': return '📝'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800 border-red-200'
      case 'pdf': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'document': return 'bg-green-100 text-green-800 border-green-200'
      case 'audio': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'image': return 'bg-pink-100 text-pink-800 border-pink-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDuration = (seconds) => {
    if (!seconds) return ''
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const isCompleted = tracking?.completed || false
  const isViewed = tracking?.viewed || false
  const timeSpent = tracking?.timeSpent || 0

  return (
    <div 
      className={`group bg-white rounded-xl lg:rounded-2xl shadow-sm border-2 p-4 lg:p-6 hover:shadow-lg transition-all duration-200 ${
        isCompleted ? 'border-green-300 bg-green-50/30' : isViewed ? 'border-sky-300' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
          isCompleted ? 'bg-green-100' : isViewed ? 'bg-sky-100' : 'bg-slate-100'
        }`}>
          <span className="text-2xl lg:text-3xl">{getResourceIcon(resource.type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h3 className={`font-bold text-slate-900 text-sm lg:text-base group-hover:text-sky-700 transition-colors line-clamp-2 ${
                isCompleted ? 'line-through text-green-700' : ''
              }`}>
                {resource.title}
                {isCompleted && <span className="ml-2 text-green-600">✓</span>}
              </h3>
              {isViewed && !isCompleted && (
                <span className="text-xs text-sky-600 mt-1 inline-block">👁️ Viewed</span>
              )}
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getResourceTypeColor(resource.type)} ml-2 flex-shrink-0`}>
              {resource.type.toUpperCase()}
            </span>
          </div>
          
          {resource.description && (
            <p className="text-xs lg:text-sm text-slate-600 mb-3 line-clamp-2">
              {resource.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs lg:text-sm text-slate-500">
            <div className="flex items-center gap-4">
              {resource.duration && (
                <span>⏱️ {formatDuration(resource.duration)}</span>
              )}
              {timeSpent > 0 && (
                <span className="text-green-600 font-medium">
                  ⏳ {formatDuration(timeSpent)} watched
                </span>
              )}
              <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={(e) => onToggleComplete(resource._id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-slate-700">Mark Complete</span>
              </label>
            </div>
            <button onClick={onClick} className="text-sky-600 group-hover:text-sky-700 font-medium">
              View →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ResourceModal({ resource, isOpen, onClose, onView, onComplete }) {
  if (!isOpen || !resource) return null

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥'
      case 'pdf': return '📄'
      case 'document': return '📝'
      case 'audio': return '🎵'
      case 'image': return '🖼️'
      default: return '📁'
    }
  }

  const getResourceTypeColor = (type) => {
    switch (type) {
      case 'video': return 'bg-red-100 text-red-800'
      case 'pdf': return 'bg-blue-100 text-blue-800'
      case 'document': return 'bg-green-100 text-green-800'
      case 'audio': return 'bg-purple-100 text-purple-800'
      case 'image': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl lg:rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{getResourceIcon(resource.type)}</span>
            </div>
            <div>
              <h2 className="text-lg lg:text-xl font-bold text-slate-900">{resource.title}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getResourceTypeColor(resource.type)}`}>
                {resource.type.toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <span className="text-xl">✕</span>
          </button>
        </div>
        
        <div className="p-4 lg:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {resource.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600 text-sm lg:text-base">{resource.description}</p>
            </div>
          )}
          
          {resource.type === 'video' && resource.filePath && (
            <VideoPlayer resource={resource} onView={onView} onComplete={onComplete} />
          )}
          
          {resource.type === 'pdf' && resource.filePath && (
            <div className="w-full h-96 lg:h-[600px]">
              <iframe
                src={`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`}
                className="w-full h-full rounded-lg border shadow-sm"
                title={resource.title}
              />
            </div>
          )}
          
          {resource.type === 'audio' && resource.filePath && (
            <AudioPlayer resource={resource} onView={onView} onComplete={onComplete} />
          )}
          
          {resource.type === 'image' && resource.filePath && (
            <div className="w-full">
              <img
                src={`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`}
                alt={resource.title}
                className="w-full rounded-lg shadow-sm"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          )}
          
          {resource.type === 'document' && resource.filePath && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">{resource.title}</h3>
              <p className="text-slate-600 mb-6">Document ready for download</p>
              <a
                href={`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`}
                download
                className="inline-flex items-center gap-2 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                onClick={onView}
              >
                <span>⬇️</span>
                Download Document
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourcesContent({ freeCourses, resources, loading, selectedResource, setSelectedResource, showModal, setShowModal, onMenuClick, trackingData, onTrackView, onTrackComplete }) {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (freeCourses.length > 0) {
      setSelectedCourse(freeCourses[0]._id)
    }
  }, [freeCourses])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 17) return 'Good Afternoon'
    return 'Good Evening'
  }

  const filteredResources = resources.filter(resource => {
    const matchesFilter = filter === 'all' || resource.type === filter
    const matchesSearch = resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesFilter && matchesSearch
  })

  const getResourceStats = () => {
    const stats = {
      total: resources.length,
      video: resources.filter(r => r.type === 'video').length,
      pdf: resources.filter(r => r.type === 'pdf').length,
      document: resources.filter(r => r.type === 'document').length,
      audio: resources.filter(r => r.type === 'audio').length,
      image: resources.filter(r => r.type === 'image').length,
    }
    return stats
  }

  const stats = getResourceStats()
  const total = filteredResources.length || 0
  const completedCount = filteredResources.reduce((acc, r) => acc + (trackingData[r._id]?.completed ? 1 : 0), 0)
  const viewedCount = filteredResources.reduce((acc, r) => acc + (trackingData[r._id]?.viewed ? 1 : 0), 0)
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const handleToggleComplete = async (resourceId, checked) => {
    if (checked && selectedCourse) {
      await onTrackComplete(resourceId, selectedCourse)
      toast.success('Resource marked as complete! 🎉')
    }
  }

  const handleResourceView = (resource) => {
    setSelectedResource(resource)
    setShowModal(true)
    if (selectedCourse) {
      onTrackView(resource._id, selectedCourse)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-4 lg:p-6 xl:p-8">
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <span className="text-xl">☰</span>
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🎁</span>
            </div>
            <span className="font-bold text-slate-900">Free Resources</span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, Explore Free Resources 🎁
        </h1>
        <p className="text-slate-600 text-sm lg:text-base">
          Access free educational resources, videos, documents, and study materials.
        </p>
      </div>

      {freeCourses.length === 0 && !loading && (
        <div className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
          <div className="flex items-start gap-4">
            <div className="text-2xl">🎁</div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 mb-2">No Free Courses Available</h3>
              <p className="text-amber-700 text-sm mb-4">
                There are no free courses available at the moment. Check back later!
              </p>
              <a 
                href="/courses" 
                className="inline-block px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
              >
                Browse All Courses
              </a>
            </div>
          </div>
        </div>
      )}

      {freeCourses.length > 0 && (
        <>
          <div className="mb-6 lg:mb-8">
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
              <h2 className="font-bold text-lg lg:text-xl text-slate-900 mb-4">Select Free Course</h2>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
              >
                {freeCourses.map((course) => (
                  <option key={course._id} value={course._id}>
                    🎁 {course.title} (Free)
                  </option>
                ))}
              </select>
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-semibold">🎁 Free Course:</span> All resources in this course are available to you at no cost.
                </p>
              </div>
            </div>
          </div>

          {resources.length > 0 && (
            <div className="mb-6 lg:mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 lg:gap-4 mb-4">
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Total</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-green-600">{completedCount}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Completed</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-sky-600">{viewedCount}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Viewed</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-red-600">{stats.video}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Videos</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-blue-600">{stats.pdf}</div>
                    <div className="text-xs lg:text-sm text-slate-600">PDFs</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-purple-600">{stats.audio}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Audio</div>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-slate-900">Your Progress</div>
                  <div className="text-sm text-slate-600">{completedCount}/{total} completed</div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="text-right text-sm font-semibold text-green-700 mt-1">{progressPct}%</div>
              </div>
            </div>
          )}

          {resources.length > 0 && (
            <div className="mb-6 lg:mb-8">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
                    />
                  </div>
                  
                  <div className="lg:w-48">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm lg:text-base"
                    >
                      <option value="all">All Types</option>
                      <option value="video">Videos</option>
                      <option value="pdf">PDFs</option>
                      <option value="document">Documents</option>
                      <option value="audio">Audio</option>
                      <option value="image">Images</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            {resources.length === 0 ? (
              <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
                <div className="text-4xl lg:text-6xl mb-4">📚</div>
                <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Resources Available</h3>
                <p className="text-slate-600 mb-6">This free course doesn't have any resources uploaded yet.</p>
              </div>
            ) : filteredResources.length === 0 ? (
              <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
                <div className="text-4xl lg:text-6xl mb-4">🔍</div>
                <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Resources Found</h3>
                <p className="text-slate-600 mb-6">No resources match your search criteria.</p>
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setFilter('all')
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {filteredResources.map((resource) => (
                  <ResourceCard
                    key={resource._id}
                    resource={resource}
                    tracking={trackingData[resource._id]}
                    onToggleComplete={handleToggleComplete}
                    onClick={() => handleResourceView(resource)}
                  />
                ))}
              </div>
            )}
          </div>

          <ResourceModal
            resource={selectedResource}
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setSelectedResource(null)
            }}
            onView={() => selectedResource && selectedCourse && onTrackView(selectedResource._id, selectedCourse)}
            onComplete={(timeSpent) => selectedResource && selectedCourse && onTrackComplete(selectedResource._id, selectedCourse, timeSpent)}
          />
        </>
      )}
    </div>
  )
}

export default function StudentResources() {
  const { getToken } = useAuth()
  const [freeCourses, setFreeCourses] = useState([])
  const [resources, setResources] = useState([])
  const [trackingData, setTrackingData] = useState({})
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('resources')
  const [selectedResource, setSelectedResource] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState('')

  useEffect(() => {
    loadFreeCourses()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadResources()
      loadTracking()
    }
  }, [selectedCourse])

  const loadFreeCourses = async () => {
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) {
        setLoading(false)
        return
      }
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const response = await fetch(`${baseUrl}/free-courses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFreeCourses(data || [])
        if (data.length > 0) {
          setSelectedCourse(data[0]._id)
        }
      }
    } catch (error) {
      console.error('Error loading free courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const url = new URL(`${baseUrl}/me/resources/${selectedCourse}`)
      const headers = { Authorization: `Bearer ${token}` }
      
      const res = await fetch(url.toString(), { headers })
      
      if (res.ok) {
        const data = await res.json()
        setResources(data || [])
      } else {
        setResources([])
      }
    } catch (error) {
      console.error('Error loading resources:', error)
      setResources([])
    }
  }

  const loadTracking = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      const response = await fetch(`${baseUrl}/free-resources/tracking?courseId=${selectedCourse}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        const trackingMap = {}
        data.forEach(t => {
          trackingMap[t.resourceId] = t
        })
        setTrackingData(trackingMap)
      }
    } catch (error) {
      console.error('Error loading tracking:', error)
    }
  }

  const trackView = async (resourceId, courseId) => {
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      await fetch(`${baseUrl}/free-resources/track/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resourceId, courseId })
      })
      
      setTrackingData(prev => ({
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          viewed: true,
          viewedAt: new Date()
        }
      }))
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const trackComplete = async (resourceId, courseId, timeSpent = 0) => {
    try {
      const token = await getToken().catch(() => undefined)
      if (!token) return
      
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      await fetch(`${baseUrl}/free-resources/track/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resourceId, courseId, timeSpent })
      })
      
      setTrackingData(prev => ({
        ...prev,
        [resourceId]: {
          ...prev[resourceId],
          completed: true,
          completedAt: new Date(),
          timeSpent: (prev[resourceId]?.timeSpent || 0) + timeSpent
        }
      }))
    } catch (error) {
      console.error('Error tracking completion:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="flex">
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        <div className="flex-1 lg:ml-16 xl:ml-16">
          <SignedOut>
            <div className="p-6 text-center">
              <SignInButton>
                <button className="px-6 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  Sign in to access free resources
                </button>
              </SignInButton>
            </div>
          </SignedOut>
          
          <SignedIn>
            <ResourcesContent
              freeCourses={freeCourses}
              resources={resources}
              loading={loading}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              showModal={showModal}
              setShowModal={setShowModal}
              onMenuClick={() => setSidebarOpen(true)}
              trackingData={trackingData}
              onTrackView={trackView}
              onTrackComplete={trackComplete}
            />
          </SignedIn>
        </div>
      </div>
    </div>
  )
}
