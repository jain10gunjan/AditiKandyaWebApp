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
app.post('/api/dev/seed', async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  await Course.deleteMany({})
  await Teacher.deleteMany({})
  await Course.insertMany([
    {
      title: 'Guitar Basics',
      description: 'Beginner-friendly chords and rhythms',
      price: 2999,
      image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop',
      level: 'Beginner',
    },
    {
      title: 'Piano Pro',
      description: 'Scales, arpeggios, and performance tips',
      price: 3499,
      image: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop',
      level: 'Intermediate',
    },
  ])
  await Teacher.insertMany([
    { name: 'Aarav', instrument: 'Guitar', avatar: 'https://i.pravatar.cc/150?img=12' },
    { name: 'Maya', instrument: 'Piano', avatar: 'https://i.pravatar.cc/150?img=32' },
  ])
  res.json({ ok: true })
})

// ==================== LEADS (ENROLLMENT) ENDPOINTS ====================

// Public: create a new enrollment lead
}

module.exports = register
