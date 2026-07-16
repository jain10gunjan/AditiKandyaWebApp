const mongoose = require('mongoose')

const WorkshopEnrollment = mongoose.model(
  'WorkshopEnrollment',
  new mongoose.Schema(
    {
      workshopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Workshop' },
      userId: String,
      name: String,
      email: String,
      phone: String,
      message: String,
      status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    },
    { timestamps: true }
  )
)

module.exports = WorkshopEnrollment
