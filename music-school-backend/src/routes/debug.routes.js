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
app.get('/api/debug/course/:courseId/structure', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(req.params.courseId)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  
  const structure = {
    courseId: course._id,
    title: course.title,
    hasModules: course.modules ? course.modules.length : 0,
    hasChapters: course.chapters ? course.chapters.length : 0,
    modules: course.modules ? course.modules.map((m, idx) => ({
      index: idx,
      title: m.title,
      lessonsCount: m.lessons ? m.lessons.length : 0,
      lessons: m.lessons ? m.lessons.map((l, lidx) => ({
        index: lidx,
        title: l.title,
        type: l.type,
        videoPath: l.videoPath,
        pdfPath: l.pdfPath
      })) : []
    })) : [],
    chapters: course.chapters ? course.chapters.map((c, cidx) => ({
      index: cidx,
      title: c.title,
      modules: c.modules ? c.modules.map((m, midx) => ({
        index: midx,
        title: m.title,
        lessonsCount: m.lessons ? m.lessons.length : 0,
        lessons: m.lessons ? m.lessons.map((l, lidx) => ({
          index: lidx,
          title: l.title,
          type: l.type,
          videoPath: l.videoPath,
          pdfPath: l.pdfPath
        })) : []
      })) : []
    })) : []
  }
  
  res.json(structure)
})

// Video streaming with Range support and access control
}

module.exports = register
