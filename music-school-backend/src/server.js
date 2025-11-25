const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const dotenv = require('dotenv')
const mongoose = require('mongoose')
const { clerkMiddleware, requireAuth, clerkClient } = require('@clerk/express')
const zlib = require('zlib')

dotenv.config()

// Allowed origins for CORS
const allowedOrigins = [
  'https://themusinest.com',
  'https://www.themusinest.com', // Also allow www subdomain
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000'
]

// CORS configuration with error handling
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      // Log for debugging
      console.warn('CORS blocked origin:', origin)
      callback(new Error(`Not allowed by CORS. Origin: ${origin} is not in the allowed list: ${allowedOrigins.join(', ')}`))
    }
  },
  credentials: true,
  optionsSuccessStatus: 200, // Some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-File-Compressed', 'X-Original-Filename', 'X-User-Id'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges']
}

const app = express()

// Increase payload size limits to 50mb
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))

// CORS middleware with error handling
app.use(cors(corsOptions))

// Additional CORS headers for edge cases
app.use((req, res, next) => {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  next()
})

// General error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      error: 'CORS policy violation', 
      message: err.message,
      allowedOrigins: allowedOrigins,
      requestedOrigin: req.headers.origin
    })
  }
  res.status(500).json({ error: 'Internal server error', message: err.message })
})

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
      // Course metrics
      studentCount: { type: Number, default: 0 },
      rating: { type: Number, default: 4.8 },
      // Free/Public course flag
      isFree: { type: Boolean, default: false }, // Free courses available to all signed-in users
      // Teacher information
      teacherId: String, // Reference to Teacher model
      teacherName: String,
      teacherDescription: String,
      teacherAvatar: String,
      teacherInstrument: String,
      // Additional course content
      scales: String,
      arpeggios: String,
      performanceTips: String,
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
      type: { type: String, enum: ['class', 'exam', 'holiday', 'event'], default: 'class' },
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
      courseId: String, // Course ID for which the user is enrolling
      courseTitle: String, // Course title for reference
    },
    { timestamps: true }
  )
);

const Contact = mongoose.model(
  'Contact',
  new mongoose.Schema(
    {
      name: String,
      email: String,
      phone: String,
      subject: String,
      message: String,
      status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    },
    { timestamps: true }
  )
);

