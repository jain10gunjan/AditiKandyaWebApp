import { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPut, apiDelete } from '../lib/api'
import toast from 'react-hot-toast'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'

function AdminGuard({ children }) {
  const { user, isLoaded } = useUser()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (isLoaded) {
      if (user?.emailAddresses?.[0]?.emailAddress === 'themusinest@gmail.com') {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
      setChecking(false)
    }
  }, [user, isLoaded])

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-6">You don't have permission to access the admin panel.</p>
          <a href="/" className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors">
            Go Home
          </a>
        </div>
      </div>
    )
  }

  return children
}

function DynamicPricingPage() {
  const { getToken } = useAuth()
  const [courses, setCourses] = useState([])
  const [pricing, setPricing] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingPricing, setEditingPricing] = useState(null)
  const [formData, setFormData] = useState({
    region: '',
    country: '',
    timezone: '',
    currency: 'USD',
    price: '',
    isActive: true
  })

  const regions = [
    { value: 'US', label: 'United States', currency: 'USD' },
    { value: 'IN', label: 'India', currency: 'INR' },
    { value: 'EU', label: 'Europe', currency: 'EUR' },
    { value: 'GB', label: 'United Kingdom', currency: 'GBP' },
    { value: 'ASIA', label: 'Asia Pacific', currency: 'USD' },
    { value: 'OCEANIA', label: 'Oceania', currency: 'AUD' },
    { value: 'CA', label: 'Canada', currency: 'CAD' },
  ]

  const currencies = {
    'US': 'USD',
    'IN': 'INR',
    'EU': 'EUR',
    'GB': 'GBP',
    'ASIA': 'USD',
    'OCEANIA': 'AUD',
    'CA': 'CAD',
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const token = await getToken()
      
      const [coursesData, pricingData] = await Promise.all([
        apiGet('/courses', token),
        apiGet('/pricing', token)
      ])
      
      setCourses(coursesData || [])
      setPricing(pricingData || [])
    } catch (error) {
      console.error('Failed to load data:', error)
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleRegionChange = (region) => {
    setFormData({
      ...formData,
      region,
      currency: currencies[region] || 'USD',
      country: region === 'US' ? 'US' : region === 'IN' ? 'IN' : region
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const token = await getToken()
      const courseId = selectedCourse || formData.courseId
      
      if (!courseId) {
        toast.error('Please select a course')
        return
      }

      if (editingPricing) {
        await apiPut(`/pricing/${editingPricing._id}`, formData, token)
        toast.success('Pricing updated successfully!')
      } else {
        await apiPost(`/courses/${courseId}/pricing`, formData, token)
        toast.success('Pricing created successfully!')
      }
      
      setShowForm(false)
      setEditingPricing(null)
      setFormData({
        region: '',
        country: '',
        timezone: '',
        currency: 'USD',
        price: '',
        isActive: true
      })
      loadData()
    } catch (error) {
      console.error('Failed to save pricing:', error)
      toast.error('Failed to save pricing')
    }
  }

  const handleEdit = (pricingItem) => {
    setEditingPricing(pricingItem)
    setSelectedCourse(pricingItem.courseId)
    setFormData({
      region: pricingItem.region,
      country: pricingItem.country || pricingItem.region,
      timezone: pricingItem.timezone || '',
      currency: pricingItem.currency || 'USD',
      price: pricingItem.price,
      isActive: pricingItem.isActive !== undefined ? pricingItem.isActive : true
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this pricing?')) return
    
    try {
      const token = await getToken()
      await apiDelete(`/pricing/${id}`, token)
      toast.success('Pricing deleted successfully!')
      loadData()
    } catch (error) {
      console.error('Failed to delete pricing:', error)
      toast.error('Failed to delete pricing')
    }
  }

  const handleNewPricing = (courseId) => {
    setSelectedCourse(courseId)
    setEditingPricing(null)
    setFormData({
      region: '',
      country: '',
      timezone: '',
      currency: 'USD',
      price: '',
      isActive: true
    })
    setShowForm(true)
  }

  const getCourseName = (courseId) => {
    const course = courses.find(c => c._id === courseId)
    return course?.title || 'Unknown Course'
  }

  const getPricingForCourse = (courseId) => {
    return pricing.filter(p => p.courseId === courseId)
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-pink-50">
        <Navbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Dynamic Pricing Management</h1>
            <p className="text-slate-600">Manage region-based pricing for your courses</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Courses List */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Courses</h2>
                <div className="space-y-4">
                  {courses.map((course) => {
                    const coursePricing = getPricingForCourse(course._id)
                    return (
                      <div key={course._id} className="border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900">{course.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">
                              Default Price: ₹{course.price?.toLocaleString() || 0}
                            </p>
                          </div>
                          <button
                            onClick={() => handleNewPricing(course._id)}
                            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium"
                          >
                            Add Pricing
                          </button>
                        </div>
                        
                        {coursePricing.length > 0 && (
                          <div className="mt-4 space-y-2">
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">Region Pricing:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {coursePricing.map((p) => (
                                <div key={p._id} className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-slate-900">{p.region}</div>
                                    <div className="text-sm text-slate-600">
                                      {p.currency === 'USD' ? '$' : p.currency === 'INR' ? '₹' : p.currency === 'EUR' ? '€' : p.currency}
                                      {p.price?.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEdit(p)}
                                      className="px-2 py-1 bg-sky-100 text-sky-700 rounded text-xs hover:bg-sky-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDelete(p._id)}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Pricing Form Modal */}
          {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {editingPricing ? 'Edit Pricing' : 'Add New Pricing'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingPricing(null)
                      setSelectedCourse(null)
                    }}
                    className="text-slate-500 hover:text-slate-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Course
                    </label>
                    <select
                      value={selectedCourse || ''}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                      disabled={!!editingPricing}
                    >
                      <option value="">Select a course</option>
                      {courses.map((course) => (
                        <option key={course._id} value={course._id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Region *
                    </label>
                    <select
                      value={formData.region}
                      onChange={(e) => handleRegionChange(e.target.value)}
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select region</option>
                      {regions.map((region) => (
                        <option key={region.value} value={region.value}>
                          {region.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Country Code
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
                        placeholder="US, IN, etc."
                        className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                        maxLength={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="INR">INR (₹)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                        <option value="AUD">AUD (A$)</option>
                        <option value="CAD">CAD (C$)</option>
                        <option value="JPY">JPY (¥)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Timezone (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.timezone}
                      onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                      placeholder="America/New_York, Asia/Kolkata, etc."
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Price *
                    </label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-slate-700">
                      Active
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                    >
                      {editingPricing ? 'Update Pricing' : 'Create Pricing'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false)
                        setEditingPricing(null)
                        setSelectedCourse(null)
                      }}
                      className="px-6 py-3 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </AdminGuard>
  )
}

export default DynamicPricingPage

