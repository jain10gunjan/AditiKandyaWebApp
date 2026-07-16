const mongoose = require('mongoose')

const FAQ = mongoose.model(
  'FAQ',
  new mongoose.Schema(
    {
      question: String,
      answer: String,
      order: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
)

module.exports = FAQ
