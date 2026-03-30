const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },

  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  }

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);