import './App.css'
import { apiGet, apiPost } from './lib/api.js'
import { useAuth } from '@clerk/clerk-react'
import { useEffect, useState, useRef } from 'react'
import toast from 'react-hot-toast'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'

function SectionTitle({ emoji, title, subtitle }) {
  return (
    <div className="max-w-5xl mx-auto text-center mb-8">
      <h2 className="text-3xl md:text-5xl font-cinema font-bold tracking-wide text-white">
        <span className="mr-2">{emoji}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-white/80 mt-3 text-lg font-medium">{subtitle}</p>
      )}
    </div>
  )
}

function CourseCard({ title, level, price, image, _id, isEnrolled = false, course }) {
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
    <a href={`/courses/${_id}`} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 border border-white/20 hover:border-[#F5E6E0] relative overflow-hidden">
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
          {!isEnrolled && (
            <span className="text-black font-bold text-lg">₹{price}</span>
          )}
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
    </a>
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

function StatCard({ number, label, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 text-center border border-white/20 hover:border-[#F5E6E0]">
      <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-[#F5E6E0] transition-colors">
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-4xl font-cinema font-bold text-black mb-2">{number}</div>
      <div className="text-black/70 font-bold">{label}</div>
    </div>
  )
}

function TestimonialCard({ name, role, content, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-6 border border-white/20 hover:border-[#F5E6E0]">
      <div className="flex items-center mb-4">
        <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover ring-2 ring-[#F5E6E0]/30" />
        <div className="ml-3">
          <div className="font-cinema font-bold text-black">{name}</div>
          <div className="text-sm text-black/70 font-medium">{role}</div>
        </div>
      </div>
      <p className="text-black italic leading-relaxed font-medium">"{content}"</p>
      <div className="mt-3 flex text-[#F5E6E0]">
        {'★'.repeat(5)}
      </div>
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
		<form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 grid md:grid-cols-2 gap-6 border border-white/20" noValidate>
			<div className="md:col-span-2 text-center mb-2">
				<h3 className="text-xl lg:text-3xl font-cinema font-bold text-black mb-2">Start Your Musical Journey 🎵</h3>
				<p className="text-black/70 font-medium">Join hundreds of students learning music with us</p>
			</div>
			
			{/* Full Name */}
			<div>
				<label htmlFor="enroll-fullName" className="block text-sm font-bold text-black mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
						errors.fullName && touched.fullName
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.fullName && !errors.fullName
							? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
							: 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
					}`}
					required
					aria-invalid={errors.fullName && touched.fullName ? 'true' : 'false'}
					aria-describedby={errors.fullName && touched.fullName ? 'enroll-fullName-error' : undefined}
				/>
				<div className="flex items-center justify-between mt-1">
					{errors.fullName && touched.fullName ? (
						<p id="enroll-fullName-error" className="text-sm text-red-600 flex items-center gap-1 animate-fade-in">
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
				<label htmlFor="enroll-email" className="block text-sm font-bold text-black mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
						errors.email && touched.email
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.email && !errors.email
							? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
							: 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
					}`}
					required
					aria-invalid={errors.email && touched.email ? 'true' : 'false'}
					aria-describedby={errors.email && touched.email ? 'enroll-email-error' : undefined}
				/>
				{errors.email && touched.email ? (
					<p id="enroll-email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
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
				<label htmlFor="enroll-whatsapp" className="block text-sm font-bold text-black mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
						errors.whatsapp && touched.whatsapp
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.whatsapp && !errors.whatsapp
							? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
							: 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
					}`}
					aria-invalid={errors.whatsapp && touched.whatsapp ? 'true' : 'false'}
					aria-describedby={errors.whatsapp && touched.whatsapp ? 'enroll-whatsapp-error' : undefined}
				/>
				{errors.whatsapp && touched.whatsapp ? (
					<p id="enroll-whatsapp-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
						<span>⚠️</span> {errors.whatsapp}
					</p>
				) : formData.whatsapp && !errors.whatsapp ? (
					<p className="mt-1 text-xs text-green-600 flex items-center gap-1">
						<span>✓</span> Valid phone number
					</p>
					) : (
						<p className="mt-1 text-xs text-[#2c2c2c]">We'll use this to contact you quickly</p>
					)}
			</div>

			{/* Country */}
			<div>
				<label htmlFor="enroll-country" className="block text-sm font-bold text-black mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
						errors.country && touched.country
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.country && !errors.country
							? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
							: 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
					}`}
					aria-invalid={errors.country && touched.country ? 'true' : 'false'}
					aria-describedby={errors.country && touched.country ? 'enroll-country-error' : undefined}
				/>
				{errors.country && touched.country ? (
					<p id="enroll-country-error" className="mt-1 text-sm text-red-600 flex items-center gap-1 animate-fade-in">
						<span>⚠️</span> {errors.country}
					</p>
				) : null}
			</div>

			{/* Submit Button */}
			<button
				type="submit"
				disabled={submitting}
				className={`md:col-span-2 px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg relative overflow-hidden ${
					submitting
						? 'bg-black text-white cursor-not-allowed'
						: 'bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] hover:shadow-xl active:scale-95'
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
  const carouselSlides = [
    {
      image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80',
      title: 'The Musinest',
      subtitle: 'Structured piano lessons designed for growth, skill-building, and musical confidence',
      badge: 'Trusted by 500+ Students'
    },
    {
      image: 'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=1920&q=80',
      title: 'Meet Your Teacher',
      subtitle: 'Aditi — dedicated to providing patient, professional, and personalised music training by Aditi',
      badge: '15+ Professional Instructors'
    },
    {
      image: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?w=1920&q=80',
      title: 'Music Arrangements & Notations',
      subtitle: 'Clean, accurate, and crafted for musicians',
      badge: '95% Success Rate'
    },
    {
      image: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1920&q=80',
      title: 'Start Your Journey',
      subtitle: 'Contact me for piano lessons, event performances, and collaboration opportunities by Aditi',
      badge: '6 Instruments Available'
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
                  className="text-5xl md:text-7xl lg:text-8xl font-cinema font-bold leading-tight text-white mb-6"
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
                  className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-medium max-w-3xl mx-auto"
                  style={{
                    fontFamily: "'Satisfy', cursive"
                  }}
                >
                  {slide.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a 
                    href="#enroll" 
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.getElementById('enroll')
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="px-8 py-4 rounded-lg bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center"
                  >
                    Start Learning Today
                  </a>
                  <a 
                    href="#courses" 
                    onClick={(e) => {
                      e.preventDefault()
                      const element = document.getElementById('courses')
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }
                    }}
                    className="px-8 py-4 rounded-lg bg-transparent border-2 border-[#F5E6E0] hover:bg-[#F5E6E0]/10 font-bold text-[#F5E6E0] text-lg transition-all duration-300 text-center"
                  >
                    Browse Courses
                  </a>
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
    // Load courses and teachers from API
    apiGet('/courses').then(setCourses).catch(() => setCourses([]))
    apiGet('/teachers').then(setTeachers).catch(() => setTeachers([]))
    
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
    <div className="min-h-screen bg-black overflow-x-hidden">
      <Navbar />

      <main className="pb-20 md:pb-16">
        {/* Hero Section - Full Width Carousel with Text Overlay */}
        <section className="w-full">
          <HeroCarousel />
        </section>

        {/* Stats Section - White background */}
        <section className="bg-white py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard number="500+" label="Happy Students" icon="👥" color="bg-black" />
              <StatCard number="15+" label="Expert Teachers" icon="👩‍🏫" color="bg-black" />
              <StatCard number="6" label="Instruments" icon="🎵" color="bg-black" />
              <StatCard number="95%" label="Success Rate" icon="⭐" color="bg-black" />
            </div>
          </div>
        </section>

        {/* Courses Section - Black background */}
        <section id="courses" className="bg-black py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle emoji="🎵" title="Featured Courses" subtitle="Choose your instrument and start your musical journey" />
          {courses.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {courses.slice(0, 6).map((course) => {
                const courseId = String(course._id)
                const isEnrolled = enrolledCourseIds.has(courseId) || enrolledCourseIds.has(course._id)
                return (
                  <CourseCard 
                    key={course._id}
                    title={course.title} 
                    level={course.level} 
                    price={course.price} 
                    image={course.image || course.thumbnailPath}
                    _id={course._id}
                    isEnrolled={isEnrolled}
                    course={course}
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
            <a href="/courses" className="inline-flex items-center px-6 py-3 rounded-lg bg-[#F5E6E0] text-black font-bold hover:bg-[#E8D5CC] transition-all duration-300 shadow-lg hover:shadow-xl">
              View All Courses
              <span className="ml-2">→</span>
            </a>
          </div>
          </div>
        </section>

        {/* Teachers Section - White background */}
        <section id="teachers" className="bg-white py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-cinema font-bold tracking-wide text-black">
                <span className="mr-2">👩‍🏫</span>
                Meet Our Expert Teachers
              </h2>
              <p className="text-black/70 mt-3 text-lg font-medium">Learn from the best musicians and educators</p>
            </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {teachers.length > 0 ? (
              teachers.map((teacher) => (
                <TeacherCard 
                  key={teacher._id}
                  name={teacher.name} 
                  instrument={teacher.instrument} 
                  avatar={teacher.avatar} 
                />
              ))
            ) : (
              <>
                <TeacherCard name="Aarav" instrument="Guitar" avatar="https://i.pravatar.cc/150?img=12" />
                <TeacherCard name="Maya" instrument="Piano" avatar="https://i.pravatar.cc/150?img=32" />
                <TeacherCard name="Kabir" instrument="Vocals" avatar="https://i.pravatar.cc/150?img=22" />
              </>
            )}
          </div>
          </div>
        </section>

        {/* Testimonials Section - Black background */}
        <section className="bg-black py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle emoji="💬" title="What Our Students Say" subtitle="Real feedback from our music community" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <TestimonialCard 
              name="Priya Sharma" 
              role="Guitar Student" 
              content="The guitar lessons here are amazing! My instructor Aarav is patient and makes learning so much fun. I've improved so much in just 3 months!"
              avatar="https://i.pravatar.cc/150?img=1"
            />
            <TestimonialCard 
              name="Arjun Patel" 
              role="Piano Student" 
              content="Maya's piano teaching style is incredible. She breaks down complex pieces into easy steps. Highly recommended for anyone wanting to learn piano!"
              avatar="https://i.pravatar.cc/150?img=2"
            />
            <TestimonialCard 
              name="Sneha Reddy" 
              role="Vocal Student" 
              content="Kabir's vocal coaching helped me discover my voice. The techniques I learned here have boosted my confidence tremendously!"
              avatar="https://i.pravatar.cc/150?img=3"
            />
          </div>
          </div>
        </section>

        {/* Enrollment Section - Black background */}
        <section id="enroll" className="bg-black py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <SectionTitle emoji="📝" title="Ready to Start?" subtitle="Join our music family today" />
            <div className="max-w-4xl mx-auto">
              <EnrollForm />
            </div>
          </div>
        </section>

        {/* Gallery Section - White background */}
        <section id="gallery" className="bg-white py-20 w-full">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto text-center mb-8">
              <h2 className="text-3xl md:text-5xl font-cinema font-bold tracking-wide text-black">
                <span className="mr-2">📸</span>
                Gallery
              </h2>
              <p className="text-black/70 mt-3 text-lg font-medium">Moments from our classes and performances</p>
            </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-white shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer">
                <img
                  className="h-full w-full object-cover"
                  src={`https://picsum.photos/seed/music-${i}/400/400`}
                  alt="gallery"
                />
              </div>
            ))}
          </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App

