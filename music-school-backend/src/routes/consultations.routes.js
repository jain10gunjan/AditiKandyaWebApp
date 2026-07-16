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
app.post('/api/consultations', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, phone, preferredDate, preferredTime, message, type } = req.body || {}
  if (!name || !email || !phone || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const doc = await Consultation.create({
    name,
    email,
    phone,
    preferredDate,
    preferredTime,
    message: message || '',
    type: type || 'consultation',
    status: 'new'
  })
  res.status(201).json({ id: doc._id, message: 'Consultation request submitted' })
})

// Admin: list all consultations (newest first)

app.get('/api/admin/consultations', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Consultation.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: update consultation status

app.put('/api/admin/consultations/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const consultation = await Consultation.findByIdAndUpdate(
    req.params.id,
    { status: status || 'new' },
    { new: true }
  )
  if (!consultation) return res.status(404).json({ error: 'Consultation not found' })
  res.json(consultation)
})

// Admin: delete consultation

app.delete('/api/admin/consultations/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const consultation = await Consultation.findByIdAndDelete(req.params.id)
  if (!consultation) return res.status(404).json({ error: 'Consultation not found' })
  res.json({ message: 'Consultation deleted' })
})

// ==================== WORKSHOP ENDPOINTS ====================

// Public: get all active workshops
}

module.exports = register
