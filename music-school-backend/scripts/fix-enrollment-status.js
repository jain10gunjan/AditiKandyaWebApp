/**
 * One-time cleanup: sync Enrollment.approved with Enrollment.status
 *
 * Usage: node scripts/fix-enrollment-status.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
require('../src/models/Enrollment')
const { fixEnrollmentStatusMismatches } = require('../src/utils/enrollmentStatus')

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI
  if (!uri) {
    console.error('Missing MONGODB_URI / MONGO_URI')
    process.exit(1)
  }

  await mongoose.connect(uri)
  console.log('Connected. Fixing enrollment status mismatches...')

  const counts = await fixEnrollmentStatusMismatches()
  console.log('Done:', counts)

  await mongoose.disconnect()
}

main().catch(async (err) => {
  console.error(err)
  try {
    await mongoose.disconnect()
  } catch (_) {}
  process.exit(1)
})
