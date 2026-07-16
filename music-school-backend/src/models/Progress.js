const mongoose = require('mongoose')

const Progress = mongoose.model(
  'Progress',
  new mongoose.Schema(
    {
      userId: { type: String, required: true },
      courseId: { type: String, required: true },
      data: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    { timestamps: true }
  )
)

module.exports = Progress
