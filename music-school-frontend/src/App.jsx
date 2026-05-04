import './App.css'
import { apiGet, apiPost } from './lib/api.js'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import OptimizedVideo from './components/OptimizedVideo.jsx'
import { motion } from 'framer-motion'
import vid1 from './assets/vid1.mp4'
import vid2 from './assets/vid2.mp4'

function SectionTitle({ emoji, title, subtitle, spaceNumber }) {
  return (
    <motion.div 
      className={`max-w-5xl mx-auto text-center mb-${spaceNumber}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2 
        className="text-3xl md:text-5xl font-cinema font-bold tracking-wide"
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.2 }}
      style={{ fontFamily: "'Bona Nova SC', serif" }}
      >
        <motion.span 
          className="mr-2"
          initial={{ rotate: -180, scale: 0 }}
          whileInView={{ rotate: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          {emoji}
        </motion.span>
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          className=" mt-3 text-lg font-medium"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
      style={{ fontFamily: "'Bona Nova', serif" }}

        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  )
}

function CourseCard({ title, level, image, _id, isEnrolled = false, course, index }) {
  // Check if teacher is assigned - check both teacherId and teacherName
  const hasTeacher = course && (
    (course.teacherId && course.teacherId.trim() !== '') || 
    (course.teacherName && course.teacherName.trim() !== '' && course.teacherName !== 'Expert Instructor')
  )
  
  // Build image URL - handle both full URLs and relative paths
  const getImageUrl = () => {
    if (!image && !course?.thumbnailPath) {
      return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
    }
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image
    }
    if (course?.thumbnailPath) {
      // thumbnailPath is stored as /uploads/filename, need to prepend API base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      return `${baseUrl}${course.thumbnailPath}`
    }
    if (image) {
      // If image is a relative path, prepend API base URL
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      return image.startsWith('/') ? `${baseUrl}${image}` : `${baseUrl}/${image}`
    }
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
  }
  
  return (
    <motion.a 
      href={`/courses/${_id}`} 
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 border border-white/20 hover:border-[#F5E6E0] relative overflow-hidden"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: (index || 0) * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      <div className="relative overflow-hidden rounded-xl">
        <img 
          src={getImageUrl()} 
          alt={title} 
          className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-500"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          }}
        />
        <div className="absolute top-3 right-3 bg-black text-[#F5E6E0] px-3 py-1 rounded-full text-xs font-bold z-10">
          {level}
        </div>
        {isEnrolled && (
          <div className="absolute bottom-3 right-3 bg-[#F5E6E0] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 z-10 animate-fade-in shadow-lg">
            <span className="text-sm">✓</span>
            <span>Already Enrolled</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-cinema font-bold text-lg text-black group-hover:text-[#F5E6E0] transition-colors">{title}</h3>
        {hasTeacher && (
          <p className="text-xs text-black/70 flex items-center gap-1 mt-1 font-medium">
            <span>👩‍🏫</span>
            <span>{course.teacherName || 'Assigned Teacher'}</span>
            {course.teacherInstrument && (
              <>
                <span className="text-black/50">•</span>
                <span>{course.teacherInstrument}</span>
              </>
            )}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {/* Price intentionally not displayed */}
          {isEnrolled && (
            <span className="text-[#F5E6E0] font-bold text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Enrolled</span>
            </span>
          )}
          <span className="px-4 py-1.5 rounded-full bg-black text-[#F5E6E0] text-sm font-bold group-hover:bg-[#F5E6E0] group-hover:text-black transition-all duration-300">
            View Details
          </span>
        </div>
      </div>
    </motion.a>
  )
}

function HomepageCourseCard({ title, level, image, _id, isEnrolled = false, course, index }) {
  // Build image URL - handle both full URLs and relative paths
  const getImageUrl = () => {
    if (!image && !course?.thumbnailPath) {
      return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
    }
    if (image && (image.startsWith('http://') || image.startsWith('https://'))) {
      return image
    }
    if (course?.thumbnailPath) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      return `${baseUrl}${course.thumbnailPath}`
    }
    if (image) {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'
      return image.startsWith('/') ? `${baseUrl}${image}` : `${baseUrl}/${image}`
    }
    return 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
  }

  // Get course description or create a default one
  const description = course?.description || course?.shortDescription || `Learn ${title} with expert guidance and structured lessons.`

  return (
    <motion.a 
      href={`/courses/${_id}`} 
      className="group relative h-96 md:h-[420px] w-full overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: (index || 0) * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ y: -8, scale: 1.02 }}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={getImageUrl()} 
          alt={title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          }}
        />
      </div>

      {/* Dark Overlay - appears on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/70 transition-all duration-500"></div>

      {/* Level Badge - always visible */}
      <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-xs font-bold z-20 backdrop-blur-sm"
      style={{ fontFamily: "'Bona Nova SC', serif" }}
      >
        {level}
      </div>

      {/* Enrolled Badge */}
      {isEnrolled && (
        <div className="absolute top-4 left-4 bg-[#F5E6E0]/90 text-black px-3 py-1 rounded-full text-xs font-bold z-20 backdrop-blur-sm flex items-center gap-1.5 shadow-lg">
          <span className="text-sm">✓</span>
          <span>Enrolled</span>
        </div>
      )}

      {/* Content Overlay - appears on hover */}
      <div className="absolute inset-0 flex flex-col justify-between p-5 md:p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10">
        {/* Title and Description */}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-white text-xl md:text-2xl font-bold mb-2 md:mb-3 uppercase tracking-wide"
          style={{ fontFamily: "'Bona Nova SC', serif" }}
          >
            {title}
          </h3>
          <div className="w-12 md:w-16 h-0.5 bg-white mb-3 md:mb-4"></div>
          <p className="text-white/90 text-xs md:text-sm leading-relaxed line-clamp-3"
          style={{ fontFamily: "'Bona Nova', serif" }}
          >
            {description}
          </p>
        </div>

        {/* Bottom Section - Price and Button */}
        <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-white/20">
          {/* Price intentionally not displayed */}
          {isEnrolled && (
            <span className="text-white/80 font-medium text-xs md:text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Enrolled</span>
            </span>
          )}
          <button className="px-4 md:px-6 py-1.5 md:py-2 bg-white text-black font-bold text-xs md:text-sm uppercase tracking-wide hover:bg-white/90 transition-all duration-300 border border-white">
            Know More
          </button>
        </div>
      </div>

      {/* Default visible content - hidden on hover */}
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6 bg-gradient-to-t from-black/60 to-transparent group-hover:opacity-0 transition-opacity duration-500">
        <h3 className="text-white text-lg md:text-xl font-bold mb-2">{title}</h3>
        {/* Price intentionally not displayed */}
      </div>
    </motion.a>
  )
}

function TeacherCard({ name, instrument, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-white/20 text-center group hover:border-[#F5E6E0]">
      <div className="relative inline-block">
        <img src={avatar} alt={name} className="h-20 w-20 rounded-full object-cover mx-auto group-hover:scale-110 transition-transform duration-300 ring-2 ring-[#F5E6E0]/30 group-hover:ring-[#F5E6E0]" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#F5E6E0] rounded-full border-2 border-white"></div>
      </div>
      <h3 className="mt-4 font-cinema font-bold text-black">{name}</h3>
      <p className="text-sm text-black/70 font-medium">{instrument} Expert</p>
      <div className="mt-2 flex justify-center">
        <div className="flex text-[#F5E6E0]">
          {'★'.repeat(5)}
        </div>
      </div>
    </div>
  )
}

function StatCard({ number, label, icon, color, index }) {
  return (
    <motion.div 
      className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-center border border-white/20 hover:border-[#F5E6E0]"
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: (index || 0) * 0.1,
        type: "spring",
        stiffness: 100
      }}
      whileHover={{ scale: 1.05, y: -5 }}
    >
      <motion.div 
        className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#F5E6E0] transition-colors"
        whileHover={{ rotate: 360 }}
        transition={{ duration: 0.6 }}
      >
        <span className="text-2xl">{icon}</span>
      </motion.div>
      <motion.div 
        className="text-4xl font-cinema font-bold text-black mb-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: (index || 0) * 0.1 + 0.2 }}
      >
        {number}
      </motion.div>
      <div className="text-black/70 font-bold">{label}</div>
    </motion.div>
  )
}

function TestimonialCard({ name, role, content, avatar, index }) {
  return (
    <motion.div 
      className="bg-white shadow-lg hover:shadow-2xl transition-all duration-300 p-6 md:p-8  h-full flex flex-col rounded-sm"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: (index || 0) * 0.1 }}
      whileHover={{ y: -5 }}
    >
       {/* Author Info */}
       <div className="flex items-center justify-between pt-4 border-b mb-4 border-black/10 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <img 
            src={`https://cdn-icons-png.flaticon.com/512/6596/6596121.png`} 
            alt={name} 
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              e.target.src = 'https://cdn-icons-png.flaticon.com/512/6596/6596121.png'
            }}
          />
          <div className="min-w-0">
            <div className="font-bold text-black text-sm md:text-base truncate" style={{ fontFamily: "'Bona Nova SC', serif" }}>
              {name}
            </div>
            <div className="text-xs md:text-sm text-black/60 truncate" style={{ fontFamily: "'Bona Nova', serif" }}>
              {role}
            </div>
          </div>
        </div>
        
      </div>

      {/* Quote Icon */}
      <div className="mb-4">
        <svg className="w-8 h-8 text-black/20" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.996 2.151c-2.432.967-4.996 2.848-4.996 7.153 0 3.68 1.681 4.806 4.996 4.806v7h-9.979zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.967-5 2.848-5 7.153 0 3.68 1.76 4.806 5 4.806v7h-10z"/>
        </svg>
      </div>


      {/* Content */}
      <p className="text-black text-base md:text-lg leading-relaxed mb-6 flex-grow" style={{ fontFamily: "'Bona Nova', serif" }}>
        "{content}"
      </p>

     
    </motion.div>
  )
}