const FAQ = mongoose.model(
  'FAQ',
  new mongoose.Schema(
    {
      question: String,
      answer: String,
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

const Consultation = mongoose.model(
  'Consultation',
  new mongoose.Schema(
    {
      name: String,
      email: String,
      phone: String,
      preferredDate: String,
      preferredTime: String,
      message: String,
      type: { type: String, default: 'consultation' },
      status: { type: String, enum: ['new', 'scheduled', 'completed', 'cancelled'], default: 'new' },
    },
    { timestamps: true }
  )
);

const Workshop = mongoose.model(
  'Workshop',
  new mongoose.Schema(
    {
      title: String,
      description: String,
      image: String,
      date: String,
      time: String,
      duration: String,
      location: String,
      price: { type: Number, default: 0 },
      maxParticipants: { type: Number, default: 20 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
);

const WorkshopEnrollment = mongoose.model(
  'WorkshopEnrollment',
  new mongoose.Schema(
    {
      workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
      userId: String, // Clerk user ID
      name: String,
      email: String,
      phone: String,
      message: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
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

// Free Resource Tracking model
const FreeResourceTracking = mongoose.model(
  'FreeResourceTracking',
  new mongoose.Schema(
    {
      userId: { type: String, required: true },
      resourceId: { type: String, required: true },
      courseId: { type: String, required: true },
      viewed: { type: Boolean, default: false },
      viewedAt: Date,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      timeSpent: { type: Number, default: 0 }, // in seconds
      lastAccessedAt: Date,
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
        if (!req.auth) {
          console.log('requireAdmin: No auth found')
          return res.status(401).json({ error: 'Unauthenticated' })
        }
        const claims = req.auth.sessionClaims || {}
        let isAdmin = isAdminFromClaims(claims)
        if (!isAdmin) {
          try {
            const user = await clerkClient.users.getUser(req.auth.userId)
            const emails = (user.emailAddresses || []).map((e) => String(e.emailAddress || '').toLowerCase())
            isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e))
          } catch (err) {
            console.log('requireAdmin: Error checking user:', err.message)
          }
        }
        if (!isAdmin) {
          console.log('requireAdmin: User is not admin')
          return res.status(403).json({ error: 'Admin only' })
        }
        console.log('requireAdmin: User is admin, proceeding')
        next()
      } catch (e) {
        console.error('requireAdmin: Error:', e)
        return res.status(500).json({ error: 'Admin check failed' })
      }
    }
  : (req, res) => res.status(501).json({ error: 'Auth not configured' })

// Multer for local uploads with increased file size limit (100mb)
const multer = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    // Check if file is compressed (has .gz extension or compressed flag in metadata)
    const isCompressed = req.headers['x-file-compressed'] === 'true' || file.originalname.endsWith('.gz')
    const originalName = file.originalname.replace(/\.gz$/, '') // Remove .gz if present
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_')}`
    cb(null, safeName)
  },
})
const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
})

// Middleware to decompress uploaded files if they're compressed
async function decompressFileIfNeeded(req, res, next) {
  if (!req.file) {
    return next()
  }

  const isCompressed = req.headers['x-file-compressed'] === 'true'
  
  if (isCompressed) {
    try {
      const filePath = req.file.path
      const originalFilename = req.headers['x-original-filename'] || req.file.originalname.replace(/\.gz$/, '')
      
      // Determine the decompressed file path
      // Remove .gz extension if present, otherwise use original filename
      let decompressedPath = filePath
      if (filePath.endsWith('.gz')) {
        decompressedPath = filePath.slice(0, -3) // Remove .gz
      } else {
        // If no .gz extension, create new path with original filename
        const dir = path.dirname(filePath)
        decompressedPath = path.join(dir, path.basename(originalFilename))
      }
      
      // Read compressed file
      const compressedData = fs.readFileSync(filePath)
      
      // Decompress using gunzip
      const decompressedData = zlib.gunzipSync(compressedData)
      
      // Write decompressed file
      fs.writeFileSync(decompressedPath, decompressedData)
      
      // Remove compressed file
      if (filePath !== decompressedPath) {
        fs.unlinkSync(filePath)
      }
      
      // Update req.file to reflect the decompressed file
      req.file.path = decompressedPath
      req.file.filename = path.basename(decompressedPath)
      req.file.originalname = originalFilename
      req.file.size = decompressedData.length
      
      const compressionRatio = ((1 - compressedData.length / decompressedData.length) * 100).toFixed(2)
      console.log(`Decompressed file: ${originalFilename} (${(compressedData.length / 1024).toFixed(2)}KB -> ${(decompressedData.length / 1024).toFixed(2)}KB, ${compressionRatio}% compression)`)
    } catch (error) {
      console.error('Error decompressing file:', error)
      return res.status(500).json({ error: 'Failed to decompress file', details: error.message })
    }
  }
  
  next()
}

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
  const { title, description, price, image, level, teacherId } = req.body || {}
  if (!title || !description) return res.status(400).json({ error: 'Missing fields' })
  
  const courseData = { title, description, price, image, level }
  
  // If teacherId is provided, fetch teacher data and populate course fields
  if (teacherId) {
    const teacher = await Teacher.findById(teacherId)
    if (teacher) {
      courseData.teacherId = teacherId
      courseData.teacherName = teacher.name
      courseData.teacherAvatar = teacher.avatar
      courseData.teacherInstrument = teacher.instrument
    }
  }
  
  const doc = await Course.create(courseData)
  res.status(201).json(doc)
})

app.put('/api/courses/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { 
    title, description, price, image, level, 
    studentCount, rating, isFree,
    teacherId, teacherName, teacherDescription, teacherAvatar, teacherInstrument,
    scales, arpeggios, performanceTips
  } = req.body || {}
  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (price !== undefined) updateData.price = price
  if (image !== undefined) updateData.image = image
  if (level !== undefined) updateData.level = level
  if (studentCount !== undefined) updateData.studentCount = Number(studentCount) || 0
  if (rating !== undefined) updateData.rating = Number(rating) || 4.8
  if (isFree !== undefined) updateData.isFree = Boolean(isFree)
  
  // Handle teacherId - if provided, auto-populate teacher fields
  if (teacherId !== undefined) {
    if (teacherId) {
      const teacher = await Teacher.findById(teacherId)
      if (teacher) {
        updateData.teacherId = teacherId
        updateData.teacherName = teacher.name
        updateData.teacherAvatar = teacher.avatar
        updateData.teacherInstrument = teacher.instrument
      }
    } else {
      // If teacherId is empty string, clear teacher assignment
      updateData.teacherId = ''
      updateData.teacherName = ''
      updateData.teacherAvatar = ''
      updateData.teacherInstrument = ''
    }
  }
  
  // Allow manual override of teacher fields
  if (teacherName !== undefined) updateData.teacherName = teacherName
  if (teacherDescription !== undefined) updateData.teacherDescription = teacherDescription
  if (teacherAvatar !== undefined) updateData.teacherAvatar = teacherAvatar
  if (teacherInstrument !== undefined) updateData.teacherInstrument = teacherInstrument
  if (scales !== undefined) updateData.scales = scales
  if (arpeggios !== undefined) updateData.arpeggios = arpeggios
  if (performanceTips !== undefined) updateData.performanceTips = performanceTips
  
  const doc = await Course.findByIdAndUpdate(
    req.params.id,
    updateData,
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
app.post('/api/courses/:id/thumbnail', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
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
app.post('/api/courses/:id/curriculum', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
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

// Update module
app.put('/api/courses/:id/modules/:mIdx', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const mIdx = Number(req.params.mIdx)
  if (!course.modules || !course.modules[mIdx]) return res.status(400).json({ error: 'Invalid module index' })
  
  if (title !== undefined) course.modules[mIdx].title = title
  if (order !== undefined) course.modules[mIdx].order = Number(order)
  
  await course.save()
  res.json(course)
})

// Delete module
app.delete('/api/courses/:id/modules/:mIdx', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const mIdx = Number(req.params.mIdx)
  if (!course.modules || !course.modules[mIdx]) return res.status(400).json({ error: 'Invalid module index' })
  
  course.modules.splice(mIdx, 1)
  await course.save()
  res.json(course)
})

// Reorder modules (swap two modules)
app.post('/api/courses/:id/modules/reorder', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { fromIndex, toIndex } = req.body || {}
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  
  const from = Number(fromIndex)
  const to = Number(toIndex)
  
  if (!course.modules || from < 0 || to < 0 || from >= course.modules.length || to >= course.modules.length) {
    return res.status(400).json({ error: 'Invalid module indices' })
  }
  
  // Swap modules
  const [movedModule] = course.modules.splice(from, 1)
  course.modules.splice(to, 0, movedModule)
  
  // Update order values to match new positions
  course.modules.forEach((module, index) => {
    module.order = index
  })
  
  await course.save()
  res.json(course)
})

// Lesson upload (video/pdf) into a module index
app.post('/api/courses/:id/modules/:mIdx/lessons', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
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

// Delete a lesson from a module
app.delete('/api/courses/:id/modules/:mIdx/lessons/:lIdx', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  const mIdx = Number(req.params.mIdx)
  const lIdx = Number(req.params.lIdx)
  if (!course.modules || !course.modules[mIdx]) return res.status(400).json({ error: 'Invalid module index' })
  if (!course.modules[mIdx].lessons || !course.modules[mIdx].lessons[lIdx]) return res.status(400).json({ error: 'Invalid lesson index' })
  
  const lesson = course.modules[mIdx].lessons[lIdx]
  
  // Delete the file from filesystem if it exists
  if (lesson.videoPath || lesson.pdfPath) {
    try {
      const filePath = lesson.videoPath || lesson.pdfPath
      const fileName = filePath.replace('/uploads/', '')
      const fullPath = path.join(uploadsDir, fileName)
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath)
        console.log('Deleted file:', fullPath)
      }
    } catch (err) {
      console.warn('Could not delete file:', err?.message)
      // Continue even if file deletion fails
    }
  }
  
  // Remove lesson from array
  course.modules[mIdx].lessons.splice(lIdx, 1)
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

app.post('/api/courses/:id/chapters/:cIdx/modules/:mIdx/lessons', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
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

function getLessonFromCourse(course, mIdx, lIdx, cIdx = null) {
  const mi = Number(mIdx)
  const li = Number(lIdx)
  
  // If cIdx is explicitly provided, use chapters structure
  if (cIdx !== null) {
    const ci = Number(cIdx)
    if (course.chapters && course.chapters[ci]) {
      const chapter = course.chapters[ci]
      if (chapter.modules && chapter.modules[mi]) {
        const module = chapter.modules[mi]
        if (module.lessons && module.lessons[li]) {
          return module.lessons[li]
        }
      }
    }
    return null // If cIdx provided but not found, return null
  }
  
  // Try old modules structure first (most common)
  if (course.modules && Array.isArray(course.modules) && course.modules.length > 0) {
    if (course.modules[mi]) {
      const module = course.modules[mi]
      if (module.lessons && Array.isArray(module.lessons) && module.lessons[li]) {
        return module.lessons[li]
      }
    }
  }
  
  // Try chapters structure (if modules structure didn't work)
  if (course.chapters && Array.isArray(course.chapters) && course.chapters.length > 0) {
    // Try first chapter by default
    const chapter = course.chapters[0]
    if (chapter && chapter.modules && Array.isArray(chapter.modules) && chapter.modules[mi]) {
      const module = chapter.modules[mi]
      if (module.lessons && Array.isArray(module.lessons) && module.lessons[li]) {
        return module.lessons[li]
      }
    }
  }
  
  return null
}

// Helper: check if user is enrolled
async function isUserEnrolled(userId, courseId) {
  if (!dbConnected) return false
  const existing = await Enrollment.findOne({ userId, courseId, approved: true })
  return Boolean(existing)
}

// Debug endpoint to check course structure
app.get('/api/debug/course/:courseId/structure', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
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
app.get('/api/media/video/:courseId/:mIdx/:lIdx', async (req, res) => {
  if (!dbConnected) {
    console.error('Database not connected')
    return res.status(503).json({ error: 'Database unavailable' })
  }
  
  try {
    const course = await Course.findById(req.params.courseId)
    if (!course) {
      console.error('Course not found:', req.params.courseId)
      return res.status(404).json({ error: 'Course not found', courseId: req.params.courseId })
    }
    
    // Try to get lesson from modules or chapters structure
    const cIdx = req.query.cIdx !== undefined ? req.query.cIdx : null
    const lesson = getLessonFromCourse(course, req.params.mIdx, req.params.lIdx, cIdx)
    
    if (!lesson || lesson.type !== 'video' || !lesson.videoPath) {
      // Enhanced error logging
      console.error('Lesson not found or invalid:', {
        courseId: req.params.courseId,
        mIdx: req.params.mIdx,
        lIdx: req.params.lIdx,
        cIdx: cIdx,
        courseHasModules: course.modules ? course.modules.length : 0,
        courseHasChapters: course.chapters ? course.chapters.length : 0,
        moduleExists: course.modules && course.modules[req.params.mIdx] ? true : false,
        lessonExists: course.modules && course.modules[req.params.mIdx] && course.modules[req.params.mIdx].lessons ? course.modules[req.params.mIdx].lessons.length : 0,
        lesson: lesson ? { type: lesson.type, videoPath: lesson.videoPath, title: lesson.title } : null
      })
      
      // Return more detailed error
      return res.status(404).json({ 
        error: 'Lesson not found',
        courseId: req.params.courseId,
        moduleIndex: req.params.mIdx,
        lessonIndex: req.params.lIdx,
        hasModules: course.modules ? course.modules.length : 0,
        hasChapters: course.chapters ? course.chapters.length : 0,
        message: 'The requested lesson does not exist at this index'
      })
    }
    
    // Access control: free preview OR free course OR enrolled user OR admin
    let allowed = Boolean(lesson.freePreview)
    
    // Get userId from multiple sources (for iframe support)
    let userId = null
    let userIdFromToken = null
    
    if (req.auth && req.auth.userId) {
      userId = req.auth.userId
    } else if (req.query.userHint) {
      userId = req.query.userHint
    } else if (req.query.token && hasClerk) {
      // Extract userId from JWT token (decode without verification for now)
      try {
        const token = req.query.token
        // JWT format: header.payload.signature
        const parts = token.split('.')
        if (parts.length === 3) {
          // Decode the payload (base64url)
          const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
          // The 'sub' claim contains the userId
          if (payload.sub) {
            userIdFromToken = payload.sub
            userId = userIdFromToken
            console.log('Extracted userId from token:', userIdFromToken)
          }
        }
      } catch (e) {
        console.warn('Could not extract userId from token:', e?.message)
      }
    } else if (req.headers['x-user-id']) {
      userId = req.headers['x-user-id']
    }
    
    // Check if user is admin (for admin preview access)
    // Check by userId OR email - try both req.auth.userId, userHint, and token
    let isAdmin = false
    const userIdsToCheck = []
    
    // Collect all possible userIds to check
    if (req.auth && req.auth.userId) {
      userIdsToCheck.push(req.auth.userId)
    }
    if (userIdFromToken) {
      userIdsToCheck.push(userIdFromToken)
    }
    if (userId && !userIdsToCheck.includes(userId)) {
      userIdsToCheck.push(userId)
    }
    
    // Check admin status for each userId (by userId OR email)
    for (const userIdToCheck of userIdsToCheck) {
      if (hasClerk && !isAdmin) {
        try {
          const user = await clerkClient.users.getUser(userIdToCheck)
          const emails = (user.emailAddresses || []).map((e) => String(e.emailAddress || '').toLowerCase())
          isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e))
          if (isAdmin) {
            console.log('Admin access granted via userId:', userIdToCheck, 'email:', emails)
            break
          }
        } catch (err) {
          console.warn('Could not check admin status for userId:', userIdToCheck, err?.message)
        }
      }
    }
    
    // Also check if Authorization header is present and req.auth is set (Clerk middleware should handle this)
    if (!isAdmin && req.auth && req.auth.userId && hasClerk) {
      try {
        const user = await clerkClient.users.getUser(req.auth.userId)
        const emails = (user.emailAddresses || []).map((e) => String(e.emailAddress || '').toLowerCase())
        isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e))
        if (isAdmin) {
          console.log('Admin access granted via req.auth.userId, email:', emails)
        }
      } catch (err) {
        console.warn('Could not check admin from req.auth:', err?.message)
      }
    }
    
    console.log('Video access check:', {
      courseId: req.params.courseId,
      userId: userId || 'none',
      isAdmin: isAdmin,
      freePreview: lesson.freePreview,
      coursePrice: course.price,
      courseIsFree: course.isFree
    })
    
    // Admin can always access videos for preview
    if (isAdmin) {
      allowed = true
      console.log('Access granted: Admin user')
    } else if (!allowed) {
      // Free course (price = 0 or isFree flag)
      if (Number(course.price || 0) === 0 || course.isFree === true) {
        allowed = true
        console.log('Access granted: Free course')
      } else if (userId) {
        // Check enrollment
        allowed = await isUserEnrolled(userId, course.id)
        console.log('Enrollment check:', { userId, allowed })
      } else {
        console.log('Access denied: No userId provided')
      }
    } else {
      console.log('Access granted: Free preview')
    }
    
    if (!allowed) {
      console.error('Access denied for video:', {
        courseId: req.params.courseId,
        userId: userId || 'none',
        lessonTitle: lesson.title,
        freePreview: lesson.freePreview,
        coursePrice: course.price,
        courseIsFree: course.isFree
      })
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'You must be enrolled to access this video',
        courseId: req.params.courseId,
        userId: userId || null
      })
    }
    
    // Handle video path - it might be stored as /uploads/filename or just filename
    let fsPath
    if (lesson.videoPath.startsWith('/uploads/')) {
      // Path is /uploads/filename.ext, extract just filename
      fsPath = path.join(uploadsDir, path.basename(lesson.videoPath))
    } else if (lesson.videoPath.startsWith('uploads/')) {
      // Path is uploads/filename.ext
      fsPath = path.join(uploadsDir, lesson.videoPath.replace('uploads/', ''))
    } else {
      // Path is just filename.ext
      fsPath = path.join(uploadsDir, lesson.videoPath)
    }
    
    console.log('Looking for video file:', {
      videoPath: lesson.videoPath,
      fsPath: fsPath,
      uploadsDir: uploadsDir,
      exists: fs.existsSync(fsPath)
    })
    
    if (!fs.existsSync(fsPath)) {
      console.error('Video file not found:', {
        videoPath: lesson.videoPath,
        fsPath: fsPath,
        uploadsDir: uploadsDir,
        availableFiles: fs.existsSync(uploadsDir) ? fs.readdirSync(uploadsDir).slice(0, 5) : 'uploads dir does not exist'
      })
      return res.status(404).json({ 
        error: 'Video file not found',
        videoPath: lesson.videoPath,
        message: 'The video file does not exist on the server'
      })
    }
    
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
        'Cache-Control': 'public, max-age=3600'
      })
      file.pipe(res)
    } else {
      res.writeHead(200, {
        'Content-Length': stat.size,
        'Content-Type': mime,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
      })
      fs.createReadStream(fsPath).pipe(res)
    }
  } catch (error) {
    console.error('Error serving video:', error)
    return res.status(500).json({ error: 'Internal server error', message: error.message })
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
  
  // Get user email from Clerk if available
  let userEmail = null
  if (hasClerk && req.auth && req.auth.userId) {
    try {
      const user = await clerkClient.users.getUser(req.auth.userId)
      userEmail = user.emailAddresses?.[0]?.emailAddress?.toLowerCase()
    } catch (err) {
      console.warn('Could not get user email from Clerk:', err?.message)
    }
  }
  
  // Find enrollments by userId OR by email (if email matches)
  const query = { approved: true }
  if (userEmail) {
    query.$or = [
      { userId },
      { email: userEmail }
    ]
  } else {
    query.userId = userId
  }
  
  const list = await Enrollment.find(query).sort({ createdAt: -1 })
  console.log('Found approved enrollments:', list.length, 'for userId:', userId, 'email:', userEmail)
  
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

app.put('/api/teachers/:id', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, instrument, avatar } = req.body || {}
  if (!name || !instrument) return res.status(400).json({ error: 'Missing fields' })
  const doc = await Teacher.findByIdAndUpdate(
    req.params.id,
    { name, instrument, avatar },
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
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

// Admin: Update an enrollment
app.put('/api/admin/enrollments/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, courseId, approved, instrument } = req.body || {}
  
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (email !== undefined) updateData.email = email.trim().toLowerCase()
  if (courseId !== undefined) updateData.courseId = courseId
  if (approved !== undefined) updateData.approved = Boolean(approved)
  if (instrument !== undefined) updateData.instrument = instrument
  
  // Validate email if provided
  if (email !== undefined) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'Invalid email format' })
    }
  }
  
  // Check if course exists if courseId is being updated
  if (courseId !== undefined) {
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ error: 'Course not found' })
    }
  }
  
  const doc = await Enrollment.findByIdAndUpdate(req.params.id, updateData, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Admin: Delete an enrollment
app.delete('/api/admin/enrollments/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Enrollment.findByIdAndDelete(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json({ message: 'Enrollment deleted successfully', id: doc._id })
})

