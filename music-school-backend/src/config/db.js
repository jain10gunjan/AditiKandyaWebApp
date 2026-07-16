const mongoose = require('mongoose')
const env = require('./env')

const state = {
  dbConnected: false,
}

async function connectDB(onConnected) {
  if (!env.mongoUri) {
    console.warn('MONGODB_URI not set - running without database')
    return state
  }

  mongoose.set('bufferCommands', false)

  try {
    await mongoose.connect(env.mongoUri)
    state.dbConnected = true
    console.log('MongoDB connected')

    // Idempotent cleanup: keep Enrollment.approved and status aligned
    try {
      const { fixEnrollmentStatusMismatches } = require('../utils/enrollmentStatus')
      const counts = await fixEnrollmentStatusMismatches()
      const total =
        (counts.pendingToApproved || 0) +
        (counts.deletedApprovedFix || 0) +
        (counts.approvedToPending || 0)
      if (total > 0) {
        console.log('Enrollment status cleanup:', counts)
      }
    } catch (cleanupErr) {
      console.warn('Enrollment status cleanup skipped:', cleanupErr?.message)
    }

    if (typeof onConnected === 'function') {
      try {
        await onConnected()
      } catch (e) {
        console.warn('Post-connect hook failed:', e?.message)
      }
    }
  } catch (err) {
    state.dbConnected = false
    console.error('MongoDB connection error (continuing without DB):', err?.message || err)
  }

  return state
}

function isDbConnected() {
  return state.dbConnected
}

module.exports = {
  connectDB,
  isDbConnected,
  state,
}
