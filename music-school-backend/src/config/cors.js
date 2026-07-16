const allowedOrigins = [
  'https://themusinest.com',
  'https://www.themusinest.com',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4000',
]

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true)

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      console.warn('CORS blocked origin:', origin)
      callback(
        new Error(
          `Not allowed by CORS. Origin: ${origin} is not in the allowed list: ${allowedOrigins.join(', ')}`
        )
      )
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-File-Compressed',
    'X-Original-Filename',
    'X-User-Id',
  ],
  exposedHeaders: ['Content-Range', 'Accept-Ranges'],
}

module.exports = { allowedOrigins, corsOptions }
