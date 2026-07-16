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
app.post('/api/courses/:id/free-enroll', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const course = await Course.findById(req.params.id)
  if (!course) return res.status(404).json({ error: 'Course not found' })
  if (Number(course.price || 0) > 0) return res.status(400).json({ error: 'Paid course' })
  const existing = await Enrollment.findOne({ userId: req.auth.userId, courseId: course.id })
  if (existing) return res.json(existing)
  const doc = await Enrollment.create({ name: 'Free Enroll', email: '', instrument: '', userId: req.auth.userId, courseId: course.id, approved: false })
  res.status(201).json(doc)
})

// Demo enrollment without payments/auth (for local preview only)

app.get('/api/courses', async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const items = await Course.find().sort({ displayOrder: 1, createdAt: -1 })
  res.json(items)
})

app.get('/api/courses/:id', async (req, res) => {
  if (!isDbConnected()) return res.status(404).json({ error: 'Not found' })
  const item = await Course.findById(req.params.id)
  if (!item) return res.status(404).json({ error: 'Not found' })
  res.json(item)
})

app.post('/api/courses', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, price, image, level, teacherId } = req.body || {}
  if (!title || !description) return res.status(400).json({ error: 'Missing fields' })
  
  const courseData = { title, description, price, image, level }

  // Assign displayOrder at the end by default
  const max = await Course.findOne().sort({ displayOrder: -1, createdAt: -1 }).select('displayOrder').lean()
  const nextOrder = (max?.displayOrder ?? 0) + 1
  courseData.displayOrder = nextOrder
  
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { 
    title, description, price, image, level, 
    studentCount, rating, isFree,
    teacherId, teacherName, teacherDescription, teacherAvatar, teacherInstrument,
    scales, arpeggios, performanceTips,
    badgeText, badgeColor, pricingFeatures, videoPlayerText, videoPlayerSubtext, videoPlayerFeatures
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
  
  // Display settings
  if (badgeText !== undefined) updateData.badgeText = badgeText
  if (badgeColor !== undefined) updateData.badgeColor = badgeColor
  if (pricingFeatures !== undefined) updateData.pricingFeatures = pricingFeatures
  if (videoPlayerText !== undefined) updateData.videoPlayerText = videoPlayerText
  if (videoPlayerSubtext !== undefined) updateData.videoPlayerSubtext = videoPlayerSubtext
  if (videoPlayerFeatures !== undefined) updateData.videoPlayerFeatures = videoPlayerFeatures

  if (req.body.displayOrder !== undefined) updateData.displayOrder = Number(req.body.displayOrder) || 0
  
  const doc = await Course.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  )
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Admin: batch update course displayOrder after drag-and-drop reorder

app.patch('/api/admin/courses/display-order', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { updates } = req.body || {}
  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'updates array is required' })
  }

  const ops = updates
    .map(u => ({
      id: String(u?._id || u?.id || '').trim(),
      displayOrder: Number(u?.displayOrder),
    }))
    .filter(u => u.id && Number.isFinite(u.displayOrder))

  if (ops.length === 0) return res.status(400).json({ error: 'No valid updates' })

  const bulk = ops.map(u => ({
    updateOne: {
      filter: { _id: u.id },
      update: { $set: { displayOrder: u.displayOrder } },
    }
  }))

  await Course.bulkWrite(bulk, { ordered: false })
  res.json({ ok: true, updated: ops.length })
})

app.delete('/api/courses/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Course.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Not found' })
  // Also delete associated dynamic pricing
  await DynamicPricing.deleteMany({ courseId: req.params.id })
  res.json({ ok: true })
})

// Dynamic Pricing API Endpoints
// Get all dynamic pricing for a course

app.post('/api/courses/:id/thumbnail', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Missing title' })
  const update = { $push: { modules: { title, order: Number(order || 0), lessons: [] } } }
  const doc = await Course.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

// Update module

app.put('/api/courses/:id/modules/:mIdx', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, order } = req.body || {}
  if (!title) return res.status(400).json({ error: 'Missing title' })
  const update = { $push: { chapters: { title, order: Number(order || 0), modules: [] } } }
  const doc = await Course.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!doc) return res.status(404).json({ error: 'Not found' })
  res.json(doc)
})

app.post('/api/courses/:id/chapters/:cIdx/modules', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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

// Debug endpoint to check course structure

app.get('/api/courses/:id/access', async (req, res) => {
  if (!isDbConnected()) return res.json({ enrolled: false })
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  if (!userId) return res.json({ enrolled: false })
  const enrolled = await isUserEnrolled(userId, req.params.id)
  res.json({ enrolled })
})

// Progress tracking endpoints

app.get('/api/courses/:id/progress', requireAuthGuarded, async (req, res) => {
  if (!isDbConnected()) return res.json({})
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
}

module.exports = register
