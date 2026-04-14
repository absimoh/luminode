const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true
  },

  score: {
    type: Number,
    default: 0
  },

  members: [
    {
      name: {
        type: String,
        trim: true
      }
    }
  ],

  // 🔥 الإجابات
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      },
      correct: Boolean,
      answer: String,
      answeredAt: {
        type: Date,
        default: Date.now
      }
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);