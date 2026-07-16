const mongoose = require('mongoose')

const Contact = mongoose.model(
  'Contact',
  new mongoose.Schema(
    {
      name: String,
      email: String,
      phone: String,
      subject: String,
      message: String,
      status: { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
    },
    { timestamps: true }
  )
)

module.exports = Contact
