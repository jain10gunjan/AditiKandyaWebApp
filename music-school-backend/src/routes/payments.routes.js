const deps = require('./deps')
const {
  fs,
  path,
  crypto,
  Razorpay,
  Course,
  Teacher,
  Enrollment,
  Payment,
  Attendance,
  Token,
  Testimonial,
  Schedule,
  Resource,
  Lead,
  Contact,
  FAQ,
  Consultation,
  Workshop,
  WorkshopEnrollment,
  DynamicPricing,
  Progress,
  FreeResourceTracking,
  isDbConnected,
  env,
  ADMIN_EMAILS,
  uploadsDir,
  requireAuthGuarded,
  requireAdmin,
  clerkClient,
  hasClerk,
  upload,
  decompressFileIfNeeded,
  getLessonFromCourse,
  isUserEnrolled,
  getUserEmail,
  findTokenRecord,
  updateTokensForAttendance,
  razorKeyId,
  razorKeySecret,
  hasRazorEnv,
} = deps
function register(app) {
app.get('/api/payments/key', (req, res) => {
  if (!razorKeyId) return res.status(501).json({ error: 'Razorpay key not configured' })
  res.json({ key: razorKeyId })
})

app.post('/api/payments/order', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, userHint } = req.body || {}
  if (!courseId) return res.status(400).json({ error: 'Missing courseId' })
  const course = await Course.findById(courseId)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const amount = course.price * 100
  if (!hasRazorEnv) return res.status(501).json({ error: 'Razorpay not configured' })
  const razor = new Razorpay({ key_id: razorKeyId, key_secret: razorKeySecret })
  const order = await razor.orders.create({ amount, currency: 'INR' })
  const userId = (req.auth && req.auth.userId) || userHint || 'guest'
  await Payment.create({ userId, courseId, orderId: order.id, amount, status: 'created' })
  res.json(order)
})

app.post('/api/payments/verify', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature, userHint } = req.body || {}
  if (!courseId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'Missing fields' })
  if (!hasRazorEnv) return res.status(501).json({ error: 'Razorpay not configured' })
  const expected = crypto
    .createHmac('sha256', razorKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  const valid = expected === razorpay_signature
  await Payment.findOneAndUpdate(
    { orderId: razorpay_order_id },
    { paymentId: razorpay_payment_id, signature: razorpay_signature, status: valid ? 'paid' : 'invalid' }
  )
  if (valid) {
    const userId = (req.auth && req.auth.userId) || userHint || 'guest'
    await Enrollment.create({ name: 'Online Checkout', email: '', instrument: '', userId, courseId, paymentId: razorpay_payment_id, approved: false })
  }
  res.json({ valid })
})

// Frontend-only fallback: record a successful payment without server-side verification

app.post('/api/payments/record', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, paymentId, orderId, amount, userHint } = req.body || {}
  if (!courseId || !paymentId) return res.status(400).json({ error: 'Missing fields' })
  const userId = (req.auth && req.auth.userId) || userHint || 'guest'
  await Payment.create({ userId, courseId, orderId: orderId || 'frontend', paymentId, amount: Number(amount || 0), status: 'paid' })
  await Enrollment.create({ name: 'Frontend Payment', email: '', instrument: '', userId, courseId, paymentId, approved: false })
  res.json({ ok: true })
})

// Free enroll (no payment) -> pending approval
}

module.exports = register
