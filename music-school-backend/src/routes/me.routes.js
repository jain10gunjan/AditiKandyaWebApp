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

const {
  findStudentEnrollments,
  resolveStudentIdentity,
} = require('../utils/enrollment')
const { extractEmailsFromClaims } = require('../utils/admin')

function emailHintsFromRequest(req) {
  const fromClaims = extractEmailsFromClaims(req.auth && req.auth.sessionClaims)
  const q = req.query || {}
  const fromQuery = []
    .concat(q.emailHint || [])
    .concat(q.email || [])
    .map((e) => String(e || '').trim().toLowerCase())
    .filter(Boolean)
  return Array.from(new Set([...fromClaims, ...fromQuery]))
}

function register(app) {
app.get('/api/me/enrollments', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json([])

  res.set('Cache-Control', 'no-store')
  try {
    const emailHints = emailHintsFromRequest(req)
    const result = await findStudentEnrollments({
      userId,
      approved: true,
      dedupe: true,
      withCourses: true,
      emailHints,
    })
    console.log('Returning enrollments:', result.length, 'for userId:', userId, 'emailHints:', emailHints)
    res.json(result)
  } catch (err) {
    console.error('GET /me/enrollments failed:', err)
    res.status(500).json({ error: 'Failed to load enrollments' })
  }
})

// Pending enrollments for current user
app.get('/api/me/enrollments/pending', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json([])

  res.set('Cache-Control', 'no-store')
  try {
    const result = await findStudentEnrollments({
      userId,
      approved: false,
      dedupe: true,
      withCourses: true,
      emailHints: emailHintsFromRequest(req),
    })
    res.json(result)
  } catch (err) {
    console.error('GET /me/enrollments/pending failed:', err)
    res.status(500).json({ error: 'Failed to load pending enrollments' })
  }
})

app.get('/api/me', requireAuthGuarded, (req, res) => {
  res.json({ userId: req.auth.userId })
})

// ==================== ATTENDANCE ENDPOINTS ====================

// Admin: Mark attendance for a student

app.get('/api/me/attendance/:courseId', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { courseId } = req.params
  const { startDate, endDate, year, month } = req.query

  const identity = await resolveStudentIdentity(req.auth.userId, {
    emailHints: emailHintsFromRequest(req),
  })
  const studentIds = Array.from(
    new Set([...(identity.userIds || []), ...(identity.emails || [])].filter(Boolean))
  )
  if (studentIds.length === 0) return res.json([])

  const query = {
    studentId: { $in: studentIds },
    courseId: String(courseId),
  }

  if (startDate && endDate) {
    query.date = { $gte: startDate, $lte: endDate }
  } else if (month && year) {
    const startOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const endOfMonth = new Date(year, month, 0).toISOString().split('T')[0]
    query.date = { $gte: startOfMonth, $lte: endOfMonth }
  } else if (year) {
    const startOfYear = new Date(year, 0, 1).toISOString().split('T')[0]
    const endOfYear = new Date(year, 11, 31).toISOString().split('T')[0]
    query.date = { $gte: startOfYear, $lte: endOfYear }
  }

  const attendance = await Attendance.find(query).sort({ date: -1 })
  res.json(attendance)
})

// ==================== TOKEN ENDPOINTS ====================

// Student: Get their tokens for a course (current month by default)