// Admin: Get enrollments filtered by manual enrollment (paymentId = 'manual-enrollment')
app.get('/api/admin/enrollments/manual', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Enrollment.find({ paymentId: 'manual-enrollment' }).sort({ createdAt: -1 })
  
  // Populate course information
  const courseIds = items.map(e => e.courseId).filter(Boolean)
  const courses = await Course.find({ _id: { $in: courseIds } })
  const idToCourse = new Map(courses.map(c => [String(c._id), c]))
  
  const result = items.map(e => ({
    ...e.toObject(),
    course: idToCourse.get(String(e.courseId)) || null
  }))
  
  res.json(result)
})

// Admin: Manually enroll a student by email
app.post('/api/admin/enrollments/manual', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { email, courseId, name } = req.body || {}
  
  if (!email || !courseId) {
    return res.status(400).json({ error: 'Email and course ID are required' })
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim().toLowerCase())) {
    return res.status(400).json({ error: 'Invalid email format' })
  }
  
  // Check if course exists
  const course = await Course.findById(courseId)
  if (!course) {
    return res.status(404).json({ error: 'Course not found' })
  }
  
  // Try to find user in Clerk by email
  let userId = null
  let studentName = name || 'Student'
  
  if (hasClerk) {
    try {
      // Search for user by email in Clerk
      const users = await clerkClient.users.getUserList({ emailAddress: [email.trim().toLowerCase()] })
      if (users && users.data && users.data.length > 0) {
        userId = users.data[0].id
        studentName = users.data[0].firstName || users.data[0].emailAddresses?.[0]?.emailAddress || studentName
      }
    } catch (err) {
      console.warn('Could not find user in Clerk by email:', err?.message)
      // Continue without userId - enrollment will work with email only
    }
  }
  
  // Check if enrollment already exists
  const existingEnrollment = userId 
    ? await Enrollment.findOne({ userId, courseId })
    : await Enrollment.findOne({ email: email.trim().toLowerCase(), courseId })
  
  if (existingEnrollment) {
    if (existingEnrollment.approved) {
      return res.status(400).json({ error: 'Student is already enrolled in this course' })
    } else {
      // Approve existing pending enrollment
      const updated = await Enrollment.findByIdAndUpdate(
        existingEnrollment._id,
        { approved: true, email: email.trim().toLowerCase(), name: studentName },
        { new: true }
      )
      return res.json({ 
        message: 'Existing enrollment approved',
        enrollment: updated 
      })
    }
  }
  
  // Create new enrollment (approved by default for manual enrollment)
  const enrollment = await Enrollment.create({
    name: studentName,
    email: email.trim().toLowerCase(),
    instrument: '',
    userId: userId || `email:${email.trim().toLowerCase()}`,
    courseId,
    approved: true,
    paymentId: 'manual-enrollment'
  })
  
  res.status(201).json({
    message: 'Student enrolled successfully',
    enrollment
  })
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

