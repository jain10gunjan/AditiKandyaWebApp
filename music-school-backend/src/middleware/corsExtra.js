const { allowedOrigins } = require('../config/cors')

function corsExtraHeaders(req, res, next) {
  const origin = req.headers.origin
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }
  next()
}

module.exports = corsExtraHeaders