app.get('/api/me/tokens/:courseId', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId } = req.params
  const { year, month } = req.query
  
  // Set no-cache headers to ensure fresh data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  
  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  
  // Get user email for primary lookup
  const studentEmail = await getUserEmail(req.auth.userId)
  const normalizedStudentId = String(req.auth.userId)
  const normalizedCourseId = String(courseId)
  
  console.log('=== STUDENT TOKEN FETCH ===')
  console.log('Request params:', { courseId, year, month })
  console.log('User identifiers:', { normalizedStudentId, studentEmail, normalizedCourseId })
  console.log('Target period:', { targetYear, targetMonth })
  
  // Find token record using email (primary) or userId (fallback)
  let tokenRecord = await findTokenRecord(studentEmail, normalizedStudentId, normalizedCourseId, targetYear, targetMonth)
  
  // If not found, try without normalization (in case data was stored differently)
  if (!tokenRecord) {
    console.log('First lookup failed, trying alternative lookups...')
    tokenRecord = await Token.findOne({ 
      studentId: req.auth.userId, 
      courseId: courseId, 
      year: targetYear, 
      month: targetMonth 
    })
  }
  
  // If still not found, try with any studentId format for this course/year/month
  if (!tokenRecord) {
    const allRecordsForPeriod = await Token.find({ 
      courseId: normalizedCourseId, 
      year: targetYear, 
      month: targetMonth 
    })
    console.log('All token records for this course/period:', allRecordsForPeriod.map(r => ({
      studentId: r.studentId,
      remainingTokens: r.remainingTokens,
      waivedTokens: r.waivedTokens
    })))
  }
  
  console.log('Token record found:', tokenRecord ? {
    _id: tokenRecord._id,
    remainingTokens: tokenRecord.remainingTokens,
    totalTokens: tokenRecord.totalTokens,
    waivedTokens: tokenRecord.waivedTokens,
    studentId: tokenRecord.studentId,
    courseId: tokenRecord.courseId,
    year: tokenRecord.year,
    month: tokenRecord.month,
    updatedAt: tokenRecord.updatedAt
  } : 'NOT FOUND')
  
  // If token record found but email doesn't match, update it
  if (tokenRecord && studentEmail && tokenRecord.studentEmail !== studentEmail.toLowerCase()) {
    console.log('Email mismatch - updating token record:', {
      oldEmail: tokenRecord.studentEmail,
      newEmail: studentEmail.toLowerCase(),
      oldStudentId: tokenRecord.studentId,
      newStudentId: normalizedStudentId
    })
    tokenRecord.studentEmail = studentEmail.toLowerCase()
    tokenRecord.studentId = normalizedStudentId
    await tokenRecord.save()
    console.log('Updated token record with correct email and studentId')
  }
  
  // CRITICAL: DO NOT create new token record here!
  // Token records should ONLY be created when attendance is marked (by admin)
  // Creating here causes duplicate records when student has different userId in production
  if (!tokenRecord) {
    console.log('No token record found - returning default values (record will be created when attendance is marked)')
    console.log('Lookup used - Email:', studentEmail, 'StudentId:', normalizedStudentId, 'Course:', normalizedCourseId, 'Period:', targetYear, targetMonth)
    return res.json({
      studentId: normalizedStudentId,
      studentEmail: studentEmail,
      courseId: normalizedCourseId,
      year: targetYear,
      month: targetMonth,
      totalTokens: 4,
      remainingTokens: 4,
      waivedTokens: 0,
      manualAdjustment: 0
    })
  }
  
  // Return the found token record
  console.log('Returning token data to student:', {
    _id: tokenRecord._id,
    remainingTokens: tokenRecord.remainingTokens,
    totalTokens: tokenRecord.totalTokens,
    waivedTokens: tokenRecord.waivedTokens,
    usedTokens: tokenRecord.totalTokens - tokenRecord.remainingTokens - (tokenRecord.waivedTokens || 0),
    studentId: tokenRecord.studentId,
    studentEmail: tokenRecord.studentEmail,
    courseId: tokenRecord.courseId,
    year: tokenRecord.year,
    month: tokenRecord.month,
    updatedAt: tokenRecord.updatedAt
  })
  console.log('=== END STUDENT TOKEN FETCH ===')
  
  res.json(tokenRecord)
})

// Student: Get all their tokens across all courses

app.get('/api/me/tokens', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { year, month } = req.query
  
  // Set no-cache headers to ensure fresh data
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  res.set('Pragma', 'no-cache')
  res.set('Expires', '0')
  
  // Get user email for primary lookup
  const studentEmail = await getUserEmail(req.auth.userId)
  const normalizedStudentId = String(req.auth.userId)
  
  const now = new Date()
  const targetYear = year ? parseInt(year) : now.getFullYear()
  const targetMonth = month ? parseInt(month) : now.getMonth() + 1
  
  // Find tokens by email (primary) or userId (fallback)
  let tokens = []
  if (studentEmail) {
    tokens = await Token.find({ 
      studentEmail: studentEmail.toLowerCase(), 
      year: targetYear, 
      month: targetMonth 
    })
  }
  
  // If no tokens found by email, try userId (for backward compatibility)
  if (tokens.length === 0) {
    tokens = await Token.find({ 
      studentId: normalizedStudentId, 
      year: targetYear, 
      month: targetMonth 
    })
  }
  
  res.json(tokens)
})

// Admin: Get tokens for a specific student and course

app.get('/api/me/schedules', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  
  const userId = req.auth.userId
  console.log('Getting schedules for user:', userId)
  
  if (!userId) {
    console.log('No userId found, returning empty array')
    return res.json([])
  }

  const emailHints = emailHintsFromRequest(req)
  const identity = await resolveStudentIdentity(userId, { emailHints })
  const enrollments = await findStudentEnrollments({
    userId,
    approved: true,
    dedupe: true,
    withCourses: false,
    identity,
  })
  console.log('Found enrollments for schedules:', enrollments.length)

  const courseIds = (enrollments || [])
    .map(e => String(e.courseId || '').trim())
    .filter(Boolean)
  console.log('Course IDs:', courseIds)
  
  // Build query: Get both course-level AND student-specific schedules
  const queryConditions = []
  
  // 1. Course-level schedules (studentId is null, undefined, empty string, or doesn't exist)
  if (courseIds.length > 0) {
    queryConditions.push({
      courseId: { $in: courseIds },
      $and: [
        {
          $or: [
            { studentId: { $exists: false } },
            { studentId: null },
            { studentId: '' }
          ]
        },
        {
          $or: [
            { status: 'scheduled' },
            { status: { $exists: false } },
            { status: null }
          ]
        }
      ]
    })
  }
  
  // 2. Student-specific schedules for all known identity keys
  const studentIdConditions = Array.from(
    new Set([
      ...(identity.userIds || []),
      ...(identity.emails || []),
      ...(identity.emails || []).map(e => `email:${e}`),
    ])
  ).filter(Boolean)

  if (studentIdConditions.length > 0) {
    queryConditions.push({
      studentId: { $in: studentIdConditions },
      $or: [
        { status: 'scheduled' },
        { status: { $exists: false } },
        { status: null }
      ]
    })
  }

  if (queryConditions.length === 0) {
    return res.json([])
  }

  const schedules = await Schedule.find({ $or: queryConditions })
    .sort({ startTime: 1 })
    .lean()

  res.json(schedules || [])
})

