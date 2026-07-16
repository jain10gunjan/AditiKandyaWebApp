const Enrollment = require('../models/Enrollment')

/**
 * Fix approved/status mismatches for existing Enrollment documents.
 * - approved:true + status:pending  → status:approved
 * - approved:true + status:deleted  → approved:false (keep deleted)
 * - approved:false + status:approved → status:pending
 */
async function fixEnrollmentStatusMismatches() {
  const [pendingToApproved, deletedApprovedFix, approvedToPending] = await Promise.all([
    Enrollment.updateMany(
      { approved: true, status: 'pending' },
      { $set: { status: 'approved', deletedAt: null } }
    ),
    Enrollment.updateMany(
      { approved: true, status: 'deleted' },
      { $set: { approved: false } }
    ),
    Enrollment.updateMany(
      { approved: false, status: 'approved' },
      { $set: { status: 'pending' } }
    ),
  ])

  return {
    pendingToApproved: pendingToApproved.modifiedCount || 0,
    deletedApprovedFix: deletedApprovedFix.modifiedCount || 0,
    approvedToPending: approvedToPending.modifiedCount || 0,
  }
}

module.exports = { fixEnrollmentStatusMismatches }
