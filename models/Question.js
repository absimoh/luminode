const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    required: true
  },
  question: {
    type: String,
    required: true
  },
  options: {
    type: [String],
    required: true
  },
  correctAnswer: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);