const mongoose = require('mongoose')

const Enrollment = mongoose.model(
  'Enrollment',
  new mongoose.Schema(
    {
      name: String,
      email: String,
      instrument: String,
      userId: String,
      courseId: String,
      paymentId: String,
      approved: { type: Boolean, default: false },
      status: { type: String, enum: ['pending', 'approved', 'deleted'], default: 'pending' },
      deletedAt: Date,
    },
    { timestamps: true }
  )
)

module.exports = Enrollment
