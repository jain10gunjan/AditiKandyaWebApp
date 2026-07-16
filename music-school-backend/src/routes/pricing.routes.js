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
app.get('/api/courses/:id/pricing', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const pricing = await DynamicPricing.find({ courseId: req.params.id, isActive: true })
    res.json(pricing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get pricing based on region/country

app.get('/api/courses/:id/pricing/:region', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { region } = req.params
    const pricing = await DynamicPricing.findOne({ 
      courseId: req.params.id, 
      $or: [
        { region },
        { country: region },
        { timezone: { $regex: region, $options: 'i' } }
      ],
      isActive: true 
    })
    if (!pricing) {
      // Fallback to default course price
      const course = await Course.findById(req.params.id)
      res.json({ 
        price: course?.price || 0, 
        currency: 'INR', 
        region: 'default',
        isDefault: true 
      })
    } else {
      res.json(pricing)
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create or update dynamic pricing (Admin only)

app.post('/api/courses/:id/pricing', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { region, country, timezone, currency, price, isActive } = req.body
    if (!region || price === undefined) {
      return res.status(400).json({ error: 'Region and price are required' })
    }
    
    const pricing = await DynamicPricing.findOneAndUpdate(
      { courseId: req.params.id, region },
      {
        courseId: req.params.id,
        region,
        country: country || region,
        timezone,
        currency: currency || 'USD',
        price: Number(price),
        isActive: isActive !== undefined ? isActive : true
      },
      { upsert: true, new: true }
    )
    res.json(pricing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update dynamic pricing (Admin only)

app.put('/api/pricing/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { region, country, timezone, currency, price, isActive } = req.body
    const update = {}
    if (region) update.region = region
    if (country) update.country = country
    if (timezone) update.timezone = timezone
    if (currency) update.currency = currency
    if (price !== undefined) update.price = Number(price)
    if (isActive !== undefined) update.isActive = isActive
    
    const pricing = await DynamicPricing.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!pricing) return res.status(404).json({ error: 'Pricing not found' })
    res.json(pricing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete dynamic pricing (Admin only)

app.delete('/api/pricing/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const pricing = await DynamicPricing.findByIdAndDelete(req.params.id)
    if (!pricing) return res.status(404).json({ error: 'Pricing not found' })
    res.json({ success: true, deleted: pricing })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get all dynamic pricing (Admin only)

app.get('/api/pricing', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const { courseId } = req.query
    const query = courseId ? { courseId } : {}
    const pricing = await DynamicPricing.find(query).sort({ createdAt: -1 })
    res.json(pricing)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload thumbnail for a course
}

module.exports = register
