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
app.get('/api/workshops', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const workshops = await Workshop.find({ isActive: true }).sort({ createdAt: -1 })
  res.json(workshops)
})

// Public: get single workshop

app.get('/api/workshops/:id', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const workshop = await Workshop.findById(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json(workshop)
})

// Admin: get all workshops (including inactive)

app.get('/api/admin/workshops', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const workshops = await Workshop.find().sort({ createdAt: -1 })
  res.json(workshops)
})

// Admin: create workshop

app.post('/api/admin/workshops', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, image, date, time, duration, location, price, maxParticipants, isActive } = req.body || {}
  if (!title || !description) return res.status(400).json({ error: 'Missing required fields' })
  const workshop = await Workshop.create({
    title,
    description,
    image: image || '',
    date: date || '',
    time: time || '',
    duration: duration || '',
    location: location || '',
    price: Number(price) || 0,
    maxParticipants: Number(maxParticipants) || 20,
    isActive: isActive !== undefined ? isActive : true
  })
  res.status(201).json(workshop)
})

// Admin: update workshop

app.put('/api/admin/workshops/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, image, date, time, duration, location, price, maxParticipants, isActive } = req.body || {}
  const workshop = await Workshop.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      image,
      date,
      time,
      duration,
      location,
      price: Number(price) || 0,
      maxParticipants: Number(maxParticipants) || 20,
      isActive: isActive !== undefined ? isActive : true
    },
    { new: true }
  )
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json(workshop)
})

// Admin: delete workshop

app.delete('/api/admin/workshops/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const workshop = await Workshop.findByIdAndDelete(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json({ message: 'Workshop deleted' })
})

// ==================== TESTIMONIAL ENDPOINTS ====================

// Public: Get all active testimonials

app.post('/api/workshops/:id/enroll', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const userId = req.auth.userId
  const { name, email, phone, message } = req.body || {}
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const workshop = await Workshop.findById(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  if (!workshop.isActive) return res.status(400).json({ error: 'Workshop is not active' })
  
  const enrollment = await WorkshopEnrollment.create({
    workshopId: req.params.id,
    userId,
    name,
    email,
    phone,
    message: message || '',
    status: 'pending'
  })
  res.status(201).json({ id: enrollment._id, message: 'Enrollment submitted successfully' })
})

// Admin: get all workshop enrollments

app.get('/api/admin/workshop-enrollments', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const enrollments = await WorkshopEnrollment.find()
    .populate('workshopId', 'title')
    .sort({ createdAt: -1 })
  res.json(enrollments)
})

// Admin: update enrollment status

app.put('/api/admin/workshop-enrollments/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const enrollment = await WorkshopEnrollment.findByIdAndUpdate(
    req.params.id,
    { status: status || 'pending' },
    { new: true }
  ).populate('workshopId', 'title')
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })
  res.json(enrollment)
})

// Admin: delete enrollment

app.delete('/api/admin/workshop-enrollments/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const enrollment = await WorkshopEnrollment.findByIdAndDelete(req.params.id)
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })
  res.json({ message: 'Enrollment deleted' })
})
}

module.exports = register
