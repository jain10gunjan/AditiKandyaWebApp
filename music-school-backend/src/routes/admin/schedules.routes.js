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
function register(app) {
app.get('/api/admin/schedules', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { date, courseId } = req.query || {}
  let query = {
    $or: [
      { studentId: { $exists: false } },
      { studentId: null }
    ]
  }
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
  console.log('Request body:', JSON.stringify(req.body, null, 2))
  try {
    if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
    const { courseId, studentId, title, description, startTime, endTime, dateTime, date, time, meetingLink, instructor, location, isRecurring, recurringPattern, type, duplicateDates, repeatWeeks } = req.body || {}
    
    console.log('Parsed studentId:', studentId, 'Type:', typeof studentId)
  
  // Support both dateTime format and separate date/time format
  let finalStartTime, finalEndTime
  if (startTime && endTime) {
    // If startTime and endTime are provided, use them directly
    finalStartTime = new Date(startTime)
    finalEndTime = new Date(endTime)
    // Validate dates
    if (isNaN(finalStartTime.getTime()) || isNaN(finalEndTime.getTime())) {
      return res.status(400).json({ error: 'Invalid startTime or endTime format' })
    }
    if (finalEndTime <= finalStartTime) {
      return res.status(400).json({ error: 'endTime must be after startTime' })
    }
  } else if (dateTime) {
    finalStartTime = new Date(dateTime)
    finalEndTime = new Date(finalStartTime.getTime() + 60 * 60 * 1000) // Default 1 hour duration
  } else if (date && time) {
    // Construct date with proper timezone handling
    const dateTimeString = `${date}T${time}:00`
    finalStartTime = new Date(dateTimeString)
    // If no endTime provided, default to 1 hour
    finalEndTime = new Date(finalStartTime.getTime() + 60 * 60 * 1000)
  } else {
    return res.status(400).json({ error: 'Missing required fields: need (startTime and endTime) or dateTime or (date and time)' })
  }
  
  if (!title) return res.status(400).json({ error: 'Title is required' })

  const repeatWeeksInt = repeatWeeks !== undefined && repeatWeeks !== null
    ? Math.max(1, parseInt(repeatWeeks, 10) || 1)
    : 1
  
  // Check for time slot conflicts with existing schedules
  // Since it's a single teacher, check all scheduled events regardless of student/course
  const checkConflict = async (startTime, endTime, excludeScheduleId = null) => {
    // Find all scheduled events that overlap with the given time slot
    // Two intervals overlap if: start1 < end2 AND start2 < end1
    const conflictingSchedules = await Schedule.find({
      status: 'scheduled',
      startTime: { $lt: endTime },
      endTime: { $gt: startTime }
    }).lean()
    
    // Filter out the schedule being edited (if any)
    const conflicts = excludeScheduleId 
      ? conflictingSchedules.filter(s => String(s._id) !== String(excludeScheduleId))
      : conflictingSchedules
    
    if (conflicts.length > 0) {
      // Get student information for conflicts
      const conflictDetails = await Promise.all(conflicts.map(async (conflict) => {
        let studentInfo = 'Unknown Student'
        let courseInfo = 'Unknown Course'
        
        if (conflict.studentId) {
          // Try to get student info from enrollments
          const enrollment = await Enrollment.findOne({ userId: conflict.studentId }).lean()
          if (enrollment) {
            studentInfo = enrollment.name || enrollment.email || 'Unknown Student'
          }
        }
        
        if (conflict.courseId) {
          const course = await Course.findById(conflict.courseId).lean()
          if (course) {
            courseInfo = course.title
          } else if (typeof conflict.courseId === 'object' && conflict.courseId.title) {
            courseInfo = conflict.courseId.title
          }
        }
        
        return {
          title: conflict.title,
          student: studentInfo,
          course: courseInfo,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
          studentId: conflict.studentId
        }
      }))
      
      return conflictDetails
    }
    
    return null
  }
  
  // If duplicateDates or repeatWeeks is provided, check all conflicts first before creating any schedules
  const hasDuplicateDates = Boolean(duplicateDates && Array.isArray(duplicateDates) && duplicateDates.length > 0)
  const hasRepeatWeeks = repeatWeeksInt > 1
  if (hasDuplicateDates || hasRepeatWeeks) {
    // Check conflict for the main schedule
    const mainConflicts = await checkConflict(finalStartTime, finalEndTime)
    if (mainConflicts && mainConflicts.length > 0) {
      const conflictMessages = mainConflicts.map(c => {
        const startStr = new Date(c.startTime).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        const endStr = new Date(c.endTime).toLocaleString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        return `"${c.title}" for ${c.student} (${c.course}) from ${startStr} to ${endStr}`
      }).join(', ')
      
      return res.status(409).json({ 
        error: 'Time slot conflict detected',
        conflicts: mainConflicts,
        message: `This time slot is already booked: ${conflictMessages}`
      })
    }
    
    // Build all additional occurrences (duplicates or weekly repeats) and check conflicts
    const allConflicts = []
    const additionalOccurrences = []

    const duration = finalEndTime.getTime() - finalStartTime.getTime()

    if (hasDuplicateDates) {
      for (const dupDate of duplicateDates) {
        const dupDateStr = new Date(dupDate).toISOString().split('T')[0]
        const originalDateStr = finalStartTime.toISOString().split('T')[0]
        if (dupDateStr === originalDateStr) continue

        // Construct the duplicate start time in UTC, preserving the original start time-of-day.
        // Using setHours/getHours mixes in server local timezone and causes day/time shifts in production.
        const [y, m, d] = dupDateStr.split('-').map(n => parseInt(n, 10))
        const dupStartTime = new Date(Date.UTC(
          y,
          (m || 1) - 1,
          d || 1,
          finalStartTime.getUTCHours(),
          finalStartTime.getUTCMinutes(),
          finalStartTime.getUTCSeconds(),
          0
        ))
        const dupEndTime = new Date(dupStartTime.getTime() + duration)
        additionalOccurrences.push({ startTime: dupStartTime, endTime: dupEndTime, label: dupDateStr })
      }
    } else if (hasRepeatWeeks) {
      // Repeat weekly for N weeks based on the start date's weekday, keeping the same time/duration
      // Creates (repeatWeeksInt - 1) additional sessions after the first one.
      for (let i = 1; i < repeatWeeksInt; i++) {
        const dupStartTime = new Date(finalStartTime.getTime() + i * 7 * 24 * 60 * 60 * 1000)
        const dupEndTime = new Date(dupStartTime.getTime() + duration)
        additionalOccurrences.push({ startTime: dupStartTime, endTime: dupEndTime, label: dupStartTime.toISOString() })
      }
    }

    for (const occ of additionalOccurrences) {
      const occConflicts = await checkConflict(occ.startTime, occ.endTime)
      if (occConflicts && occConflicts.length > 0) {
        allConflicts.push({
          date: occ.label,
          conflicts: occConflicts
        })
      }
    }
    
    // If any conflicts found, return error before creating any schedules
    if (allConflicts.length > 0) {
      const conflictMessages = allConflicts.map(({ date, conflicts }) => {
        const dateStr = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        const conflictDetails = conflicts.map(c => {
          const startStr = new Date(c.startTime).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          const endStr = new Date(c.endTime).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
          return `"${c.title}" for ${c.student} (${c.course}) from ${startStr} to ${endStr}`
        }).join(', ')
        return `${dateStr}: ${conflictDetails}`
      }).join('; ')
      
      return res.status(409).json({ 
        error: 'Time slot conflict detected on duplicate dates',
        conflicts: allConflicts.flatMap(ac => ac.conflicts),
        message: `Time slot conflicts detected: ${conflictMessages}`
      })
    }
    
    // All checks passed, now create schedules with parent-child linkage
    const schedules = []

    const baseScheduleData = {
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
      type: type || 'class',
      status: 'scheduled'
    }

    if (studentId && String(studentId).trim() !== '') {
      baseScheduleData.studentId = String(studentId).trim()
      console.log('Setting studentId for schedule:', baseScheduleData.studentId)
    } else {
      console.log('No studentId provided, creating course-level schedule')
    }

    const parentSchedule = await Schedule.create(baseScheduleData)
    schedules.push(parentSchedule)

    for (const occ of additionalOccurrences) {
      const childData = {
        ...baseScheduleData,
        startTime: occ.startTime,
        endTime: occ.endTime,
        parentScheduleId: String(parentSchedule._id),
      }
      const child = await Schedule.create(childData)
      schedules.push(child)
    }

    return res.status(201).json(schedules)
  }
  
  // Single event creation - check for conflicts
  const conflicts = await checkConflict(finalStartTime, finalEndTime)
  if (conflicts && conflicts.length > 0) {
    const conflictMessages = conflicts.map(c => {
      const startStr = new Date(c.startTime).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const endStr = new Date(c.endTime).toLocaleString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      return `"${c.title}" for ${c.student} (${c.course}) from ${startStr} to ${endStr}`
    }).join(', ')
    
    return res.status(409).json({ 
      error: 'Time slot conflict detected',
      conflicts: conflicts,
      message: `This time slot is already booked: ${conflictMessages}`
    })
  }
  
  const scheduleData = {
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
    type: type || 'class',
    status: 'scheduled'
  }
  
  // Only set studentId if it's provided and not empty
  if (studentId && String(studentId).trim() !== '') {
    scheduleData.studentId = String(studentId).trim()
    console.log('Setting studentId for single schedule:', scheduleData.studentId)
    console.log('StudentId type:', typeof scheduleData.studentId, 'Length:', scheduleData.studentId.length)
  } else {
    console.log('No studentId provided, creating course-level schedule')
  }
  
  const schedule = await Schedule.create(scheduleData)
  console.log('Created schedule:', {
    id: schedule._id,
    title: schedule.title,
    studentId: schedule.studentId,
    studentIdType: typeof schedule.studentId,
    courseId: schedule.courseId,
    startTime: schedule.startTime,
    status: schedule.status
  })
  
  // Verify the schedule was created correctly
  const verifySchedule = await Schedule.findById(schedule._id)
  console.log('Verified schedule from DB:', {
    id: verifySchedule._id,
    studentId: verifySchedule.studentId,
    studentIdExists: verifySchedule.studentId !== undefined && verifySchedule.studentId !== null
  })
  
  res.status(201).json(schedule)
  } catch (error) {
    console.error('Error creating schedule:', error)
    res.status(500).json({ error: error.message || 'Failed to create schedule' })
  }
})

