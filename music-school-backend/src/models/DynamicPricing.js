const mongoose = require('mongoose')

const DynamicPricing = mongoose.model(
  'DynamicPricing',
  new mongoose.Schema(
    {
      courseId: { type: String, required: true },
      region: { type: String, required: true },
      timezone: String,
      country: String,
      currency: { type: String, default: 'USD' },
      price: { type: Number, required: true },
      isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
  )
)

module.exports = DynamicPricing
