const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  category: String, // AI, Planets, etc
  difficulty: String, // easy, medium, hard
  question: String,
  options: [String],
  correctAnswer: String,
  points: Number
});

module.exports = mongoose.model("Question", questionSchema);