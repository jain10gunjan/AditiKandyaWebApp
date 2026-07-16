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

function normalizeId(value) {
  return String(value || '').trim()
}

async function getCourseTitleMap() {
  const courses = await Course.find({}).select('_id title').lean()
  const map = new Map()
  for (const c of courses || []) {
    const id = normalizeId(c._id)
    if (!id) continue
    map.set(id, normalizeId(c.title) || 'Untitled Course')
  }
  return map
}

function resolveCourseTitle(titleMap, courseId) {
  const cid = normalizeId(courseId)
  if (!cid) return 'No course'
  return titleMap.get(cid) || 'Removed course'
}

function register(app) {
app.post('/api/admin/attendance', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { studentId, courseId, date, status, notes } = req.body || {}
  if (!studentId || !courseId || !date) return res.status(400).json({ error: 'Missing required fields' })
  
  console.log('Marking attendance:', { studentId, courseId, date, status, notes })
  
  // Get previous attendance status if exists
  const previousAttendance = await Attendance.findOne({ studentId, courseId, date: date })
  const previousStatus = previousAttendance?.status
  
  const attendance = await Attendance.findOneAndUpdate(
    { studentId, courseId, date: date }, // Use string date instead of Date object
    { 
      studentId, 
      courseId, 
      date: date, // Use string date instead of Date object
      status: status || 'present', 
      markedBy: req.auth.userId,
      notes 
    },
    { upsert: true, new: true }
  )
  
  // Update tokens based on attendance status
  // Get student email first to ensure we're updating the correct record
  const studentEmail = await getUserEmail(studentId)
  console.log('Marking attendance - student identifiers:', { studentId, studentEmail, courseId, date, status })
  
  try {
    await updateTokensForAttendance(studentId, courseId, date, status || 'present', previousStatus, req.auth.userId)
    console.log('Token update completed for attendance')
    
    // Verify token was updated correctly by fetching with email
    if (studentEmail) {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const verifyToken = await findTokenRecord(studentEmail, String(studentId), String(courseId), year, month)
      console.log('POST-ATTENDANCE Token verification:', verifyToken ? {
        remainingTokens: verifyToken.remainingTokens,
        waivedTokens: verifyToken.waivedTokens,
        studentEmail: verifyToken.studentEmail
      } : 'NOT FOUND')
    }
  } catch (tokenError) {
    console.error('Token update failed (non-blocking):', tokenError)
    // Continue even if token update fails
  }
  
  console.log('Attendance saved:', attendance)
  res.json(attendance)
})

// Admin: Clear / reset a single attendance mark (and reverse token impact)
app.delete('/api/admin/attendance', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { studentId, courseId, date } = req.query || {}
  if (!studentId || !courseId || !date) {
    return res.status(400).json({ error: 'Missing required fields: studentId, courseId, date' })
  }

  const sid = String(studentId).trim()
  const cid = String(courseId).trim()
  const dateStr = String(date).includes('T') ? String(date).split('T')[0] : String(date).trim()

  const previousAttendance = await Attendance.findOne({ studentId: sid, courseId: cid, date: dateStr })
  if (!previousAttendance) {
    return res.json({ deleted: false, message: 'No attendance record found' })
  }

  const previousStatus = previousAttendance.status
  await Attendance.deleteOne({ studentId: sid, courseId: cid, date: dateStr })

  try {
    // status=null → reverse previous mark only, do not apply a new status
    await updateTokensForAttendance(sid, cid, dateStr, null, previousStatus, req.auth.userId)
  } catch (tokenError) {
    console.error('Token reverse failed after attendance clear (non-blocking):', tokenError)
  }

  res.json({ deleted: true, previousStatus })
})

// Admin: Get attendance for a course within a date range
// Use courseId = "all" to load attendance across every course.

app.get('/api/admin/attendance/:courseId/:startDate/:endDate', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')
  const { courseId, startDate, endDate } = req.params
  
  console.log('Loading attendance range:', { courseId, startDate, endDate })

  const query = {
    date: { $gte: startDate, $lte: endDate },
  }
  if (String(courseId) !== 'all') {
    query.courseId = courseId
  }
  
  const attendance = await Attendance.find(query).sort({ date: 1, studentId: 1, courseId: 1 })
  
  console.log('Found attendance records:', attendance.length)
  res.json(attendance)
})

// Admin: Get attendance for a course on a specific date
// Use courseId = "all" to load attendance across every course for that date.

app.get('/api/admin/attendance/:courseId/:date', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { courseId, date } = req.params
  
  console.log('Loading attendance for date:', { courseId, date })

  const query = { date }
  if (String(courseId) !== 'all') {
    query.courseId = courseId
  }
  
  const attendance = await Attendance.find(query).sort({ createdAt: -1 })
  
  console.log('Found attendance records:', attendance.length)
  res.json(attendance)
})

// Admin: Daily attendance view across ALL courses (scheduled student-specific classes)
// Returns one row per (studentId, courseId) that has a scheduled class on the day.

