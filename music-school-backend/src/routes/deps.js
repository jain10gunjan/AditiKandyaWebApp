const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const Razorpay = require('razorpay')

const models = require('../models')
const { isDbConnected } = require('../config/db')
const env = require('../config/env')
const { ADMIN_EMAILS } = require('../config/constants')
const { uploadsDir } = require('../config/paths')
const { requireAuthGuarded, requireAdmin, clerkClient, hasClerk } = require('../middleware/auth')
const { upload, decompressFileIfNeeded } = require('../middleware/upload')
const { getLessonFromCourse } = require('../utils/courseStructure')
const { isUserEnrolled } = require('../utils/enrollment')
const { getUserEmail, findTokenRecord, updateTokensForAttendance } = require('../utils/tokens')

module.exports = {
  fs,
  path,
  crypto,
  Razorpay,
  ...models,
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
  razorKeyId: env.razorKeyId,
  razorKeySecret: env.razorKeySecret,
  hasRazorEnv: env.hasRazorEnv,
}
