import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../lib/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function TeachersPage() {
  const [showConsultationForm, setShowConsultationForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  })
  const nameInputRef = useRef(null)

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
    // Remove spaces, dashes, plus signs, and parentheses for validation
    const cleaned = phone.replace(/[\s\-+()]/g, '')
    if (!/^\d{10,15}$/.test(cleaned)) {
      return 'Please enter a valid phone number (10-15 digits)'
    }
    if (cleaned.length < 10) {
      return 'Phone number must have at least 10 digits'
    }
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    let processedValue = value
    
    // Format phone number as user types
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
    setTouched(prev => ({ ...prev, [name]: true }))
    
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
    
    setTouched({
      name: true,
      email: true,
      phone: true,
      preferredDate: true,
      preferredTime: true,
      message: true
    })
    
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
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime,
        message: formData.message.trim(),
        type: 'consultation'
      }
      
      await toast.promise(
        apiPost('/consultations', payload),
        {
          loading: 'Submitting your consultation request...',
          success: 'Consultation request submitted! We\'ll contact you soon. 🎉',
          error: 'Failed to submit request. Please try again.',
        }
      )
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
      })
      setErrors({})
      setTouched({})
      setShowConsultationForm(false)
      
    } catch (error) {
      console.error('Failed to submit consultation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    // Scroll to top on page load
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <main className="pb-20 md:pb-16">
        {/* Hero Section */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4">
                Meet Your Teacher
              </h1>
              <div className="w-24 h-1 bg-[#FFD700] mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Teacher Introduction */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black rounded-2xl shadow-2xl p-8 md:p-12 border border-[#FFD700]/30">
              <div className="text-center mb-8">
                <div className="w-48 h-48 md:w-56 md:h-56 rounded-full mx-auto mb-6 overflow-hidden border-4 border-[#FFD700]/50 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80" 
                    alt="Aditi Kandya" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white mb-4">
                  Hi, I'm Aditi Kandya
                </h2>
                <p className="text-xl text-white/90 font-medium mb-6">
                  A pianist, classical vocalist, and passionate music educator
                </p>
                <p className="text-lg text-white/80 leading-relaxed">
                  With years of training and a deep love for music, I have:
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">🎹</div>
                  <h3 className="text-xl font-bold text-white mb-2">Completed ABRSM Grade 8</h3>
                  <p className="text-white/80 font-medium">Piano certification</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">🎤</div>
                  <h3 className="text-xl font-bold text-white mb-2">Indian Classical Vocalist</h3>
                  <p className="text-white/80 font-medium">Trained in classical vocals</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Learning Journey */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white text-center mb-12">
              My Learning Journey
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🎓</div>
                <h3 className="text-2xl font-bold text-black mb-3">KM Music Conservatory</h3>
                <p className="text-black/70 font-medium">
                  Attended a 21-day summer course in Composition at KM Music Conservatory, Chennai
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🎚️</div>
                <h3 className="text-2xl font-bold text-black mb-3">Sound Engineering</h3>
                <p className="text-black/70 font-medium">
                  Completed a 2-week intensive course in Sound Engineering
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recognition & Achievements */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-black text-center mb-12">
              Recognition & Achievements
            </h2>
            <div className="bg-black rounded-2xl shadow-2xl p-8 border border-[#FFD700]/30">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-6 bg-white/10 rounded-xl border border-[#FFD700]/30">
                  <div className="text-4xl mb-3">🎹</div>
                  <div className="text-3xl font-bold text-[#FFD700] mb-2">ABRSM</div>
                  <div className="text-lg font-bold text-white mb-1">Grade 8</div>
                  <div className="text-sm text-white/80 font-medium">Piano certification</div>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-xl border border-[#FFD700]/30">
                  <div className="text-4xl mb-3">👥</div>
                  <div className="text-3xl font-bold text-[#FFD700] mb-2">50+</div>
                  <div className="text-lg font-bold text-white mb-1">Students</div>
                  <div className="text-sm text-white/80 font-medium">Taught across various ages</div>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-xl border border-[#FFD700]/30">
                  <div className="text-4xl mb-3">🎤</div>
                  <div className="text-3xl font-bold text-[#FFD700] mb-2">Indian</div>
                  <div className="text-lg font-bold text-white mb-1">Classical</div>
                  <div className="text-sm text-white/80 font-medium">Vocal training completed</div>
                </div>
                <div className="text-center p-6 bg-white/10 rounded-xl border border-[#FFD700]/30">
                  <div className="text-4xl mb-3">⏱️</div>
                  <div className="text-3xl font-bold text-[#FFD700] mb-2">4+</div>
                  <div className="text-lg font-bold text-white mb-1">Years</div>
                  <div className="text-sm text-white/80 font-medium">Teaching experience</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Teaching Philosophy */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white text-center mb-12">
              My Teaching Philosophy
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">❤️</div>
                <h3 className="text-2xl font-bold text-black mb-3">Passion-Driven</h3>
                <p className="text-black/70 font-medium">
                  Every lesson is infused with genuine love for music and dedication to student success.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold text-black mb-3">Goal-Oriented</h3>
                <p className="text-black/70 font-medium">
                  Clear, achievable milestones keep you motivated and steadily progressing.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-2xl font-bold text-black mb-3">Balanced Approach</h3>
                <p className="text-black/70 font-medium">
                  Striking the perfect balance between structure and creativity in music learning.
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold text-black mb-3">Personal Growth</h3>
                <p className="text-black/70 font-medium">
                  Creating a safe space where mistakes are part of the journey, not something to fear.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-black text-center mb-12">
              What My Students Say
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30">
                <div className="flex text-[#FFD700] mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-white/90 italic mb-6 font-medium leading-relaxed">
                  "Aditi's teaching method is incredible! I went from complete beginner to ABRSM Grade 3 in just 2 years. Her patience and expertise are unmatched!"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">Priya Sharma</div>
                    <div className="text-sm text-white/70 font-medium">Piano Student</div>
                  </div>
                </div>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30">
                <div className="flex text-[#FFD700] mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-white/90 italic mb-6 font-medium leading-relaxed">
                  "Learning Indian classical vocals from Aditi has been transformative. She makes complex ragas accessible and enjoyable for beginners."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">Arjun Patel</div>
                    <div className="text-sm text-white/70 font-medium">Vocal Student</div>
                  </div>
                </div>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30">
                <div className="flex text-[#FFD700] mb-4">
                  {'★'.repeat(5)}
                </div>
                <p className="text-white/90 italic mb-6 font-medium leading-relaxed">
                  "Aditi's Bollywood piano lessons are amazing! She breaks down complex songs into simple steps that anyone can follow."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <div className="font-bold text-white">Zara Khan</div>
                    <div className="text-sm text-white/70 font-medium">Bollywood Piano Student</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Musical Setup */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white text-center mb-12">
              My Musical Setup
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                <div className="text-5xl mb-4">🎹</div>
                <h3 className="text-xl font-bold text-black mb-3">Professional Piano</h3>
                <p className="text-black/70 font-medium">
                  Quality piano for classical and contemporary music learning
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-black mb-3">Learning Materials</h3>
                <p className="text-black/70 font-medium">
                  Comprehensive resources for ABRSM, Trinity, and RSL examinations
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-white/20 text-center">
                <div className="text-5xl mb-4">🎤</div>
                <h3 className="text-xl font-bold text-black mb-3">Vocal Training</h3>
                <p className="text-black/70 font-medium">
                  Indian classical vocal training and contemporary singing techniques
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black rounded-2xl shadow-2xl p-8 md:p-12 border border-[#FFD700]/30 text-center">
              <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white mb-6">
                Let's Connect
              </h2>
              <p className="text-lg text-white/80 mb-8 font-medium">
                Ready to start your musical journey? Get in touch or follow my work on social media.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📍</div>
                  <h3 className="font-bold text-white mb-2">Location</h3>
                  <p className="text-white/80 text-sm font-medium">MusiNest Studio</p>
                  <p className="text-white/80 text-sm font-medium">Chennai, India</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📞</div>
                  <h3 className="font-bold text-white mb-2">Phone</h3>
                  <p className="text-white/80 text-sm font-medium">+91 98765 43210</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📧</div>
                  <h3 className="font-bold text-white mb-2">Email</h3>
                  <p className="text-white/80 text-sm font-medium">aditi@musinest.com</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowConsultationForm(true)
                  setTimeout(() => {
                    nameInputRef.current?.focus()
                  }, 100)
                }}
                className="px-8 py-4 rounded-lg bg-[#FFD700] text-black hover:bg-[#FFC700] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Book a Consultation
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Consultation Form Modal */}
      {showConsultationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#FFD700]/30">
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-cinema font-bold text-black">Book a Consultation</h2>
              <button
                onClick={() => {
                  setShowConsultationForm(false)
                  setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    preferredDate: '',
                    preferredTime: '',
                    message: ''
                  })
                  setErrors({})
                  setTouched({})
                }}
                className="text-black/70 hover:text-black text-2xl"
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
              <div>
                <label htmlFor="consult-name" className="block text-sm font-bold text-black mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  ref={nameInputRef}
                  id="consult-name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Your full name"
                  className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                    errors.name && touched.name
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                      : formData.name && !errors.name
                      ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                  }`}
                  required
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="consult-email" className="block text-sm font-bold text-black mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="consult-email"
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
                      ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                  }`}
                  required
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="consult-phone" className="block text-sm font-bold text-black mb-2">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  id="consult-phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+91 98765 43210"
                  maxLength={17}
                  className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                    errors.phone && touched.phone
                      ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                      : formData.phone && !errors.phone
                      ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                  }`}
                  required
                />
                {errors.phone && touched.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.phone}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="consult-date" className="block text-sm font-bold text-black mb-2">
                    Preferred Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="consult-date"
                    name="preferredDate"
                    type="date"
                    value={formData.preferredDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                      touched.preferredDate && !formData.preferredDate
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : formData.preferredDate
                        ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                        : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                    }`}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="consult-time" className="block text-sm font-bold text-black mb-2">
                    Preferred Time <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="consult-time"
                    name="preferredTime"
                    value={formData.preferredTime}
                    onChange={handleChange}
                    className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                      touched.preferredTime && !formData.preferredTime
                        ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                        : formData.preferredTime
                        ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                        : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                    }`}
                    required
                  >
                    <option value="">Select time</option>
                    <option value="9:00 AM - 10:00 AM">9:00 AM - 10:00 AM</option>
                    <option value="10:00 AM - 11:00 AM">10:00 AM - 11:00 AM</option>
                    <option value="11:00 AM - 12:00 PM">11:00 AM - 12:00 PM</option>
                    <option value="12:00 PM - 1:00 PM">12:00 PM - 1:00 PM</option>
                    <option value="2:00 PM - 3:00 PM">2:00 PM - 3:00 PM</option>
                    <option value="3:00 PM - 4:00 PM">3:00 PM - 4:00 PM</option>
                    <option value="4:00 PM - 5:00 PM">4:00 PM - 5:00 PM</option>
                    <option value="5:00 PM - 6:00 PM">5:00 PM - 6:00 PM</option>
                    <option value="6:00 PM - 7:00 PM">6:00 PM - 7:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="consult-message" className="block text-sm font-bold text-black mb-2">
                  Message <span className="text-black/60 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  id="consult-message"
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
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowConsultationForm(false)
                    setFormData({
                      name: '',
                      email: '',
                      phone: '',
                      preferredDate: '',
                      preferredTime: '',
                      message: ''
                    })
                    setErrors({})
                    setTouched({})
                  }}
                  className="px-6 py-3 rounded-lg font-bold bg-black/10 text-black hover:bg-black/20 transition-all duration-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