// ==================== RESOURCES ENDPOINTS ====================

/**
 * Signed-in resource library:
 * - Shared: all isPublic resources (any course)
 * - Free courses: all resources for free courses
 * - Enrolled courses: all resources for approved (non-deleted) enrollments
 */
app.get('/api/me/resource-library', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ sources: [], shared: [], byCourse: {} })
  }

  res.set('Cache-Control', 'no-store')
  const userId = req.auth.userId
  const emailHints = emailHintsFromRequest(req)

  const [enrollments, freeCourses, publicResources] = await Promise.all([
    findStudentEnrollments({
      userId,
      approved: true,
      dedupe: true,
      withCourses: false,
      emailHints,
    }),
    Course.find({ isFree: true }).select('_id title isFree').sort({ title: 1 }).lean(),
    Resource.find({ isPublic: true }).sort({ order: 1, createdAt: -1 }).lean(),
  ])

  const enrolledIds = Array.from(
    new Set((enrollments || []).map(e => String(e.courseId || '').trim()).filter(Boolean))
  )
  const freeIds = (freeCourses || []).map(c => String(c._id))
  const freeIdSet = new Set(freeIds)
  const enrolledOnlyIds = enrolledIds.filter(id => !freeIdSet.has(id))
  const accessibleCourseIds = Array.from(new Set([...freeIds, ...enrolledIds]))

  const courseResources = accessibleCourseIds.length
    ? await Resource.find({ courseId: { $in: accessibleCourseIds } })
        .sort({ order: 1, createdAt: -1 })
        .lean()
    : []

  const titleCourseIds = Array.from(
    new Set([
      ...accessibleCourseIds,
      ...(publicResources || []).map(r => String(r.courseId || '').trim()).filter(Boolean),
      ...enrolledOnlyIds,
    ])
  )

  const titleCourses = titleCourseIds.length
    ? await Course.find({ _id: { $in: titleCourseIds } }).select('_id title isFree').lean()
    : []
  const courseMap = new Map((titleCourses || []).map(c => [String(c._id), c]))

  const enrich = (r, access, courseId) => ({
    ...r,
    access,
    courseTitle: courseMap.get(String(r.courseId || courseId || ''))?.title || null,
  })

  const shared = (publicResources || []).map(r => enrich(r, 'public'))

  const byCourse = {}
  for (const id of accessibleCourseIds) {
    const accessDefault = freeIdSet.has(id) ? 'free' : 'enrolled'
    byCourse[id] = (courseResources || [])
      .filter(r => String(r.courseId) === id)
      .map(r => enrich(r, r.isPublic ? 'public' : accessDefault, id))
  }

  const sources = []
  sources.push({
    id: 'shared',
    type: 'shared',
    title: 'Shared Library',
    count: shared.length,
  })
  for (const c of freeCourses || []) {
    const id = String(c._id)
    sources.push({
      id,
      type: 'free',
      title: c.title || 'Free Course',
      count: (byCourse[id] || []).length,
    })
  }
  for (const id of enrolledOnlyIds) {
    sources.push({
      id,
      type: 'enrolled',
      title: courseMap.get(id)?.title || 'Enrolled Course',
      count: (byCourse[id] || []).length,
    })
  }

  res.json({ sources, shared, byCourse })
})

app.get('/api/me/resources/:courseId', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json([])

  const courseId = String(req.params.courseId || '').trim()
  if (!courseId) return res.status(400).json({ error: 'Missing courseId' })

  if (courseId === 'shared') {
    const resources = await Resource.find({ isPublic: true }).sort({ order: 1, createdAt: -1 }).lean()
    return res.json(resources)
  }

  const course = await Course.findById(courseId).select('_id isFree title').lean()
  const isFreeCourse = course && course.isFree === true

  if (!isFreeCourse) {
    const enrolled = await isUserEnrolled(req.auth.userId, courseId)
    if (!enrolled) {
      return res.status(403).json({ error: 'Not enrolled in this course' })
    }
  }

  const resources = await Resource.find({ courseId }).sort({ order: 1, createdAt: -1 }).lean()
  res.json(resources)
})
}

module.exports = register
