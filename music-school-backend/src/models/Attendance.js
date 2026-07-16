const mongoose = require('mongoose')

const Attendance = mongoose.model(
  'Attendance',
  new mongoose.Schema(
    {
      studentId: String,
      courseId: String,
      date: String,
      status: { type: String, enum: ['present', 'absent', 'late', 'waived'], default: 'present' },
      markedBy: String,
      notes: String,
    },
    { timestamps: true }
  )
)

module.exports = Attendance
