const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Team = require("./models/Team");
const Control = require("./models/Control");
const Ticket = require("./models/Ticket");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= CREATE TEAM (ADMIN USE) ================= */

app.post("/api/team/create", async (req, res) => {
  const { name, password } = req.body;

  const existing = await Team.findOne({ name });
  if (existing) return res.status(400).json({ message: "Team exists" });

  const hashed = await bcrypt.hash(password, 10);

  await Team.create({
    name,
    password: hashed,
    members: [],
    score: 0
  });

  res.json({ message: "Team created" });
});

/* ================= GET TEAMS ================= */

app.get("/api/teams", async (req, res) => {
  const teams = await Team.find().select("name");
  res.json(teams);
});

/* ================= JOIN TEAM ================= */

app.post("/api/team/join", async (req, res) => {
  const { name, password, memberName } = req.body;

  const team = await Team.findOne({ name });
  if (!team) return res.status(404).json({ message: "Team not found" });

  const match = await bcrypt.compare(password, team.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  team.members.push({ name: memberName });
  await team.save();

  res.json({ message: "Joined successfully" });
});

/* ================= ADMIN CONTROL ================= */

app.post("/api/admin/toggle", async (req, res) => {
  const { showChallenges, showRanking } = req.body;

  await Control.updateOne(
    {},
    { showChallenges, showRanking },
    { upsert: true }
  );

  res.json({ message: "Updated" });
});

/* ================= GET TICKETS ================= */

app.get("/api/admin/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

app.post("/api/ticket", async (req, res) => {
  const { teamName, message } = req.body;
  await Ticket.create({ teamName, message });
  res.json({ message: "Ticket sent" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));