function TestimonialsSlider({ testimonials }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAll, setShowAll] = useState(false)
  const itemsPerView = 3 // Number of testimonials to show at once in carousel mode

  if (testimonials.length === 0) {
    return null
  }

  const hasMore = testimonials.length > itemsPerView

  // For carousel mode (when not showing all)
  const maxIndex = Math.max(0, testimonials.length - itemsPerView)
  
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + (maxIndex + 1)) % (maxIndex + 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % (maxIndex + 1))
  }

  // Get testimonials to display based on current index
  const getDisplayedTestimonials = () => {
    if (showAll) {
      return testimonials
    }
    const endIndex = Math.min(currentIndex + itemsPerView, testimonials.length)
    return testimonials.slice(currentIndex, endIndex)
  }

  const displayedTestimonials = getDisplayedTestimonials()
  const showNavigation = !showAll && testimonials.length > itemsPerView

  return (
    <div className="w-full">
      {/* Testimonials Grid/Carousel */}
      <div className="relative px-8 md:px-12 lg:px-16">
        {/* Navigation Buttons - Only show when not showing all and there are more than itemsPerView */}
        {showNavigation && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-black/80 text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white"
              aria-label="Previous reviews"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black hover:bg-black/80 text-white p-2 md:p-3 rounded-full transition-all duration-300 hover:scale-110 shadow-lg border-2 border-white"
              aria-label="Next reviews"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {displayedTestimonials.map((testimonial, index) => (
            <TestimonialCard
              key={testimonial._id || `${currentIndex}-${index}`}
              name={testimonial.name}
              role={testimonial.role}
              content={testimonial.content}
              avatar={testimonial.avatar}
              index={index}
            />
          ))}
        </div>

        {/* Dots Indicator - Only show when not showing all and there are more than itemsPerView */}
        {showNavigation && maxIndex > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-black w-8'
                    : 'bg-black/30 hover:bg-black/50 w-2'
                }`}
                aria-label={`Go to review set ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Show More / Show Less Button */}
      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              setShowAll(!showAll)
              setCurrentIndex(0) // Reset to first when toggling
            }}
            className="px-6 md:px-8 py-3 md:py-4 bg-black text-white hover:bg-black/80 font-bold transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-black uppercase tracking-wide text-sm md:text-base"
            style={{ fontFamily: "'Bona Nova SC', serif" }}
          >
            {showAll ? (
              <span className="flex items-center justify-center gap-2">
                <span>Show Less</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Show More Reviews</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function EnrollForm() {
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
	
	// Ensure errors are cleared on mount
	useEffect(() => {
		setErrors({})
		setTouched({})
	}, [])

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
			const digits = value.replace(/\D/g, '')
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
		
		let error = null
		switch (name) {
			case 'fullName':
				error = validateFullName(value)
				break
			case 'email':
				error = validateEmail(value)
				break
			case 'whatsapp':
				error = validateWhatsApp(value)
				break
			case 'country':
				error = validateCountry(value)
				break
		}
		
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

	const handleSubmit = async (e) => {
		e.preventDefault()
		
		// Mark all fields as touched
		setTouched({
			fullName: true,
			email: true,
			whatsapp: true,
			country: true
		})
		
		// Validate form
		const currentErrors = {}
		const fullNameError = validateFullName(formData.fullName)
		if (fullNameError) currentErrors.fullName = fullNameError
		const emailError = validateEmail(formData.email)
		if (emailError) currentErrors.email = emailError
		const whatsappError = validateWhatsApp(formData.whatsapp)
		if (whatsappError) currentErrors.whatsapp = whatsappError
		const countryError = validateCountry(formData.country)
		if (countryError) currentErrors.country = countryError
		
		setErrors(currentErrors)
		
		// If there are errors, show message and scroll to first error
		if (Object.keys(currentErrors).length > 0) {
			toast.error('Please fix the errors in the form')
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
			}
			
			await toast.promise(
				apiPost('/leads', payload),
				{
					loading: 'Submitting your request...',
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
			
		} catch (error) {
			console.error('Failed to submit enrollment request:', error)
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<form 
			onSubmit={handleSubmit} 
			className="bg-white shadow-xl p-6 lg:p-8 grid md:grid-cols-2 gap-6 md:gap-8 border border-black/10" 
			noValidate
			onInvalid={(e) => {
				e.preventDefault()
			}}
		>
			<div className="md:col-span-2 text-center mb-4 md:mb-6">
				<h3 className="text-2xl lg:text-3xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>
					Start Your Musical Journey 🎵
				</h3>
				<p className="text-black/70 text-base md:text-lg" style={{ fontFamily: "'Bona Nova', serif" }}>
					Join hundreds of students learning music with us
				</p>
			</div>
			
			{/* Full Name */}
			<div className="md:col-span-2">
				<label htmlFor="enroll-fullName" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>
					Full Name <span className="text-red-500">*</span>
				</label>
				<input
					ref={nameInputRef}
					id="enroll-fullName"
					name="fullName"
					type="text"
					value={formData.fullName}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="Enter your full name"
					maxLength={100}
					className={`w-full border-2 p-3 md:p-4 transition-all duration-200 bg-white ${
						touched.fullName && errors.fullName
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: touched.fullName && formData.fullName && !errors.fullName
							? 'border-black/30 bg-white focus:ring-2 focus:ring-black/20 focus:border-black'
							: 'border-black/20 focus:ring-2 focus:ring-black/20 focus:border-black'
					}`}
					style={{ fontFamily: "'Bona Nova', serif" }}
					aria-invalid={errors.fullName && touched.fullName ? 'true' : 'false'}
					aria-describedby={errors.fullName && touched.fullName ? 'enroll-fullName-error' : undefined}
				/>
				<div className="flex items-center justify-between mt-2 min-h-[20px]">
					{touched.fullName && errors.fullName ? (
						<p id="enroll-fullName-error" className="text-sm text-red-600 flex items-center gap-1">
							<span>⚠️</span> {errors.fullName}
						</p>
					) : touched.fullName && formData.fullName && !errors.fullName ? (
						<p className="text-xs text-green-600 flex items-center gap-1">
							<span>✓</span> Looks good!
						</p>
					) : (
						<span></span>
					)}
					{formData.fullName.length > 0 && (
						<span className="text-xs text-black/40">{formData.fullName.length}/100</span>
					)}
				</div>
			</div>

			{/* Email */}
			<div>
				<label htmlFor="enroll-email" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>
					Email Address <span className="text-red-500">*</span>
				</label>
				<input
					id="enroll-email"
					name="email"
					type="email"
					value={formData.email}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="your.email@example.com"
					className={`w-full border-2 p-3 md:p-4 transition-all duration-200 bg-white ${
						errors.email && touched.email
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.email && !errors.email
							? 'border-black/30 bg-white focus:ring-2 focus:ring-black/20 focus:border-black'
							: 'border-black/20 focus:ring-2 focus:ring-black/20 focus:border-black'
					}`}
					style={{ fontFamily: "'Bona Nova', serif" }}
					aria-invalid={errors.email && touched.email ? 'true' : 'false'}
					aria-describedby={errors.email && touched.email ? 'enroll-email-error' : undefined}
				/>
				<div className="mt-2 min-h-[20px]">
					{errors.email && touched.email ? (
						<p id="enroll-email-error" className="text-sm text-red-600 flex items-center gap-1">
							<span>⚠️</span> {errors.email}
						</p>
					) : formData.email && !errors.email ? (
						<p className="text-xs text-green-600 flex items-center gap-1">
							<span>✓</span> Valid email address
						</p>
					) : null}
				</div>
			</div>

			{/* WhatsApp */}
			<div>
				<label htmlFor="enroll-whatsapp" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>
					WhatsApp Number <span className="text-black/60 text-xs font-normal">(Optional)</span>
				</label>
				<input
					id="enroll-whatsapp"
					name="whatsapp"
					type="tel"
					value={formData.whatsapp}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="+91 98765 43210"
					maxLength={17}
					className={`w-full border-2 p-3 md:p-4 transition-all duration-200 bg-white ${
						errors.whatsapp && touched.whatsapp
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.whatsapp && !errors.whatsapp
							? 'border-black/30 bg-white focus:ring-2 focus:ring-black/20 focus:border-black'
							: 'border-black/20 focus:ring-2 focus:ring-black/20 focus:border-black'
					}`}
					style={{ fontFamily: "'Bona Nova', serif" }}
					aria-invalid={errors.whatsapp && touched.whatsapp ? 'true' : 'false'}
					aria-describedby={errors.whatsapp && touched.whatsapp ? 'enroll-whatsapp-error' : undefined}
				/>
				<div className="mt-2 min-h-[20px]">
					{errors.whatsapp && touched.whatsapp ? (
						<p id="enroll-whatsapp-error" className="text-sm text-red-600 flex items-center gap-1">
							<span>⚠️</span> {errors.whatsapp}
						</p>
					) : formData.whatsapp && !errors.whatsapp ? (
						<p className="text-xs text-green-600 flex items-center gap-1">
							<span>✓</span> Valid phone number
						</p>
					) : (
						<p className="text-xs text-black/50">We'll use this to contact you quickly</p>
					)}
				</div>
			</div>

			{/* Country */}
			<div className="md:col-span-2">
				<label htmlFor="enroll-country" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>
					Country <span className="text-black/60 text-xs font-normal">(Optional)</span>
				</label>
				<input
					id="enroll-country"
					name="country"
					type="text"
					value={formData.country}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="e.g., India, USA, UK"
					className={`w-full border-2 p-3 md:p-4 transition-all duration-200 bg-white ${
						errors.country && touched.country
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.country && !errors.country
							? 'border-black/30 bg-white focus:ring-2 focus:ring-black/20 focus:border-black'
							: 'border-black/20 focus:ring-2 focus:ring-black/20 focus:border-black'
					}`}
					style={{ fontFamily: "'Bona Nova', serif" }}
					aria-invalid={errors.country && touched.country ? 'true' : 'false'}
					aria-describedby={errors.country && touched.country ? 'enroll-country-error' : undefined}
				/>
				<div className="mt-2 min-h-[20px]">
					{errors.country && touched.country ? (
						<p id="enroll-country-error" className="text-sm text-red-600 flex items-center gap-1">
							<span>⚠️</span> {errors.country}
						</p>
					) : null}
				</div>
			</div>

			{/* Submit Button */}
			<button
				type="submit"
				disabled={submitting}
				className={`md:col-span-2 px-8 py-4 font-bold transition-all duration-300 shadow-lg relative overflow-hidden border-2 border-black ${
					submitting
						? 'bg-black text-white cursor-not-allowed'
						: 'bg-white text-black hover:bg-black hover:text-white hover:shadow-xl active:scale-95'
				}`}
				style={{ fontFamily: "'Bona Nova SC', serif" }}
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
						<span>📝</span>
						<span>Submit Enrollment Request</span>
						<span className="text-sm">→</span>
					</span>
				)}
			</button>

			{/* Helper Text */}
			<p className="md:col-span-2 text-xs text-black/70 text-center font-medium">
				🔒 Your information is secure and will only be used for enrollment purposes
			</p>
		</form>
	)
}

// Hero Carousel Component
function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const navigate = useNavigate()
  const carouselSlides = [
    {
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80',
      title: 'The Musinest',
      subtitle: 'Structured piano lessons designed for growth, skill-building, and musical confidence',
      badge: 'Trusted by 500+ Students',
      buttonText1: 'Start Learning Today',
      href1: '#enroll',
      buttonText2: 'Browse Courses',
      href2: '#courses',
    },
    {
      image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=1920&q=80',
      title: 'Meet Your Teacher',
      subtitle: 'Meet Aditi — offering patient, professional, and personalised music training for learners of all levels.',
      badge: '15+ Professional Instructors',
    buttonText1: 'About Aditi',
    href1: '/teachers',
      buttonText2: 'About Musinest',
      href2: '/about',
    },
     
    {
      image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1920&q=80',
      title: 'One-on-One Lessons',
      subtitle: 'Structured teaching with complete attention on you and your progress.',
      buttonText1: 'Start Learning Today',
      href1: '#enroll',
      buttonText2: 'Browse Courses',
      href2: '#courses',
    },
    {
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&q=80',
      title: 'Start Your Journey',
      subtitle: 'Get in touch to begin your musical journey.',
      badge: '6 Instruments Available',
      buttonText1: 'Contact Us',
      href1: '/contact',
      buttonText2: 'Browse Courses',
      href2: '#courses',
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)
    }, 5000) // Auto-slide every 5 seconds

    return () => clearInterval(interval)
  }, [carouselSlides.length])

  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + carouselSlides.length) % carouselSlides.length)
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % carouselSlides.length)
  }

  return (
    <div className="relative w-full h-screen min-h-[300px] max-h-[600px] overflow-hidden">
      {/* Carousel Images with Overlay Text */}
      <div className="relative w-full h-full">
        {carouselSlides.map((slide, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"></div>
            
            {/* Text Content Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                 
                <h1 
                  className="text-5xl md:text-7xl lg:text-8xl font-cinema text-white mb-6"
                  style={{
                    fontFamily: "'Dancing Script', cursive"
                  }}
                >
                  {slide.title.split(' ').map((word, i, arr) => (
                    <span key={i}>
                      {i === arr.length - 1 ? (
                        <span className="text-[#F5E6E0] font-bold">{word}</span>
                      ) : (
                        <>{word} </>
                      )}
                    </span>
                  ))}
                </h1>
                <p 
                  className="text-xl md:text-2xl text-white/90 mb-8 font-medium max-w-3xl mx-auto"
                  style={{
                    fontFamily: "'Bona Nova SC', serif"
                  }}
                >
                  {slide.subtitle}
                </p>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const href = slide.href1
                        if (href.startsWith('#')) {
                          // Hash link - scroll to element
                          const elementId = href.substring(1)
                          const element = document.getElementById(elementId)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        } else if (href.startsWith('/')) {
                          // Route link - navigate using React Router
                          navigate(href)
                        } else if (href.startsWith('http://') || href.startsWith('https://')) {
                          // External link - open in new tab
                          window.open(href, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="px-8 py-4 rounded-none bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                      style={{ fontFamily: "'Bona Nova SC', serif" }}
                    >
                      {slide.buttonText1}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        const href = slide.href2
                        if (href.startsWith('#')) {
                          // Hash link - scroll to element
                          const elementId = href.substring(1)
                          const element = document.getElementById(elementId)
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }
                        } else if (href.startsWith('/')) {
                          // Route link - navigate using React Router
                          navigate(href)
                        } else if (href.startsWith('http://') || href.startsWith('https://')) {
                          // External link - open in new tab
                          window.open(href, '_blank', 'noopener,noreferrer')
                        }
                      }}
                      className="px-8 py-4 rounded-none bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center whitespace-nowrap cursor-pointer"
                      style={{ fontFamily: "'Bona Nova SC', serif" }}
                    >
                      {slide.buttonText2}
                    </button>
                  </div>
                  {/* Social Media Icons */}
                  <div className="flex gap-4 items-center mt-2">
                    <a 
                      href="https://www.instagram.com/the_musinest?igsh=MWp1b3BpazQ2NHFtZA==" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#F5E6E0]/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F5E6E0]/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 border border-[#F5E6E0]/30"
                      title="Follow us on Instagram"
                    >
                      <svg className="w-6 h-6 text-[#F5E6E0]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://www.youtube.com/@the_musinest" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#F5E6E0]/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F5E6E0]/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 border border-[#F5E6E0]/30"
                      title="Subscribe to our YouTube channel"
                    >
                      <svg className="w-6 h-6 text-[#F5E6E0]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>
                    </a>
                    <a 
                      href="https://wa.me/917024403520" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-12 h-12 bg-[#F5E6E0]/20 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-[#F5E6E0]/30 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110 border border-[#F5E6E0]/30"
                      title="Contact us on WhatsApp"
                    >
                      <svg className="w-6 h-6 text-[#F5E6E0]" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-[#F5E6E0] p-3 rounded-full transition-all duration-300 hover:scale-110 z-20 backdrop-blur-sm border border-[#F5E6E0]/30 sm:block hidden"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-[#F5E6E0] p-3 rounded-full transition-all duration-300 hover:scale-110 z-20 backdrop-blur-sm border border-[#F5E6E0]/30 sm:block hidden"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {carouselSlides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-[#F5E6E0] w-8 border-2 border-white'
                : 'bg-white/50 hover:bg-white/70 border border-[#F5E6E0]/50 w-3'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function App() {
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [testimonials, setTestimonials] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set())
  const { getToken, isSignedIn } = useAuth()

  // Scroll to top on component mount and prevent hash scroll on reload
  useEffect(() => {
    // Remove hash from URL if present
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
    }
    
    // Force scroll to top multiple times to ensure it works
    const scrollToTop = () => {
      window.scrollTo(0, 0)
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    
    scrollToTop()
    
    // Use requestAnimationFrame
    requestAnimationFrame(scrollToTop)
    
    // After render
    setTimeout(scrollToTop, 0)
    setTimeout(scrollToTop, 50)
    setTimeout(scrollToTop, 100)
  }, [])

  useEffect(() => {
    // Load courses, teachers, and testimonials from API
    apiGet('/courses').then(setCourses).catch(() => setCourses([]))
    apiGet('/teachers').then(setTeachers).catch(() => setTeachers([]))
    apiGet('/testimonials')
      .then(data => {
        console.log('Loaded testimonials from API:', data)
        setTestimonials(Array.isArray(data) ? data : [])
      })
      .catch((error) => {
        console.error('Error loading testimonials:', error)
        setTestimonials([])
      })
    
    // Load enrollment status if user is signed in
    if (isSignedIn) {
      getToken().then(token => {
        if (token) {
          fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000'}/api/me/enrollments`, {
            headers: { Authorization: `Bearer ${token}` }
          })
            .then(res => res.ok ? res.json() : [])
            .then(enrollments => {
              // The endpoint returns an array of { enrollmentId, course } objects
              const enrolledIds = new Set(
                Array.isArray(enrollments) 
                  ? enrollments.map(e => {
                      const id = e.course?._id || e.courseId
                      return id ? String(id) : null
                    }).filter(Boolean)
                  : []
              )
              console.log('Enrolled course IDs (homepage):', Array.from(enrolledIds))
              setEnrolledCourseIds(enrolledIds)
            })
            .catch(err => console.error('Failed to load enrollments:', err))
        }
      }).catch(() => {})
    }
  }, [isSignedIn, getToken])

  return (
    <div className="min-h-screen overflow-x-hidden">
      <Navbar />

      <main className="pb-20 md:pb-16">
        {/* Hero Section - Full Width Carousel with Text Overlay */}
        <section className="w-full">
          <HeroCarousel />
        </section>

     

        {/* Courses Section - Black background */}
        <motion.section 
          id="courses" 
          className="bg-white py-20 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle emoji="🎵" title="Featured Courses" subtitle="Choose your instrument and start your musical journey" spaceNumber={16}/>
          {courses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.slice(0, 6).map((course, index) => {
                const courseId = String(course._id)
                const isEnrolled = enrolledCourseIds.has(courseId) || enrolledCourseIds.has(course._id)
                return (
                  <HomepageCourseCard 
                    key={course._id}
                    title={course.title} 
                    level={course.level} 
                    image={course.image || course.thumbnailPath}
                    _id={course._id}
                    isEnrolled={isEnrolled}
                    course={course}
                    index={index}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-cinema font-bold text-white mb-2">No courses available yet</h3>
              <p className="text-white/80 mb-6 font-medium">Check back soon for exciting music courses!</p>
            </div>
          )}
          <div className="text-center mt-8">
            <a href="/courses" className="inline-flex items-center px-6 py-3 text-black font-bold hover:bg-black hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-black"
            style={{ fontFamily: "'Bona Nova SC', serif" }}
            >
              View All Courses
              <span className="ml-2">→</span>
            </a>
          </div>
          </div>
        </motion.section>

        {/* Teachers Section - White background */}
        <motion.section 
          id="teachers" 
          className="bg-white py-20 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
             {/* Music Genres Section */}
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ fontFamily: "'Bona Nova SC', serif" }}>
              Music Genres & Styles
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg- rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎼</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Western Classical</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>From Baroque to Modern music, structured ABRSM curriculum (Grades 1-8)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎬</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Bollywood Piano</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>Popular Hindi film songs, focusing on melody, harmony, and rhythm (All Levels)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎵</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Indian Classical Vocal</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>Traditional ragas, tala patterns, classical compositions (Beginner to Intermediate)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎸</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Rock & Pop</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>Contemporary music styles, chord progressions, modern piano techniques (Beginners to Advanced)</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">📚</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Music Theory</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>Harmony, rhythm, notation, and musical structure integrated into learning</p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-white/20">
                <div className="text-3xl mb-3">🎭</div>
                <h3 className="text-xl font-bold text-black mb-2" style={{ fontFamily: "'Bona Nova SC', serif" }}>Performance Skills</h3>
                <p className="text-black/70 font-medium text-sm" style={{ fontFamily: "'Bona Nova', serif" }}>Stage presence, confidence building, and audience engagement.</p>
              </div>
            </div>
          </div>
          </div>
        </motion.section>

        {/* Testimonials Section - White background */}
        {testimonials.length > 0 && (
          <motion.section 
            className="bg-white py-20 w-full"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <SectionTitle emoji="💬" title="Reviews from our music family" subtitle="" spaceNumber="16" />
              <TestimonialsSlider testimonials={testimonials} />
            </div>
          </motion.section>
        )}

        {/* Enrollment Section - Black background */}
        <motion.section 
          id="enroll" 
          className="bg-white py-20 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle emoji="" title="" subtitle="" />
            <div className="max-w-4xl mx-auto">
              <EnrollForm />
            </div>
          </div>
        </motion.section>

        {/* Gallery Section - White background */}
        <motion.section 
          id="gallery" 
          className="bg-white py-20 w-full"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-cinema font-bold tracking-wide text-black">
                <span className="mr-2"
                style={{ fontFamily: "'Bona Nova SC', serif" }}
                >📸
                Gallery</span>
              </h2>
              <p className="text-black/70 mt-3 text-lg font-medium" style={{ fontFamily: "'Bona Nova', serif" }}>Moments from our classes and performances</p>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { src: vid1, title: "Music Class Performance", delay: 0.1 },
              { src: vid2, title: "Student Showcase", delay: 0.2 }
            ].map((video, index) => (
              <motion.div
                key={index}
                className="aspect-square rounded-2xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: video.delay }}
              >
                <OptimizedVideo
                  src={video.src}
                  title={video.title}
                  className="w-full h-full"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center">
            💡 Videos autoplay when in view. Hover to pause or click to control.
          </p>
          </div>
        </motion.section>
      </main>

      <Footer />
    </div>
  )
}

export default App

