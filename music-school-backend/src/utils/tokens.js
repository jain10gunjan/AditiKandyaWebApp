const { Token } = require('../models')
const { isDbConnected } = require('../config/db')
const { getClerkUser } = require('./clerkUserCache')

async function getUserEmail(userId) {
  if (!userId) return null
  try {
    const user = await getClerkUser(userId)
    return user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || null
  } catch (err) {
    console.warn('Could not get user email for userId:', userId, err?.message)
    return null
  }
}

async function findTokenRecord(studentEmail, studentId, courseId, year, month) {
  const normalizedCourseId = String(courseId)

  if (studentEmail) {
    const normalizedEmail = studentEmail.toLowerCase()
    const byEmail = await Token.findOne({
      studentEmail: normalizedEmail,
      courseId: normalizedCourseId,
      year,
      month,
    })
    if (byEmail) {
      console.log('✓ Found token record by EMAIL:', normalizedEmail, {
        remainingTokens: byEmail.remainingTokens,
        waivedTokens: byEmail.waivedTokens,
        studentId: byEmail.studentId,
      })
      return byEmail
    }
    console.log('✗ No token record found by email:', normalizedEmail)
  } else {
    console.log('⚠ No student email provided for lookup')
  }

  if (studentId) {
    const normalizedStudentId = String(studentId)
    const byUserId = await Token.findOne({
      studentId: normalizedStudentId,
      courseId: normalizedCourseId,
      year,
      month,
    })
    if (byUserId) {
      console.log('✓ Found token record by userId (fallback):', normalizedStudentId, {
        remainingTokens: byUserId.remainingTokens,
        waivedTokens: byUserId.waivedTokens,
        studentEmail: byUserId.studentEmail,
      })
      if (studentEmail && !byUserId.studentEmail) {
        byUserId.studentEmail = studentEmail.toLowerCase()
        await byUserId.save()
        console.log('Updated token record with email:', studentEmail.toLowerCase())
      }
      return byUserId
    }
    console.log('✗ No token record found by userId:', normalizedStudentId)
  }

  const allRecords = await Token.find({
    courseId: normalizedCourseId,
    year,
    month,
  })
  if (allRecords.length > 0) {
    console.log(
      'All token records for this course/period:',
      allRecords.map((r) => ({
        _id: r._id,
        studentId: r.studentId,
        studentEmail: r.studentEmail,
        remainingTokens: r.remainingTokens,
        waivedTokens: r.waivedTokens,
      }))
    )
  }

  return null
}

