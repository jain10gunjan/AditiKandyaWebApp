const dotenv = require('dotenv')

dotenv.config()

const env = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGODB_URI || '',
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
  clerkSecretKey: process.env.CLERK_SECRET_KEY || '',
  razorKeyId: process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || '',
  razorKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  adminEmailsRaw: process.env.ADMIN_EMAILS || process.env.ADMIN_EMAIL || 'themusinest@gmail.com',
}

env.hasClerk = Boolean(env.clerkSecretKey && env.clerkPublishableKey)
env.hasRazorEnv = Boolean(env.razorKeyId && env.razorKeySecret)

module.exports = env
