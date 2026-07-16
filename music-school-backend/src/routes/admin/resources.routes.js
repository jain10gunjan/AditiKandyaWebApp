const deps = require('../deps')
const {
  Course,
  Resource,
  isDbConnected,
  requireAdmin,
  upload,
  decompressFileIfNeeded,
} = deps

function parseBool(value) {
  if (typeof value === 'boolean') return value
  const v = String(value ?? '').trim().toLowerCase()
  return v === 'true' || v === '1' || v === 'on' || v === 'yes'
}

async function attachCourseTitles(resources) {
  const list = resources || []
  const courseIds = Array.from(new Set(list.map(r => String(r.courseId || '')).filter(Boolean)))
  const courses = courseIds.length
    ? await Course.find({ _id: { $in: courseIds } }).select('_id title isFree').lean()
    : []
  const titleById = new Map((courses || []).map(c => [String(c._id), c]))
  return list.map(r => {
    const raw = typeof r.toObject === 'function' ? r.toObject() : r
    const course = titleById.get(String(raw.courseId || '')) || null
    return {
      ...raw,
      courseTitle: course?.title || null,
      courseIsFree: Boolean(course?.isFree),
    }
  })
}

function register(app) {
// Admin: List resources (optional filters). Must be registered before /:courseId.
app.get('/api/admin/resources', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')

  const { courseId, shared, type, q } = req.query || {}
  const query = {}

  if (courseId && String(courseId) !== 'all') {
    query.courseId = String(courseId)
  }
  if (shared === 'true' || shared === '1') {
    query.isPublic = true
  } else if (shared === 'false' || shared === '0') {
    query.isPublic = { $ne: true }
  }
  if (type && type !== 'all') {
    query.type = String(type)
  }
  if (q && String(q).trim()) {
    const term = String(q).trim()
    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { description: { $regex: term, $options: 'i' } },
    ]
  }

  const resources = await Resource.find(query).sort({ order: 1, createdAt: -1 }).lean()
  res.json(await attachCourseTitles(resources))
})

app.post('/api/admin/resources', requireAdmin, upload.single('file'), decompressFileIfNeeded, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { courseId, title, description, type, isPublic, order } = req.body || {}
  if (!courseId || !title) return res.status(400).json({ error: 'Missing required fields' })

  const course = await Course.findById(courseId).select('_id').lean()
  if (!course) return res.status(404).json({ error: 'Course not found' })

  const resource = await Resource.create({
    courseId: String(courseId),
    title: String(title).trim(),
    description: description || '',
    type: type || 'video',
    filePath: req.file ? `/uploads/${req.file.filename}` : undefined,
    isPublic: parseBool(isPublic),
    order: Number(order || 0),
  })
  res.status(201).json(resource)
})

// Admin: Update a resource (metadata; optional course move + shared toggle)
app.put('/api/admin/resources/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const { title, description, isPublic, order, type, courseId } = req.body || {}

  const update = {}
  if (title !== undefined) update.title = String(title).trim()
  if (description !== undefined) update.description = description
  if (isPublic !== undefined) update.isPublic = parseBool(isPublic)
  if (order !== undefined) update.order = Number(order || 0)
  if (type !== undefined) update.type = type
  if (courseId !== undefined) {
    const course = await Course.findById(courseId).select('_id').lean()
    if (!course) return res.status(404).json({ error: 'Course not found' })
    update.courseId = String(courseId)
  }

  const resource = await Resource.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!resource) return res.status(404).json({ error: 'Resource not found' })
  res.json(resource)
})

// Admin: Quick toggle shared flag
app.patch('/api/admin/resources/:id/shared', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const isPublic = parseBool(req.body?.isPublic)
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { isPublic },
    { new: true }
  )
  if (!resource) return res.status(404).json({ error: 'Resource not found' })
  res.json(resource)
})

app.delete('/api/admin/resources/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Resource.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Resource not found' })
  res.json({ ok: true })
})

// Admin: Get all resources for a course (legacy path)
app.get('/api/admin/resources/:courseId', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  res.set('Cache-Control', 'no-store')
  // Avoid treating "shared" style reserved words as ids if added later
  const courseId = String(req.params.courseId || '')
  const resources = await Resource.find({ courseId }).sort({ order: 1, createdAt: -1 }).lean()
  res.json(await attachCourseTitles(resources))
})
}

module.exports = register
