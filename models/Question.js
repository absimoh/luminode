const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: String, required: true },
  points: { type: Number, default: 1 },
  isActive: { type: Boolean, default: false }
});

module.exports = mongoose.model("Question", questionSchema);