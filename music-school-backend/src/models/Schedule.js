const mongoose = require('mongoose')

const Schedule = mongoose.model(
  'Schedule',
  new mongoose.Schema(
    {
      courseId: String,
      studentId: String,
      parentScheduleId: String,
      title: String,
      description: String,
      startTime: Date,
      endTime: Date,
      meetingLink: String,
      instructor: String,
      location: String,
      type: { type: String, enum: ['class', 'exam', 'holiday', 'event'], default: 'class' },
      isRecurring: { type: Boolean, default: false },
      recurringPattern: String,
      status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
    },
    { timestamps: true }
  )
)

module.exports = Schedule
