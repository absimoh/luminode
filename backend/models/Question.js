const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

  question: {
    type: String,
    required: true,
    trim: true
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: function(arr) {
        return arr.length >= 2;
      },
      message: "At least 2 options required"
    }
  },

  correctAnswer: {
    type: String,
    required: true
  },

  category: {
    type: String,
    required: true,
    trim: true
  },

  points: {
    type: Number,
    default: 1
  },

  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium"
  },

  timeLimit: {
    type: Number, // seconds
    default: 30
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);