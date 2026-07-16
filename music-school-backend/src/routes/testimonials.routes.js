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
app.get('/api/testimonials', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
    res.json(testimonials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Get all testimonials (including inactive)

app.get('/api/admin/testimonials', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const testimonials = await Testimonial.find().sort({ order: 1, createdAt: -1 })
    res.json(testimonials)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Create testimonial

app.post('/api/admin/testimonials', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { name, role, content, avatar, isActive, order } = req.body
    if (!name || !role || !content) {
      return res.status(400).json({ error: 'Name, role, and content are required' })
    }
    const testimonial = new Testimonial({
      name,
      role,
      content,
      avatar: avatar || 'https://i.pravatar.cc/150',
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0
    })
    await testimonial.save()
    res.status(201).json(testimonial)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Update testimonial

app.put('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { name, role, content, avatar, isActive, order } = req.body
    const testimonial = await Testimonial.findByIdAndUpdate(
      req.params.id,
      {
        name,
        role,
        content,
        avatar,
        isActive,
        order
      },
      { new: true }
    )
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' })
    res.json(testimonial)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Admin: Delete testimonial

app.delete('/api/admin/testimonials/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const testimonial = await Testimonial.findByIdAndDelete(req.params.id)
    if (!testimonial) return res.status(404).json({ error: 'Testimonial not found' })
    res.json({ message: 'Testimonial deleted' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ==================== WORKSHOP ENROLLMENT ENDPOINTS ====================

// Authenticated: enroll in workshop
}

module.exports = register
