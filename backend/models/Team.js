const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true
  },

  password: {
    type: String,
    required: true
  },

  score: {
    type: Number,
    default: 0
  },

  members: [
    {
      name: String
    }
  ],

  // 🔥 هنا أهم شي
  answers: [
    {
      questionId: String,
      correct: Boolean,
      answer: String
    }
  ]

});

module.exports = mongoose.model("Team", teamSchema);