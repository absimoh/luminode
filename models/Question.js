const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: String,
  options: [String],
  correctAnswer: String,
  points: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model("Question", questionSchema);