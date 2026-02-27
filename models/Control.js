const mongoose = require("mongoose");

const controlSchema = new mongoose.Schema({
  showRanking: { type: Boolean, default: false },
  showChallenges: { type: Boolean, default: false }
});

module.exports = mongoose.model("Control", controlSchema);