app.get('/api/admin/attendance-day/:date', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')
  const { date } = req.params
  const dateStr = String(date || '').includes('T') ? String(date).split('T')[0] : String(date || '')
  if (!dateStr) return res.status(400).json({ error: 'Missing date' })

  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)

  // Find all student-specific class schedules on this day
  // Note: both status and type filters need $and — two top-level $or keys would overwrite each other
  const schedules = await Schedule.find({
    studentId: { $exists: true, $ne: null, $ne: '' },
    startTime: { $gte: startOfDay, $lte: endOfDay },
    $and: [
      {
        $or: [
          { status: 'scheduled' },
          { status: { $exists: false } },
          { status: null },
        ],
      },
      {
        $or: [
          { type: 'class' },
          { type: { $exists: false } },
          { type: null },
        ],
      },
    ],
  })
    .select('_id studentId courseId startTime endTime title type status')
    .sort({ courseId: 1, startTime: 1 })
    .lean()

  // De-dupe to one row per (studentId, courseId) for the day
  const byKey = new Map()
  for (const s of schedules || []) {
    const sid = normalizeId(s.studentId)
    const cid = normalizeId(s.courseId)
    if (!sid || !cid) continue
    const key = `${cid}::${sid}`
    if (!byKey.has(key)) byKey.set(key, s)
  }

  const unique = Array.from(byKey.values())
  const courseIds = Array.from(new Set(unique.map(s => normalizeId(s.courseId)).filter(Boolean)))
  const studentIds = Array.from(new Set(unique.map(s => normalizeId(s.studentId)).filter(Boolean)))

  const [titleMap, enrollments, attendance] = await Promise.all([
    getCourseTitleMap(),
    studentIds.length
      ? Enrollment.find({
          userId: { $in: studentIds },
          approved: true,
          status: { $ne: 'deleted' },
        })
          .select('userId name email instrument courseId')
          .lean()
      : Promise.resolve([]),
    courseIds.length && studentIds.length
      ? Attendance.find({
          date: dateStr,
          courseId: { $in: courseIds },
          studentId: { $in: studentIds },
        }).lean()
      : Promise.resolve([]),
  ])

  // Prefer enrollment matching the same course for name/instrument
  const studentByCourseKey = new Map()
  const studentById = new Map()
  for (const e of enrollments || []) {
    const sid = normalizeId(e.userId)
    const cid = normalizeId(e.courseId)
    if (!sid) continue
    const profile = {
      userId: sid,
      name: e.name,
      email: e.email,
      instrument: e.instrument,
    }
    if (cid) studentByCourseKey.set(`${cid}::${sid}`, profile)
    if (!studentById.has(sid) || (e.name && !studentById.get(sid)?.name)) {
      studentById.set(sid, profile)
    }
  }

  const attendanceByKey = new Map()
  for (const a of attendance || []) {
    const sid = normalizeId(a.studentId)
    const cid = normalizeId(a.courseId)
    const d = normalizeId(a.date)
    if (!sid || !cid || !d) continue
    attendanceByKey.set(`${cid}::${sid}::${d}`, a)
  }

  const rows = unique.map(s => {
    const studentId = normalizeId(s.studentId)
    const courseId = normalizeId(s.courseId)
    const a = attendanceByKey.get(`${courseId}::${studentId}::${dateStr}`)
    const student =
      studentByCourseKey.get(`${courseId}::${studentId}`) ||
      studentById.get(studentId) ||
      { userId: studentId, name: null, email: null, instrument: null }
    return {
      studentId,
      studentName: student.name || student.email || 'Unknown Student',
      studentEmail: student.email || null,
      instrument: student.instrument || null,
      courseId,
      courseTitle: resolveCourseTitle(titleMap, courseId),
      date: dateStr,
      status: a?.status || null,
      notes: a?.notes || null,
      scheduleStartTime: s.startTime || null,
      scheduleEndTime: s.endTime || null,
    }
  })

  rows.sort((a, b) => {
    const byCourse = String(a.courseTitle).localeCompare(String(b.courseTitle))
    if (byCourse !== 0) return byCourse
    const at = a.scheduleStartTime ? new Date(a.scheduleStartTime).getTime() : 0
    const bt = b.scheduleStartTime ? new Date(b.scheduleStartTime).getTime() : 0
    if (at !== bt) return at - bt
    return String(a.studentName).localeCompare(String(b.studentName))
  })

  res.json(rows)
})

// Admin: Get all students enrolled in a course
// Use courseId = "all" to return every approved enrollment (one row per student+course).

app.get('/api/admin/courses/:courseId/students', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')
  const { courseId } = req.params
  const query = {
    approved: true,
    status: { $ne: 'deleted' },
  }
  if (String(courseId) !== 'all') {
    query.courseId = courseId
  }

  const [enrollments, titleMap] = await Promise.all([
    Enrollment.find(query).sort({ updatedAt: -1, createdAt: -1 }).lean(),
    getCourseTitleMap(),
  ])

  // One row per (userId, courseId); skip incomplete enrollments
  const byKey = new Map()
  for (const e of enrollments || []) {
    const sid = normalizeId(e.userId)
    const cid = normalizeId(e.courseId)
    if (!sid || !cid) continue
    const key = `${sid}::${cid}`
    if (!byKey.has(key)) {
      byKey.set(key, {
        ...e,
        userId: sid,
        courseId: cid,
        courseTitle: resolveCourseTitle(titleMap, cid),
      })
    }
  }

  const rows = Array.from(byKey.values())
  rows.sort((a, b) => {
    const byCourse = String(a.courseTitle).localeCompare(String(b.courseTitle))
    if (byCourse !== 0) return byCourse
    return String(a.name || '').localeCompare(String(b.name || ''))
  })

  res.json(rows)
})

// Student: Get their attendance for a course
}

module.exports = register
