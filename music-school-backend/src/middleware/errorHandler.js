const { allowedOrigins } = require('../config/cors')

function errorHandler(err, req, res, next) {
  console.error('Error:', err)
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: err.message,
      allowedOrigins,
      requestedOrigin: req.headers.origin,
    })
  }
  res.status(500).json({ error: 'Internal server error', message: err.message })
}

module.exports = errorHandler
