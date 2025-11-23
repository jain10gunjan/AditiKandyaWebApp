/**
 * File compression utility for client-side file compression before upload
 * Uses native CompressionStream API when available, falls back to pako for older browsers
 * 
 * @example
 * import { uploadFileWithCompression } from './lib/fileCompression'
 * 
 * const file = event.target.files[0]
 * const result = await uploadFileWithCompression(
 *   'http://localhost:4000/api/courses/123/thumbnail',
 *   file,
 *   {
 *     compress: true,
 *     token: 'your-auth-token',
 *     additionalData: { title: 'My File' }
 *   }
 * )
 */

/**
 * Compress a file using gzip compression
 * @param {File} file - The file to compress
 * @param {Object} options - Compression options
 * @param {number} options.minSize - Minimum file size in bytes to compress (default: 100KB)
 * @param {number} options.maxSize - Maximum file size in bytes to compress (default: 50MB)
 * @returns {Promise<{file: File, compressed: boolean, originalSize: number, compressedSize: number}>}
 */
export async function compressFile(file, options = {}) {
  const { minSize = 100 * 1024, maxSize = 50 * 1024 * 1024 } = options

  // Skip compression for small files or files that are too large
  if (file.size < minSize) {
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    }
  }

  if (file.size > maxSize) {
    console.warn(`File size (${file.size} bytes) exceeds maximum (${maxSize} bytes). Uploading without compression.`)
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    }
  }

  try {
    // Try using native CompressionStream API (Chrome 80+, Firefox 113+, Safari 16.4+)
    if (typeof CompressionStream !== 'undefined') {
      return await compressWithNativeAPI(file)
    }

    // Fallback: Try to import and use pako
    try {
      // Dynamic import for pako (only loads if needed)
      const pako = await import('pako')
      return await compressWithPako(file, pako.default || pako)
    } catch (pakoError) {
      // pako not available, continue without compression
      console.warn('pako library not available. Uploading file without compression.')
    }

    // If no compression method available, return original file
    console.warn('No compression method available. Uploading file without compression.')
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
    }
  } catch (error) {
    console.error('Error compressing file:', error)
    // Return original file if compression fails
    return {
      file,
      compressed: false,
      originalSize: file.size,
      compressedSize: file.size,
      error: error.message,
    }
  }
}

/**
 * Compress file using native CompressionStream API
 */
async function compressWithNativeAPI(file) {
  const fileBuffer = await file.arrayBuffer()
  const compressionStream = new CompressionStream('gzip')
  const writer = compressionStream.writable.getWriter()
  const reader = compressionStream.readable.getReader()

  // Write file data to compression stream
  writer.write(new Uint8Array(fileBuffer))
  writer.close()

  // Read compressed data
  const chunks = []
  let done = false

  while (!done) {
    const { value, done: streamDone } = await reader.read()
    done = streamDone
    if (value) {
      chunks.push(value)
    }
  }

  // Combine chunks into single Uint8Array
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0)
  const compressedData = new Uint8Array(totalLength)
  let offset = 0
  for (const chunk of chunks) {
    compressedData.set(chunk, offset)
    offset += chunk.length
  }

  // Create a new File object with compressed data
  const compressedBlob = new Blob([compressedData], { type: 'application/gzip' })
  const compressedFile = new File([compressedBlob], `${file.name}.gz`, {
    type: 'application/gzip',
    lastModified: file.lastModified,
  })

  const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(2)
  console.log(
    `Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB (${compressionRatio}% reduction)`
  )

  return {
    file: compressedFile,
    compressed: true,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: parseFloat(compressionRatio),
  }
}

/**
 * Compress file using pako library (fallback for older browsers)
 */
async function compressWithPako(file, pako) {
  const fileBuffer = await file.arrayBuffer()
  const uint8Array = new Uint8Array(fileBuffer)

  // Compress using pako
  const compressed = pako.gzip(uint8Array, { level: 6 }) // Level 6 is a good balance

  // Create a new File object with compressed data
  const compressedBlob = new Blob([compressed], { type: 'application/gzip' })
  const compressedFile = new File([compressedBlob], `${file.name}.gz`, {
    type: 'application/gzip',
    lastModified: file.lastModified,
  })

  const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(2)
  console.log(
    `Compressed ${file.name}: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB (${compressionRatio}% reduction)`
  )

  return {
    file: compressedFile,
    compressed: true,
    originalSize: file.size,
    compressedSize: compressedFile.size,
    compressionRatio: parseFloat(compressionRatio),
  }
}

/**
 * Upload a file with optional compression
 * @param {string} url - The upload endpoint URL
 * @param {File} file - The file to upload
 * @param {Object} options - Upload options
 * @param {boolean} options.compress - Whether to compress the file (default: true)
 * @param {string} options.fieldName - FormData field name (default: 'file')
 * @param {Object} options.additionalData - Additional form data to include
 * @param {string} options.token - Authorization token
 * @returns {Promise<Response>}
 */
export async function uploadFileWithCompression(url, file, options = {}) {
  const {
    compress = true,
    fieldName = 'file',
    additionalData = {},
    token = null,
  } = options

  let fileToUpload = file
  let isCompressed = false

  // Compress file if requested
  if (compress) {
    const compressionResult = await compressFile(file)
    fileToUpload = compressionResult.file
    isCompressed = compressionResult.compressed
  }

  // Create FormData
  const formData = new FormData()
  formData.append(fieldName, fileToUpload)

  // Add compression header
  if (isCompressed) {
    formData.append('_compressed', 'true')
  }

  // Add additional form data
  Object.keys(additionalData).forEach((key) => {
    formData.append(key, additionalData[key])
  })

  // Prepare headers
  const headers = {}
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (isCompressed) {
    headers['X-File-Compressed'] = 'true'
    headers['X-Original-Filename'] = file.name
  }

  // Upload file
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Upload failed: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Check if compression is supported in the current browser
 * @returns {Promise<boolean>}
 */
export async function isCompressionSupported() {
  if (typeof CompressionStream !== 'undefined') {
    return true
  }
  
  // Check if pako can be imported
  try {
    await import('pako')
    return true
  } catch {
    return false
  }
}

