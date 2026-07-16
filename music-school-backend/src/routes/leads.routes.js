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
app.post('/api/leads', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { fullName, email, whatsapp, country, courseId, courseTitle } = req.body || {}
  if (!fullName || !email) return res.status(400).json({ error: 'Missing required fields' })
  const doc = await Lead.create({ 
    fullName, 
    email, 
    whatsapp: whatsapp || '', 
    country: country || '',
    courseId: courseId || '',
    courseTitle: courseTitle || ''
  })
  res.status(201).json({ id: doc._id, message: 'Lead captured' })
})

// Admin: list all leads (newest first)

app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Lead.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: delete a lead

app.delete('/api/leads/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Lead.findByIdAndDelete(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Lead not found' })
  res.json({ message: 'Lead deleted successfully', id: doc._id })
})

// ==================== CONTACT ENDPOINTS ====================

// Public: create a new contact form submission
}

module.exports = register
