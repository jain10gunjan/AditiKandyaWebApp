const deps = require('../deps')
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
app.get('/api/admin/tokens/:studentId/:courseId', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { studentId, courseId } = req.params
  const { year, month } = req.query
  
  // Set no-cache headers to ensure fresh data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  
  // Get user email for primary lookup
  const studentEmail = await getUserEmail(studentId)
  const normalizedStudentId = String(studentId)
  const normalizedCourseId = String(courseId)
  
  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  
  console.log('Admin fetching tokens:', { normalizedStudentId, studentEmail, normalizedCourseId, targetYear, targetMonth })
  
  // Find token record using email (primary) or userId (fallback)
  let tokenRecord = await findTokenRecord(studentEmail, normalizedStudentId, normalizedCourseId, targetYear, targetMonth)
  
  console.log('Admin token lookup result:', tokenRecord ? {
    remainingTokens: tokenRecord.remainingTokens,
    totalTokens: tokenRecord.totalTokens,
    waivedTokens: tokenRecord.waivedTokens,
    studentEmail: tokenRecord.studentEmail
  } : 'NOT FOUND')
  
  // If no token record exists, create one with default 4 tokens
  if (!tokenRecord) {
    tokenRecord = new Token({
      studentId: normalizedStudentId,
      studentEmail: studentEmail ? studentEmail.toLowerCase() : null,
      courseId: normalizedCourseId,
      year: targetYear,
      month: targetMonth,
      totalTokens: 4,
      remainingTokens: 4,
      waivedTokens: 0,
      manualAdjustment: 0
    })
    await tokenRecord.save()
    console.log('Admin created new token record with email:', studentEmail)
  }
  
  res.json(tokenRecord)
})

// Admin: Get all tokens for a course

app.get('/api/admin/courses/:courseId/tokens', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { courseId } = req.params
  const { year, month } = req.query
  
  // Set no-cache headers to ensure fresh data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  
  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  
  const tokens = await Token.find({ 
    courseId, 
    year: targetYear, 
    month: targetMonth 
  })
  
  res.json(tokens)
})

// Admin: Manually override tokens for a student

app.put('/api/admin/tokens/:studentId/:courseId', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { studentId, courseId } = req.params
  const { totalTokens, remainingTokens, waivedTokens, manualAdjustment, notes, year, month } = req.body || {}
  
  // Get user email for primary lookup
  const studentEmail = await getUserEmail(studentId)
  const normalizedStudentId = String(studentId)
  const normalizedCourseId = String(courseId)
  
  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  
  console.log('Admin updating tokens:', { normalizedStudentId, studentEmail, normalizedCourseId, targetYear, targetMonth, updates: { totalTokens, remainingTokens, waivedTokens, manualAdjustment } })
  
  // Find token record using email (primary) or userId (fallback)
  let tokenRecord = await findTokenRecord(studentEmail, normalizedStudentId, normalizedCourseId, targetYear, targetMonth)
  
  if (!tokenRecord) {
    tokenRecord = new Token({
      studentId: normalizedStudentId,
      studentEmail: studentEmail ? studentEmail.toLowerCase() : null,
      courseId: normalizedCourseId,
      year: targetYear,
      month: targetMonth,
      totalTokens: totalTokens || 4,
      remainingTokens: remainingTokens !== undefined ? remainingTokens : (totalTokens || 4),
      waivedTokens: waivedTokens || 0,
      manualAdjustment: manualAdjustment || 0,
      lastUpdatedBy: req.auth.userId
    })
    console.log('Admin creating new token record for manual update with email:', studentEmail)
  } else {
    // Update existing record - also ensure email is set
    if (studentEmail && !tokenRecord.studentEmail) {
      tokenRecord.studentEmail = studentEmail.toLowerCase()
    }
    if (totalTokens !== undefined) tokenRecord.totalTokens = totalTokens
    if (remainingTokens !== undefined) tokenRecord.remainingTokens = remainingTokens
    if (waivedTokens !== undefined) tokenRecord.waivedTokens = waivedTokens
    if (manualAdjustment !== undefined) tokenRecord.manualAdjustment = manualAdjustment
    if (notes !== undefined) tokenRecord.notes = notes
    console.log('Admin updating existing token record')
  }
  
  tokenRecord.lastUpdatedBy = req.auth.userId
  const savedRecord = await tokenRecord.save()
  
  console.log('Admin token update saved:', {
    remainingTokens: savedRecord.remainingTokens,
    totalTokens: savedRecord.totalTokens,
    waivedTokens: savedRecord.waivedTokens
  })
  
  res.json(savedRecord)
})

// ==================== CALENDAR/SCHEDULE ENDPOINTS ====================

// Admin: Get all schedules (with optional date filter) - only course-level schedules
}

module.exports = register
