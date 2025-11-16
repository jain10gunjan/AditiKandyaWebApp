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
      <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-sky-600">
        <span className="mr-2">{emoji}</span>
        {title}
      </h2>
      {subtitle && (
        <p className="text-slate-600 mt-2">{subtitle}</p>
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
  
  return (
    <a href={`/courses/${_id}`} className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-4 border border-slate-100 hover:border-sky-200 relative">
      <div className="relative overflow-hidden rounded-xl">
        <img src={image} alt={title} className="h-40 w-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 right-3 bg-sky-600 text-white px-2 py-1 rounded-full text-xs font-medium z-10">
          {level}
        </div>
        {isEnrolled && (
          <div className="absolute bottom-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 z-10 animate-fade-in shadow-lg">
            <span className="text-sm">✓</span>
            <span>Already Enrolled</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-bold text-lg text-slate-800 group-hover:text-sky-700 transition-colors">{title}</h3>
        {hasTeacher && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
            <span>👩‍🏫</span>
            <span>{course.teacherName || 'Assigned Teacher'}</span>
            {course.teacherInstrument && (
              <>
                <span className="text-slate-300">•</span>
                <span>{course.teacherInstrument}</span>
              </>
            )}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          {!isEnrolled && (
            <span className="text-sky-600 font-semibold text-lg">₹{price}</span>
          )}
          {isEnrolled && (
            <span className="text-green-600 font-semibold text-sm flex items-center gap-1">
              <span>✓</span>
              <span>Enrolled</span>
            </span>
          )}
          <span className="px-3 py-1.5 rounded-full bg-sky-600 text-white text-sm group-hover:bg-sky-700 transition-colors">
            View Details
          </span>
        </div>
      </div>
    </a>
  )
}

function TeacherCard({ name, instrument, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-slate-100 text-center group">
      <div className="relative inline-block">
        <img src={avatar} alt={name} className="h-20 w-20 rounded-full object-cover mx-auto group-hover:scale-110 transition-transform duration-300" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      <h3 className="mt-4 font-bold text-slate-800">{name}</h3>
      <p className="text-sm text-slate-600">{instrument} Expert</p>
      <div className="mt-2 flex justify-center">
        <div className="flex text-yellow-400">
          {'★'.repeat(5)}
        </div>
      </div>
    </div>
  )
}

function StatCard({ number, label, icon, color }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 text-center border border-slate-100">
      <div className={`w-16 h-16 ${color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-slate-900 mb-2">{number}</div>
      <div className="text-slate-600">{label}</div>
    </div>
  )
}

function TestimonialCard({ name, role, content, avatar }) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 p-6 border border-slate-100">
      <div className="flex items-center mb-4">
        <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
        <div className="ml-3">
          <div className="font-semibold text-slate-800">{name}</div>
          <div className="text-sm text-slate-600">{role}</div>
        </div>
      </div>
      <p className="text-slate-700 italic">"{content}"</p>
      <div className="mt-3 flex text-yellow-400">
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
		<form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 lg:p-8 grid md:grid-cols-2 gap-6 border border-slate-100" noValidate>
			<div className="md:col-span-2 text-center mb-2">
				<h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2">Start Your Musical Journey 🎵</h3>
				<p className="text-slate-600">Join hundreds of students learning music with us</p>
			</div>
			
			{/* Full Name */}
			<div>
				<label htmlFor="enroll-fullName" className="block text-sm font-medium text-slate-700 mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 ${
						errors.fullName && touched.fullName
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.fullName && !errors.fullName
							? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
							: 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
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
				<label htmlFor="enroll-email" className="block text-sm font-medium text-slate-700 mb-2">
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 ${
						errors.email && touched.email
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.email && !errors.email
							? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
							: 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
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
				<label htmlFor="enroll-whatsapp" className="block text-sm font-medium text-slate-700 mb-2">
					WhatsApp Number <span className="text-slate-400 text-xs">(Optional)</span>
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
					className={`w-full border rounded-lg p-3 transition-all duration-200 ${
						errors.whatsapp && touched.whatsapp
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.whatsapp && !errors.whatsapp
							? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
							: 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
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
					<p className="mt-1 text-xs text-slate-500">We'll use this to contact you quickly</p>
				)}
			</div>

			{/* Country */}
			<div>
				<label htmlFor="enroll-country" className="block text-sm font-medium text-slate-700 mb-2">
					Country <span className="text-slate-400 text-xs">(Optional)</span>
				</label>
				<input
					id="enroll-country"
					name="country"
					type="text"
					value={formData.country}
					onChange={handleChange}
					onBlur={handleBlur}
					placeholder="e.g., India, USA, UK"
					className={`w-full border rounded-lg p-3 transition-all duration-200 ${
						errors.country && touched.country
							? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
							: formData.country && !errors.country
							? 'border-green-300 bg-green-50/30 focus:ring-2 focus:ring-green-500 focus:border-green-500'
							: 'border-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500'
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
				className={`md:col-span-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg relative overflow-hidden ${
					submitting
						? 'bg-slate-400 text-white cursor-not-allowed'
						: 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 hover:shadow-xl active:scale-95'
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
			<p className="md:col-span-2 text-xs text-slate-500 text-center">
				🔒 Your information is secure and will only be used for enrollment purposes
			</p>
		</form>
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
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <Navbar />

      <main className="pb-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 pt-12 md:pt-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-sky-100 text-sky-700 text-sm font-medium mb-6">
                <span className="mr-2">🎵</span>
                Trusted by 500+ Students
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold leading-tight text-slate-900 mb-6">
                Learn, Play, and 
                <span className="bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent"> Shine</span>
              </h1>
              <p className="text-xl text-slate-700 mb-8 leading-relaxed">
                Fun and modern music lessons for ages 9–22. Master Guitar 🎸, Piano 🎹, Vocals 🎤 and more with our expert instructors!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a 
                  href="#enroll" 
                  onClick={(e) => {
                    e.preventDefault()
                    const element = document.getElementById('enroll')
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }
                  }}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700 font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 text-center"
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
                  className="px-8 py-4 rounded-full bg-white border-2 border-slate-200 hover:border-sky-300 font-semibold text-slate-800 text-lg transition-all duration-300 text-center"
                >
                  Browse Courses
                </a>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎸</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎹</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎤</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🥁</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎻</div>
              <div className="h-32 md:h-40 rounded-2xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-5xl hover:scale-105 cursor-pointer">🎷</div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="max-w-6xl mx-auto px-4 mt-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard number="500+" label="Happy Students" icon="👥" color="bg-blue-100" />
            <StatCard number="15+" label="Expert Teachers" icon="👩‍🏫" color="bg-green-100" />
            <StatCard number="6" label="Instruments" icon="🎵" color="bg-purple-100" />
            <StatCard number="95%" label="Success Rate" icon="⭐" color="bg-yellow-100" />
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="max-w-6xl mx-auto px-4 mt-20">
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
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No courses available yet</h3>
              <p className="text-slate-600 mb-6">Check back soon for exciting music courses!</p>
            </div>
          )}
          <div className="text-center mt-8">
            <a href="/courses" className="inline-flex items-center px-6 py-3 rounded-full bg-white border-2 border-sky-200 text-sky-700 font-semibold hover:border-sky-300 hover:bg-sky-50 transition-all duration-300">
              View All Courses
              <span className="ml-2">→</span>
            </a>
          </div>
        </section>

        {/* Teachers Section */}
        <section id="teachers" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="👩‍🏫" title="Meet Our Expert Teachers" subtitle="Learn from the best musicians and educators" />
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
        </section>

        {/* Testimonials Section */}
        <section className="max-w-6xl mx-auto px-4 mt-20">
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
        </section>

        {/* Schedule Section */}
        <section id="schedule" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📅" title="Class Schedule" subtitle="Flexible timings for after-school and weekend learning" />
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 rounded-xl bg-sky-50">
                <div className="text-2xl mb-2">🎸</div>
                <div className="font-semibold text-slate-800">Guitar</div>
                <div className="text-sm text-slate-600 mt-1">Mon & Wed</div>
                <div className="text-sm text-slate-600">5:00 PM - 6:30 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-green-50">
                <div className="text-2xl mb-2">🎹</div>
                <div className="font-semibold text-slate-800">Piano</div>
                <div className="text-sm text-slate-600 mt-1">Tue & Thu</div>
                <div className="text-sm text-slate-600">5:00 PM - 6:30 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-purple-50">
                <div className="text-2xl mb-2">🎤</div>
                <div className="font-semibold text-slate-800">Vocals</div>
                <div className="text-sm text-slate-600 mt-1">Saturday</div>
                <div className="text-sm text-slate-600">10:00 AM - 12:00 PM</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-orange-50">
                <div className="text-2xl mb-2">🥁</div>
                <div className="font-semibold text-slate-800">Drums</div>
                <div className="text-sm text-slate-600 mt-1">Sunday</div>
                <div className="text-sm text-slate-600">11:00 AM - 1:00 PM</div>
              </div>
            </div>
          </div>
        </section>

        {/* Enrollment Section */}
        <section id="enroll" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📝" title="Ready to Start?" subtitle="Join our music family today" />
          <div className="max-w-4xl mx-auto">
            <EnrollForm />
          </div>
        </section>

        {/* Gallery Section */}
        <section id="gallery" className="max-w-6xl mx-auto px-4 mt-20">
          <SectionTitle emoji="📸" title="Gallery" subtitle="Moments from our classes and performances" />
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
        </section>
      </main>

      <Footer />
    </div>
  )
}

export default App

