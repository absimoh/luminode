require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const Team = require("./models/Team");
const Question = require("./models/Question");
const Control = require("./models/Control");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= GET TEAMS ================= */
app.get("/api/teams", async (req, res) => {
  const teams = await Team.find().select("name score");
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

/* ================= QUESTIONS ================= */
app.get("/api/questions", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.challengesOpen)
    return res.json({ message: "Challenges closed" });

  const questions = await Question.find({ isActive: true }).select("-correctAnswer");
  res.json(questions);
});

/* ================= LEADERBOARD ================= */
app.get("/api/leaderboard", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.leaderboardOpen)
    return res.json({ message: "Leaderboard closed" });

  const teams = await Team.find().sort({ score: -1 });
  res.json(teams);
});

/* ================= CONTROL ================= */
app.get("/api/control", async (req, res) => {
  let control = await Control.findOne();
  if (!control) control = await Control.create({});
  res.json(control);
});

app.post("/api/control", async (req, res) => {
  const { challengesOpen, leaderboardOpen } = req.body;

  let control = await Control.findOne();
  if (!control) control = await Control.create({});

  control.challengesOpen = challengesOpen;
  control.leaderboardOpen = leaderboardOpen;
  await control.save();

  res.json({ message: "Updated" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port " + PORT));