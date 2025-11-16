const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const { clerkMiddleware, requireAuth, clerkClient } = require('@clerk/express')

dotenv.config()


const app = express()
app.use(express.json())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*', credentials: true }))
app.use(morgan('dev'))
// Serve local uploads
const path = require('path')
const fs = require('fs')
const uploadsDir = path.join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })
app.use('/uploads', express.static(uploadsDir))
// Enable Clerk only when keys are present; otherwise leave routes public
const hasClerk = Boolean(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)
if (hasClerk) {
  app.use(
    clerkMiddleware({
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  )
} else {
  console.warn('Clerk not configured: set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable auth')
}

const requireAuthGuarded = hasClerk
  ? requireAuth()
  : (req, res) => res.status(501).json({ error: 'Auth not configured' })

// Mongo connection (non-fatal if unavailable)
let dbConnected = false
const mongoUri = process.env.MONGODB_URI
if (!mongoUri) {
  console.warn('MONGODB_URI not set - running without database')
} else {
  mongoose.set('bufferCommands', false)
  mongoose
    .connect(mongoUri)
    .then(async () => {
      dbConnected = true
      console.log('MongoDB connected')
      try {
        await seedIfEmpty()
      } catch (e) {
        console.warn('Seeding skipped:', e?.message)
      }
    })
    .catch((err) => {
      dbConnected = false
      console.error('MongoDB connection error (continuing without DB):', err?.message || err)
    })
}

// Models
const Course = mongoose.model(
  'Course',
  new mongoose.Schema(
    {
      title: String,
      description: String,
      price: Number,
      image: String,
      level: String,
      thumbnailPath: String, // local file path served via /uploads
      curriculum: [
        {
          title: String,
          videoPath: String, // local video path served via /uploads
          freePreview: { type: Boolean, default: false },
          durationSec: Number,
        },
      ],
      modules: [
        {
          title: String,
          order: Number,
          lessons: [
            {
              title: String,
              type: { type: String, enum: ['video', 'pdf'], default: 'video' },
              videoPath: String,
              pdfPath: String,
              freePreview: { type: Boolean, default: false },
              durationSec: Number,
              order: Number,
            },
          ],
        },
      ],
      // New hierarchy: chapters -> modules -> lessons
      chapters: [
        {
          title: String,
          order: Number,
          modules: [
            {
              title: String,
              order: Number,
              lessons: [
                {
                  title: String,
                  type: { type: String, enum: ['video', 'pdf'], default: 'video' },
                  videoPath: String,
                  pdfPath: String,
                  freePreview: { type: Boolean, default: false },
                  durationSec: Number,
                  order: Number,
                },
              ],
            },
          ],
        },
      ],
    },
    { timestamps: true }
  )
);

const Teacher = mongoose.model(
  'Teacher',
  new mongoose.Schema(
    { name: String, instrument: String, avatar: String },
    { timestamps: true }
  )
);

const Enrollment = mongoose.model(
  'Enrollment',
  new mongoose.Schema(
    { name: String, email: String, instrument: String, userId: String, courseId: String, paymentId: String, approved: { type: Boolean, default: false } },
    { timestamps: true }
  )
);

const Payment = mongoose.model(
  'Payment',
  new mongoose.Schema(
    {
      userId: String,
      courseId: String,
      orderId: String,
      paymentId: String,
      signature: String,
      amount: Number,
      status: String,
    },
    { timestamps: true }
  )
);

// Attendance model
const Attendance = mongoose.model(
  'Attendance',
  new mongoose.Schema(
    {
      studentId: String,
      courseId: String,
      date: String, // Changed to String to match frontend format
      status: { type: String, enum: ['present', 'absent', 'waived'], default: 'present' }, // Added 'waived', removed 'late'
      markedBy: String, // admin userId who marked attendance
      notes: String,
    },
    { timestamps: true }
  )
);

// Schedule/Calendar model
const Schedule = mongoose.model(
  'Schedule',
  new mongoose.Schema(
    {
      courseId: String,
      title: String,
      description: String,
      startTime: Date,
      endTime: Date,
      meetingLink: String,
      instructor: String,
      location: String,
      isRecurring: { type: Boolean, default: false },
      recurringPattern: String, // daily, weekly, monthly
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    },
    { timestamps: true }
  )
);

// Resources model
const Resource = mongoose.model(
  'Resource',
  new mongoose.Schema(
    {
      courseId: String,
      title: String,
      description: String,
      type: { type: String, enum: ['video', 'pdf', 'document'], default: 'video' },
      filePath: String,
      thumbnailPath: String,
      duration: Number, // in seconds for videos
      order: Number,
      isPublic: { type: Boolean, default: false }, // for free previews
    },
    { timestamps: true }
  )
);

// Lead model for new enrollment leads (no payment)
const Lead = mongoose.model(
  'Lead',
  new mongoose.Schema(
    {
      fullName: String,
      email: String,
      whatsapp: String,
      country: String,
    },
    { timestamps: true }
  )
);

const Progress = mongoose.model(
  'Progress',
  new mongoose.Schema(
    {
      userId: { type: String, required: true },
      courseId: { type: String, required: true },
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
      }
    },
    { timestamps: true }
  )
);

// Routes
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString(), db: dbConnected })
})

