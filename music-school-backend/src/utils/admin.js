const { ADMIN_EMAILS } = require('../config/constants')

function extractEmailsFromClaims(claims) {
  if (!claims) return []
  const emails = []
  if (claims.email) emails.push(String(claims.email))
  if (claims.email_address) emails.push(String(claims.email_address))
  if (claims.primary_email_address) emails.push(String(claims.primary_email_address))
  if (Array.isArray(claims.email_addresses)) {
    for (const v of claims.email_addresses) {
      if (typeof v === 'string') emails.push(v)
      else if (v && typeof v.email_address === 'string') emails.push(v.email_address)
    }
  }
  return emails.map((e) => e.toLowerCase())
}

function isAdminFromClaims(claims) {
  const userEmails = extractEmailsFromClaims(claims)
  return userEmails.some((e) => ADMIN_EMAILS.includes(e))
}

module.exports = { extractEmailsFromClaims, isAdminFromClaims }
