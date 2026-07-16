const { clerkMiddleware, requireAuth, clerkClient } = require('@clerk/express')
const env = require('../config/env')
const { ADMIN_EMAILS } = require('../config/constants')
const { extractEmailsFromClaims, isAdminFromClaims } = require('../utils/admin')

function setupClerk(app) {
  if (env.hasClerk) {
    app.use(
      clerkMiddleware({
        publishableKey: env.clerkPublishableKey,
        secretKey: env.clerkSecretKey,
      })
    )
  } else {
    console.warn('Clerk not configured: set CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY to enable auth')
  }
}

const requireAuthGuarded = env.hasClerk
  ? requireAuth()
  : (req, res) => res.status(501).json({ error: 'Auth not configured' })

const requireAdmin = env.hasClerk
  ? async (req, res, next) => {
      try {
        if (!req.auth) {
          console.log('requireAdmin: No auth found')
          return res.status(401).json({ error: 'Unauthenticated' })
        }
        const claims = req.auth.sessionClaims || {}
        let isAdmin = isAdminFromClaims(claims)
        if (!isAdmin) {
          try {
            const user = await clerkClient.users.getUser(req.auth.userId)
            const emails = (user.emailAddresses || []).map((e) => String(e.emailAddress || '').toLowerCase())
            isAdmin = emails.some((e) => ADMIN_EMAILS.includes(e))
          } catch (err) {
            console.log('requireAdmin: Error checking user:', err.message)
          }
        }
        if (!isAdmin) {
          console.log('requireAdmin: User is not admin')
          return res.status(403).json({ error: 'Admin only' })
        }
        console.log('requireAdmin: User is admin, proceeding')
        next()
      } catch (e) {
        console.error('requireAdmin: Error:', e)
        return res.status(500).json({ error: 'Admin check failed' })
      }
    }
  : (req, res) => res.status(501).json({ error: 'Auth not configured' })

module.exports = {
  setupClerk,
  requireAuthGuarded,
  requireAdmin,
  clerkClient,
  hasClerk: env.hasClerk,
}