// Admin: Get all schedules (with optional date filter)
app.get('/api/admin/schedules', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const { date, courseId } = req.query || {}
  let query = {}
  if (date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    query.startTime = { $gte: startOfDay, $lte: endOfDay }
  }
  if (courseId) {
    query.courseId = courseId
  }
  const schedules = await Schedule.find(query).sort({ startTime: 1 })
  res.json(schedules)
})

// Admin: Create a schedule (supports single or multiple dates for duplication)
app.post('/api/admin/schedules', requireAdmin, async (req, res) => {
  console.log('POST /api/admin/schedules hit')
  try {
    if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
    const { courseId, title, description, startTime, endTime, dateTime, date, time, meetingLink, instructor, location, isRecurring, recurringPattern, type, duplicateDates } = req.body || {}
  
  // Support both dateTime format and separate date/time format
  let finalStartTime, finalEndTime
  if (dateTime) {
    finalStartTime = new Date(dateTime)
    finalEndTime = new Date(finalStartTime.getTime() + 60 * 60 * 1000) // Default 1 hour duration
  } else if (date && time) {
    finalStartTime = new Date(`${date}T${time}`)
    finalEndTime = new Date(finalStartTime.getTime() + 60 * 60 * 1000) // Default 1 hour duration
  } else if (startTime && endTime) {
    finalStartTime = new Date(startTime)
    finalEndTime = new Date(endTime)
  } else {
    return res.status(400).json({ error: 'Missing required fields: need dateTime or (date and time) or (startTime and endTime)' })
  }
  
  if (!title) return res.status(400).json({ error: 'Title is required' })
  
  // If duplicateDates is provided, create multiple events
  if (duplicateDates && Array.isArray(duplicateDates) && duplicateDates.length > 0) {
    const schedules = []
    // Create event on original date first
    const originalSchedule = await Schedule.create({
      courseId: courseId || '',
      title,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      meetingLink,
      instructor,
      location,
      isRecurring: Boolean(isRecurring),
      recurringPattern,
      type: type || 'class'
    })
    schedules.push(originalSchedule)
    
    // Create events on duplicate dates
    for (const dupDate of duplicateDates) {
      // Skip if duplicate date is the same as original date
      const dupDateStr = new Date(dupDate).toISOString().split('T')[0]
      const originalDateStr = finalStartTime.toISOString().split('T')[0]
      if (dupDateStr === originalDateStr) continue
      
      const dupStartTime = new Date(dupDate)
      dupStartTime.setHours(finalStartTime.getHours(), finalStartTime.getMinutes(), 0, 0)
      const dupEndTime = new Date(dupStartTime.getTime() + (finalEndTime.getTime() - finalStartTime.getTime()))
      
      const schedule = await Schedule.create({
        courseId: courseId || '',
        title,
        description,
        startTime: dupStartTime,
        endTime: dupEndTime,
        meetingLink,
        instructor,
        location,
        isRecurring: Boolean(isRecurring),
        recurringPattern,
        type: type || 'class'
      })
      schedules.push(schedule)
    }
    return res.status(201).json(schedules)
  }
  
  // Single event creation
  const schedule = await Schedule.create({
    courseId: courseId || '',
    title,
    description,
    startTime: finalStartTime,
    endTime: finalEndTime,
    meetingLink,
    instructor,
    location,
    isRecurring: Boolean(isRecurring),
    recurringPattern,
    type: type || 'class'
  })
  res.status(201).json(schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    res.status(500).json({ error: error.message || 'Failed to create schedule' })
  }
})

// Admin: Update a schedule
app.put('/api/admin/schedules/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, startTime, endTime, meetingLink, instructor, location, status, type } = req.body || {}
  
  const updateData = {}
  if (title !== undefined) updateData.title = title
  if (description !== undefined) updateData.description = description
  if (startTime !== undefined) updateData.startTime = new Date(startTime)
  if (endTime !== undefined) updateData.endTime = new Date(endTime)
  if (meetingLink !== undefined) updateData.meetingLink = meetingLink
  if (instructor !== undefined) updateData.instructor = instructor
  if (location !== undefined) updateData.location = location
  if (status !== undefined) updateData.status = status
  if (type !== undefined) updateData.type = type
  
  const schedule = await Schedule.findByIdAndUpdate(
    req.params.id,
    updateData,
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
app.post('/api/admin/resources', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
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

// Student: Get resources for enrolled courses OR free courses
app.get('/api/me/resources/:courseId', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json([])
  
  // Check if course is free
  const course = await Course.findById(req.params.courseId)
  const isFreeCourse = course && course.isFree === true
  
  // Check if user is enrolled (if not a free course)
  if (!isFreeCourse) {
    const enrollment = await Enrollment.findOne({ 
      userId: req.auth.userId, 
      courseId: req.params.courseId, 
      approved: true 
    })
    
    if (!enrollment) return res.status(403).json({ error: 'Not enrolled in this course' })
  }
  
  const resources = await Resource.find({ 
    courseId: req.params.courseId 
  }).sort({ order: 1 })
  
  res.json(resources)
})

// Get all free courses (available to all signed-in users)
app.get('/api/free-courses', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.json([])
  const courses = await Course.find({ isFree: true }).sort({ createdAt: -1 })
  res.json(courses)
})

// Track free resource view
app.post('/api/free-resources/track/view', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!dbConnected) return res.json([])
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
  
  // Check access: public resource OR enrolled user OR free course (via auth or userHint)
  let allowed = Boolean(resource.isPublic)
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  
  if (!allowed && userId) {
    // Check if course is free
    const course = await Course.findById(resource.courseId)
    if (course && course.isFree === true) {
      allowed = true
      console.log('Free course access granted:', { userId, courseId: resource.courseId })
    } else {
      // Check enrollment
      const enrollment = await Enrollment.findOne({ 
        userId, 
        courseId: resource.courseId, 
        approved: true 
      })
      allowed = Boolean(enrollment)
      console.log('Enrollment check:', { userId, courseId: resource.courseId, allowed, enrollment })
    }
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
  const { fullName, email, whatsapp, country, courseId, courseTitle } = req.body || {}
  if (!fullName || !email) return res.status(400).json({ error: 'Missing required fields' })
  const doc = await Lead.create({ 
    fullName, 
    email, 
    whatsapp: whatsapp || '', 
    country: country || '',
    courseId: courseId || '',
    courseTitle: courseTitle || ''
  })
  res.status(201).json({ id: doc._id, message: 'Lead captured' })
})

// Admin: list all leads (newest first)
app.get('/api/admin/leads', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Lead.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: delete a lead
app.delete('/api/leads/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const doc = await Lead.findByIdAndDelete(req.params.id)
  if (!doc) return res.status(404).json({ error: 'Lead not found' })
  res.json({ message: 'Lead deleted successfully', id: doc._id })
})

// ==================== CONTACT ENDPOINTS ====================

// Public: create a new contact form submission
app.post('/api/contact', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, phone, subject, message } = req.body || {}
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const doc = await Contact.create({
    name,
    email,
    phone: phone || '',
    subject,
    message,
    status: 'new'
  })
  res.status(201).json({ id: doc._id, message: 'Contact form submitted' })
})

