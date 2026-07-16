const deps = require('../deps')
const {
  Course,
  Enrollment,
  isDbConnected,
  requireAdmin,
  clerkClient,
  hasClerk,
} = deps
const { fixEnrollmentStatusMismatches } = require('../../utils/enrollmentStatus')

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(normalizeEmail(email))
}

/** Keep approved + status in sync. Never leave approved:true with status:deleted. */
function syncApprovalFields(updateData, { approved, status } = {}) {
  if (approved !== undefined) {
    const isApproved = Boolean(approved)
    updateData.approved = isApproved
    if (isApproved) {
      updateData.status = 'approved'
      updateData.deletedAt = null
    } else if (updateData.status !== 'deleted' && status !== 'deleted') {
      updateData.status = 'pending'
    }
  }

  if (status !== undefined) {
    updateData.status = status
    if (status === 'approved') {
      updateData.approved = true
      updateData.deletedAt = null
    } else if (status === 'pending') {
      updateData.approved = false
    } else if (status === 'deleted') {
      updateData.approved = false
      if (updateData.deletedAt === undefined) {
        updateData.deletedAt = new Date()
      }
    }
  }
}

async function findEnrollmentForManual(email, courseId, userId) {
  const emailNorm = normalizeEmail(email)
  const or = [
    { email: emailNorm, courseId },
    { userId: `email:${emailNorm}`, courseId },
  ]
  if (userId) or.push({ userId, courseId })
  return Enrollment.findOne({ $or: or })
}

async function attachCourses(items) {
  const list = items || []
  const courseIds = Array.from(new Set(list.map(e => String(e.courseId || '')).filter(Boolean)))
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select('_id title').lean()
    : []
  const idToCourse = new Map((courses || []).map(c => [String(c._id), c]))
  return list.map(e => {
    const raw = typeof e.toObject === 'function' ? e.toObject() : e
    return {
      ...raw,
      course: idToCourse.get(String(raw.courseId)) || null,
    }
  })
}

function register(app) {
// Admin: One-time / on-demand cleanup of approved vs status mismatches
// Registered before /:id routes so "fix-status" is never treated as an id.
app.post('/api/admin/enrollments/fix-status', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const counts = await fixEnrollmentStatusMismatches()
  res.json({ message: 'Enrollment status mismatches fixed', ...counts })
})

app.get('/api/admin/enrollments', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Enrollment.find({ status: { $ne: 'deleted' } }).sort({ createdAt: -1 }).lean()
  res.json(items)
})

app.post('/api/admin/enrollments/:id/approve', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { approved: true, status: 'approved', deletedAt: null },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Admin: Update an enrollment
app.put('/api/admin/enrollments/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, courseId, approved, instrument, status } = req.body || {}

  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) {
    const emailNorm = normalizeEmail(email)
    if (!isValidEmail(emailNorm)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
    updateData.email = emailNorm
  }
  if (courseId !== undefined) updateData.courseId = courseId
  if (instrument !== undefined) updateData.instrument = instrument

  syncApprovalFields(updateData, { approved, status })

  if (courseId !== undefined) {
    const course = await Course.findById(courseId).select('_id').lean()
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
  }

  const doc = await Enrollment.findByIdAndUpdate(req.params.id, updateData, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Admin: Soft-delete an enrollment
app.delete('/api/admin/enrollments/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { status: 'deleted', deletedAt: new Date(), approved: false },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ message: 'Enrollment deleted successfully', id: doc._id })
})

// Admin: List soft-deleted enrollments ("Deleted Students")
app.get('/api/admin/enrollments/deleted', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Enrollment.find({ status: 'deleted' }).sort({ deletedAt: -1, createdAt: -1 }).lean()
  res.json(await attachCourses(items))
})

// Admin: Restore a soft-deleted enrollment
app.post('/api/admin/enrollments/:id/restore', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Enrollment.findByIdAndUpdate(
    req.params.id,
    { status: 'approved', approved: true, deletedAt: null },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Admin: Get active manual enrollments
app.get('/api/admin/enrollments/manual', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')
  const items = await Enrollment.find({
    paymentId: 'manual-enrollment',
    status: { $ne: 'deleted' },
  })
    .sort({ createdAt: -1 })
    .lean()
  res.json(await attachCourses(items))
})

// Admin: Manually enroll a student by email
app.post('/api/admin/enrollments/manual', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { email, courseId, name, instrument } = req.body || {}

  if (!email || !courseId) {
    return res.status(400).json({ error: 'Email and course ID are required' })
  }

  const emailNorm = normalizeEmail(email)
  if (!isValidEmail(emailNorm)) {
    return res.status(400).json({ error: 'Invalid email format' })
  }

  const course = await Course.findById(courseId).select('_id title').lean()
  if (!course) {
    return res.status(404).json({ error: 'Course not found' })
  }

  // Prefer Clerk name when a Clerk user exists (requested behavior)
  let userId = null
  let studentName = (name && String(name).trim()) || 'Student'

  if (hasClerk) {
    try {
      const users = await clerkClient.users.getUserList({ emailAddress: [emailNorm] })
      if (users && users.data && users.data.length > 0) {
        userId = users.data[0].id
        studentName =
          users.data[0].firstName ||
          users.data[0].emailAddresses?.[0]?.emailAddress ||
          studentName
      }
    } catch (err) {
      console.warn('Could not find user in Clerk by email:', err?.message)
    }
  }

  const existingEnrollment = await findEnrollmentForManual(emailNorm, courseId, userId)

  if (existingEnrollment) {
    if (existingEnrollment.status === 'deleted') {
      return res.status(400).json({
        error:
          'This student was previously enrolled and then deleted for this course. Restore them from the Deleted Students page instead of creating a new enrollment.',
        enrollmentId: existingEnrollment._id,
        code: 'ENROLLMENT_DELETED',
      })
    }

    if (existingEnrollment.approved || existingEnrollment.status === 'approved') {
      return res.status(400).json({ error: 'Student is already enrolled in this course' })
    }

    // Approve existing pending enrollment and mark as manual
    const updated = await Enrollment.findByIdAndUpdate(
      existingEnrollment._id,
      {
        approved: true,
        status: 'approved',
        deletedAt: null,
        email: emailNorm,
        name: studentName,
        instrument: instrument !== undefined ? instrument : existingEnrollment.instrument,
        paymentId: existingEnrollment.paymentId || 'manual-enrollment',
        ...(userId ? { userId } : {}),
      },
      { new: true }
    )
    return res.json({
      message: 'Existing enrollment approved',
      enrollment: updated,
    })
  }

  const enrollment = await Enrollment.create({
    name: studentName,
    email: emailNorm,
    instrument: instrument || '',
    userId: userId || `email:${emailNorm}`,
    courseId,
    approved: true,
    status: 'approved',
    deletedAt: null,
    paymentId: 'manual-enrollment',
  })

  res.status(201).json({
    message: 'Student enrolled successfully',
    enrollment,
  })
})
}

module.exports = register
