const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  username: {
    type: String,
    required: true,
    trim: true
  },

  email: {
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

  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Question"
      },
      answer: String,
      correct: Boolean
    }
  ]

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);