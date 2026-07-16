const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const { corsOptions } = require('./config/cors')
const { uploadsDir } = require('./config/paths')
const { setupClerk } = require('./middleware/auth')
const corsExtraHeaders = require('./middleware/corsExtra')
const errorHandler = require('./middleware/errorHandler')
const registerRoutes = require('./routes')

function createApp() {
  const app = express()

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(cors(corsOptions))
  app.use(corsExtraHeaders)

  // Preserve original behavior: CORS error handler registered early
  app.use(errorHandler)

  app.use(morgan('dev'))
  app.use('/uploads', express.static(uploadsDir))

  setupClerk(app)
  registerRoutes(app)

  return app
}

module.exports = createApp
