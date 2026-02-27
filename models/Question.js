const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({

  question: {
    type: String,
    required: true,
    trim: true
  },

  options: {
    type: [String],
    required: true
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

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Question", questionSchema);