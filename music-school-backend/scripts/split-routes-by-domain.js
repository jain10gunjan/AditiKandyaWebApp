/**
 * Split _allRoutes.js into domain route modules (full /api paths preserved).
 */
const fs = require('fs')
const path = require('path')

const routesDir = path.join(__dirname, '..', 'src', 'routes')
const allPath = path.join(routesDir, '_allRoutes.js')
const src = fs.readFileSync(allPath, 'utf8')

const startMarker = 'function registerRoutes(app) {'
const endMarker = '\n}\n\nmodule.exports = registerRoutes'
const start = src.indexOf(startMarker)
const end = src.lastIndexOf(endMarker)
if (start < 0 || end < 0) {
  console.error('markers not found', { start, end })
  process.exit(1)
}

const body = src.slice(start + startMarker.length, end)
const lineRe = /^app\.(get|post|put|patch|delete)\(/gm
const indices = []
let m
while ((m = lineRe.exec(body)) !== null) indices.push(m.index)
indices.push(body.length)

const chunks = []
for (let i = 0; i < indices.length - 1; i++) {
  const code = body.slice(indices[i], indices[i + 1]).trim()
  if (!code) continue
  const pathMatch = code.match(/^app\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/)
  if (!pathMatch) {
    console.warn('skip chunk', code.slice(0, 80))
    continue
  }
  chunks.push({ method: pathMatch[1], routePath: pathMatch[2], code })
}

function domainFor(routePath) {
  if (routePath === '/api/health') return 'health'
  if (routePath.startsWith('/api/payments')) return 'payments'
  if (routePath.startsWith('/api/media')) return 'media'
  if (routePath.startsWith('/api/teachers')) return 'teachers'
  if (routePath.startsWith('/api/demo')) return 'demo'
  if (routePath.startsWith('/api/dev')) return 'dev'
  if (routePath.startsWith('/api/leads') || routePath.startsWith('/api/admin/leads')) return 'leads'
  if (routePath.startsWith('/api/contact') || routePath.startsWith('/api/admin/contacts')) return 'contact'
  if (routePath.startsWith('/api/faqs') || routePath.startsWith('/api/admin/faqs')) return 'faqs'
  if (routePath.startsWith('/api/consultations') || routePath.startsWith('/api/admin/consultations')) {
    return 'consultations'
  }
  if (
    routePath.startsWith('/api/workshops') ||
    routePath.startsWith('/api/admin/workshops') ||
    routePath.startsWith('/api/admin/workshop-enrollments')
  ) {
    return 'workshops'
  }
  if (routePath.startsWith('/api/testimonials') || routePath.startsWith('/api/admin/testimonials')) {
    return 'testimonials'
  }
  if (routePath.startsWith('/api/me')) return 'me'
  if (routePath.startsWith('/api/admin/attendance') || routePath === '/api/admin/attendance-day/:date') {
    return 'adminAttendance'
  }
  if (routePath.startsWith('/api/admin/tokens') || /\/api\/admin\/courses\/:courseId\/tokens$/.test(routePath)) {
    return 'adminTokens'
  }
  if (
    routePath.startsWith('/api/admin/schedules') ||
    routePath.startsWith('/api/admin/student-schedules') ||
    routePath === '/api/admin/courses/:courseId/enrollments'
  ) {
    return 'adminSchedules'
  }
  if (routePath.startsWith('/api/admin/resources')) return 'adminResources'
  if (routePath.startsWith('/api/admin/enrollments')) return 'adminEnrollments'
  if (routePath === '/api/admin/courses/:courseId/students') return 'adminAttendance'
  if (routePath.startsWith('/api/resources/')) return 'resources'
  if (routePath.startsWith('/api/free-')) return 'freeResources'
  if (routePath.startsWith('/api/enroll')) return 'enrollments'
  if (routePath.startsWith('/api/pricing') || routePath.includes('/pricing')) return 'pricing'
  if (routePath.startsWith('/api/debug')) return 'debug'
  if (routePath.startsWith('/api/courses') || routePath.startsWith('/api/admin/courses/display-order')) {
    return 'courses'
  }
  return 'misc'
}

const groups = {}
for (const c of chunks) {
  const d = domainFor(c.routePath)
  if (!groups[d]) groups[d] = []
  groups[d].push(c)
}

fs.mkdirSync(path.join(routesDir, 'admin'), { recursive: true })

const fileMap = {
  health: 'health.routes.js',
  payments: 'payments.routes.js',
  courses: 'courses.routes.js',
  pricing: 'pricing.routes.js',
  media: 'media.routes.js',
  teachers: 'teachers.routes.js',
  demo: 'demo.routes.js',
  dev: 'dev.routes.js',
  leads: 'leads.routes.js',
  contact: 'contact.routes.js',
  faqs: 'faqs.routes.js',
  consultations: 'consultations.routes.js',
  workshops: 'workshops.routes.js',
  testimonials: 'testimonials.routes.js',
  me: 'me.routes.js',
  enrollments: 'enrollments.routes.js',
  resources: 'resources.routes.js',
  freeResources: 'freeResources.routes.js',
  debug: 'debug.routes.js',
  misc: 'misc.routes.js',
  adminAttendance: 'admin/attendance.routes.js',
  adminTokens: 'admin/tokens.routes.js',
  adminSchedules: 'admin/schedules.routes.js',
  adminResources: 'admin/resources.routes.js',
  adminEnrollments: 'admin/enrollments.routes.js',
}

function makeHeader(isAdmin) {
  const b = isAdmin ? '../..' : '..'
  return `const fs = require('fs')
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
} = require('${b}/models')
const { isDbConnected } = require('${b}/config/db')
const env = require('${b}/config/env')
const { ADMIN_EMAILS } = require('${b}/config/constants')
const { uploadsDir } = require('${b}/config/paths')
const { requireAuthGuarded, requireAdmin, clerkClient, hasClerk } = require('${b}/middleware/auth')
const { upload, decompressFileIfNeeded } = require('${b}/middleware/upload')
const { getLessonFromCourse } = require('${b}/utils/courseStructure')
const { isUserEnrolled } = require('${b}/utils/enrollment')
const { getUserEmail, findTokenRecord, updateTokensForAttendance } = require('${b}/utils/tokens')

const razorKeyId = env.razorKeyId
const razorKeySecret = env.razorKeySecret
const hasRazorEnv = env.hasRazorEnv

`
}

const written = []
for (const [domain, items] of Object.entries(groups)) {
  const fileRel = fileMap[domain] || `${domain}.routes.js`
  const isAdmin = fileRel.startsWith('admin/')
  const out = path.join(routesDir, fileRel)
  const code =
    makeHeader(isAdmin) +
    `function register(app) {\n` +
    items.map((i) => i.code).join('\n\n') +
    `\n}\n\nmodule.exports = register\n`
  fs.writeFileSync(out, code)
  written.push({ domain, fileRel, count: items.length })
}

function exportName(domain) {
  return 'register' + domain.charAt(0).toUpperCase() + domain.slice(1)
}

const index = `${written
  .map((w) => `const ${exportName(w.domain)} = require('./${w.fileRel.replace(/\\.js$/, '')}')`)
  .join('\n')}

function registerRoutes(app) {
${written.map((w) => `  ${exportName(w.domain)}(app)`).join('\n')}
}

module.exports = registerRoutes
`

fs.writeFileSync(path.join(routesDir, 'index.js'), index)
console.log('domains:', written.map((w) => `${w.fileRel} (${w.count})`).join('\n'))
console.log('total routes:', chunks.length)
