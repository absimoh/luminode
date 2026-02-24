const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  password: String,
  members: [
    {
      name: String,
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  score: { type: Number, default: 0 },
  solvedChallenges: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Team", teamSchema);