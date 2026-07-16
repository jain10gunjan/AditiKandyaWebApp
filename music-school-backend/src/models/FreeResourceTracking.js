const mongoose = require('mongoose')

const FreeResourceTracking = mongoose.model(
  'FreeResourceTracking',
  new mongoose.Schema(
    {
      userId: { type: String, required: true },
      resourceId: { type: String, required: true },
      courseId: { type: String, required: true },
      viewed: { type: Boolean, default: false },
      viewedAt: Date,
      completed: { type: Boolean, default: false },
      completedAt: Date,
      timeSpent: { type: Number, default: 0 },
      lastAccessedAt: Date,
    },
    { timestamps: true }
  )
)

module.exports = FreeResourceTracking
