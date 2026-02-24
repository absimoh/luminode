const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  points: Number,
  answer: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Challenge", challengeSchema);