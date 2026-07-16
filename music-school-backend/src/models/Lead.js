const mongoose = require('mongoose')

const Lead = mongoose.model(
  'Lead',
  new mongoose.Schema(
    {
      fullName: String,
      email: String,
      whatsapp: String,
      country: String,
      courseId: String,
      courseTitle: String,
    },
    { timestamps: true }
  )
)

module.exports = Lead
