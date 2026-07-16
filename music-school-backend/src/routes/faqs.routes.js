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
app.get('/api/faqs', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
  res.json(faqs)
})

// Admin: get all FAQs (including inactive)

app.get('/api/admin/faqs', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 })
  res.json(faqs)
})

// Admin: create FAQ

app.post('/api/admin/faqs', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { question, answer, order, isActive } = req.body || {}
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' })
  }
  const faq = await FAQ.create({
    question,
    answer,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true
  })
  res.status(201).json(faq)
})

// Admin: update FAQ

app.put('/api/admin/faqs/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { question, answer, order, isActive } = req.body || {}
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { question, answer, order, isActive },
    { new: true }
  )
  if (!faq) return res.status(404).json({ error: 'FAQ not found' })
  res.json(faq)
})

// Admin: delete FAQ

app.delete('/api/admin/faqs/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const faq = await FAQ.findByIdAndDelete(req.params.id)
  if (!faq) return res.status(404).json({ error: 'FAQ not found' })
  res.json({ message: 'FAQ deleted' })
})

// ==================== CONSULTATION ENDPOINTS ====================

// Public: create a new consultation request
}

module.exports = register