async function updateTokensForAttendance(studentId, courseId, date, status, previousStatus, markedBy) {
  if (!isDbConnected()) {
    console.error('Cannot update tokens: Database not connected')
    return
  }

  try {
    let dateObj
    if (typeof date === 'string') {
      const parts = date.split('-')
      if (parts.length === 3) {
        dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
      } else {
        dateObj = new Date(date)
      }
    } else {
      dateObj = new Date(date)
    }

    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1

    let studentEmail = await getUserEmail(studentId)
    const normalizedStudentId = String(studentId)
    const normalizedCourseId = String(courseId)

    console.log('Updating tokens:', { studentId, studentEmail, courseId, date, year, month, status, previousStatus })

    let tokenRecord = await findTokenRecord(studentEmail, normalizedStudentId, normalizedCourseId, year, month)
    const isNewRecord = !tokenRecord

    console.log('Token lookup:', {
      normalizedStudentId,
      normalizedCourseId,
      year,
      month,
      found: !!tokenRecord,
      existingRecord: tokenRecord
        ? {
            remainingTokens: tokenRecord.remainingTokens,
            totalTokens: tokenRecord.totalTokens,
            waivedTokens: tokenRecord.waivedTokens,
          }
        : null,
    })

    if (!tokenRecord) {
      if (!studentEmail) {
        console.error('CRITICAL ERROR: Cannot create token record without email! studentId:', normalizedStudentId)
        const retryEmail = await getUserEmail(normalizedStudentId)
        if (!retryEmail) {
          console.error('Failed to get email after retry - skipping token record creation')
          return
        }
        studentEmail = retryEmail
      }

      tokenRecord = new Token({
        studentId: normalizedStudentId,
        studentEmail: studentEmail.toLowerCase(),
        courseId: normalizedCourseId,
        year,
        month,
        totalTokens: 4,
        remainingTokens: 4,
        waivedTokens: 0,
        manualAdjustment: 0,
        lastUpdatedBy: markedBy,
      })
      console.log('Created new token record with email:', studentEmail.toLowerCase(), {
        studentId: tokenRecord.studentId,
        studentEmail: tokenRecord.studentEmail,
        courseId: tokenRecord.courseId,
        year: tokenRecord.year,
        month: tokenRecord.month,
        remainingTokens: tokenRecord.remainingTokens,
      })
    } else {
      if (studentEmail) {
        const normalizedEmail = studentEmail.toLowerCase()
        if (!tokenRecord.studentEmail || tokenRecord.studentEmail !== normalizedEmail) {
          console.log('Updating token record email:', {
            oldEmail: tokenRecord.studentEmail,
            newEmail: normalizedEmail,
            oldStudentId: tokenRecord.studentId,
            newStudentId: normalizedStudentId,
          })
          tokenRecord.studentEmail = normalizedEmail
          tokenRecord.studentId = normalizedStudentId
          await tokenRecord.save()
        }
      }

      console.log('Found existing token record:', {
        studentId: tokenRecord.studentId,
        studentEmail: tokenRecord.studentEmail,
        courseId: tokenRecord.courseId,
        year: tokenRecord.year,
        month: tokenRecord.month,
        remainingTokens: tokenRecord.remainingTokens,
        totalTokens: tokenRecord.totalTokens,
        waivedTokens: tokenRecord.waivedTokens,
      })
    }

    if (previousStatus && previousStatus !== status) {
      console.log('Reversing previous status:', previousStatus)
      if (previousStatus === 'present' || previousStatus === 'absent' || previousStatus === 'late') {
        tokenRecord.remainingTokens = Math.min(tokenRecord.remainingTokens + 1, tokenRecord.totalTokens)
        console.log('Reversed present/absent. Remaining tokens:', tokenRecord.remainingTokens)
      } else if (previousStatus === 'waived') {
        tokenRecord.remainingTokens = Math.min(tokenRecord.remainingTokens + 1, tokenRecord.totalTokens)
        tokenRecord.waivedTokens = Math.max((tokenRecord.waivedTokens || 0) - 1, 0)
        console.log('Reversed waived. Remaining tokens:', tokenRecord.remainingTokens, 'Waived:', tokenRecord.waivedTokens)
      }
    }

    if (status === 'present' || status === 'absent' || status === 'late') {
      if (tokenRecord.remainingTokens > 0) {
        tokenRecord.remainingTokens = Math.max(tokenRecord.remainingTokens - 1, 0)
        console.log('Reduced token for present/absent/late. New remaining:', tokenRecord.remainingTokens, 'Status:', status)
      } else {
        console.log('Warning: Cannot reduce token - remainingTokens is already 0')
      }
    } else if (status === 'waived') {
      if (tokenRecord.remainingTokens > 0) {
        tokenRecord.remainingTokens = Math.max(tokenRecord.remainingTokens - 1, 0)
        tokenRecord.waivedTokens = (tokenRecord.waivedTokens || 0) + 1
        console.log('Reduced token for waived. New remaining:', tokenRecord.remainingTokens, 'Waived:', tokenRecord.waivedTokens)
      } else {
        console.log('Warning: Cannot reduce token - remainingTokens is already 0')
      }
    }

    tokenRecord.lastUpdatedBy = markedBy
    const savedRecord = await tokenRecord.save()

    console.log('Token saved successfully:', {
      studentId: savedRecord.studentId,
      courseId: savedRecord.courseId,
      year: savedRecord.year,
      month: savedRecord.month,
      status,
      isNewRecord,
      remainingTokens: savedRecord.remainingTokens,
      waivedTokens: savedRecord.waivedTokens,
      totalTokens: savedRecord.totalTokens,
      usedTokens: savedRecord.totalTokens - savedRecord.remainingTokens - (savedRecord.waivedTokens || 0),
      _id: savedRecord._id,
    })

    const verifyRecord = await findTokenRecord(studentEmail, normalizedStudentId, normalizedCourseId, year, month)
    console.log(
      'Verified saved token record:',
      verifyRecord
        ? {
            _id: verifyRecord._id,
            studentEmail: verifyRecord.studentEmail,
            studentId: verifyRecord.studentId,
            remainingTokens: verifyRecord.remainingTokens,
            totalTokens: verifyRecord.totalTokens,
            waivedTokens: verifyRecord.waivedTokens,
            updatedAt: verifyRecord.updatedAt,
          }
        : 'NOT FOUND - SAVE FAILED!'
    )
  } catch (error) {
    console.error('Error updating tokens:', error)
  }
}

module.exports = {
  getUserEmail,
  findTokenRecord,
  updateTokensForAttendance,
}