// Admin: list all contact submissions (newest first)
app.get('/api/admin/contacts', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Contact.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: update contact status
app.put('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const contact = await Contact.findByIdAndUpdate(
    req.params.id,
    { status: status || 'read' },
    { new: true }
  )
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  res.json(contact)
})

// Admin: delete contact submission
app.delete('/api/admin/contacts/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const contact = await Contact.findByIdAndDelete(req.params.id)
  if (!contact) return res.status(404).json({ error: 'Contact not found' })
  res.json({ message: 'Contact deleted' })
})

// ==================== FAQ ENDPOINTS ====================

// Public: get all active FAQs
app.get('/api/faqs', async (req, res) => {
  if (!dbConnected) return res.json([])
  const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
  res.json(faqs)
})

// Admin: get all FAQs (including inactive)
app.get('/api/admin/faqs', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const faqs = await FAQ.find().sort({ order: 1, createdAt: -1 })
  res.json(faqs)
})

// Admin: create FAQ
app.post('/api/admin/faqs', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { question, answer, order, isActive } = req.body || {}
  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' })
  }
  const faq = await FAQ.create({
    question,
    answer,
    order: order || 0,
    isActive: isActive !== undefined ? isActive : true
  })
  res.status(201).json(faq)
})

// Admin: update FAQ
app.put('/api/admin/faqs/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { question, answer, order, isActive } = req.body || {}
  const faq = await FAQ.findByIdAndUpdate(
    req.params.id,
    { question, answer, order, isActive },
    { new: true }
  )
  if (!faq) return res.status(404).json({ error: 'FAQ not found' })
  res.json(faq)
})

