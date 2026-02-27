const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  teamName: String,
  message: String,
  status: { type: String, default: "open" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Ticket", ticketSchema);