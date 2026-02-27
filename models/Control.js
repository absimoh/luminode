const mongoose = require("mongoose");

const controlSchema = new mongoose.Schema({
  challengesOpen: { type: Boolean, default: false },
  leaderboardOpen: { type: Boolean, default: false }
});

module.exports = mongoose.model("Control", controlSchema);