// Admin: delete FAQ
app.delete('/api/admin/faqs/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const faq = await FAQ.findByIdAndDelete(req.params.id)
  if (!faq) return res.status(404).json({ error: 'FAQ not found' })
  res.json({ message: 'FAQ deleted' })
})

// ==================== CONSULTATION ENDPOINTS ====================

// Public: create a new consultation request
app.post('/api/consultations', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { name, email, phone, preferredDate, preferredTime, message, type } = req.body || {}
  if (!name || !email || !phone || !preferredDate || !preferredTime) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const doc = await Consultation.create({
    name,
    email,
    phone,
    preferredDate,
    preferredTime,
    message: message || '',
    type: type || 'consultation',
    status: 'new'
  })
  res.status(201).json({ id: doc._id, message: 'Consultation request submitted' })
})

// Admin: list all consultations (newest first)
app.get('/api/admin/consultations', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const items = await Consultation.find().sort({ createdAt: -1 })
  res.json(items)
})

// Admin: update consultation status
app.put('/api/admin/consultations/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const consultation = await Consultation.findByIdAndUpdate(
    req.params.id,
    { status: status || 'new' },
    { new: true }
  )
  if (!consultation) return res.status(404).json({ error: 'Consultation not found' })
  res.json(consultation)
})

// Admin: delete consultation
app.delete('/api/admin/consultations/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const consultation = await Consultation.findByIdAndDelete(req.params.id)
  if (!consultation) return res.status(404).json({ error: 'Consultation not found' })
  res.json({ message: 'Consultation deleted' })
})

