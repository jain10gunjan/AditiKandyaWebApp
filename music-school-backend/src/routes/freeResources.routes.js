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
app.get('/api/free-courses', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const courses = await Course.find({ isFree: true }).sort({ createdAt: -1 })
  res.json(courses)
})

// Track free resource view

app.post('/api/free-resources/track/view', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { resourceId, courseId } = req.body || {}
  if (!resourceId || !courseId) return res.status(400).json({ error: 'Missing resourceId or courseId' })
  
  try {
    const userId = req.auth.userId
    const tracking = await FreeResourceTracking.findOneAndUpdate(
      { userId, resourceId },
      {
        userId,
        resourceId,
        courseId,
        viewed: true,
        viewedAt: new Date(),
        lastAccessedAt: new Date()
      },
      { upsert: true, new: true }
    )
    res.json(tracking)
  } catch (error) {
    console.error('Error tracking resource view:', error)
    res.status(500).json({ error: 'Failed to track view' })
  }
})

// Track free resource completion

app.post('/api/free-resources/track/complete', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { resourceId, courseId, timeSpent } = req.body || {}
  if (!resourceId || !courseId) return res.status(400).json({ error: 'Missing resourceId or courseId' })
  
  try {
    const userId = req.auth.userId
    const tracking = await FreeResourceTracking.findOneAndUpdate(
      { userId, resourceId },
      {
        userId,
        resourceId,
        courseId,
        completed: true,
        completedAt: new Date(),
        timeSpent: timeSpent || 0,
        lastAccessedAt: new Date(),
        viewed: true,
        viewedAt: new Date()
      },
      { upsert: true, new: true }
    )
    res.json(tracking)
  } catch (error) {
    console.error('Error tracking resource completion:', error)
    res.status(500).json({ error: 'Failed to track completion' })
  }
})

// Get user's free resource tracking data

app.get('/api/free-resources/tracking', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  try {
    const userId = req.auth.userId
    const { courseId } = req.query || {}
    const query = { userId }
    if (courseId) query.courseId = courseId
    
    const tracking = await FreeResourceTracking.find(query)
    res.json(tracking)
  } catch (error) {
    console.error('Error getting tracking data:', error)
    res.status(500).json({ error: 'Failed to get tracking data' })
  }
})

// Serve resource files with access control
}

module.exports = register
