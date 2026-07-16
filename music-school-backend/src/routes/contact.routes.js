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
app.post('/api/contact', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, phone, subject, message } = req.body || {}
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const doc = await Contact.create({
    name,
    email,
    phone: phone || '',
    subject,
    message,
    status: 'new'
  })
  res.status(201).json({ id: doc._id, message: 'Contact form submitted' })
})

// Admin: list all contact submissions (newest first)

app.get('/api/admin/contacts', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Contact.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: update contact status

app.put('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status: status || 'read' },
    { new: true }
  )
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  res.json(contact)
})

// Admin: delete contact submission

app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const contact = await Contact.findByIdAndDelete(req.params.id)
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  res.json({ message: 'Contact deleted' })
})

// ==================== FAQ ENDPOINTS ====================

// Public: get all active FAQs
}

module.exports = register
