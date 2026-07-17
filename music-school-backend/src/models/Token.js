const mongoose = require('mongoose')

const TokenSchema = new mongoose.Schema(
  {
    studentId: String,
    studentEmail: String,
    courseId: String,
    year: Number,
    month: Number,
    totalTokens: { type: Number, default: 4 },
    remainingTokens: { type: Number, default: 4 },
    waivedTokens: { type: Number, default: 0 },
    manualAdjustment: { type: Number, default: 0 },
    lastUpdatedBy: String,
    notes: String,
  },
  { timestamps: true }
)

TokenSchema.index({ studentEmail: 1, courseId: 1, year: 1, month: 1 }, { unique: true })
TokenSchema.index({ studentId: 1, courseId: 1, year: 1, month: 1 })

const Token = mongoose.model('Token', TokenSchema) 

module.exports = Token
