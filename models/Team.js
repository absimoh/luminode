const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
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
      name: {
        type: String,
        trim: true
      }
    }
  ],
  
  answers: [
    {
      questionId: String,
      correct: Boolean,
      answer: String,
      
    }
  ]


}, { timestamps: true });

module.exports = mongoose.model("Team", teamSchema);