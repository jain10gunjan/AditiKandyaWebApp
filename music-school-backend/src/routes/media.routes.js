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
app.get('/api/media/video/:courseId/:mIdx/:lIdx', async (req, res) => {
  if (!isDbConnected()) {
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
  if (!isDbConnected()) return res.status(503).end()
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
}

module.exports = register
