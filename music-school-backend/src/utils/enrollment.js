const mongoose = require('mongoose')
const { Enrollment, Course, Token } = require('../models')
const { isDbConnected } = require('../config/db')
const { getClerkUser } = require('./clerkUserCache')

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isValidObjectId(id) {
  const s = String(id || '').trim()
  if (!s) return false
  return mongoose.Types.ObjectId.isValid(s) && String(new mongoose.Types.ObjectId(s)) === s
}

function addEmailToIdentity(emails, userIds, email) {
  const e = normalizeEmail(email)
  if (!e || !e.includes('@')) return
  emails.add(e)
  userIds.add(`email:${e}`)
  userIds.add(e) // legacy plain-email userId
}

/**
 * Resolve all identity keys for a signed-in (or hinted) student:
 * - Clerk user id
 * - email hints (JWT claims / frontend)
 * - emails already on this user's enrollments / tokens (no Clerk needed)
 * - Clerk API only as last resort (rate-limit safe via cache)
 */
async function resolveStudentIdentity(userId, options = {}) {
  const uid = String(userId || '').trim()
  const userIds = new Set()
  const emails = new Set()
  const hints = []
    .concat(options.emailHints || [])
    .concat(options.emailHint || [])
    .map(normalizeEmail)
    .filter(Boolean)

  if (uid) {
    userIds.add(uid)
    if (uid.startsWith('email:')) {
      addEmailToIdentity(emails, userIds, uid.slice('email:'.length))
    } else if (uid.includes('@')) {
      addEmailToIdentity(emails, userIds, uid)
    }
  }

  for (const hint of hints) {
    addEmailToIdentity(emails, userIds, hint)
  }

  // Harvest emails already linked to this Clerk id in our DB (no Clerk API)
  if (isDbConnected() && uid && uid.startsWith('user_')) {
    try {
      const [linkedEnrollments, linkedTokens] = await Promise.all([
        Enrollment.find({ userId: uid }).select('email').limit(50).lean(),
        Token.find({ studentId: uid }).select('studentEmail').limit(20).lean(),
      ])
      for (const row of linkedEnrollments || []) {
        addEmailToIdentity(emails, userIds, row.email)
      }
      for (const row of linkedTokens || []) {
        addEmailToIdentity(emails, userIds, row.studentEmail)
      }
    } catch (err) {
      console.warn('resolveStudentIdentity: DB email harvest failed:', err?.message)
    }
  }

  // Clerk API only if we still have no email for a Clerk user
  if (uid && uid.startsWith('user_') && emails.size === 0) {
    try {
      const user = await getClerkUser(uid)
      const list = user?.emailAddresses || []
      for (const entry of list) {
        addEmailToIdentity(emails, userIds, entry?.emailAddress)
      }
    } catch (err) {
      console.warn('resolveStudentIdentity: Clerk lookup failed:', err?.message)
    }
  }

  return {
    userId: uid || null,
    userIds: Array.from(userIds).filter(Boolean),
    emails: Array.from(emails).filter(Boolean),
  }
}

function buildStudentEnrollmentFilter(identity, extra = {}) {
  const { userIds = [], emails = [] } = identity || {}
  const identityOr = []
  if (userIds.length) identityOr.push({ userId: { $in: userIds } })
  if (emails.length) {
    identityOr.push({ email: { $in: emails } })
    identityOr.push({ userId: { $in: emails.map((e) => `email:${e}`) } })
  }

  if (identityOr.length === 0) {
    return { _id: null }
  }

  const and = [{ status: { $ne: 'deleted' } }, { $or: identityOr }]

  if (extra.approved === true) {
    // Keep approved boolean and status in sync historically; accept either
    and.push({ $or: [{ approved: true }, { status: 'approved' }] })
  } else if (extra.approved === false) {
    and.push({
      approved: { $ne: true },
      status: { $nin: ['approved', 'deleted'] },
    })
  }

  if (extra.courseId != null) {
    and.push({ courseId: String(extra.courseId) })
  }

  return { $and: and }
}

function enrollmentIdentityScore(enrollment) {
  const uid = String(enrollment?.userId || '')
  if (uid.startsWith('user_')) return 3
  if (uid.startsWith('email:')) return 2
  if (uid) return 1
  return 0
}

