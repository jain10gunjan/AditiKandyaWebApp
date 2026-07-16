require('./config/env')
const createApp = require('./app')
const { connectDB } = require('./config/db')
const env = require('./config/env')
const { seedIfEmpty } = require('./seeds/seedIfEmpty')

async function start() {
  await connectDB(async () => {
    try {
      await seedIfEmpty()
    } catch (e) {
      console.warn('Seeding skipped:', e?.message)
    }
  })

  const app = createApp()
  const port = env.port
  app.listen(port, () => console.log(`API listening on http://localhost:${port}`))
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