// ==================== WORKSHOP ENDPOINTS ====================

// Public: get all active workshops
app.get('/api/workshops', async (req, res) => {
  if (!dbConnected) return res.json([])
  const workshops = await Workshop.find({ isActive: true }).sort({ createdAt: -1 })
  res.json(workshops)
})

// Public: get single workshop
app.get('/api/workshops/:id', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const workshop = await Workshop.findById(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json(workshop)
})

// Admin: get all workshops (including inactive)
app.get('/api/admin/workshops', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const workshops = await Workshop.find().sort({ createdAt: -1 })
  res.json(workshops)
})

// Admin: create workshop
app.post('/api/admin/workshops', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, image, date, time, duration, location, price, maxParticipants, isActive } = req.body || {}
  if (!title || !description) return res.status(400).json({ error: 'Missing required fields' })
  const workshop = await Workshop.create({
    title,
    description,
    image: image || '',
    date: date || '',
    time: time || '',
    duration: duration || '',
    location: location || '',
    price: Number(price) || 0,
    maxParticipants: Number(maxParticipants) || 20,
    isActive: isActive !== undefined ? isActive : true
  })
  res.status(201).json(workshop)
})

// Admin: update workshop
app.put('/api/admin/workshops/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, image, date, time, duration, location, price, maxParticipants, isActive } = req.body || {}
  const workshop = await Workshop.findByIdAndUpdate(
    req.params.id,
    {
      title,
      description,
      image,
      date,
      time,
      duration,
      location,
      price: Number(price) || 0,
      maxParticipants: Number(maxParticipants) || 20,
      isActive: isActive !== undefined ? isActive : true
    },
    { new: true }
  )
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json(workshop)
})

