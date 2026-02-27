const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({

  teamName: {
    type: String,
    required: true,
    trim: true
  },

  message: {
    type: String,
    required: true,
    trim: true
  },

  status: {
    type: String,
    enum: ["open", "closed"],
    default: "open"
  }

}, { timestamps: true });

module.exports = mongoose.model("Ticket", ticketSchema);