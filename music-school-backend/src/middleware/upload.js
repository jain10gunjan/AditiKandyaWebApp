const path = require('path')
const fs = require('fs')
const zlib = require('zlib')
const multer = require('multer')
const { uploadsDir } = require('../config/paths')

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadsDir)
  },
  filename(req, file, cb) {
    const originalName = file.originalname.replace(/\.gz$/, '')
    const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName.replace(/[^a-zA-Z0-9.\-_/]/g, '_')}`
    cb(null, safeName)
  },
})

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024,
  },
})

async function decompressFileIfNeeded(req, res, next) {
  if (!req.file) {
    return next()
  }

  const isCompressed = req.headers['x-file-compressed'] === 'true'

  if (isCompressed) {
    try {
      const filePath = req.file.path
      const originalFilename = req.headers['x-original-filename'] || req.file.originalname.replace(/\.gz$/, '')

      let decompressedPath = filePath
      if (filePath.endsWith('.gz')) {
        decompressedPath = filePath.slice(0, -3)
      } else {
        const dir = path.dirname(filePath)
        decompressedPath = path.join(dir, path.basename(originalFilename))
      }

      const compressedData = fs.readFileSync(filePath)
      const decompressedData = zlib.gunzipSync(compressedData)
      fs.writeFileSync(decompressedPath, decompressedData)

      if (filePath !== decompressedPath) {
        fs.unlinkSync(filePath)
      }

      req.file.path = decompressedPath
      req.file.filename = path.basename(decompressedPath)
      req.file.originalname = originalFilename
      req.file.size = decompressedData.length

      const compressionRatio = ((1 - compressedData.length / decompressedData.length) * 100).toFixed(2)
      console.log(
        `Decompressed file: ${originalFilename} (${(compressedData.length / 1024).toFixed(2)}KB -> ${(decompressedData.length / 1024).toFixed(2)}KB, ${compressionRatio}% compression)`
      )
    } catch (error) {
      console.error('Error decompressing file:', error)
      return res.status(500).json({ error: 'Failed to decompress file', details: error.message })
    }
  }

  next()
}

module.exports = { upload, decompressFileIfNeeded }
