const mongoose = require('mongoose')

const Payment = mongoose.model(
  'Payment',
  new mongoose.Schema(
    {
      userId: String,
      courseId: String,
      orderId: String,
      paymentId: String,
      signature: String,
      amount: Number,
      status: String,
    },
    { timestamps: true }
  )
)

module.exports = Payment
