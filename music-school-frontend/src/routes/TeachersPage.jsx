import { useState, useRef, useEffect } from 'react'
import { apiPost } from '../lib/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import aditiProfileImage01 from '../assets/profileImages/image1.jpg'
import aditiProfileImage02 from '../assets/profileImages/image2.jpg'


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
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="pb-0">
        {/* Hero Section with Large Portrait */}

  {/* About the Teacher Section */}
  <section className="bg-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src={aditiProfileImage01}
                  alt="Aditi Kandya"
                  className="w-full h-[600px] object-cover rounded-lg"
                />
              </div>
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-black mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Hello I'M <br/> ADITI KANDYA
                </h2>
                <p className="text-lg text-black/80 mb-8 leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  Hi, I'm Aditi Kandya — a pianist, classical vocalist, and passionate music educator. With years of training and a deep love for music, I have completed ABRSM Grade 8 in Piano and am also a trained Indian classical vocalist. My learning journey has taken me beyond performance and teaching.
                </p>
                <p className="text-lg text-black/80 mb-8 leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  I have attended a 21-day summer course in composition at KM Music Conservatory, Chennai, and completed a 2-week intensive course in Sound Engineering, expanding my skills in both creative and technical aspects of music.
                </p>
                <div className="grid grid-cols-3 gap-6 mt-12">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                      +4
                    </div>
                    <div className="text-sm text-black/70" style={{ fontFamily: "'Satisfy', cursive" }}>
                      DEDICATED YEARS OF TEACHING
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                      50+
                    </div>
                    <div className="text-sm text-black/70" style={{ fontFamily: "'Satisfy', cursive" }}>
                      LIVES CHANGED WITH MY PROGRAM
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-black mb-2" style={{ fontFamily: "'Dancing Script', cursive" }}>
                      100%
                    </div>
                    <div className="text-sm text-black/70" style={{ fontFamily: "'Satisfy', cursive" }}>
                      SATISFACTION RATE OF MY STUDENTS
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
       
 {/* Services Section */}
 <section className=" py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12" style={{ fontFamily: "'Cinzel', serif" }}>
              MY SERVICES
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <div className="bg-gray-100 rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  PIANO & KEYBOARD COACHING
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
                  Structured ABRSM curriculum from Grades 1-8, covering Western classical, Bollywood, and contemporary styles
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  VOCAL TRAINING & DIRECTION
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
                  Indian classical vocal training with traditional ragas, tala patterns, and classical compositions
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  MUSIC THEORY & PERFORMANCE
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
                  Comprehensive music theory, composition skills, and stage presence development
                </p>
              </div>
              <div className="bg-white rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  One on One Coaching
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
                Experience personalized music education tailored to your unique learning style and goals.
                 </p>
              </div>
              <div className="bg-white rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Exam Preparation & Guidance.
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
               Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tempore laudantium accusamus voluptas, molestias qui officiis voluptate cumque asperiores dignissimos animi.
                 </p>
              </div>
              <div className="bg-white rounded-lg p-8 border border-[#F5E6E0]/30">
                
                <h3 className="text-xl font-bold text-black mb-3" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  Live Recital & Workshops.
                </h3>
                <p className="text-black/70 text-sm" style={{ fontFamily: "'Satisfy', cursive" }}>
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Aperiam, commodi! Possimus officia beatae ipsam, voluptas obcaecati totam incidunt.
                 </p>
              </div>
              
            </div>
            <div className="text-center">
              <button
                onClick={() => {
                  setShowConsultationForm(true)
                  setTimeout(() => {
                    nameInputRef.current?.focus()
                  }, 100)
                }}
                className="px-8 py-4 bg-white text-black hover:bg-black hover:text-white font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl border-2 border-black"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                Get In Touch
              </button>
            </div>
          </div>
        </section>


        {/* Inspirational Quote & Philosophy Section */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-8 leading-tight" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  You are NOT TOO MUCH YOU'RE MORE THAN ENOUGH
                </h2>
                <p className="text-lg text-black/80 mb-6 leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  At MusiNest, we believe every student has unique musical potential waiting to be discovered. My teaching approach combines rigorous ABRSM training with creative exploration, helping you build strong foundations while expressing your authentic voice.
                </p>
                <p className="text-lg text-black/80 mb-8 leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  Whether you're a curious beginner or an aspiring performer, I create a warm, encouraging space where mistakes are part of the journey, not something to fear. Together, we'll make music learning personal, joyful, and confidence-building.
                </p>
                <button
                  onClick={() => {
                    setShowConsultationForm(true)
                    setTimeout(() => {
                      nameInputRef.current?.focus()
                    }, 100)
                  }}
                  className="px-8 py-4 bg-black text-white hover:bg-black/90 font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  GET IN TOUCH
                </button>
              </div>
              <div>
                <img
                  src="https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80"
                  alt="Music education"
                  className="w-full h-[500px] object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </section>

       

      

        {/* One-on-One Coaching Section
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <img
                  src="https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80"
                  alt="Music lesson"
                  className="w-full h-[400px] object-cover rounded-lg mb-6"
                />
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6" style={{ fontFamily: "'Dancing Script', cursive" }}>
                  ONE-ON-ONE MUSIC COACHING
                </h2>
                <p className="text-lg text-white/80 mb-8 leading-relaxed" style={{ fontFamily: "'Bitter', serif" }}>
                  Experience personalized music education tailored to your unique learning style and goals. Each session is designed to help you progress at your own pace while building strong technical foundations and creative expression.
                </p>
                <button
                  onClick={() => {
                    setShowConsultationForm(true)
                    setTimeout(() => {
                      nameInputRef.current?.focus()
                    }, 100)
                  }}
                  className="px-8 py-4 bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] font-bold text-lg transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ fontFamily: "'Dancing Script', cursive" }}
                >
                  BOOK NOW
                </button>
              </div>
              <div>
                <img
                  src={aditiProfileImage01}
                  alt="Aditi Kandya"
                  className="w-full h-[600px] object-cover rounded-lg"
                />
              </div>
            </div>
          </div>
        </section> */}

       


       
      </main>

      {/* Consultation Form Modal */}
      {showConsultationForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#F5E6E0]/30">
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-black" style={{ fontFamily: "'Dancing Script', cursive" }}>Book a Consultation</h2>
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
                <label htmlFor="consult-name" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
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
                      ? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                  }`}
                  style={{ fontFamily: "'Bitter', serif" }}
                  required
                />
                {errors.name && touched.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="consult-email" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
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
                      ? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                  }`}
                  style={{ fontFamily: "'Bitter', serif" }}
                  required
                />
                {errors.email && touched.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="consult-phone" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
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
                      ? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                      : 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                  }`}
                  style={{ fontFamily: "'Bitter', serif" }}
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
                  <label htmlFor="consult-date" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
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
                        ? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                        : 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                    }`}
                    style={{ fontFamily: "'Bitter', serif" }}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="consult-time" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
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
                        ? 'border-[#F5E6E0] bg-[#F5E6E0]/5 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                        : 'border-black/20 focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0]'
                    }`}
                    style={{ fontFamily: "'Bitter', serif" }}
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
                <label htmlFor="consult-message" className="block text-sm font-bold text-black mb-2" style={{ fontFamily: "'Satisfy', cursive" }}>
                  Message <span className="text-black/60 text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  id="consult-message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Any additional information or questions..."
                  rows="4"
                  className="w-full border border-black/20 rounded-lg p-3 transition-all duration-200 bg-white font-medium focus:ring-2 focus:ring-[#F5E6E0] focus:border-[#F5E6E0] resize-none"
                  style={{ fontFamily: "'Bitter', serif" }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg ${
                    submitting
                      ? 'bg-black text-white cursor-not-allowed'
                      : 'bg-[#F5E6E0] text-black hover:bg-[#E8D5CC] hover:shadow-xl active:scale-95'
                  }`}
                  style={{ fontFamily: "'Dancing Script', cursive" }}
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
                  style={{ fontFamily: "'Dancing Script', cursive" }}
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
