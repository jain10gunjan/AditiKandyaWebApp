import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { apiGet, apiPost, apiPut } from '../lib/api.js'
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function CourseLeadForm({ course, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    whatsapp: '',
    country: ''
  })
  const nameInputRef = useRef(null)

  // Validation functions
  const validateFullName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Full name is required'
    }
    if (name.trim().length < 2) {
      return 'Name must be at least 2 characters'
    }
    if (name.trim().length > 100) {
      return 'Name must be less than 100 characters'
    }
    if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      return 'Name can only contain letters, spaces, hyphens, and apostrophes'
    }
    return null
  }

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) {
      return 'Email is required'
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return 'Please enter a valid email address'
    }
    return null
  }

  const validateWhatsApp = (whatsapp) => {
    if (!whatsapp || whatsapp.trim().length === 0) {
      return null // Optional field
    }
    // Remove spaces, dashes, and plus signs for validation
    const cleaned = whatsapp.replace(/[\s\-+]/g, '')
    if (!/^\d{10,15}$/.test(cleaned)) {
      return 'Please enter a valid phone number (10-15 digits)'
    }
    if (cleaned.length < 10) {
      return 'Phone number must have at least 10 digits'
    }
    return null
  }

  const validateCountry = (country) => {
    if (!country || country.trim().length === 0) {
      return null // Optional field
    }
    if (country.trim().length < 2) {
      return 'Country name must be at least 2 characters'
    }
    return null
  }

  const validateField = (name, value) => {
    switch (name) {
      case 'fullName':
        return validateFullName(value)
      case 'email':
        return validateEmail(value)
      case 'whatsapp':
        return validateWhatsApp(value)
      case 'country':
        return validateCountry(value)
      default:
        return null
    }
  }

  // Auto-focus first field when form mounts
  useEffect(() => {
    if (nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus()
      }, 100)
    }
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // Format phone number as user types
    if (name === 'whatsapp') {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '')
      // Format: +91 98765 43210 (for Indian numbers) or keep as is
      if (digits.length > 0) {
        if (digits.length <= 2) {
          processedValue = digits.length > 0 ? `+${digits}` : digits
        } else if (digits.length <= 7) {
          processedValue = `+${digits.slice(0, 2)} ${digits.slice(2)}`
        } else {
          processedValue = `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7, 12)}`
        }
      } else {
        processedValue = ''
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleBlur = (e) => {
    const { name, value } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    
    const error = validateField(name, value)
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = () => {
    const newErrors = {}
    
    const fullNameError = validateFullName(formData.fullName)
    if (fullNameError) newErrors.fullName = fullNameError
    
    const emailError = validateEmail(formData.email)
    if (emailError) newErrors.email = emailError
    
    const whatsappError = validateWhatsApp(formData.whatsapp)
    if (whatsappError) newErrors.whatsapp = whatsappError
    
    const countryError = validateCountry(formData.country)
    if (countryError) newErrors.country = countryError
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Mark all fields as touched
    setTouched({
      fullName: true,
      email: true,
      whatsapp: true,
      country: true
    })
    
    // Validate form and get errors
    const currentErrors = {}
    const fullNameError = validateFullName(formData.fullName)
    if (fullNameError) currentErrors.fullName = fullNameError
    const emailError = validateEmail(formData.email)
    if (emailError) currentErrors.email = emailError
    const whatsappError = validateWhatsApp(formData.whatsapp)
    if (whatsappError) currentErrors.whatsapp = whatsappError
    const countryError = validateCountry(formData.country)
    if (countryError) currentErrors.country = countryError
    
    // Set errors
    setErrors(currentErrors)
    
    // If there are errors, show message and scroll to first error
    if (Object.keys(currentErrors).length > 0) {
      toast.error('Please fix the errors in the form')
      // Scroll to first error
      const firstErrorField = Object.keys(currentErrors)[0]
      if (firstErrorField) {
        setTimeout(() => {
          const element = document.querySelector(`[name="${firstErrorField}"]`)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
          }
        }, 100)
      }
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsapp: formData.whatsapp.trim(),
        country: formData.country.trim(),
        courseId: course?._id,
        courseTitle: course?.title,
      }
      
      await toast.promise(
        apiPost('/leads', payload),
        {
          loading: 'Submitting your details...',
          success: 'Thanks! We\'ll contact you soon. 🎉',
          error: 'Submission failed. Please try again.',
        }
      )
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        whatsapp: '',
        country: ''
      })
      setErrors({})
      setTouched({})
      
      // Close modal after short delay to show success message
      setTimeout(() => {
        if (onSuccess) onSuccess()
      }, 1500)
      
    } catch (err) {
      console.error('Failed to submit lead', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      {/* Full Name */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-2">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          ref={nameInputRef}
          id="fullName"
          name="fullName"
          type="text"
          value={formData.fullName}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your full name"
          maxLength={100}
          className={`w-full border rounded-lg p-3 transition-all duration-200 ${
            errors.fullName && touched.fullName
              ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : formData.fullName && !errors.fullName
              ? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
          }`}
          required
          aria-invalid={errors.fullName && touched.fullName ? 'true' : 'false'}
          aria-describedby={errors.fullName && touched.fullName ? 'fullName-error' : undefined}
        />
        <div className="flex items-center justify-between mt-1">
          {errors.fullName && touched.fullName ? (
            <p id="fullName-error" className="text-sm text-red-600 flex items-center gap-1 animate-fade-in">
              <span>⚠️</span> {errors.fullName}
            </p>
          ) : formData.fullName && !errors.fullName ? (
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span>✓</span> Looks good!
            </p>
          ) : null}
          {formData.fullName.length > 0 && (
            <span className="text-xs text-slate-400">{formData.fullName.length}/100</span>
          )}
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="your.email@example.com"
          className={`w-full border rounded-lg p-3 transition-all duration-200 ${
            errors.email && touched.email
              ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : formData.email && !errors.email
              ? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
          }`}
          required
          aria-invalid={errors.email && touched.email ? 'true' : 'false'}
          aria-describedby={errors.email && touched.email ? 'email-error' : undefined}
        />
        {errors.email && touched.email ? (
          <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
            <span>⚠️</span> {errors.email}
          </p>
        ) : formData.email && !errors.email ? (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <span>✓</span> Valid email address
          </p>
        ) : null}
      </div>

      {/* WhatsApp */}
      <div>
        <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-2">
          WhatsApp Number <span className="text-slate-400 text-xs">(Optional)</span>
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          value={formData.whatsapp}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="+91 98765 43210"
          maxLength={17}
          className={`w-full border rounded-lg p-3 transition-all duration-200 ${
            errors.whatsapp && touched.whatsapp
              ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : formData.whatsapp && !errors.whatsapp
              ? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
              : 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
          }`}
          aria-invalid={errors.whatsapp && touched.whatsapp ? 'true' : 'false'}
          aria-describedby={errors.whatsapp && touched.whatsapp ? 'whatsapp-error' : undefined}
        />
        {errors.whatsapp && touched.whatsapp ? (
          <p id="whatsapp-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
            <span>⚠️</span> {errors.whatsapp}
          </p>
        ) : formData.whatsapp && !errors.whatsapp ? (
          <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
            <span>✓</span> Valid phone number
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">We'll use this to contact you quickly</p>
        )}
      </div>

      {/* Country */}
      <div>
        <label htmlFor="country" className="block text-sm font-medium text-slate-700 mb-2">
          Country <span className="text-slate-400 text-xs">(Optional)</span>
        </label>
        <input
          id="country"
          name="country"
          type="text"
          value={formData.country}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="e.g., India, USA, UK"
          className={`w-full border rounded-lg p-3 transition-all duration-200 ${
            errors.country && touched.country
              ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
          }`}
          aria-invalid={errors.country && touched.country ? 'true' : 'false'}
          aria-describedby={errors.country && touched.country ? 'country-error' : undefined}
        />
        {errors.country && touched.country && (
          <p id="country-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
            <span>⚠️</span> {errors.country}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full px-6 py-3 rounded-lg font-medium transition-all duration-300 shadow-sm relative overflow-hidden ${
          submitting
            ? 'bg-slate-400 text-white cursor-not-allowed'
            : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 hover:shadow-md active:scale-95'
        }`}
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Submitting...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <span className="text-lg">📝</span>
            <span>Submit Enrollment Request</span>
            <span className="text-sm">→</span>
          </span>
        )}
      </button>

      {/* Helper Text */}
      <p className="text-xs text-slate-500 text-center">
        By submitting, you agree to be contacted by our team regarding this course.
      </p>
    </form>
  )
}

function CourseLeadModal({ open, onClose, course }) {
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    if (open) {
      setIsClosing(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 200)
  }

  const handleSuccess = () => {
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && open) {
        handleClose()
      }
    }
    if (open) {
      window.addEventListener('keydown', handleEsc)
    }
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open])

  if (!open) return null

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 transform transition-all duration-200 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 lg:p-6 border-b border-slate-200 bg-gradient-to-r from-sky-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-lg lg:text-xl font-semibold text-slate-900 mb-1">
                Enroll in Course
              </h3>
              <p className="text-sm text-slate-600 truncate">{course?.title}</p>
            </div>
            <button 
              onClick={handleClose} 
              className="p-2 rounded-lg hover:bg-slate-200 transition-colors ml-4 flex-shrink-0"
              title="Close (ESC)"
            >
              <span className="text-xl">✕</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 lg:p-6 max-h-[70vh] overflow-y-auto">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 flex items-start gap-2">
              <span className="text-lg">💡</span>
              <span>Fill in your details below and our team will contact you shortly to complete your enrollment!</span>
            </p>
          </div>
          <CourseLeadForm course={course} onSuccess={handleSuccess} />
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <p className="text-xs text-slate-500 text-center">
            🔒 Your information is secure and will only be used for enrollment purposes
          </p>
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

function InstructorCard({ course }) {
  // Debug: Log course data to see what we're getting
  if (course && (course.teacherId || course.teacherName)) {
    console.log('Course teacher data:', {
      teacherId: course.teacherId,
      teacherName: course.teacherName,
      teacherInstrument: course.teacherInstrument,
      teacherAvatar: course.teacherAvatar,
      teacherDescription: course.teacherDescription
    })
  }
  
  // Check for teacher data - check both teacherId and teacherName
  const hasTeacher = (course.teacherId && course.teacherId.trim() !== '') || 
                     (course.teacherName && course.teacherName.trim() !== '' && course.teacherName !== 'Expert Instructor')
  
  const teacherName = hasTeacher && course.teacherName && course.teacherName.trim() !== '' && course.teacherName !== 'Expert Instructor'
    ? course.teacherName 
    : 'Expert Instructor'
  const teacherInstrument = hasTeacher && course.teacherInstrument && course.teacherInstrument.trim() !== ''
    ? course.teacherInstrument 
    : 'Music'
  const teacherAvatar = hasTeacher && course.teacherAvatar && course.teacherAvatar.trim() !== ''
    ? course.teacherAvatar 
    : 'https://i.pravatar.cc/150?img=12'
  const teacherDescription = hasTeacher && course.teacherDescription && course.teacherDescription.trim() !== ''
    ? course.teacherDescription 
    : `Expert musician with 10+ years of teaching experience. Specialized in ${teacherInstrument.toLowerCase()} with a passion for helping students discover their musical potential.`
  const rating = course.rating || 4.8
  const studentCount = course.studentCount || 0
  const studentDisplay = studentCount > 0 
    ? (studentCount >= 1000 ? `${(studentCount / 1000).toFixed(1)}k+` : `${studentCount}+`)
    : '0'
  
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all duration-300">
      <div className="flex items-start space-x-4">
        <div className="relative group">
          <img 
            src={teacherAvatar} 
            alt={teacherName}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-200 group-hover:ring-sky-400 transition-all duration-300"
            onError={(e) => {
              e.target.src = 'https://i.pravatar.cc/150?img=12'
            }}
          />
          {hasTeacher && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center z-10">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-slate-800 text-lg">{teacherName}</h3>
            {hasTeacher && (
              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium animate-fade-in">
                Assigned
              </span>
            )}
          </div>
          <p className="text-sky-600 font-medium flex items-center gap-1">
            <span>🎵</span>
            <span>{teacherInstrument} Instructor</span>
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <div className="flex text-yellow-400">
              {'★'.repeat(Math.floor(rating))}
              {rating % 1 >= 0.5 && <span className="text-yellow-400">½</span>}
            </div>
            <span className="text-sm text-slate-600">({rating.toFixed(1)}) • {studentDisplay} students</span>
          </div>
          <p className="text-slate-600 text-sm mt-3 leading-relaxed">
            {teacherDescription}
          </p>
        </div>
      </div>
    </div>
  )
}

function CourseStats({ course }) {
  const studentCount = course.studentCount || 0
  const studentDisplay = studentCount > 0 
    ? (studentCount >= 1000 ? `${(studentCount / 1000).toFixed(1)}k+` : `${studentCount}+`)
    : '0'
  
  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const totalDurationSec = course.modules?.reduce((acc, m) => 
    acc + (m.lessons?.reduce((a, l) => a + (l.durationSec || 0), 0) || 0), 0) || 0
  const totalHours = Math.round(totalDurationSec / 3600) || 0
  const totalMinutes = Math.round((totalDurationSec % 3600) / 60) || 0
  const durationDisplay = totalHours > 0 
    ? `${totalHours}h${totalMinutes > 0 ? ` ${totalMinutes}m` : ''}`
    : totalMinutes > 0 
    ? `${totalMinutes}m`
    : '0h'
  
  const stats = [
    { label: 'Students', value: studentDisplay, icon: '👥', color: 'text-sky-600' },
    { label: 'Lessons', value: totalLessons, icon: '📚', color: 'text-emerald-600' },
    { label: 'Duration', value: durationDisplay, icon: '⏱️', color: 'text-purple-600' },
    { label: 'Level', value: course.level || 'All Levels', icon: '📈', color: 'text-orange-600' }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index} 
          className="bg-white rounded-xl p-4 text-center border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all duration-300 group cursor-default"
        >
          <div className="text-3xl mb-2 group-hover:scale-110 transition-transform duration-300">{stat.icon}</div>
          <div className={`font-bold text-lg ${stat.color} mb-1 group-hover:scale-105 transition-transform duration-300`}>
            {stat.value}
          </div>
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
        console.log('Loaded course data:', courseData)
        console.log('Teacher data in course:', {
          teacherId: courseData?.teacherId,
          teacherName: courseData?.teacherName,
          teacherInstrument: courseData?.teacherInstrument,
          teacherAvatar: courseData?.teacherAvatar,
          teacherDescription: courseData?.teacherDescription
        })
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
          const isEnrolled = Boolean(data.enrolled)
          setEnrolled(isEnrolled)
            
          // Redirect enrolled users to dashboard course view
          if (isEnrolled) {
            navigate(`/dashboard/course/${id}`, { replace: true })
            return
          }
            
            // Load progress data if enrolled
            if (isEnrolled && token) {
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
      <Navbar />

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
                      {'★'.repeat(Math.floor(course.rating || 4.8))}
                      {(course.rating || 4.8) % 1 >= 0.5 && <span className="text-yellow-400">½</span>}
                    </div>
                    <span className="text-slate-600">
                      {(course.rating || 4.8).toFixed(1)} 
                      {course.studentCount > 0 && ` (${course.studentCount >= 1000 ? `${(course.studentCount / 1000).toFixed(1)}k+` : `${course.studentCount}+`} ratings)`}
                    </span>
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
              <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 relative">
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
              <div className="bg-white rounded-2xl p-6 border border-slate-200 sticky top-24 z-20">
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
              <InstructorCard course={course} />

              {/* Additional Course Content */}
              {(course.scales || course.arpeggios || course.performanceTips) && (
                <div className="bg-white rounded-2xl p-8 border border-slate-200">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">What You'll Learn</h2>
                  <div className="space-y-6">
                    {course.scales && (
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg mb-2 flex items-center">
                          <span className="mr-2">🎵</span>
                          Scales
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{course.scales}</p>
                      </div>
                    )}
                    {course.arpeggios && (
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg mb-2 flex items-center">
                          <span className="mr-2">🎹</span>
                          Arpeggios
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{course.arpeggios}</p>
                      </div>
                    )}
                    {course.performanceTips && (
                      <div>
                        <h3 className="font-semibold text-slate-800 text-lg mb-2 flex items-center">
                          <span className="mr-2">💡</span>
                          Performance Tips
                        </h3>
                        <p className="text-slate-600 leading-relaxed whitespace-pre-line">{course.performanceTips}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />

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


