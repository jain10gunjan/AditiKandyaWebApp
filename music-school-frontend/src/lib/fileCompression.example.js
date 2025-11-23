/**
 * Example usage of file compression utility
 * 
 * This file demonstrates how to use the file compression utilities
 * in your React components for efficient large file uploads.
 */

import { uploadFileWithCompression, compressFile, isCompressionSupported } from './fileCompression'
import { API_BASE_URL } from './api'

/**
 * Example 1: Upload a file with automatic compression
 */
export async function uploadThumbnail(courseId, file, token) {
  try {
    const result = await uploadFileWithCompression(
      `${API_BASE_URL}/api/courses/${courseId}/thumbnail`,
      file,
      {
        compress: true, // Enable compression
        token: token, // Auth token
      }
    )
    return result
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}

/**
 * Example 2: Upload a resource file with additional form data
 */
export async function uploadResource(courseId, file, metadata, token) {
  try {
    const result = await uploadFileWithCompression(
      `${API_BASE_URL}/api/admin/resources`,
      file,
      {
        compress: true,
        token: token,
        additionalData: {
          courseId: courseId,
          title: metadata.title,
          description: metadata.description,
          type: metadata.type || 'video',
          isPublic: metadata.isPublic || false,
        },
      }
    )
    return result
  } catch (error) {
    console.error('Resource upload failed:', error)
    throw error
  }
}

/**
 * Example 3: Compress a file manually before upload
 */
export async function compressAndUploadManually(url, file, token) {
  try {
    // Compress the file first
    const compressionResult = await compressFile(file, {
      minSize: 100 * 1024, // Only compress files > 100KB
      maxSize: 50 * 1024 * 1024, // Max 50MB
    })

    if (compressionResult.compressed) {
      console.log(
        `File compressed: ${compressionResult.compressionRatio}% size reduction`
      )
    }

    // Create FormData
    const formData = new FormData()
    formData.append('file', compressionResult.file)

    // Add compression header if compressed
    const headers = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    if (compressionResult.compressed) {
      headers['X-File-Compressed'] = 'true'
      headers['X-Original-Filename'] = file.name
    }

    // Upload
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Upload failed:', error)
    throw error
  }
}

/**
 * Example 4: Check compression support before uploading
 */
export async function uploadWithCompressionCheck(url, file, token) {
  const supported = await isCompressionSupported()
  
  if (!supported) {
    console.warn('Compression not supported in this browser. Uploading without compression.')
  }

  return uploadFileWithCompression(url, file, {
    compress: supported, // Only compress if supported
    token: token,
  })
}

/**
 * Example 5: React component usage
 */
/*
import { useState } from 'react'
import { uploadFileWithCompression } from '../lib/fileCompression'
import { API_BASE_URL } from '../lib/api'

function FileUploadComponent({ courseId, token }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleFileUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadFileWithCompression(
        `${API_BASE_URL}/api/courses/${courseId}/thumbnail`,
        file,
        {
          compress: true,
          token: token,
        }
      )
      console.log('Upload successful:', result)
      alert('File uploaded successfully!')
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Upload failed: ' + error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <input
        type="file"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p>Uploading and compressing file...</p>}
    </div>
  )
}
*/

