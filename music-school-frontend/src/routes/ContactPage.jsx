import { useState, useEffect } from 'react'
import { apiGet, apiPost } from '../lib/api.js'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

export default function ContactPage() {
  const [faqs, setFaqs] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  })
  const [openFaqIndex, setOpenFaqIndex] = useState(null)

  useEffect(() => {
    // Prevent hash scroll on page load
    if (window.location.hash) {
      const url = window.location.href.split('#')[0]
      window.history.replaceState(null, '', url)
    }
    
    // Scroll to top on page load - do this immediately
    window.scrollTo(0, 0)
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
    
    // Load FAQs
    apiGet('/faqs').then(setFaqs).catch(() => setFaqs([]))
  }, [])

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
    if (!phone || phone.trim().length === 0) return null // Optional
    const cleaned = phone.replace(/[\s\-+]/g, '')
    if (!/^\d{10,15}$/.test(cleaned)) return 'Please enter a valid phone number'
    return null
  }

  const validateSubject = (subject) => {
    if (!subject || subject.trim().length === 0) return 'Subject is required'
    if (subject.trim().length < 3) return 'Subject must be at least 3 characters'
    return null
  }

  const validateMessage = (message) => {
    if (!message || message.trim().length === 0) return 'Message is required'
    if (message.trim().length < 10) return 'Message must be at least 10 characters'
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
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
      case 'subject':
        error = validateSubject(value)
        break
      case 'message':
        error = validateMessage(value)
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
      subject: true,
      message: true
    })
    
    const currentErrors = {}
    const nameError = validateName(formData.name)
    if (nameError) currentErrors.name = nameError
    const emailError = validateEmail(formData.email)
    if (emailError) currentErrors.email = emailError
    const phoneError = validatePhone(formData.phone)
    if (phoneError) currentErrors.phone = phoneError
    const subjectError = validateSubject(formData.subject)
    if (subjectError) currentErrors.subject = subjectError
    const messageError = validateMessage(formData.message)
    if (messageError) currentErrors.message = messageError
    
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
        subject: formData.subject.trim(),
        message: formData.message.trim()
      }
      
      await toast.promise(
        apiPost('/contact', payload),
        {
          loading: 'Sending your message...',
          success: 'Message sent successfully! We\'ll get back to you soon. 🎉',
          error: 'Failed to send message. Please try again.',
        }
      )
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      })
      setErrors({})
      setTouched({})
      
    } catch (error) {
      console.error('Failed to submit contact form:', error)
    } finally {
      setSubmitting(false)
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
              <h1 className="text-4xl md:text-6xl font-cinema font-bold text-white mb-4">
                Contact Us
              </h1>
              <p className="text-xl text-white/80 font-medium">
                Get in touch with us. We're here to help!
              </p>
              <div className="w-24 h-1 bg-[#FFD700] mx-auto mt-6"></div>
            </div>
          </div>
        </section>

        {/* Contact Info & Timings */}
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30 text-center">
                <div className="text-5xl mb-4">📍</div>
                <h3 className="text-xl font-bold text-white mb-3">Location</h3>
                <p className="text-white/80 font-medium">MusiNest Studio</p>
                <p className="text-white/80 font-medium">Chennai, India</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30 text-center">
                <div className="text-5xl mb-4">📞</div>
                <h3 className="text-xl font-bold text-white mb-3">Phone</h3>
                <p className="text-white/80 font-medium">+91 98765 43210</p>
                <p className="text-white/70 text-sm font-medium mt-2">Mon-Sat: 9 AM - 7 PM</p>
              </div>
              <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30 text-center">
                <div className="text-5xl mb-4">📧</div>
                <h3 className="text-xl font-bold text-white mb-3">Email</h3>
                <p className="text-white/80 font-medium">aditi@musinest.com</p>
                <p className="text-white/70 text-sm font-medium mt-2">support@themusinest.com</p>
              </div>
            </div>

            {/* Timings */}
            <div className="bg-black rounded-2xl shadow-xl p-8 border border-[#FFD700]/30">
              <h2 className="text-2xl font-bold text-white mb-6 text-center">Studio Timings</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <h3 className="text-lg font-bold text-white mb-3">Weekdays</h3>
                  <p className="text-white/80 font-medium">Monday - Friday</p>
                  <p className="text-[#FFD700] font-bold text-lg">9:00 AM - 7:00 PM</p>
                </div>
                <div className="bg-white/10 rounded-xl p-6 border border-[#FFD700]/30">
                  <h3 className="text-lg font-bold text-white mb-3">Weekends</h3>
                  <p className="text-white/80 font-medium">Saturday - Sunday</p>
                  <p className="text-[#FFD700] font-bold text-lg">10:00 AM - 6:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form & FAQs */}
        <section className="bg-black py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl font-cinema font-bold text-white mb-6">Send Us a Message</h2>
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 lg:p-8 border border-white/20" noValidate>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-bold text-black mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
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

                  <div className="mb-4">
                    <label htmlFor="email" className="block text-sm font-bold text-black mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
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

                  <div className="mb-4">
                    <label htmlFor="phone" className="block text-sm font-bold text-black mb-2">
                      Phone <span className="text-black/60 text-xs font-normal">(Optional)</span>
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="+91 98765 43210"
                      className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                        errors.phone && touched.phone
                          ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : formData.phone && !errors.phone
                          ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                          : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      }`}
                    />
                    {errors.phone && touched.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {errors.phone}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <label htmlFor="subject" className="block text-sm font-bold text-black mb-2">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="What is this regarding?"
                      className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium ${
                        errors.subject && touched.subject
                          ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : formData.subject && !errors.subject
                          ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                          : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      }`}
                      required
                    />
                    {errors.subject && touched.subject && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {errors.subject}
                      </p>
                    )}
                  </div>

                  <div className="mb-6">
                    <label htmlFor="message" className="block text-sm font-bold text-black mb-2">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="Tell us how we can help..."
                      rows="5"
                      className={`w-full border rounded-lg p-3 transition-all duration-200 bg-white font-medium resize-none ${
                        errors.message && touched.message
                          ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                          : formData.message && !errors.message
                          ? 'border-[#FFD700] bg-[#FFD700]/5 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                          : 'border-black/20 focus:ring-2 focus:ring-[#FFD700] focus:border-[#FFD700]'
                      }`}
                      required
                    />
                    {errors.message && touched.message && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <span>⚠️</span> {errors.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full px-6 py-3 rounded-lg font-bold transition-all duration-300 shadow-lg ${
                      submitting
                        ? 'bg-black text-white cursor-not-allowed'
                        : 'bg-[#FFD700] text-black hover:bg-[#FFC700] hover:shadow-xl active:scale-95'
                    }`}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </div>

              {/* FAQs */}
              <div>
                <h2 className="text-3xl font-cinema font-bold text-white mb-6">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {faqs.length > 0 ? (
                    faqs.map((faq, index) => (
                      <div key={faq._id || index} className="bg-white rounded-xl shadow-lg border border-white/20 overflow-hidden">
                        <button
                          onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
                        >
                          <span className="font-bold text-black pr-4">{faq.question}</span>
                          <span className="text-2xl text-[#FFD700] flex-shrink-0">
                            {openFaqIndex === index ? '−' : '+'}
                          </span>
                        </button>
                        {openFaqIndex === index && (
                          <div className="px-6 pb-4">
                            <p className="text-black/70 font-medium leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-xl shadow-lg p-8 border border-white/20 text-center">
                      <p className="text-black/70 font-medium">No FAQs available at the moment.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

