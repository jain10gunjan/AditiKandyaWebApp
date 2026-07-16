const mongoose = require('mongoose')

const Consultation = mongoose.model(
  'Consultation',
  new mongoose.Schema(
    {
      name: String,
      email: String,
      phone: String,
      preferredDate: String,
      preferredTime: String,
      message: String,
      type: { type: String, default: 'consultation' },
      status: { type: String, enum: ['new', 'scheduled', 'completed', 'cancelled'], default: 'new' },
    },
    { timestamps: true }
  )
)

module.exports = Consultation
