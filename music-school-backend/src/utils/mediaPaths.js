const path = require('path')
const fs = require('fs')
const { uploadsDir } = require('../config/paths')

function resolveUploadPath(storedPath) {
  if (!storedPath) return null
  if (storedPath.startsWith('/uploads/')) {
    return path.join(uploadsDir, path.basename(storedPath))
  }
  if (storedPath.startsWith('uploads/')) {
    return path.join(uploadsDir, storedPath.replace('uploads/', ''))
  }
  return path.join(uploadsDir, storedPath)
}

function fileExists(fsPath) {
  return Boolean(fsPath && fs.existsSync(fsPath))
}

module.exports = { resolveUploadPath, fileExists, uploadsDir }
