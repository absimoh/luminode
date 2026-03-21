const mongoose = require("mongoose");

const controlSchema = new mongoose.Schema({

  challengesOpen: {
    type: Boolean,
    default: false
  },

  leaderboardOpen: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("Control", controlSchema);