import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut } from '../lib/api.js'
import { SignedIn, SignedOut, SignInButton, useAuth, UserButton } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

function CourseLeadForm({ course }) {
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      const form = new FormData(e.currentTarget)
      const payload = {
        fullName: form.get('fullName'),
        email: form.get('email'),
        whatsapp: form.get('whatsapp'),
        country: form.get('country'),
        courseId: course?._id,
        courseTitle: course?.title,
      }
      await toast.promise(
        apiPost('/leads', payload),
        {
          loading: 'Submitting your details...',
          success: 'Thanks! We\'ll contact you soon.',
          error: 'Submission failed. Please try again.',
        }
      )
      e.currentTarget.reset()
    } catch (err) {
      console.error('Failed to submit lead', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <input name="fullName" placeholder="Full Name" className="border border-slate-300 rounded-lg p-3" required />
      <input name="email" type="email" placeholder="Email Address" className="border border-slate-300 rounded-lg p-3" required />
      <input name="whatsapp" placeholder="WhatsApp Number" className="border border-slate-300 rounded-lg p-3" />
      <input name="country" placeholder="Country" className="border border-slate-300 rounded-lg p-3" />
      <button type="submit" disabled={submitting} className="w-full px-6 py-3 rounded-lg bg-white border border-slate-300 text-slate-800 hover:border-sky-300 hover:bg-sky-50 transition-colors font-medium disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Submit Details'}
      </button>
    </form>
  )
}

function CourseLeadModal({ open, onClose, course }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Enroll Interest • {course?.title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">✕</button>
        </div>
        <div className="p-5">
          <CourseLeadForm course={course} />
        </div>
      </div>
    </div>
  )
}

function VideoModal({ 
  currentVideo, 
  course, 
  enrolled, 
  onVideoComplete, 
  onPreviousVideo, 
  onNextVideo,
  hasPrevious,
  hasNext,
  isOpen,
  onClose
}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const videoRef = useRef(null)

  useEffect(() => {
    if (currentVideo && videoRef.current) {
      videoRef.current.load()
    }
  }, [currentVideo])

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime
      const total = videoRef.current.duration
      setCurrentTime(current)
      setDuration(total)
      setProgress((current / total) * 100)
    }
  }

  const handleVideoEnd = () => {
    setIsPlaying(false)
    if (enrolled && currentVideo) {
      onVideoComplete(currentVideo.moduleIndex, currentVideo.lessonIndex)
    }
  }

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen || !currentVideo) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">{currentVideo.title}</h3>
            <p className="text-sm text-slate-600 mt-1">
              Module {currentVideo.moduleIndex + 1} • Lesson {currentVideo.lessonIndex + 1}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <span className="text-2xl">✕</span>
          </button>
        </div>

        {/* Video Player */}
        <div className="relative bg-black">
          <video
            ref={videoRef}
            className="w-full h-auto max-h-[70vh]"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleVideoEnd}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlayPause}
            poster={course.image}
            controls
          >
            <source src={currentVideo.url} type="video/mp4" />
            Your browser does not support the video tag.
          </video>

          {/* Navigation Arrows */}
          {hasPrevious && (
            <button
              onClick={onPreviousVideo}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <span className="text-xl">‹</span>
            </button>
          )}
          
          {hasNext && (
            <button
              onClick={onNextVideo}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full flex items-center justify-center text-white transition-all"
            >
              <span className="text-xl">›</span>
            </button>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onPreviousVideo}
                disabled={!hasPrevious}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={onNextVideo}
                disabled={!hasNext}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
            <div className="text-sm text-slate-600">
              Press <kbd className="px-2 py-1 bg-slate-200 rounded text-xs">ESC</kbd> to close
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressTracker({ lesson, moduleIndex, lessonIndex, enrolled, onToggleComplete, completed }) {
  const handleToggle = async () => {
    if (enrolled) {
      await onToggleComplete(moduleIndex, lessonIndex, !completed)
    }
  }

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={handleToggle}
        disabled={!enrolled}
        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          completed 
            ? 'bg-sky-600 border-sky-600 text-white' 
            : 'border-slate-300 hover:border-sky-400'
        } ${!enrolled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        {completed && <span className="text-xs">✓</span>}
      </button>
      
      <div className="flex-1">
        <div className="flex items-center space-x-2">
          <span className="text-slate-600 text-sm font-medium">{lessonIndex + 1}.</span>
          <h4 className="font-medium text-slate-800">{lesson.title}</h4>
          {lesson.freePreview && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs">Free Preview</span>
          )}
        </div>
        <div className="flex items-center space-x-2 text-sm text-slate-500 mt-1">
          <span>{lesson.type}</span>
          {lesson.durationSec && <span>• {Math.round(lesson.durationSec / 60)} min</span>}
          {completed && <span className="text-green-600">✓ Completed</span>}
        </div>
      </div>
    </div>
  )
}

