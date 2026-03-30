const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  password: String,
  score: { type: Number, default: 0 },
  answers: []
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);