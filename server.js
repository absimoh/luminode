const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const Team = require("./models/Team");
const Question = require("./models/Question");
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

/* ================= TEAMS ================= */

app.get("/api/teams", async (req, res) => {
  const teams = await Team.find().select("name");
  res.json(teams);
});

app.post("/api/team/join", async (req, res) => {
  const { name, password, memberName } = req.body;

  const team = await Team.findOne({ name });
  if (!team) return res.status(404).json({ message: "Team not found" });

  const match = await bcrypt.compare(password, team.password);
  if (!match) return res.status(400).json({ message: "Wrong password" });

  team.members.push({ name: memberName, score: 0 });
  await team.save();

  res.json({ message: "Joined successfully" });
});
/* ================= CREATE TEAM (TEMP) ================= */

app.post("/api/team/create", async (req, res) => {
  try {
    const { name, password } = req.body;

    const existing = await Team.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const team = new Team({
      name,
      password: hashed,
      members: [],
      score: 0
    });

    await team.save();
    res.json({ message: "Team created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error creating team" });
  }
});
/* ================= QUESTIONS ================= */

app.get("/api/questions", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.showChallenges)
    return res.status(403).json({ message: "Challenges are closed" });

  const questions = await Question.find({ isActive: true }).select("-correctAnswer");
  res.json(questions);
});

app.post("/api/answer", async (req, res) => {
  const { teamName, questionId, answer } = req.body;

  const control = await Control.findOne();
  if (!control || !control.showChallenges)
    return res.status(403).json({ message: "Challenges are closed" });

  const team = await Team.findOne({ name: teamName });
  const question = await Question.findById(questionId);

  if (!team || !question)
    return res.status(404).json({ message: "Not found" });

  if (question.correctAnswer === answer) {
    team.score += question.points;
    await team.save();
    return res.json({ correct: true });
  }

  res.json({ correct: false });
});

/* ================= LEADERBOARD ================= */

app.get("/api/leaderboard", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.showRanking)
    return res.status(403).json({ message: "Leaderboard is closed" });

  const teams = await Team.find().sort({ score: -1 });
  res.json(teams);
});

/* ================= TICKETS ================= */

app.post("/api/ticket", async (req, res) => {
  const { teamName, message } = req.body;
  await Ticket.create({ teamName, message });
  res.json({ message: "Ticket sent successfully" });
});

/* ================= ADMIN ================= */

app.post("/api/admin/toggle", async (req, res) => {
  const { showChallenges, showRanking } = req.body;

  await Control.updateOne(
    {},
    { showChallenges, showRanking },
    { upsert: true }
  );

  res.json({ message: "Control updated" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Server running"));



