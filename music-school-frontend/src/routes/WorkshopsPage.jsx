import { useEffect, useState } from 'react'
import { apiGet } from '../lib/api.js'
import { useAuth, SignedIn, SignedOut } from '@clerk/clerk-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import toast from 'react-hot-toast'

function WorkshopCard({ workshop, onEnrollClick }) {
  return (
    <div className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 p-4 border border-white/20 hover:border-[#F5E6E0] relative overflow-hidden">
      <div className="relative overflow-hidden rounded-xl">
        <img 
          src={workshop.image || 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'} 
          alt={workshop.title} 
          className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-500" 
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop'
          }}
        />
        {workshop.price === 0 && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-bold shadow-md z-10">
            Free
          </div>
        )}
        {workshop.price > 0 && (
          <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm text-black px-2 py-1 rounded-full text-xs font-bold shadow-md z-10">
            ₹{workshop.price?.toLocaleString() || 0}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-cinema font-bold text-lg text-black group-hover:text-gray-700 transition-colors mb-1">
          {workshop.title}
        </h3>
        <p className="text-black/70 text-sm line-clamp-2 leading-relaxed mb-3 font-medium">
          {workshop.description}
        </p>
        
        <div className="space-y-2 mb-4 text-xs text-black/60 font-medium">
          {workshop.date && (
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>{workshop.date}</span>
            </div>
          )}
          {workshop.time && (
            <div className="flex items-center gap-2">
              <span>⏰</span>
              <span>{workshop.time}</span>
            </div>
          )}
          {workshop.duration && (
            <div className="flex items-center gap-2">
              <span>⏱️</span>
              <span>{workshop.duration}</span>
            </div>
          )}
          {workshop.location && (
            <div className="flex items-center gap-2">
              <span>📍</span>
              <span>{workshop.location}</span>
            </div>
          )}
        </div>
        
        <button
          onClick={() => onEnrollClick(workshop)}
          className="w-full px-4 py-2 rounded-lg bg-black text-[#F5E6E0] text-sm font-bold group-hover:bg-[#F5E6E0] group-hover:text-black transition-all duration-300"
        >
          Enroll Now
        </button>
      </div>
    </div>
  )
}

function EnrollmentForm({ workshop, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validateName = (name) => {
    if (!name || name.trim().length === 0) return 'Name is required'
    if (name.trim().length < 2) return 'Name must be at least 2 characters'
    return null
  }

  const validateEmail = (email) => {
    if (!email || email.trim().length === 0) return 'Email is required'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) return 'Please enter a valid email address'
    return null
  }

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) return 'Phone number is required'
    const cleaned = phone.replace(/[\s\-+()]/g, '')
    if (!/^\d{10,15}$/.test(cleaned)) {
      return 'Please enter a valid phone number (10-15 digits)'
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    if (name === 'phone') {
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
    let error = null
    switch (name) {
      case 'name':
        error = validateName(value)
        break
      case 'email':
        error = validateEmail(value)
        break
      case 'phone':
        error = validatePhone(value)
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
    
    const currentErrors = {}
    const nameError = validateName(formData.name)
    if (nameError) currentErrors.name = nameError
    const emailError = validateEmail(formData.email)
    if (emailError) currentErrors.email = emailError
    const phoneError = validatePhone(formData.phone)
    if (phoneError) currentErrors.phone = phoneError
    
    setErrors(currentErrors)
    
    if (Object.keys(currentErrors).length > 0) {
      toast.error('Please fix the errors in the form')
      return
    }
    
    try {
      setSubmitting(true)
      await onSubmit(workshop._id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        message: formData.message.trim()
      })
      
      setFormData({ name: '', email: '', phone: '', message: '' })
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to submit enrollment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#FFD700]/30">
        <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-cinema font-bold text-black">Enroll in Workshop</h2>
          <button
            onClick={onClose}
            className="text-black/70 hover:text-black text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6 p-4 bg-black/5 rounded-lg">
            <h3 className="font-bold text-black mb-2">{workshop.title}</h3>
            {workshop.date && <p className="text-sm text-black/70">📅 {workshop.date}</p>}
            {workshop.time && <p className="text-sm text-black/70">⏰ {workshop.time}</p>}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="enroll-name" className="block text-sm font-bold text-black mb-2">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="enroll-name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Your full name"
                className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                  errors.name
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : formData.name && !errors.name
                    ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                    : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                }`}
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="enroll-email" className="block text-sm font-bold text-black mb-2">
                Email <span className="text-red-500">*</span>
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
                  errors.email
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : formData.email && !errors.email
                    ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                    : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                }`}
                required
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="enroll-phone" className="block text-sm font-bold text-black mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                id="enroll-phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="+91 98765 43210"
                maxLength={17}
                className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                  errors.phone
                    ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : formData.phone && !errors.phone
                    ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                    : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                }`}
                required
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <span>⚠️</span> {errors.phone}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="enroll-message" className="block text-sm font-bold text-black mb-2">
                Message <span className="text-black/60 text-xs font-normal">(Optional)</span>
              </label>
              <textarea
                id="enroll-message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Any additional information or questions..."
                rows="4"
                className="w-full border border-black/20 rounded-lg p-3 transition-all duration-200 bg-white font-medium focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700] resize-none"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg ${
                  submitting
                    ? 'bg-black text-white cursor-not-allowed'
                    : 'bg-[#FFD700] text-black hover:bg-[#FFC700] hover:shadow-xl active:scale-95'
                }`}
              >
                {submitting ? 'Submitting...' : 'Submit Enrollment'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-lg font-bold bg-black/10 text-black hover:bg-black/20 transition-all duration-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedWorkshop, setSelectedWorkshop] = useState(null)
  const [showEnrollmentForm, setShowEnrollmentForm] = useState(false)
  const { isSignedIn, getToken } = useAuth()

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    const loadWorkshops = async () => {
      try {
        setLoading(true)
        const data = await apiGet('/workshops')
        setWorkshops(data)
      } catch (error) {
        console.error('Failed to load workshops:', error)
        setWorkshops([])
      } finally {
        setLoading(false)
      }
    }
    
    loadWorkshops()
  }, [])

  const handleEnrollClick = (workshop) => {
    if (!isSignedIn) {
      toast.error('Please sign in to enroll in workshops')
      return
    }
    setSelectedWorkshop(workshop)
    setShowEnrollmentForm(true)
  }

  const handleEnrollSubmit = async (workshopId, formData) => {
    try {
      const token = await getToken()
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'}/workshops/${workshopId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit enrollment')
      }
      
      await toast.promise(
        Promise.resolve(),
        {
          loading: 'Submitting your enrollment...',
          success: 'Enrollment submitted successfully! We\'ll contact you soon. 🎉',
          error: 'Failed to submit enrollment. Please try again.',
        }
      )
    } catch (error) {
      console.error('Failed to submit enrollment:', error)
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="pb-20 md:pb-16">
        {/* Hero Section */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4"
              style={{
                fontFamily: "'Dancing Script', cursive"
              }}>
                Workshops
              </h1>
              <div className="w-24 h-1 bg-[#F5E6E0] mx-auto mb-6"></div>
              <p className="text-xl md:text-2xl text-white/90 font-medium max-w-3xl mx-auto leading-relaxed"
              style={{
                fontFamily: "'Satisfy', cursive"
              }}>
                Join our intensive workshops and master new skills with expert guidance
              </p>
            </div>
          </div>
        </section>

        {/* Workshops Grid Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-2xl shadow-md p-6 border border-black/10 animate-pulse">
                    <div className="h-40 bg-black/10 rounded-xl mb-4"></div>
                    <div className="h-6 bg-black/10 rounded mb-2"></div>
                    <div className="h-4 bg-black/10 rounded w-3/4 mb-4"></div>
                    <div className="h-4 bg-black/10 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {workshops.map((workshop) => (
                  <WorkshopCard 
                    key={workshop._id} 
                    workshop={workshop}
                    onEnrollClick={handleEnrollClick}
                  />
                ))}
              </div>
            )}

            {workshops.length === 0 && !loading && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🎓</div>
                <h3 className="text-xl font-bold text-black mb-2">No workshops available</h3>
                <p className="text-black/70 font-medium">Check back later for upcoming workshops.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {showEnrollmentForm && selectedWorkshop && (
        <EnrollmentForm
          workshop={selectedWorkshop}
          onClose={() => {
            setShowEnrollmentForm(false)
            setSelectedWorkshop(null)
          }}
          onSubmit={handleEnrollSubmit}
        />
      )}

      <Footer />
    </div>
  )
}

