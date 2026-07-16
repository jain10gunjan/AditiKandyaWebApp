const mongoose = require('mongoose')

const Testimonial = mongoose.model(
  'Testimonial',
  new mongoose.Schema(
    {
      name: { type: String, required: true },
      role: { type: String, required: true },
      content: { type: String, required: true },
      avatar: { type: String, default: 'https://i.pravatar.cc/150' },
      isActive: { type: Boolean, default: true },
      order: { type: Number, default: 0 },
    },
    { timestamps: true }
  )
)

module.exports = Testimonial
