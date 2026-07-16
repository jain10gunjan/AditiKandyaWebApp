/**
 * One-time helper: builds src/routes/_generatedRegister.js from the monolith backup.
 * Run: node scripts/build-routes-from-monolith.js
 */
const fs = require('fs')
const path = require('path')

const backupPath = path.join(__dirname, '..', 'src', 'server.monolith.backup.js')
const outPath = path.join(__dirname, '..', 'src', 'routes', '_allRoutes.js')

const src = fs.readFileSync(backupPath, 'utf8')
const lines = src.split(/\r?\n/)

const startIdx = lines.findIndex((l) => l.includes("app.get('/api/health'"))
const endIdx = lines.findIndex((l) => l.startsWith('const port ='))

if (startIdx < 0 || endIdx < 0) {
  console.error('Could not find route bounds', { startIdx, endIdx })
  process.exit(1)
}

let body = lines.slice(startIdx, endIdx).join('\n')

// Remove inline helper/model definitions that now live elsewhere
const removeBlocks = [
  [/\/\/ Seed endpoint \(and run-once seeder\)[\s\S]*?\/\/ seeding is now triggered after successful DB connection\n/, ''],
  [/\/\/ Razorpay setup \(guarded\)\nconst Razorpay = require\('razorpay'\)\nconst crypto = require\('crypto'\)\nconst razorKeyId[\s\S]*?const hasRazorEnv = Boolean\(razorKeyId && razorKeySecret\)\n\n/, ''],
  [/\/\/ Admin guard[\s\S]*?: \(req, res\) => res\.status\(501\)\.json\(\{ error: 'Auth not configured' \}\)\n\n/, ''],
  [/\/\/ Multer for local uploads[\s\S]*?next\(\)\n\}\n\n/, ''],
  [/function getLessonFromCourse[\s\S]*?return null\n\}\n\n/, ''],
  [/\/\/ Helper: check if user is enrolled\nasync function isUserEnrolled[\s\S]*?return Boolean\(existing\)\n\}\n\n/, ''],
  [/\/\/ Helper function to get user email from userId\nasync function getUserEmail[\s\S]*?return null\n\}\n\n/, ''],
  [/\/\/ Helper function to find token record[\s\S]*?return null\n\}\n\n/, ''],
  [/\/\/ Helper function to update tokens when attendance is marked\nasync function updateTokensForAttendance[\s\S]*?\}\n\n/, ''],
]

for (const [re, rep] of removeBlocks) {
  body = body.replace(re, rep)
}

body = body
  .replace(/\bif\s*\(\s*!dbConnected\s*\)/g, 'if (!isDbConnected())')
  .replace(/\bif\s*\(\s*!dbConnected\s*\)/g, 'if (!isDbConnected())')
  .replace(/\bdbConnected\b/g, 'isDbConnected()')

const header = `const express = require('express')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Razorpay = require('razorpay')
const {
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
} = require('../models')
const { isDbConnected } = require('../config/db')
const env = require('../config/env')
const { ADMIN_EMAILS } = require('../config/constants')
const { uploadsDir } = require('../config/paths')
const { requireAuthGuarded, requireAdmin, clerkClient, hasClerk } = require('../middleware/auth')
const { upload, decompressFileIfNeeded } = require('../middleware/upload')
const { getLessonFromCourse } = require('../utils/courseStructure')
const { isUserEnrolled } = require('../utils/enrollment')
const { getUserEmail, findTokenRecord, updateTokensForAttendance } = require('../utils/tokens')
const { seedIfEmpty } = require('../seeds/seedIfEmpty')

const razorKeyId = env.razorKeyId
const razorKeySecret = env.razorKeySecret
const hasRazorEnv = env.hasRazorEnv

function registerRoutes(app) {
`

const footer = `
}

module.exports = registerRoutes
`

fs.writeFileSync(outPath, header + body + footer)
console.log('Wrote', outPath, 'lines:', (header + body + footer).split(/\n/).length)
