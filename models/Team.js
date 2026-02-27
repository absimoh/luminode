const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema({
  name: String,
  score: { type: Number, default: 0 }
});

const teamSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  members: [memberSchema],
  score: { type: Number, default: 0 }
});

module.exports = mongoose.model("Team", teamSchema);