// Admin: Update a schedule

app.put('/api/admin/schedules/:id', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
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
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  const ok = await Schedule.findByIdAndDelete(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Schedule not found' })
  res.json({ ok: true })
})

// Admin: Delete ALL schedules (use with caution!)

app.delete('/api/admin/schedules', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.status(503).json({ error: 'Database unavailable' })
  try {
    const result = await Schedule.deleteMany({})
    res.json({ 
      ok: true, 
      deletedCount: result.deletedCount,
      message: `Successfully deleted ${result.deletedCount} schedule(s) from the database`
    })
  } catch (error) {
    console.error('Error deleting all schedules:', error)
    res.status(500).json({ error: error.message || 'Failed to delete schedules' })
  }
})

// Admin: Get all schedules for a course

app.get('/api/admin/schedules/:courseId', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const schedules = await Schedule.find({ courseId: req.params.courseId }).sort({ startTime: 1 })
  res.json(schedules)
})

// Admin: Get all student-specific schedules (with optional studentId filter)

app.get('/api/admin/student-schedules', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { studentId, courseId, date } = req.query || {}
  let query = {}
  
  // Only student-specific schedules (studentId exists and is not null)
  if (studentId) {
    query.studentId = studentId
  } else {
    query.studentId = { $exists: true, $ne: null }
  }
  
  if (courseId) {
    query.courseId = courseId
  }
  if (date) {
    // Handle date filtering with proper timezone handling
    // Create date range in UTC to avoid timezone issues
    const dateObj = new Date(date)
    // Get the date string in YYYY-MM-DD format
    const dateStr = date.includes('T') ? date.split('T')[0] : date
    // Create start and end of day in UTC
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`)
    const endOfDay = new Date(`${dateStr}T23:59:59.999Z`)
    query.startTime = { $gte: startOfDay, $lte: endOfDay }
  }
  
  const schedules = await Schedule.find(query).sort({ startTime: 1 })
  res.json(schedules)
})

// Admin: Get student-specific schedules for a course within a date range (efficient month loading)
// Query params:
// - courseId (required)
// - startDate YYYY-MM-DD (required)
// - endDate YYYY-MM-DD (required)
// - studentIds (optional, comma-separated)

app.get('/api/admin/student-schedules-range', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const { courseId, startDate, endDate, studentIds } = req.query || {}
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' })
  }

  const startDateStr = String(startDate).includes('T') ? String(startDate).split('T')[0] : String(startDate)
  const endDateStr = String(endDate).includes('T') ? String(endDate).split('T')[0] : String(endDate)

  const startOfRange = new Date(`${startDateStr}T00:00:00.000Z`)
  const endOfRange = new Date(`${endDateStr}T23:59:59.999Z`)

  const query = {
    studentId: { $exists: true, $ne: null, $ne: '' },
    startTime: { $gte: startOfRange, $lte: endOfRange },
  }

  // Omit course filter when courseId is missing or "all"
  if (courseId && String(courseId) !== 'all') {
    query.courseId = String(courseId)
  }

  if (studentIds) {
    const ids = String(studentIds)
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    if (ids.length > 0) query.studentId = { $in: ids }
  }

  // Return minimal fields for performance; sort stable by time
  const schedules = await Schedule.find(query)
    .select('_id studentId courseId startTime endTime title type status')
    .sort({ startTime: 1 })
    .lean()

  res.json(schedules)
})

// Admin: Get enrollments for a course (to show students)

app.get('/api/admin/courses/:courseId/enrollments', requireAdmin, async (req, res) => {
  if (!isDbConnected()) return res.json([])
  const enrollments = await Enrollment.find({ courseId: req.params.courseId, approved: true, status: { $ne: 'deleted' } }).sort({ createdAt: -1 })
  res.json(enrollments)
})

// Student: Get their upcoming schedules for enrolled courses
}

module.exports = register
