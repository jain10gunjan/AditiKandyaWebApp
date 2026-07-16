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
app.get('/api/resources/:resourceId/file', async (req, res) => {
  if (!isDbConnected()) {
    console.error('Database not connected')
    return res.status(503).end()
  }
  
  const resource = await Resource.findById(req.params.resourceId)
  if (!resource || !resource.filePath) {
    console.error('Resource not found or no filePath:', req.params.resourceId, resource)
    return res.status(404).end()
  }
  
  console.log('Serving resource:', resource._id, 'filePath:', resource.filePath)

  // Access rules:
  // - isPublic: streamable without auth (shared library; media tags cannot send Bearer)
  // - otherwise: signed-in + free course OR approved non-deleted enrollment
  const userId = (req.auth && req.auth.userId) || req.query.userHint
  let allowed = Boolean(resource.isPublic)

  if (!allowed) {
    if (!userId) {
      return res.status(401).end()
    }

    const course = resource.courseId
      ? await Course.findById(resource.courseId).select('_id isFree').lean()
      : null

    if (course && course.isFree === true) {
      allowed = true
    } else if (resource.courseId) {
      allowed = await isUserEnrolled(userId, String(resource.courseId))
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
}

module.exports = register
