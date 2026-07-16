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
app.get('/api/teachers', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Teacher.find().sort({ createdAt: -1 })
  res.json(items)
})

app.post('/api/teachers', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { name, instrument, avatar } = req.body || {}
  if (!name || !instrument) return res.status(400).json({ error: 'Missing fields' })
  const doc = await Teacher.create({ name, instrument, avatar })
  res.status(201).json(doc)
})

app.put('/api/teachers/:id', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { name, instrument, avatar } = req.body || {}
  if (!name || !instrument) return res.status(400).json({ error: 'Missing fields' })
  const doc = await Teacher.findByIdAndUpdate(
    req.params.id,
    { name, instrument, avatar },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.delete('/api/teachers/:id', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Teacher.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Admin: list pending and approve enrollments
}

module.exports = register
