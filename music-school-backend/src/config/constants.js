const env = require('./env')

const ADMIN_EMAILS = String(env.adminEmailsRaw)
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean)

module.exports = { ADMIN_EMAILS }
