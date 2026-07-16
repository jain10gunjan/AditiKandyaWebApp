const mongoose = require('mongoose')

const Teacher = mongoose.model(
  'Teacher',
  new mongoose.Schema(
    { name: String, instrument: String, avatar: String },
    { timestamps: true }
  )
)

module.exports = Teacher
