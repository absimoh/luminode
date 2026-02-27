const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  teamName: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", ticketSchema);