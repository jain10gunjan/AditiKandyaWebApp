const mongoose = require('mongoose')

const lessonSchema = {
  title: String,
  type: { type: String, enum: ['video', 'pdf'], default: 'video' },
  videoPath: String,
  pdfPath: String,
  freePreview: { type: Boolean, default: false },
  durationSec: Number,
  order: Number,
}

const Course = mongoose.model(
  'Course',
  new mongoose.Schema(
    {
      title: String,
      description: String,
      price: Number,
      image: String,
      level: String,
      thumbnailPath: String,
      displayOrder: { type: Number, default: 0 },
      studentCount: { type: Number, default: 0 },
      rating: { type: Number, default: 4.8 },
      isFree: { type: Boolean, default: false },
      teacherId: String,
      teacherName: String,
      teacherDescription: String,
      teacherAvatar: String,
      teacherInstrument: String,
      scales: String,
      arpeggios: String,
      performanceTips: String,
      curriculum: [
        {
          title: String,
          videoPath: String,
          freePreview: { type: Boolean, default: false },
          durationSec: Number,
        },
      ],
      modules: [
        {
          title: String,
          order: Number,
          lessons: [lessonSchema],
        },
      ],
      chapters: [
        {
          title: String,
          order: Number,
          modules: [
            {
              title: String,
              order: Number,
              lessons: [lessonSchema],
            },
          ],
        },
      ],
    },
    { timestamps: true }
  )
)

module.exports = Course
