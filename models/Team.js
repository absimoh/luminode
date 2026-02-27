const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 },

  members: [
    {
      name: String
    }
  ],

  answeredQuestions: {
    type: [String],
    default: []
  }

});

module.exports = mongoose.model("Team", teamSchema);