// Admin: delete workshop
app.delete('/api/admin/workshops/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const workshop = await Workshop.findByIdAndDelete(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  res.json({ message: 'Workshop deleted' })
})

// ==================== WORKSHOP ENROLLMENT ENDPOINTS ====================

// Authenticated: enroll in workshop
app.post('/api/workshops/:id/enroll', requireAuthGuarded, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const userId = req.auth.userId
  const { name, email, phone, message } = req.body || {}
  if (!name || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' })
  }
  const workshop = await Workshop.findById(req.params.id)
  if (!workshop) return res.status(404).json({ error: 'Workshop not found' })
  if (!workshop.isActive) return res.status(400).json({ error: 'Workshop is not active' })
  
  const enrollment = await WorkshopEnrollment.create({
    workshopId: req.params.id,
    userId,
    name,
    email,
    phone,
    message: message || '',
    status: 'pending'
  })
  res.status(201).json({ id: enrollment._id, message: 'Enrollment submitted successfully' })
})

// Admin: get all workshop enrollments
app.get('/api/admin/workshop-enrollments', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.json([])
  const enrollments = await WorkshopEnrollment.find()
    .populate('workshopId', 'title')
    .sort({ createdAt: -1 })
  res.json(enrollments)
})

// Admin: update enrollment status
app.put('/api/admin/workshop-enrollments/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const { status } = req.body || {}
  const enrollment = await WorkshopEnrollment.findByIdAndUpdate(
    req.params.id,
    { status: status || 'pending' },
    { new: true }
  ).populate('workshopId', 'title')
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })
  res.json(enrollment)
})

// Admin: delete enrollment
app.delete('/api/admin/workshop-enrollments/:id', requireAdmin, async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'Database unavailable' })
  const enrollment = await WorkshopEnrollment.findByIdAndDelete(req.params.id)
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' })
  res.json({ message: 'Enrollment deleted' })
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API listening on http://localhost:${port}`))


