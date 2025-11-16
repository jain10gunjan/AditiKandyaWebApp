import { useEffect, useState } from 'react'
import { useAuth, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react'
import { apiGet } from '../lib/api'

function VideoPlayer({ resource }) {
  const { getToken } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [videoKey, setVideoKey] = useState(0)

  useEffect(() => {
    loadVideo()
  }, [resource._id])

  const loadVideo = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      // First, check if the video is accessible
      const response = await fetch(url.toString(), { 
        method: 'HEAD',
        headers 
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You are not authorized to access this video. Please ensure you are enrolled in the course.')
        } else if (response.status === 404) {
          throw new Error('Video file not found. Please contact your instructor.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not be enrolled in this course.')
        } else {
          throw new Error(`Failed to load video (${response.status}): ${response.statusText}`)
        }
      }
      
      // If HEAD request succeeds, set the video URL
      setVideoUrl(url.toString())
      setVideoKey(prev => prev + 1) // Force video re-render
      
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

  const handleRetry = () => {
    setVideoKey(prev => prev + 1)
    loadVideo()
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
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
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
          preload="metadata"
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          <source src={videoUrl} type="video/ogg" />
          <div className="absolute inset-0 bg-slate-900 text-white flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl mb-4">🎥</div>
              <p>Your browser does not support video playback.</p>
              <a 
                href={videoUrl} 
                download 
                className="inline-block mt-4 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
              >
                Download Video
              </a>
            </div>
          </div>
        </video>
        
        {/* Video overlay with title */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h3 className="text-white font-semibold">{resource.title}</h3>
        </div>
      </div>
      
      {/* Video controls info */}
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

function AudioPlayer({ resource }) {
  const { getToken } = useAuth()
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [audioKey, setAudioKey] = useState(0)

  useEffect(() => {
    loadAudio()
  }, [resource._id])

  const loadAudio = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      // Check if the audio is accessible
      const response = await fetch(url.toString(), { 
        method: 'HEAD',
        headers 
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('You are not authorized to access this audio. Please ensure you are enrolled in the course.')
        } else if (response.status === 404) {
          throw new Error('Audio file not found. Please contact your instructor.')
        } else if (response.status === 403) {
          throw new Error('Access denied. You may not be enrolled in this course.')
        } else {
          throw new Error(`Failed to load audio (${response.status}): ${response.statusText}`)
        }
      }
      
      setAudioUrl(url.toString())
      setAudioKey(prev => prev + 1)
      
    } catch (err) {
      console.error('Error loading audio:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAudioError = (e) => {
    console.error('Audio playback error:', e)
    setError('Audio playback failed. The file may be corrupted or in an unsupported format.')
  }

  const handleRetry = () => {
    setAudioKey(prev => prev + 1)
    loadAudio()
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
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
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
              key={audioKey}
              controls
              className="w-full"
              onError={handleAudioError}
              preload="metadata"
            >
              <source src={audioUrl} type="audio/mpeg" />
              <source src={audioUrl} type="audio/wav" />
              <source src={audioUrl} type="audio/ogg" />
              Your browser does not support the audio tag.
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
    { id: 'resources', label: 'Resources', icon: '📖', href: '/student/resources' },
    { id: 'schedule', label: 'Schedule', icon: '⏰', href: '/student/schedule' },
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
      <div className={`fixed inset-y-0 left-0 z-50 w-56 lg:w-60 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-full overflow-y-auto">
          {/* Header */}
          <div className="p-4 lg:p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 lg:gap-3">
                <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-lg lg:rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm lg:text-lg">🎶</span>
                </div>
                <div>
                  <h1 className="font-bold text-slate-900 text-sm lg:text-base">Music Academy</h1>
                  <p className="text-xs text-slate-600">Student Dashboard</p>
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
                  {user?.firstName || 'Student'}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress || 'student@example.com'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
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

          {/* Footer */}
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

function ResourceCard({ resource, onClick, completed, onToggleComplete }) {
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

  const formatFileSize = (bytes) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div 
      className="group bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6 hover:shadow-lg hover:border-sky-300 transition-all duration-200"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 lg:w-14 lg:h-14 bg-slate-100 rounded-xl lg:rounded-2xl flex items-center justify-center group-hover:bg-sky-100 transition-colors flex-shrink-0">
          <span className="text-2xl lg:text-3xl">{getResourceIcon(resource.type)}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-bold text-slate-900 text-sm lg:text-base group-hover:text-sky-700 transition-colors line-clamp-2">
              {resource.title}
            </h3>
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
              {resource.fileSize && (
                <span>📦 {formatFileSize(resource.fileSize)}</span>
              )}
              <label className="inline-flex items-center gap-2 select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={completed}
                  onChange={(e) => onToggleComplete(resource._id, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-slate-700">Mark as Completed</span>
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

function ResourceModal({ resource, isOpen, onClose }) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl lg:rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
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
        
        {/* Content */}
        <div className="p-4 lg:p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          {resource.description && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
              <p className="text-slate-600 text-sm lg:text-base">{resource.description}</p>
            </div>
          )}
          
          {/* Video Player */}
          {resource.type === 'video' && resource.filePath && (
            <VideoPlayer resource={resource} />
          )}
          
          {/* PDF Viewer */}
          {resource.type === 'pdf' && resource.filePath && (
            <div className="w-full h-96 lg:h-[600px]">
              <iframe
                src={`${import.meta.env.VITE_API_BASE_URL}/resources/${resource._id}/file`}
                className="w-full h-full rounded-lg border shadow-sm"
                title={resource.title}
              />
            </div>
          )}
          
          {/* Audio Player */}
          {resource.type === 'audio' && resource.filePath && (
            <AudioPlayer resource={resource} />
          )}
          
          {/* Image Viewer */}
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
          
          {/* Document Download */}
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
              >
                <span>⬇️</span>
                Download Document
              </a>
            </div>
          )}
          
          {/* No File Available */}
          {!resource.filePath && (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">File Not Available</h3>
              <p className="text-slate-600">This resource is not available for viewing or download.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResourcesContent({ enrollments, resources, loading, selectedResource, setSelectedResource, showModal, setShowModal, onMenuClick }) {
  const [selectedCourse, setSelectedCourse] = useState('')
  const [filter, setFilter] = useState('all') // all, video, pdf, document, audio, image
  const [searchTerm, setSearchTerm] = useState('')
  const [completedMap, setCompletedMap] = useState({}) // resourceId -> boolean

  const userId = window.Clerk?.user?.id || 'guest'

  const progressKey = (courseId) => `resourceProgress:${userId}:${courseId}`
  const loadProgress = (courseId) => {
    try {
      const raw = localStorage.getItem(progressKey(courseId))
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }
  const saveProgress = (courseId, map) => {
    try {
      localStorage.setItem(progressKey(courseId), JSON.stringify(map))
    } catch {}
  }

  useEffect(() => {
    if (enrollments.length > 0) {
      setSelectedCourse(enrollments[0].course._id)
    }
  }, [enrollments])

  useEffect(() => {
    if (selectedCourse) {
      setCompletedMap(loadProgress(selectedCourse))
    }
  }, [selectedCourse])

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
  const completedCount = filteredResources.reduce((acc, r) => acc + (completedMap[r._id] ? 1 : 0), 0)
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const handleToggleComplete = (resourceId, checked) => {
    setCompletedMap(prev => {
      const next = { ...prev, [resourceId]: checked }
      if (!checked) delete next[resourceId]
      if (selectedCourse) saveProgress(selectedCourse, next)
      return next
    })
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
            <span className="font-bold text-slate-900">Resources</span>
          </div>
          <div className="w-8"></div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-slate-900 mb-2">
          {getGreeting()}, Your Resources 📚
        </h1>
        <p className="text-slate-600 text-sm lg:text-base">
          Access course materials, videos, documents, and study resources.
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
                You need to be enrolled in courses to access course resources.
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
          {/* Course Selection */}
          <div className="mb-6 lg:mb-8">
            <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
              <h2 className="font-bold text-lg lg:text-xl text-slate-900 mb-4">Select Course</h2>
              <select 
                value={selectedCourse} 
                onChange={(e) => setSelectedCourse(e.target.value)}
                className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm lg:text-base"
              >
                {enrollments.map((enrollment) => (
                  <option key={enrollment.course._id} value={enrollment.course._id}>
                    {enrollment.course.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

      {/* Resource Stats + Progress */}
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
                    <div className="text-lg lg:text-2xl font-bold text-green-600">{stats.document}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Documents</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-purple-600">{stats.audio}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Audio</div>
                  </div>
                </div>
                <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-sm border border-slate-200">
                  <div className="text-center">
                    <div className="text-lg lg:text-2xl font-bold text-pink-600">{stats.image}</div>
                    <div className="text-xs lg:text-sm text-slate-600">Images</div>
                  </div>
                </div>
              </div>
          {/* Progress Bar */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-200">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold text-slate-900">Your Progress</div>
              <div className="text-sm text-slate-600">{completedCount}/{total} completed</div>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div className="h-3 bg-gradient-to-r from-sky-500 to-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="text-right text-sm font-semibold text-sky-700 mt-1">{progressPct}%</div>
          </div>
            </div>
          )}

          {/* Search and Filter */}
          {resources.length > 0 && (
            <div className="mb-6 lg:mb-8">
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-sm border border-slate-200 p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Search resources..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm lg:text-base"
                    />
                  </div>
                  
                  {/* Filter */}
                  <div className="lg:w-48">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="w-full p-3 lg:p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 text-sm lg:text-base"
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

          {/* Resources Grid */}
          <div>
            {resources.length === 0 ? (
              <div className="bg-white rounded-xl lg:rounded-2xl p-8 lg:p-12 text-center border border-slate-200">
                <div className="text-4xl lg:text-6xl mb-4">📚</div>
                <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-2">No Resources Available</h3>
                <p className="text-slate-600 mb-6">This course doesn't have any resources uploaded yet.</p>
                <p className="text-sm text-slate-500">
                  Make sure you're enrolled in this course and that your instructor has uploaded resources.
                </p>
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
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
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
                    completed={!!completedMap[resource._id]}
                    onToggleComplete={handleToggleComplete}
                    onClick={() => {
                      setSelectedResource(resource)
                      setShowModal(true)
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Resource Modal */}
          <ResourceModal
            resource={selectedResource}
            isOpen={showModal}
            onClose={() => {
              setShowModal(false)
              setSelectedResource(null)
            }}
          />
        </>
      )}
    </div>
  )
}

export default function StudentResources() {
  const { getToken } = useAuth()
  const [enrollments, setEnrollments] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('resources')
  const [selectedResource, setSelectedResource] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const [selectedCourse, setSelectedCourse] = useState('')

  useEffect(() => {
    loadEnrollments()
  }, [])

  useEffect(() => {
    if (selectedCourse) {
      loadResources()
    }
  }, [selectedCourse])

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
          setSelectedCourse(data[0].course._id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const loadResources = async () => {
    if (!selectedCourse) return
    
    try {
      const token = await getToken().catch(() => undefined)
      const user = window.Clerk?.user
      const userHint = user?.id
      const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/me/resources/${selectedCourse}`)
      if (!token && userHint) url.searchParams.set('userHint', userHint)
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      
      console.log('Loading resources from:', url.toString())
      console.log('Headers:', headers)
      
      const res = await fetch(url.toString(), { headers })
      console.log('Response status:', res.status)
      
      if (res.ok) {
        const data = await res.json()
        console.log('Resources data:', data)
        setResources(data)
      } else {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        if (res.status === 403) {
          alert('You are not enrolled in this course. Please enroll first.')
        }
      }
    } catch (error) {
      console.error('Error loading resources:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        
        {/* Main Content */}
        <div className="flex-1 lg:ml-16 xl:ml-16">
        <SignedOut>
            <div className="p-6 text-center">
            <SignInButton>
                <button className="px-6 py-3 rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors">
                  Sign in to access resources
                </button>
            </SignInButton>
          </div>
        </SignedOut>
        
        <SignedIn>
            <ResourcesContent
              enrollments={enrollments}
              resources={resources}
              loading={loading}
              selectedResource={selectedResource}
              setSelectedResource={setSelectedResource}
              showModal={showModal}
              setShowModal={setShowModal}
              onMenuClick={() => setSidebarOpen(true)}
            />
        </SignedIn>
        </div>
      </div>
    </div>
  )
}