function ModuleSection({ module, moduleIndex, course, enrolled, onPlayVideo, onOpenPDF, onToggleComplete, progressData }) {
  const [isExpanded, setIsExpanded] = useState(true)
  
  const totalDuration = module.lessons?.reduce((acc, lesson) => acc + (lesson.durationSec || 0), 0) || 0
  const completedLessons = module.lessons?.filter((lesson, index) => 
    progressData?.[moduleIndex]?.[index]?.completed
  ).length || 0
  const totalLessons = module.lessons?.length || 0

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div 
        className="p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
              <span className="text-sky-600 font-semibold text-sm">{moduleIndex + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">{module.title}</h3>
              <div className="flex items-center space-x-4 text-sm text-slate-500 mt-1">
                <span>{totalLessons} lessons</span>
                <span>{Math.round(totalDuration / 60)} min</span>
                {enrolled && (
                  <span className="text-green-600">{completedLessons}/{totalLessons} completed</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {enrolled && totalLessons > 0 && (
              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-300"
                  style={{ width: `${(completedLessons / totalLessons) * 100}%` }}
                />
              </div>
            )}
            <span className="text-slate-400">
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>
      </div>
      
      {isExpanded && module.lessons && (
        <div className="border-t border-slate-100">
          {module.lessons.map((lesson, lessonIndex) => {
            const isPreview = Boolean(lesson.freePreview)
            const isVideo = lesson.type === 'video'
            const canAccess = isPreview || enrolled
            const href = isVideo
              ? `${import.meta.env.VITE_API_BASE_URL}/media/video/${course._id}/${moduleIndex}/${lessonIndex}`
              : `${import.meta.env.VITE_API_BASE_URL}/media/pdf/${course._id}/${moduleIndex}/${lessonIndex}`
            const completed = progressData?.[moduleIndex]?.[lessonIndex]?.completed || false
            
            return (
              <div key={lessonIndex} className="p-4 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <ProgressTracker
                    lesson={lesson}
                    moduleIndex={moduleIndex}
                    lessonIndex={lessonIndex}
                    enrolled={enrolled}
                    onToggleComplete={onToggleComplete}
                    completed={completed}
                  />
                  
                  <div className="flex items-center space-x-2">
                    {canAccess ? (
                      isVideo ? (
                        <button 
                          onClick={() => onPlayVideo({
                            url: href,
                            title: lesson.title,
                            moduleIndex,
                            lessonIndex
                          })}
                          className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
                        >
                          Play
                        </button>
                      ) : (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-sky-600 text-white rounded-lg text-sm hover:bg-sky-700 transition-colors"
                        >
                          Open PDF
                        </a>
                      )
                    ) : (
                      <button 
                        onClick={() => navigate('/checkout?courseId=' + course._id)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-300 transition-colors"
                      >
                        Locked
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function InstructorCard({ instructor }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="flex items-start space-x-4">
        <img 
          src={instructor.avatar || 'https://i.pravatar.cc/150?img=12'} 
          alt={instructor.name}
          className="w-16 h-16 rounded-full object-cover"
        />
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800 text-lg">{instructor.name}</h3>
          <p className="text-sky-600 font-medium">{instructor.instrument} Instructor</p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex text-yellow-400">
              {'★'.repeat(5)}
            </div>
            <span className="text-sm text-slate-600">(4.9) • 1,200+ students</span>
          </div>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            Expert musician with 10+ years of teaching experience. Specialized in {instructor.instrument.toLowerCase()} 
            with a passion for helping students discover their musical potential.
          </p>
        </div>
      </div>
    </div>
  )
}

function CourseStats({ course }) {
  const stats = [
    { label: 'Students', value: '1,200+', icon: '👥' },
    { label: 'Lessons', value: course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0, icon: '📚' },
    { label: 'Duration', value: `${Math.round((course.modules?.reduce((acc, m) => acc + (m.lessons?.reduce((a, l) => a + (l.durationSec || 0), 0) || 0), 0) || 0) / 60)}h`, icon: '⏱️' },
    { label: 'Level', value: course.level || 'All Levels', icon: '📈' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-lg p-4 text-center border border-slate-200">
          <div className="text-2xl mb-2">{stat.icon}</div>
          <div className="font-semibold text-slate-800">{stat.value}</div>
          <div className="text-sm text-slate-600">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function CourseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentVideo, setCurrentVideo] = useState(null)
  const [progressData, setProgressData] = useState({})
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [leadModalOpen, setLeadModalOpen] = useState(false)
  const { getToken } = useAuth()

  useEffect(() => {
    const loadCourse = async () => {
      try {
        setLoading(true)
        const courseData = await apiGet(`/courses/${id}`)
        setCourse(courseData)
        
        // Check enrollment status
      try {
        const token = await getToken().catch(() => undefined)
        const user = window.Clerk?.user
        const userHint = user?.id
        const url = new URL(`${import.meta.env.VITE_API_BASE_URL}/courses/${id}/access`)
        if (!token && userHint) url.searchParams.set('userHint', userHint)
        const res = await fetch(url.toString(), { headers: token ? { Authorization: `Bearer ${token}` } : {} })
        if (res.ok) {
          const data = await res.json()
          setEnrolled(Boolean(data.enrolled))
            
            // Load progress data if enrolled
            if (data.enrolled && token) {
              try {
                const progressRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/courses/${id}/progress`, {
                  headers: { Authorization: `Bearer ${token}` }
                })
                if (progressRes.ok) {
                  const progress = await progressRes.json()
                  setProgressData(progress)
                }
              } catch (error) {
                console.error('Failed to load progress:', error)
              }
            }
          }
        } catch (error) {
          console.error('Failed to check enrollment:', error)
        }
      } catch (error) {
        console.error('Failed to load course:', error)
        // Fallback demo course
        setCourse({
          _id: id,
          title: 'Guitar Basics - Complete Course',
          description: 'Master the fundamentals of guitar playing with this comprehensive course. Learn chords, strumming patterns, fingerpicking, and play your favorite songs.',
          price: 2999,
          level: 'Beginner',
          image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop',
          modules: [
            {
              title: 'Getting Started',
              lessons: [
                { title: 'Introduction to Guitar', type: 'video', durationSec: 300, freePreview: true },
                { title: 'Guitar Anatomy', type: 'video', durationSec: 240 },
                { title: 'How to Hold Your Guitar', type: 'video', durationSec: 180 },
                { title: 'Tuning Your Guitar', type: 'video', durationSec: 360 },
                { title: 'Basic Guitar Care', type: 'pdf' }
              ]
            },
            {
              title: 'Basic Chords',
              lessons: [
                { title: 'Open Chords Introduction', type: 'video', durationSec: 420 },
                { title: 'C Major Chord', type: 'video', durationSec: 300 },
                { title: 'G Major Chord', type: 'video', durationSec: 300 },
                { title: 'D Major Chord', type: 'video', durationSec: 300 },
                { title: 'Chord Practice Exercises', type: 'video', durationSec: 600 }
              ]
            },
            {
              title: 'Strumming Patterns',
              lessons: [
                { title: 'Basic Strumming Technique', type: 'video', durationSec: 480 },
                { title: 'Down Strumming', type: 'video', durationSec: 300 },
                { title: 'Up Strumming', type: 'video', durationSec: 300 },
                { title: 'Common Strumming Patterns', type: 'video', durationSec: 720 },
                { title: 'Practice Songs', type: 'video', durationSec: 900 }
              ]
            }
          ]
        })
      } finally {
        setLoading(false)
      }
    }
    
    loadCourse()
  }, [id])

  const handlePlayVideo = (videoData) => {
    if (enrolled) {
      setCurrentVideo(videoData)
      setIsVideoModalOpen(true)
    }
  }

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false)
    setCurrentVideo(null)
  }

  const handleOpenPDF = (url) => {
    window.open(url, '_blank')
  }

  const handleToggleComplete = async (moduleIndex, lessonIndex, completed) => {
    try {
      const token = await getToken()
      await apiPost(`/courses/${id}/progress`, {
        moduleIndex,
        lessonIndex,
        completed
      }, token)
      
      // Update local state
      setProgressData(prev => ({
        ...prev,
        [moduleIndex]: {
          ...prev[moduleIndex],
          [lessonIndex]: { completed }
        }
      }))
    } catch (error) {
      console.error('Failed to update progress:', error)
    }
  }

  const handleVideoComplete = async (moduleIndex, lessonIndex) => {
    await handleToggleComplete(moduleIndex, lessonIndex, true)
  }

  const handlePreviousVideo = () => {
    if (!course || !currentVideo) return
    
    const allLessons = course.modules.flatMap((module, mIndex) => 
      module.lessons.map((lesson, lIndex) => ({
        ...lesson,
        moduleIndex: mIndex,
        lessonIndex: lIndex,
        url: lesson.type === 'video' 
          ? `${import.meta.env.VITE_API_BASE_URL}/media/video/${course._id}/${mIndex}/${lIndex}`
          : null
      })).filter(lesson => lesson.type === 'video')
    )
    
    const currentIndex = allLessons.findIndex(lesson => 
      lesson.moduleIndex === currentVideo.moduleIndex && 
      lesson.lessonIndex === currentVideo.lessonIndex
    )
    
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1]
      setCurrentVideo({
        url: prevLesson.url,
        title: prevLesson.title,
        moduleIndex: prevLesson.moduleIndex,
        lessonIndex: prevLesson.lessonIndex
      })
    }
  }

  const handleNextVideo = () => {
    if (!course || !currentVideo) return
    
    const allLessons = course.modules.flatMap((module, mIndex) => 
      module.lessons.map((lesson, lIndex) => ({
        ...lesson,
        moduleIndex: mIndex,
        lessonIndex: lIndex,
        url: lesson.type === 'video' 
          ? `${import.meta.env.VITE_API_BASE_URL}/media/video/${course._id}/${mIndex}/${lIndex}`
          : null
      })).filter(lesson => lesson.type === 'video')
    )
    
    const currentIndex = allLessons.findIndex(lesson => 
      lesson.moduleIndex === currentVideo.moduleIndex && 
      lesson.lessonIndex === currentVideo.lessonIndex
    )
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1]
      setCurrentVideo({
        url: nextLesson.url,
        title: nextLesson.title,
        moduleIndex: nextLesson.moduleIndex,
        lessonIndex: nextLesson.lessonIndex
      })
    }
  }

  const getVideoNavigation = () => {
    if (!course || !currentVideo) return { hasPrevious: false, hasNext: false }
    
    const allLessons = course.modules.flatMap((module, mIndex) => 
      module.lessons.map((lesson, lIndex) => ({
        ...lesson,
        moduleIndex: mIndex,
        lessonIndex: lIndex
      })).filter(lesson => lesson.type === 'video')
    )
    
    const currentIndex = allLessons.findIndex(lesson => 
      lesson.moduleIndex === currentVideo.moduleIndex && 
      lesson.lessonIndex === currentVideo.lessonIndex
    )
    
    return {
      hasPrevious: currentIndex > 0,
      hasNext: currentIndex < allLessons.length - 1
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-6xl mb-4">🎵</div>
            <h1 className="text-2xl font-bold text-slate-900 mb-4">Course Not Found</h1>
            <p className="text-slate-600 mb-6">The course you're looking for doesn't exist.</p>
            <a href="/courses" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
              Browse All Courses
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-10 backdrop-blur bg-white/80 border-b border-slate-200 shadow-sm">
        <nav className="max-w-6xl mx-auto flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">🎶</span>
              </div>
              <div>
                <span className="font-extrabold text-slate-800 text-lg">Themusinest.com</span>
                <div className="text-xs text-slate-500">Music Academy</div>
              </div>
            </a>
          </div>
          <div className="hidden md:flex items-center gap-6 text-slate-700">
            <a href="/" className="hover:text-sky-700 font-medium transition-colors">Home</a>
            <a href="/courses" className="hover:text-sky-700 font-medium transition-colors">Courses</a>
            <a href="/teachers" className="hover:text-sky-700 font-medium transition-colors">Teachers</a>
            <a href="/schedule" className="hover:text-sky-700 font-medium transition-colors">Schedule</a>
            <a href="/dashboard" className="hover:text-sky-700 font-medium transition-colors">Dashboard</a>
            <a href="/admin" className="hover:text-sky-700 font-medium transition-colors">Admin</a>
            <SignedOut>
              <SignInButton>
                <button className="px-4 py-2 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white text-sm font-medium hover:from-sky-700 hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg">
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </nav>
      </header>

      <main className="pb-16">
        {/* Course Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Course Header */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full text-sm font-medium">
                        {course.level || 'All Levels'}
                      </span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Best Seller
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                      {course.title}
                    </h1>
                    <p className="text-lg text-slate-700 leading-relaxed mb-6">
                      {course.description}
                    </p>
                    <CourseStats course={course} />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-6 border-t border-slate-200">
                  <div className="flex items-center space-x-4">
                    <div className="flex text-yellow-400">
                      {'★'.repeat(5)}
                    </div>
                    <span className="text-slate-600">4.8 (1,200+ ratings)</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <SignedOut>
                      <SignInButton>
                        <button className="px-6 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium">
                          Sign in to Enroll
                        </button>
                      </SignInButton>
                    </SignedOut>
                    <SignedIn>
                      {enrolled ? (
                        <a 
                          href="/dashboard" 
                          className="px-6 py-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors font-medium"
                        >
                          Go to Dashboard
                        </a>
                      ) : (
                        <button 
                          onClick={() => setLeadModalOpen(true)} 
                          className="px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                        >
                          Enroll Now
                        </button>
                      )}
                    </SignedIn>
                  </div>
                </div>
              </div>

              {/* Course Image */}
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200">
                <img 
                  src={course.image || course.thumbnailPath || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=800&auto=format&fit=crop'} 
                  alt={course.title} 
                  className="w-full h-64 md:h-80 object-cover"
                />
              </div>

              {/* Video Player Placeholder - Only for enrolled users */}
              {enrolled && (
                <div className="bg-white rounded-2xl p-6 border border-slate-200">
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎥</div>
                    <h3 className="text-xl font-semibold text-slate-800 mb-2">Ready to Learn?</h3>
                    <p className="text-slate-600 mb-6">Click on any lesson below to start watching videos</p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-slate-500">
                      <span>✓ HD Quality Videos</span>
                      <span>✓ Mobile & Desktop</span>
                      <span>✓ Progress Tracking</span>
                    </div>
                  </div>
          </div>
        )}

              {/* Course Curriculum */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">Course Curriculum</h2>
                  <div className="text-sm text-slate-600">
                    {course.modules?.length || 0} sections • {course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0} lessons
                  </div>
                </div>
                
                <div className="space-y-4">
                  {course.modules?.map((module, index) => (
                    <ModuleSection
                      key={index}
                      module={module}
                      moduleIndex={index}
                      course={course}
                      enrolled={enrolled}
                      onPlayVideo={handlePlayVideo}
                      onOpenPDF={handleOpenPDF}
                      onToggleComplete={handleToggleComplete}
                      progressData={progressData}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Pricing Card */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 sticky top-24">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-slate-900 mb-2">
                    ₹{course.price?.toLocaleString() || '2,999'}
                  </div>
                  <div className="text-sm text-slate-600">One-time payment</div>
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">✓</span>
                    Lifetime access
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">✓</span>
                    Mobile & desktop
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">✓</span>
                    Certificate of completion
                  </div>
                  <div className="flex items-center text-sm text-slate-600">
                    <span className="mr-2">✓</span>
                    30-day money-back guarantee
                  </div>
                          </div>

                <SignedOut>
                  <SignInButton>
                    <button className="w-full px-6 py-3 rounded-full bg-slate-900 text-white hover:bg-slate-800 transition-colors font-medium">
                      Sign in to Enroll
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  {enrolled ? (
                    <a 
                      href="/dashboard" 
                      className="block w-full px-6 py-3 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors font-medium text-center"
                    >
                      Go to Dashboard
                    </a>
                  ) : (
                    <button 
                      onClick={() => setLeadModalOpen(true)}
                      className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 transition-all duration-300 font-medium shadow-lg hover:shadow-xl"
                    >
                      Enroll Now
                    </button>
                  )}
                </SignedIn>
              </div>

              {/* Instructor Card */}
              <InstructorCard instructor={{ name: 'Aarav Sharma', instrument: 'Guitar', avatar: 'https://i.pravatar.cc/150?img=12' }} />
            </div>
          </div>
        </section>
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
              <h3 className="font-semibold text-slate-800 mb-4">Follow Us</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">f</span>
                </div>
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">📷</span>
                </div>
                <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-sky-200 transition-colors">
                  <span className="text-sky-600 text-sm">📺</span>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-200 mt-8 pt-6 text-center text-slate-600 text-sm">
            © {new Date().getFullYear()} Themusinest.com • Made with 🎶 and ❤️
          </div>
      </div>
      </footer>

      {/* Video Modal - Only for enrolled users */}
      <VideoModal
        currentVideo={currentVideo}
        course={course}
        enrolled={enrolled}
        onVideoComplete={handleVideoComplete}
        onPreviousVideo={handlePreviousVideo}
        onNextVideo={handleNextVideo}
        {...getVideoNavigation()}
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
      />

      <CourseLeadModal open={leadModalOpen && !enrolled} onClose={() => setLeadModalOpen(false)} course={course} />
    </div>
  )
}


