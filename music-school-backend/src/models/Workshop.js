const mongoose = require('mongoose')

const Workshop = mongoose.model(
  'Workshop',
  new mongoose.Schema(
    {
      title: String,
      description: String,
      image: String,
      date: String,
      time: String,
      duration: String,
      location: String,
      price: { type: Number, default: 0 },
      maxParticipants: { type: Number, default: 20 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
)

module.exports = Workshop
