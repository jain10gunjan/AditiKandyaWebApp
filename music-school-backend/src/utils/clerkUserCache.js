const { clerkClient, hasClerk } = require('../middleware/auth')

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map()

/**
 * Cached Clerk user lookup with stale fallback on rate limits / errors.
 */
async function getClerkUser(userId) {
  const uid = String(userId || '').trim()
  if (!uid || !hasClerk || !uid.startsWith('user_')) return null

  const hit = cache.get(uid)
  if (hit && hit.expires > Date.now() && hit.user) {
    return hit.user
  }

  try {
    const user = await clerkClient.users.getUser(uid)
    cache.set(uid, { user, expires: Date.now() + CACHE_TTL_MS })
    return user
  } catch (err) {
    if (hit?.user) {
      console.warn('getClerkUser: using stale cache after error:', err?.message)
      return hit.user
    }
    throw err
  }
}

function clearClerkUserCache(userId) {
  if (userId) cache.delete(String(userId))
  else cache.clear()
}

module.exports = { getClerkUser, clearClerkUserCache, CACHE_TTL_MS }
