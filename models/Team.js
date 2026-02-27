const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  members: [
    {
      name: String
    }
  ],
  score: { type: Number, default: 0 },
  solvedChallenges: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }]
});

module.exports = mongoose.model("Team", teamSchema);