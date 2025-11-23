import { useEffect, useState, useRef } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { apiPost } from '../lib/api'
import toast from 'react-hot-toast'

/**
 * Video Player Page - Can be used standalone or in an iframe
 * Route: /video/:courseId/:moduleIndex/:lessonIndex
 */
export default function VideoPlayer() {
  const { courseId, moduleIndex, lessonIndex } = useParams()
  const [searchParams] = useSearchParams()
  const { userId, getToken } = useAuth()
  const [videoUrl, setVideoUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [completed, setCompleted] = useState(false)
  const videoRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  // Get courseId from params or query
  const actualCourseId = courseId || searchParams.get('courseId')
  const mIdx = moduleIndex || searchParams.get('moduleIndex') || '0'
  const lIdx = lessonIndex || searchParams.get('lessonIndex') || '0'

  useEffect(() => {
    loadVideo()
  }, [actualCourseId, mIdx, lIdx, userId])

  const loadVideo = async () => {
    try {
      setLoading(true)
      setError(null)
      startTimeRef.current = Date.now()

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      const baseUrl = apiBaseUrl.endsWith('/api') ? apiBaseUrl : `${apiBaseUrl}/api`
      
      // Construct video URL with authentication
      const url = new URL(`${baseUrl}/media/video/${actualCourseId}/${mIdx}/${lIdx}`)
      
      // Add userId for authentication (preferred method)
      if (userId) {
        url.searchParams.set('userHint', userId)
      }

      // Test if video is accessible
      const testResponse = await fetch(url.toString(), { method: 'HEAD' })
      
      if (!testResponse.ok) {
        if (testResponse.status === 401) {
          throw new Error('You are not authorized to access this video. Please make sure you are enrolled.')
        } else if (testResponse.status === 404) {
          throw new Error('Video not found. The lesson may not exist or the video file is missing.')
        } else {
          throw new Error(`Failed to load video (${testResponse.status})`)
        }
      }

      setVideoUrl(url.toString())
    } catch (err) {
      console.error('Error loading video:', err)
      setError(err.message || 'Failed to load video')
    } finally {
      setLoading(false)
    }
  }

  const handleVideoEnd = async () => {
    if (completed) return
    
    try {
      const token = await getToken().catch(() => null)
      if (token && actualCourseId) {
        await apiPost(
          `/courses/${actualCourseId}/progress`,
          {
            moduleIndex: Number(mIdx),
            lessonIndex: Number(lIdx),
            completed: true
          },
          token
        )
        setCompleted(true)
        
        // Only show toast if not in iframe (check if we're in top window)
        if (window.self === window.top) {
          toast.success('Lesson completed! 🎉')
        } else {
          // Send message to parent window
          window.parent.postMessage({ type: 'VIDEO_COMPLETED', courseId: actualCourseId, moduleIndex: Number(mIdx), lessonIndex: Number(lIdx) }, '*')
        }
      }
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error)
    }
  }

  const handleMarkComplete = async () => {
    if (completed) return
    
    try {
      const token = await getToken().catch(() => null)
      if (token && actualCourseId) {
        await apiPost(
          `/courses/${actualCourseId}/progress`,
          {
            moduleIndex: Number(mIdx),
            lessonIndex: Number(lIdx),
            completed: true
          },
          token
        )
        setCompleted(true)
        
        if (window.self === window.top) {
          toast.success('Lesson marked as complete! 🎉')
        } else {
          window.parent.postMessage({ type: 'VIDEO_COMPLETED', courseId: actualCourseId, moduleIndex: Number(mIdx), lessonIndex: Number(lIdx) }, '*')
        }
      }
    } catch (error) {
      console.error('Failed to mark lesson as complete:', error)
      toast.error('Failed to mark lesson as complete')
    }
  }

  if (loading) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading video...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Video Not Available</h2>
          <p className="text-white/70 mb-4">{error}</p>
          <button
            onClick={loadVideo}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center relative">
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          autoPlay
          onEnded={handleVideoEnd}
          crossOrigin="anonymous"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-900 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {completed && (
            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-medium">
              ✓ Completed
            </span>
          )}
        </div>
        <button
          onClick={handleMarkComplete}
          disabled={completed}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            completed
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {completed ? '✓ Completed' : 'Mark as Complete'}
        </button>
      </div>
    </div>
  )
}

