const mongoose = require("mongoose");

const controlSchema = new mongoose.Schema({
  showChallenges: { type: Boolean, default: false },
  showRanking: { type: Boolean, default: false }
});

module.exports = mongoose.model("Control", controlSchema);