/** One enrollment per courseId — prefer Clerk-linked + newest. */
function dedupeEnrollmentsByCourse(enrollments) {
  const map = new Map()
  for (const e of enrollments || []) {
    const courseId = String(e.courseId || '').trim()
    if (!courseId) continue
    const prev = map.get(courseId)
    if (!prev) {
      map.set(courseId, e)
      continue
    }
    const scorePrev = enrollmentIdentityScore(prev)
    const scoreNext = enrollmentIdentityScore(e)
    if (scoreNext > scorePrev) {
      map.set(courseId, e)
      continue
    }
    if (scoreNext === scorePrev) {
      const prevTime = new Date(prev.updatedAt || prev.createdAt || 0).getTime()
      const nextTime = new Date(e.updatedAt || e.createdAt || 0).getTime()
      if (nextTime >= prevTime) map.set(courseId, e)
    }
  }
  return Array.from(map.values())
}

async function attachCoursesToEnrollments(enrollments) {
  const list = enrollments || []
  const courseIds = Array.from(
    new Set(list.map((e) => String(e.courseId || '').trim()).filter(isValidObjectId))
  )

  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).lean()
    : []
  const byId = new Map((courses || []).map((c) => [String(c._id), c]))

  return list.map((e) => {
    const raw = typeof e.toObject === 'function' ? e.toObject() : e
    const courseId = String(raw.courseId || '').trim()
    const course = byId.get(courseId) || null
    return {
      enrollmentId: raw._id,
      courseId,
      approved: Boolean(raw.approved),
      status: raw.status || (raw.approved ? 'approved' : 'pending'),
      instrument: raw.instrument || null,
      enrolledAt: raw.createdAt || null,
      courseMissing: !course,
      course: course
        ? course
        : courseId
          ? {
              _id: courseId,
              title: 'Course unavailable',
              description: 'This course could not be loaded. It may have been removed.',
              unavailable: true,
            }
          : null,
    }
  })
}

/**
 * Find enrollments for a student across all known identities.
 */
async function findStudentEnrollments({
  userId,
  approved,
  dedupe = true,
  withCourses = true,
  identity: identityHint,
  emailHints,
  emailHint,
} = {}) {
  if (!isDbConnected() || !userId) {
    return []
  }

  const identity =
    identityHint ||
    (await resolveStudentIdentity(userId, { emailHints, emailHint }))

  if (!identity.userIds.length && !identity.emails.length) {
    return []
  }

  const extra = {}
  if (approved === true) extra.approved = true
  if (approved === false) extra.approved = false

  const filter = buildStudentEnrollmentFilter(identity, extra)
  let list = await Enrollment.find(filter).sort({ createdAt: -1 }).lean()

  console.log('findStudentEnrollments:', {
    userId: identity.userId,
    emails: identity.emails,
    userIdKeys: identity.userIds.length,
    matched: (list || []).length,
    approved,
  })

  // Permanently link email:/email-field enrollments to Clerk id once we know the email.
  // Prevents missing courses when Clerk API is rate-limited on later requests.
  const clerkId = identity.userId
  if (
    clerkId &&
    clerkId.startsWith('user_') &&
    identity.emails.length > 0 &&
    (list || []).some((e) => {
      const uid = String(e.userId || '')
      return !uid.startsWith('user_')
    })
  ) {
    try {
      const linkFilter = {
        status: { $ne: 'deleted' },
        userId: { $not: /^user_/ },
        $or: [
          { email: { $in: identity.emails } },
          { userId: { $in: identity.emails.map((e) => `email:${e}`) } },
          { userId: { $in: identity.emails } },
        ],
      }
      const linkResult = await Enrollment.updateMany(linkFilter, {
        $set: { userId: clerkId },
      })
      if (linkResult.modifiedCount > 0) {
        console.log(
          'Linked',
          linkResult.modifiedCount,
          'manual enrollment(s) to',
          clerkId
        )
        list = await Enrollment.find(filter).sort({ createdAt: -1 }).lean()
      }
    } catch (err) {
      console.warn('Enrollment Clerk link-up failed:', err?.message)
    }
  }

  if (dedupe) {
    list = dedupeEnrollmentsByCourse(list)
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  }

  if (!withCourses) return list
  return attachCoursesToEnrollments(list)
}

async function isUserEnrolled(userId, courseId, options = {}) {
  if (!isDbConnected() || !userId || !courseId) return false
  const identity = await resolveStudentIdentity(userId, options)
  const filter = buildStudentEnrollmentFilter(identity, {
    approved: true,
    courseId: String(courseId),
  })
  const existing = await Enrollment.findOne(filter).select('_id').lean()
  return Boolean(existing)
}

module.exports = {
  normalizeEmail,
  isValidObjectId,
  resolveStudentIdentity,
  buildStudentEnrollmentFilter,
  dedupeEnrollmentsByCourse,
  attachCoursesToEnrollments,
  findStudentEnrollments,
  isUserEnrolled,
}
