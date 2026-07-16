const mongoose = require('mongoose')

const Resource = mongoose.model(
  'Resource',
  new mongoose.Schema(
    {
      courseId: String,
      title: String,
      description: String,
      type: { type: String, enum: ['video', 'pdf', 'document'], default: 'video' },
      filePath: String,
      thumbnailPath: String,
      duration: Number,
      order: Number,
      isPublic: { type: Boolean, default: false },
    },
    { timestamps: true }
  )
)

module.exports = Resource