// Seed endpoint (and run-once seeder)
async function seedIfEmpty() {
  try {
    const courseCount = await Course.countDocuments()
    const teacherCount = await Teacher.countDocuments()
    if (courseCount === 0) {
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
        {
          title: 'Vocal Coaching',
          description: 'Breathing, pitch, and performance practice',
          price: 2799,
          image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop',
          level: 'All Levels',
        },
      ])
      console.log('Seeded demo courses')
    }
    if (teacherCount === 0) {
      await Teacher.insertMany([
        { name: 'Aarav', instrument: 'Guitar', avatar: 'https://i.pravatar.cc/150?img=12' },
        { name: 'Maya', instrument: 'Piano', avatar: 'https://i.pravatar.cc/150?img=32' },
        { name: 'Kabir', instrument: 'Vocals', avatar: 'https://i.pravatar.cc/150?img=22' },
      ])
      console.log('Seeded demo teachers')
    }
  } catch (e) {
    console.warn('Seeding skipped:', e?.message)
  }
}

// seeding is now triggered after successful DB connection

// Razorpay setup (guarded)
const Razorpay = require('razorpay')
const crypto = require('crypto')
const razorKeyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || ''
const razorKeySecret = process.env.RAZORPAY_KEY_SECRET || ''
const hasRazorEnv = Boolean(razorKeyId && razorKeySecret)

// Admin guard - allow list of admin emails (comma-separated)
const ADMIN_EMAILS = String(process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'themusinest@gmail.com')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)
function extractEmailsFromClaims(claims) {
  if (!claims) return []
  const emails = []
  // common locations in Clerk JWTs
  if (claims.email) emails.push(String(claims.email))
  if (claims.email_address) emails.push(String(claims.email_address))
  if (claims.primary_email_address) emails.push(String(claims.primary_email_address))
  if (Array.isArray(claims.email_addresses)) {
    for (const v of claims.email_addresses) {
      if (typeof v === 'string') emails.push(v)
      else if (v && typeof v.email_address === 'string') emails.push(v.email_address)
    }
  }
  return emails.map((e) => e.toLowerCase())
}
function isAdminFromClaims(claims) {
  const userEmails = extractEmailsFromClaims(claims)
  return userEmails.some((e) => ADMIN_EMAILS.includes(e))
}
const requireAdmin = hasClerk
  ? async (req, res, next) => {
      try {
        if (!req.auth) return res.status(401).json({ error: 'Unauthenticated' })
        const claims = req.auth.sessionClaims || {}
        let isAdmin = isAdminFromClaims(claims)
        if (!isAdmin) {
          try {
            const user = await clerkClient.users.getUser(req.auth.userId)
            const emails = (user.emailAddresses || []).map((e) => String(e.emailAddress || '').toLowerCase())
            isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e))
          } catch (_) {}
        }
        if (!isAdmin) return res.status(403).json({ error: 'Admin only' })
        next()
      } catch (e) {
        res.status(500).json({ error: 'Admin check failed' })
      }
    }
  : (req, res) => res.status(501).json({ error: 'Auth not configured' })

