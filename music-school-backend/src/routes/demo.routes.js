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
app.post('/api/demo/enroll', async (req, res) => {
  const { name, email, instrument, courseId } = req.body || {}
  if (!name || !email || !courseId) return res.status(400).json({ error: 'Missing fields' })
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(courseId)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const doc = await Enrollment.create({ name, email, instrument: instrument || '', userId: 'demo', courseId, approved: false })
  res.status(201).json({ message: 'Enrollment (demo) created', id: doc._id })
})
}

module.exports = register
