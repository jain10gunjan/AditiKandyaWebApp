import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useUser } from '@clerk/clerk-react'
import { apiGet, apiPost } from '../lib/api.js'

export default function CheckoutPage() {
  const { isSignedIn } = useUser()
  const { getToken } = useAuth()
  const navigate = useNavigate()
  const params = new URLSearchParams(useLocation().search)
  const courseId = params.get('courseId')
  const [course, setCourse] = useState(null)

  useEffect(() => {
    apiGet('/courses').then((list) => setCourse(list.find((c) => c._id === courseId) || null))
  }, [courseId])

  const handlePay = async () => {
    if (!isSignedIn) return alert('Please sign in')
    const token = await getToken({ template: 'default' }).catch(() => undefined)
    const user = window.Clerk?.user
    const userHint = user?.id
    if (Number(course.price || 0) === 0) {
      await apiPost(`/courses/${courseId}/free-enroll`, {}, token)
      alert('Request sent. Waiting for admin approval.')
      navigate('/dashboard')
      return
    }
    try {
      const order = await apiPost('/payments/order', { courseId, userHint }, token)
      const keyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/key`)
      const { key } = await keyRes.json()
      const options = {
        key,
        amount: order.amount,
        currency: 'INR',
        name: 'Youth Music Academy',
        description: course.title,
        order_id: order.id,
        handler: async function (response) {
          await apiPost('/payments/verify', { courseId, userHint, ...response }, token)
          alert('Payment successful! Awaiting admin approval.')
          navigate('/dashboard')
        },
        theme: { color: '#0284c7' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      // Frontend-only fallback: no order_id
      const keyRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/payments/key`)
      const { key } = await keyRes.json()
      const options = {
        key,
        amount: Number(course.price) * 100,
        currency: 'INR',
        name: 'Youth Music Academy',
        description: course.title,
        handler: async function (response) {
          await apiPost('/payments/record', { courseId, userHint, paymentId: response.razorpay_payment_id, amount: Number(course.price) * 100 }, token)
          alert('Payment recorded! Awaiting admin approval.')
          navigate('/dashboard')
        },
        theme: { color: '#0284c7' },
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    }
  }

  const handleDemoEnroll = async () => {
    const name = prompt('Your name?')
    const email = prompt('Your email?')
    if (!name || !email) return
    await apiPost('/demo/enroll', { courseId, name, email })
    alert('Enrollment created (demo).')
    navigate('/')
  }

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [])

  if (!course) return <div className="p-8">Loading...</div>
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-pink-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Checkout</h1>
        <div className="mt-6 bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-lg">{course.title}</div>
              <div className="text-slate-600">{course.level}</div>
            </div>
            <div className="text-2xl text-sky-700 font-extrabold">₹{course.price}</div>
          </div>
          <div className="mt-6 flex gap-3">
            <button onClick={handlePay} className="px-5 py-3 rounded-full bg-sky-600 text-white hover:bg-sky-700">Pay with Razorpay</button>
          </div>
        </div>
      </div>
    </div>
  )
}


