import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../lib/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import aditiProfileImage01 from '../assets/profileImages/image1.jpg'

// Static teachers data
const staticTeachers = [
  {
    id: 1,
    name: 'Aditi Kandya',
    instrument: 'Piano & Vocals',
    description: 'A pianist, classical vocalist, and passionate music educator. With years of training and a deep love for music, I bring expertise in both Western classical piano (ABRSM Grade 8) and Indian classical vocals.',
    image: aditiProfileImage01
  },
  {
    id: 2,
    name: 'Expert Instructor',
    instrument: 'Guitar & Drums',
    description: 'An experienced musician and educator specializing in guitar and drums. Dedicated to helping students discover their musical potential through personalized instruction and innovative teaching methods.',
    image: aditiProfileImage01 // You can replace this with another image
  }
]

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
    <div className="min-h-screen">
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
                Meet Your Teacher
              </h1>
              <div className="w-24 h-1 bg-[#F5F5DC] mx-auto"></div>
            </div>
          </div>
        </section>

        {/* Teachers Section - Alternating Layout */}
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-0">
            <div
                    
                    className={`flex flex-col ${'md:flex-row-reverse'} min-h-[600px] md:min-h-[700px]`}
                  >
                    {/* Image Section - No rounded corners */}
                    <div className="w-full md:w-1/2 flex-shrink-0 relative bg-slate-900">
                      <img
                        src={aditiProfileImage01}
                        alt={`Aditi Kandya`}
                        className="w-full h-full object-cover"
                        style={{ 
                          minHeight: '600px',
                          maxHeight: '700px'
                        }}
                        onError={(e) => {
                          e.target.src = aditiProfileImage01
                        }}
                      />
                    </div>
                    
                    {/* Content Section */}
                    <div className="w-full md:w-1/2 flex-shrink-0 bg-black flex items-center">
                      <div className="p-8 md:p-12 lg:p-16 w-full">
                        <h2 className="text-4xl md:text-5xl lg:text-6xl font-cinema font-bold text-white mb-6 md:mb-8"
                        style={{
                          fontFamily: "'Dancing Script', cursive"
                        }}>
                        Aditi Kandya
                        </h2>
                        <p className="text-xl md:text-2xl text-white/90 font-medium mb-6 md:mb-8"
                          style={{
                            fontFamily: "'Satisfy', cursive"
                          }}
                        >
                        Pianist, Vocalist & Music Educator
                        </p>
                        <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 md:mb-10"
                          style={{
                            fontFamily: "'Bitter', serif"
                          }}
                        >
                          Hi, I'm Aditi Kandya — a pianist, classical vocalist, and passionate music educator. With years of training and a deep love for music, I have completed ABRSM Grade 8 in Piano and am also a trained Indian classical vocalist. My learning journey has taken me beyond performance and teaching.
                        </p>
                        <button
                          onClick={() => {
                            setShowConsultationForm(true)
                            setTimeout(() => {
                              nameInputRef.current?.focus()
                            }, 100)
                          }}
                          className="px-8 py-4 bg-white text-black hover:bg-white/90 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          CONTACT US
                        </button>
                      </div>
                    </div>
                  </div>
            </div>
          </div>
        </section>

         {/* Teachers Section - Alternating Layout */}
         <section className="py-4 md:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-0">
            <div
                    
                    className={`flex flex-col ${'md:flex-row-reverse'} min-h-[600px] md:min-h-[700px]`}
                  >

                      {/* Content Section */}
                      <div className="w-full md:w-1/2 flex-shrink-0 bg-black flex items-center">
                      <div className="p-8 md:p-12 lg:p-16 w-full">
                         
              
                        <p className="text-base md:text-lg text-white/80 leading-relaxed mb-8 md:mb-10"
                          style={{
                            fontFamily: "'Bitter', serif"
                          }}
                        >
                          I have attended a 21-day summer course in composition at KM Music Conservatory, Chennai, and completed a 2-week intensive course in Sound Engineering, expanding my skills in both creative and technical aspects of music. My journey has taken me from being a curious learner to becoming a mentor who helps students of all ages discover the joy of playing and understanding music.
                        </p>
                        <button
                          onClick={() => {
                            setShowConsultationForm(true)
                            setTimeout(() => {
                              nameInputRef.current?.focus()
                            }, 100)
                          }}
                          className="px-8 py-4 bg-white text-black hover:bg-white/90 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                        >
                          CONTACT US
                        </button>
                      </div>
                    </div>

                    {/* Image Section - No rounded corners */}
                    <div className="w-full md:w-1/2 flex-shrink-0 relative bg-slate-900">
                      <img
                        src={aditiProfileImage01}
                        alt={`Aditi Kandya`}
                        className="w-full h-full object-cover"
                        style={{ 
                          minHeight: '600px',
                          maxHeight: '700px'
                        }}
                        onError={(e) => {
                          e.target.src = aditiProfileImage01
                        }}
                      />
                    </div>
                    
                  
                  </div>
            </div>
          </div>
        </section>

         

        {/* Teaching Philosophy */}
        <section className="py-8 md:py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-cinema font-bold text-center mb-12"
            style={{
              fontFamily: "'Dancing Script', cursive"
            }}>
              My Teaching Philosophy
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black text-white  shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">❤️</div>
                <h3 className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "'Satisfy', cursive"
                }}>Passion-Driven</h3>
                <p className="font-medium"
                style={{
                  fontFamily: "'Bitter', serif"
                }}>
                  Every lesson is infused with genuine love for music and dedication to student success.
                </p>
              </div>
              <div className="bg-black text-white shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "'Satisfy', cursive"
                }}>Goal-Oriented</h3>
                <p className="  font-medium"
                style={{
                  fontFamily: "'Bitter', serif"
                }}>
                  Clear, achievable milestones keep you motivated and steadily progressing.
                </p>
              </div>
              <div className="bg-black text-white shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "'Satisfy', cursive"
                }}>Balanced Approach</h3>
                <p className=" font-medium"style={{
                  fontFamily: "'Biiter', serif"
                }}>
                  Striking the perfect balance between structure and creativity in music learning.
                </p>
              </div>
              <div className="bg-black text-white shadow-xl p-8 border border-white/20">
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold mb-3"
                style={{
                  fontFamily: "'Satisfy', cursive"
                }}>Personal Growth</h3>
                <p className=" font-medium"style={{
                  fontFamily: "'Bitter', serif"
                }}>
                  Creating a safe space where mistakes are part of the journey, not something to fear.
                </p>
              </div>
            </div>
          </div>
        </section>
 

       

        {/* Contact Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-black rounded-2xl shadow-2xl p-8 md:p-12 border border-[#FFD700]/30 text-center">
              <h2 className="text-3xl md:text-4xl font-cinema font-bold text-white mb-6"
              style={{
                fontFamily: "'Dancing Script', cursive"
              }}>
                Let's Connect
              </h2>
              <p className="text-lg text-white/80 mb-8 font-medium"
              style={{
                fontFamily: "'Bitter', serif"
              }}>
                Ready to start your musical journey? Get in touch or follow my work on social media.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📍</div>
                  <h3 className="font-bold text-white mb-2"
                  style={{
                    fontFamily: "'Satisfy', cursive"
                  }}>Location</h3>
                  <p className="text-white/80 text-sm font-medium"
                  style={{
                    fontFamily: "'Bitter', serif"
                  }}>MusiNest Studio</p>
                  <p className="text-white/80 text-sm font-medium"
                  style={{
                    fontFamily: "'Bitter', serif"
                  }}>Chennai, India</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📞</div>
                  <h3 className="font-bold text-white mb-2"
                  style={{
                    fontFamily: "'Satisfy', cursive"
                  }}>Phone</h3>
                  <p className="text-white/80 text-sm font-medium"
                  style={{
                    fontFamily: "'Bitter', serif"
                  }}>+91 98765 43210</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <div className="text-3xl mb-3">📧</div>
                  <h3 className="font-bold text-white mb-2"
                  style={{
                    fontFamily: "'Satisfy', cursive"
                  }}>Email</h3>
                  <p className="text-white/80 text-sm font-medium"
                  style={{
                    fontFamily: "'Bitter', serif"
                  }}>aditi@musinest.com</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowConsultationForm(true)
                  setTimeout(() => {
                    nameInputRef.current?.focus()
                  }, 100)
                }}
                className="px-8 py-4 rounded-lg bg-[#F5E6E0] text-black hover:bg-[#FFC700] font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                style={{
                  fontFamily: "'Dancing Script', cursive"
                }}
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