// Multer for local uploads
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/[^a-zA-Z0-9.\-_/]/g, '_')}`
    cb(null, safeName)
  },
})
const upload = multer({ storage })

app.get('/api/payments/key', (req, res) => {
  if (!razorKeyId) return res.status(501).json({ error: 'Razorpay key not configured' })
  res.json({ key: razorKeyId })
})

app.post('/api/payments/order', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, userHint } = req.body || {}
  if (!courseId) return res.status(400).json({ error: 'Missing courseId' })
  const course = await Course.findById(courseId)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const amount = course.price * 100
  if (!hasRazorEnv) return res.status(501).json({ error: 'Razorpay not configured' })
  const razor = new Razorpay({ key_id: razorKeyId, key_secret: razorKeySecret })
  const order = await razor.orders.create({ amount, currency: 'INR' })
  const userId = (req.auth && req.auth.userId) || userHint || 'guest'
  await Payment.create({ userId, courseId, orderId: order.id, amount, status: 'created' })
  res.json(order)
})

app.post('/api/payments/verify', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, razorpay_order_id, razorpay_payment_id, razorpay_signature, userHint } = req.body || {}
  if (!courseId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ error: 'Missing fields' })
  if (!hasRazorEnv) return res.status(501).json({ error: 'Razorpay not configured' })
  const expected = crypto
    .createHmac('sha256', razorKeySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex')
  const valid = expected === razorpay_signature
  await Payment.findOneAndUpdate(
    { orderId: razorpay_order_id },
    { paymentId: razorpay_payment_id, signature: razorpay_signature, status: valid ? 'paid' : 'invalid' }
  )
  if (valid) {
    const userId = (req.auth && req.auth.userId) || userHint || 'guest'
    await Enrollment.create({ name: 'Online Checkout', email: '', instrument: '', userId, courseId, paymentId: razorpay_payment_id, approved: false })
  }
  res.json({ valid })
})

// Frontend-only fallback: record a successful payment without server-side verification
app.post('/api/payments/record', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, paymentId, orderId, amount, userHint } = req.body || {}
  if (!courseId || !paymentId) return res.status(400).json({ error: 'Missing fields' })
  const userId = (req.auth && req.auth.userId) || userHint || 'guest'
  await Payment.create({ userId, courseId, orderId: orderId || 'frontend', paymentId, amount: Number(amount || 0), status: 'paid' })
  await Enrollment.create({ name: 'Frontend Payment', email: '', instrument: '', userId, courseId, paymentId, approved: false })
  res.json({ ok: true })
})

// Free enroll (no payment) -> pending approval
app.post('/api/courses/:id/free-enroll', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  if (Number(course.price || 0) > 0) return res.status(400).json({ error: 'Paid course' })
  const existing = await Enrollment.findOne({ userId: req.auth.userId, courseId: course.id })
  if (existing) return res.json(existing)
  const doc = await Enrollment.create({ name: 'Free Enroll', email: '', instrument: '', userId: req.auth.userId, courseId: course.id, approved: false })
  res.status(201).json(doc)
})

// Demo enrollment without payments/auth (for local preview only)
app.post('/api/demo/enroll', async (req, res) => {
  const { name, email, instrument, courseId } = req.body || {}
  if (!name || !email || !courseId) return res.status(400).json({ error: 'Missing fields' })
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(courseId)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const doc = await Enrollment.create({ name, email, instrument: instrument || '', userId: 'demo', courseId, approved: false })
  res.status(201).json({ message: 'Enrollment (demo) created', id: doc._id })
})

app.get('/api/courses', async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Course.find().sort({ createdAt: -1 })
  res.json(items)
})

app.get('/api/courses/:id', async (req, res) => {
  if (!dbConnected) return res.status(404).json({ error: 'Not found' })
  const item = await Course.findById(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

app.get('/api/teachers', async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Teacher.find().sort({ createdAt: -1 })
  res.json(items)
})

app.post('/api/enroll', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, instrument } = req.body || {}
  if (!name || !email || !instrument) return res.status(400).json({ error: 'Missing fields' })
  const userId = req.auth.userId
  const doc = await Enrollment.create({ name, email, instrument, userId })
  res.status(201).json({ message: 'Enrollment received', id: doc._id })
})

// Basic content management (temporary: any signed-in user)
app.post('/api/courses', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, price, image, level } = req.body || {}
  if (!title || !description) return res.status(400).json({ error: 'Missing fields' })
  const doc = await Course.create({ title, description, price, image, level })
  res.status(201).json(doc)
})

app.put('/api/courses/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, price, image, level } = req.body || {}
  const doc = await Course.findByIdAndUpdate(
    req.params.id,
    { title, description, price, image, level },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.delete('/api/courses/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Course.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Upload thumbnail for a course
app.post('/api/courses/:id/thumbnail', requireAdmin, upload.single('file'), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Course.findByIdAndUpdate(
    req.params.id,
    { thumbnailPath: `/uploads/${req.file.filename}` },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Upload a curriculum video item
app.post('/api/courses/:id/curriculum', requireAdmin, upload.single('file'), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, freePreview, durationSec } = req.body || {}
  const update = {
    $push: {
      curriculum: {
        title: title || req.file.originalname,
        videoPath: `/uploads/${req.file.filename}`,
        freePreview: String(freePreview) === 'true',
        durationSec: Number(durationSec || 0),
      },
    },
  }
  const doc = await Course.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Module management
app.post('/api/courses/:id/modules', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Missing title' })
  const update = { $push: { modules: { title, order: Number(order || 0), lessons: [] } } }
  const doc = await Course.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Lesson upload (video/pdf) into a module index
app.post('/api/courses/:id/modules/:mIdx/lessons', requireAdmin, upload.single('file'), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, type, freePreview, durationSec, order } = req.body || {}
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Not found' })
  const mIdx = Number(req.params.mIdx)
  if (!course.modules || !course.modules[mIdx]) return res.status(400).json({ error: 'Invalid module index' })
  const lesson = {
    title: title || (req.file ? req.file.originalname : 'Untitled'),
    type: type === 'pdf' ? 'pdf' : 'video',
    videoPath: undefined,
    pdfPath: undefined,
    freePreview: String(freePreview) === 'true',
    durationSec: Number(durationSec || 0),
    order: Number(order || course.modules[mIdx].lessons.length),
  }
  if (lesson.type === 'video' && req.file) lesson.videoPath = `/uploads/${req.file.filename}`
  if (lesson.type === 'pdf' && req.file) lesson.pdfPath = `/uploads/${req.file.filename}`
  course.modules[mIdx].lessons.push(lesson)
  await course.save()
  res.json(course)
})

// Chapters -> modules -> lessons management
app.post('/api/courses/:id/chapters', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Missing title' })
  const update = { $push: { chapters: { title, order: Number(order || 0), modules: [] } } }
  const doc = await Course.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.post('/api/courses/:id/chapters/:cIdx/modules', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Not found' })
  const cIdx = Number(req.params.cIdx)
  if (!course.chapters || !course.chapters[cIdx]) return res.status(400).json({ error: 'Invalid chapter index' })
  course.chapters[cIdx].modules.push({ title, order: Number(order || course.chapters[cIdx].modules.length), lessons: [] })
  await course.save()
  res.json(course)
})

app.post('/api/courses/:id/chapters/:cIdx/modules/:mIdx/lessons', requireAdmin, upload.single('file'), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, type, freePreview, durationSec, order } = req.body || {}
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Not found' })
  const cIdx = Number(req.params.cIdx)
  const mIdx = Number(req.params.mIdx)
  if (!course.chapters || !course.chapters[cIdx] || !course.chapters[cIdx].modules[mIdx]) return res.status(400).json({ error: 'Invalid index' })
  const lesson = {
    title: title || (req.file ? req.file.originalname : 'Untitled'),
    type: type === 'pdf' ? 'pdf' : 'video',
    videoPath: undefined,
    pdfPath: undefined,
    freePreview: String(freePreview) === 'true',
    durationSec: Number(durationSec || 0),
    order: Number(order || course.chapters[cIdx].modules[mIdx].lessons.length),
  }
  if (lesson.type === 'video' && req.file) lesson.videoPath = `/uploads/${req.file.filename}`
  if (lesson.type === 'pdf' && req.file) lesson.pdfPath = `/uploads/${req.file.filename}`
  course.chapters[cIdx].modules[mIdx].lessons.push(lesson)
  await course.save()
  res.json(course)
})

function getLessonFromCourse(course, mIdx, lIdx) {
  const mi = Number(mIdx)
  const li = Number(lIdx)
  if (!course.modules || !course.modules[mi]) return null
  const module = course.modules[mi]
  if (!module.lessons || !module.lessons[li]) return null
  return module.lessons[li]
}

// Helper: check if user is enrolled
async function isUserEnrolled(userId, courseId) {
  if (!dbConnected) return false
  const existing = await Enrollment.findOne({ userId, courseId, approved: true })
  return Boolean(existing)
}

// Video streaming with Range support and access control
app.get('/api/media/video/:courseId/:mIdx/:lIdx', async (req, res) => {
  if (!dbConnected) return res.status(503).end()
  const course = await Course.findById(req.params.courseId)
  if (!course) return res.status(404).end()
  const lesson = getLessonFromCourse(course, req.params.mIdx, req.params.lIdx)
  if (!lesson || lesson.type !== 'video' || !lesson.videoPath) return res.status(404).end()
  // Access: free preview OR enrolled user
  let allowed = Boolean(lesson.freePreview)
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!allowed) {
    if (Number(course.price || 0) === 0) allowed = true
    else if (userId) allowed = await isUserEnrolled(userId, course.id)
  }
  if (!allowed) return res.status(401).end()
  const fsPath = path.join(uploadsDir, path.basename(lesson.videoPath))
  if (!fs.existsSync(fsPath)) return res.status(404).end()
  const stat = fs.statSync(fsPath)
  const range = req.headers.range
  const mime = 'video/mp4'
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-')
    const start = parseInt(parts[0], 10)
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
    const chunkSize = end - start + 1
    const file = fs.createReadStream(fsPath, { start, end })
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunkSize,
      'Content-Type': mime,
    })
    file.pipe(res)
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
    })
    fs.createReadStream(fsPath).pipe(res)
  }
})

// PDF serve (inline) with access control
app.get('/api/media/pdf/:courseId/:mIdx/:lIdx', async (req, res) => {
  if (!dbConnected) return res.status(503).end()
  const course = await Course.findById(req.params.courseId)
  if (!course) return res.status(404).end()
  const lesson = getLessonFromCourse(course, req.params.mIdx, req.params.lIdx)
  if (!lesson || lesson.type !== 'pdf' || !lesson.pdfPath) return res.status(404).end()
  let allowed = Boolean(lesson.freePreview)
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!allowed) {
    if (Number(course.price || 0) === 0) allowed = true
    else if (userId) allowed = await isUserEnrolled(userId, course.id)
  }
  if (!allowed) return res.status(401).end()
  const fsPath = path.join(uploadsDir, path.basename(lesson.pdfPath))
  if (!fs.existsSync(fsPath)) return res.status(404).end()
  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', 'inline')
  fs.createReadStream(fsPath).pipe(res)
})

// Access check endpoint
app.get('/api/courses/:id/access', async (req, res) => {
  if (!dbConnected) return res.json({ enrolled: false })
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json({ enrolled: false })
  const enrolled = await isUserEnrolled(userId, req.params.id)
  res.json({ enrolled })
})

// Progress tracking endpoints
app.get('/api/courses/:id/progress', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json({})
  const userId = req.auth.userId
  const courseId = req.params.id
  
  // Check if user is enrolled
  const enrolled = await isUserEnrolled(userId, courseId)
  if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' })
  
  try {
    const progress = await Progress.findOne({ userId, courseId })
    res.json(progress?.data || {})
  } catch (error) {
    console.error('Failed to get progress:', error)
    res.status(500).json({ error: 'Failed to get progress' })
  }
})

app.post('/api/courses/:id/progress', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const userId = req.auth.userId
  const courseId = req.params.id
  const { moduleIndex, lessonIndex, completed } = req.body
  
  // Check if user is enrolled
  const enrolled = await isUserEnrolled(userId, courseId)
  if (!enrolled) return res.status(403).json({ error: 'Not enrolled in this course' })
  
  try {
    // Find or create progress record
    let progress = await Progress.findOne({ userId, courseId })
    if (!progress) {
      progress = new Progress({ userId, courseId, data: {} })
    }
    
    // Ensure data structure exists
    if (!progress.data) {
      progress.data = {}
    }
    if (!progress.data[moduleIndex]) {
      progress.data[moduleIndex] = {}
    }
    
    // Update progress data
    progress.data[moduleIndex][lessonIndex] = { completed }
    
    // Mark as modified to ensure Mongoose saves the changes
    progress.markModified('data')
    
    await progress.save()
    console.log('Progress saved:', { userId, courseId, moduleIndex, lessonIndex, completed })
    res.json({ success: true })
  } catch (error) {
    console.error('Failed to update progress:', error)
    res.status(500).json({ error: 'Failed to update progress' })
  }
})

// Student: my enrollments with course info
app.get('/api/me/enrollments', async (req, res) => {
  if (!dbConnected) return res.json([])
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json([])
  
  console.log('Getting enrollments for user:', userId)
  
  const list = await Enrollment.find({ userId, approved: true }).sort({ createdAt: -1 })
  console.log('Found approved enrollments:', list.length)
  
  const courseIds = list.map((e) => e.courseId)
  const courses = await Course.find({ _id: { $in: courseIds } })
  const idToCourse = new Map(courses.map((c) => [String(c._id), c]))
  
  const result = list.map((e) => ({ enrollmentId: e._id, course: idToCourse.get(String(e.courseId)) }))
  console.log('Returning enrollments:', result.length)
  
  res.json(result)
})

// Pending enrollments for current user
app.get('/api/me/enrollments/pending', async (req, res) => {
  if (!dbConnected) return res.json([])
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json([])
  const list = await Enrollment.find({ userId, approved: false }).sort({ createdAt: -1 })
  const courseIds = list.map((e) => e.courseId)
  const courses = await Course.find({ _id: { $in: courseIds } })
  const idToCourse = new Map(courses.map((c) => [String(c._id), c]))
  res.json(list.map((e) => ({ enrollmentId: e._id, course: idToCourse.get(String(e.courseId)) })))
})

app.post('/api/teachers', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, instrument, avatar } = req.body || {}
  if (!name || !instrument) return res.status(400).json({ error: 'Missing fields' })
  const doc = await Teacher.create({ name, instrument, avatar })
  res.status(201).json(doc)
})

app.delete('/api/teachers/:id', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Teacher.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  res.json({ ok: true })
})

// Admin: list pending and approve enrollments
app.get('/api/admin/enrollments', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Enrollment.find().sort({ createdAt: -1 })
  res.json(items)
})

app.post('/api/admin/enrollments/:id/approve', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Enrollment.findByIdAndUpdate(req.params.id, { approved: true }, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Auth test route
app.get('/api/me', requireAuthGuarded, (req, res) => {
  res.json({ userId: req.auth.userId })
})

// ==================== ATTENDANCE ENDPOINTS ====================

// Admin: Mark attendance for a student
app.post('/api/admin/attendance', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { studentId, courseId, date, status, notes } = req.body || {}
  if (!studentId || !courseId || !date) return res.status(400).json({ error: 'Missing required fields' })
  
  console.log('Marking attendance:', { studentId, courseId, date, status, notes })
  
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
  
  console.log('Attendance saved:', attendance)
  res.json(attendance)
})

// Admin: Get attendance for a course within a date range
app.get('/api/admin/attendance/:courseId/:startDate/:endDate', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const { courseId, startDate, endDate } = req.params
  
  console.log('Loading attendance range:', { courseId, startDate, endDate })
  
  const attendance = await Attendance.find({ 
    courseId, 
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1, studentId: 1 })
  
  console.log('Found attendance records:', attendance.length)
  res.json(attendance)
})

// Admin: Get attendance for a course on a specific date
app.get('/api/admin/attendance/:courseId/:date', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const { courseId, date } = req.params
  
  console.log('Loading attendance for date:', { courseId, date })
  
  const attendance = await Attendance.find({ 
    courseId, 
    date: date // Use string comparison instead of Date object
  }).sort({ createdAt: -1 })
  
  console.log('Found attendance records:', attendance.length)
  res.json(attendance)
})

// Admin: Get all students enrolled in a course
app.get('/api/admin/courses/:courseId/students', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const enrollments = await Enrollment.find({ 
    courseId: req.params.courseId, 
    approved: true 
  }).sort({ createdAt: -1 })
  res.json(enrollments)
})

// Student: Get their attendance for a course
app.get('/api/me/attendance/:courseId', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json([])
  const { courseId } = req.params
  const { startDate, endDate, year, month } = req.query
  
  let query = { studentId: req.auth.userId, courseId }
  
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

// ==================== CALENDAR/SCHEDULE ENDPOINTS ====================

// Admin: Create a schedule
app.post('/api/admin/schedules', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, title, description, startTime, endTime, meetingLink, instructor, location, isRecurring, recurringPattern } = req.body || {}
  if (!courseId || !title || !startTime || !endTime) return res.status(400).json({ error: 'Missing required fields' })
  
  const schedule = await Schedule.create({
    courseId,
    title,
    description,
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    meetingLink,
    instructor,
    location,
    isRecurring: Boolean(isRecurring),
    recurringPattern
  })
  res.status(201).json(schedule)
})

// Admin: Update a schedule
app.put('/api/admin/schedules/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, startTime, endTime, meetingLink, instructor, location, status } = req.body || {}
  
  const schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    { title, description, startTime: startTime ? new Date(startTime) : undefined, endTime: endTime ? new Date(endTime) : undefined, meetingLink, instructor, location, status },
    { new: true }
  )
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' })
  res.json(schedule)
})

// Admin: Delete a schedule
app.delete('/api/admin/schedules/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Schedule.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Schedule not found' })
  res.json({ ok: true })
})

// Admin: Get all schedules for a course
app.get('/api/admin/schedules/:courseId', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const schedules = await Schedule.find({ courseId: req.params.courseId }).sort({ startTime: 1 })
  res.json(schedules)
})

// Student: Get their upcoming schedules for enrolled courses
app.get('/api/me/schedules', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json([])
  
  console.log('Getting schedules for user:', req.auth.userId)
  
  // Get enrolled courses
  const enrollments = await Enrollment.find({ userId: req.auth.userId, approved: true })
  console.log('Found enrollments:', enrollments.length)
  
  const courseIds = enrollments.map(e => e.courseId)
  console.log('Course IDs:', courseIds)
  
  if (courseIds.length === 0) {
    console.log('No approved enrollments found')
    return res.json([])
  }
  
  const now = new Date()
  console.log('Current time:', now)
  
  const schedules = await Schedule.find({ 
    courseId: { $in: courseIds },
    status: 'scheduled'
  }).sort({ startTime: 1 })
  
  console.log('Found schedules:', schedules.length)
  
  res.json(schedules)
})

// ==================== RESOURCES ENDPOINTS ====================

// Admin: Upload a resource
app.post('/api/admin/resources', requireAdmin, upload.single('file'), async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, title, description, type, isPublic, order } = req.body || {}
  if (!courseId || !title) return res.status(400).json({ error: 'Missing required fields' })
  
  const resource = await Resource.create({
    courseId,
    title,
    description,
    type: type || 'video',
    filePath: req.file ? `/uploads/${req.file.filename}` : undefined,
    isPublic: Boolean(isPublic),
    order: Number(order || 0)
  })
  res.status(201).json(resource)
})

// Admin: Update a resource
app.put('/api/admin/resources/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, isPublic, order } = req.body || {}
  
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { title, description, isPublic: Boolean(isPublic), order: Number(order || 0) },
    { new: true }
  )
  if (!resource) return res.status(404).json({ error: 'Resource not found' })
  res.json(resource)
})

// Admin: Delete a resource
app.delete('/api/admin/resources/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Resource.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Resource not found' })
  res.json({ ok: true })
})

// Admin: Get all resources for a course
app.get('/api/admin/resources/:courseId', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const resources = await Resource.find({ courseId: req.params.courseId }).sort({ order: 1 })
  res.json(resources)
})

// Student: Get resources for enrolled courses
app.get('/api/me/resources/:courseId', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json([])
  
  // Check if user is enrolled
  const enrollment = await Enrollment.findOne({ 
    userId: req.auth.userId, 
    courseId: req.params.courseId, 
    approved: true 
  })
  
  if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' })
  
  const resources = await Resource.find({ 
    courseId: req.params.courseId 
  }).sort({ order: 1 })
  
  res.json(resources)
})

// Serve resource files with access control
app.get('/api/resources/:resourceId/file', async (req, res) => {
  if (!dbConnected) {
    console.error('Database not connected')
    return res.status(503).end()
  }
  
  const resource = await Resource.findById(req.params.resourceId)
  if (!resource || !resource.filePath) {
    console.error('Resource not found or no filePath:', req.params.resourceId, resource)
    return res.status(404).end()
  }
  
  console.log('Serving resource:', resource._id, 'filePath:', resource.filePath)
  
  // Check access: public resource OR enrolled user (via auth or userHint)
  let allowed = Boolean(resource.isPublic)
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  
  if (!allowed && userId) {
    const enrollment = await Enrollment.findOne({ 
      userId, 
      courseId: resource.courseId, 
      approved: true 
    })
    allowed = Boolean(enrollment)
    console.log('Enrollment check:', { userId, courseId: resource.courseId, allowed, enrollment })
  }
  
  if (!allowed) {
    console.error('Access denied for resource:', resource._id, 'userId:', userId)
    return res.status(401).end()
  }
  
  // Handle file path - resource.filePath is stored as /uploads/filename or filename
  let fsPath
  if (resource.filePath.startsWith('/uploads/')) {
    // Path is /uploads/filename.ext, extract just filename
    fsPath = path.join(uploadsDir, path.basename(resource.filePath))
  } else if (resource.filePath.startsWith('uploads/')) {
    // Path is uploads/filename.ext
    fsPath = path.join(uploadsDir, resource.filePath.replace('uploads/', ''))
  } else {
    // Path is just filename.ext
    fsPath = path.join(uploadsDir, resource.filePath)
  }
  
  console.log('Looking for file at:', fsPath, 'exists:', fs.existsSync(fsPath))
  console.log('Uploads dir:', uploadsDir)
  
  if (!fs.existsSync(fsPath)) {
    // List files in uploads directory for debugging
    try {
      const files = fs.readdirSync(uploadsDir)
      console.error('File not found. Available files in uploads:', files.slice(0, 10))
    } catch (err) {
      console.error('Error reading uploads directory:', err)
    }
    return res.status(404).end()
  }
  
  if (resource.type === 'video') {
    const stat = fs.statSync(fsPath)
    const range = req.headers.range
    const mime = 'video/mp4'
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-')
      const start = parseInt(parts[0], 10)
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1
      const chunkSize = end - start + 1
      const file = fs.createReadStream(fsPath, { start, end })
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': mime,
      })
      return file.pipe(res)
    }
    
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Content-Type': mime,
      'Accept-Ranges': 'bytes',
    })
    return fs.createReadStream(fsPath).pipe(res)
  } else if (resource.type === 'pdf') {
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'inline')
    return fs.createReadStream(fsPath).pipe(res)
  } else {
    res.setHeader('Content-Type', 'application/octet-stream')
    return fs.createReadStream(fsPath).pipe(res)
  }
})

// Seed endpoint (dev only)
app.post('/api/dev/seed', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
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
app.post('/api/leads', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { fullName, email, whatsapp, country } = req.body || {}
  if (!fullName || !email) return res.status(400).json({ error: 'Missing required fields' })
  const doc = await Lead.create({ fullName, email, whatsapp: whatsapp || '', country: country || '' })
  res.status(201).json({ id: doc._id, message: 'Lead captured' })
})

// Admin: list all leads (newest first)
app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Lead.find().sort({ createdAt: -1 })
  res.json(items)
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))


