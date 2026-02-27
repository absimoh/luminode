require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const path = require("path");

const Team = require("./models/Team");
const Question = require("./models/Question");
const Control = require("./models/Control");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Connection Error:", err));

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("🔥 Luminode Competition Live");
});

/* ================= QUESTIONS ================= */

app.get("/api/questions", async (req, res) => {
  try {
    const control = await Control.findOne();

    if (!control || !control.showChallenges) {
      return res.status(403).json({
        message: "Challenges are not available yet"
      });
    }

    const { category, difficulty } = req.query;

    let filter = { isActive: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter).select("-correctAnswer");

    res.json(questions);

  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

/* ================= CREATE TEAM ================= */

app.post("/api/team/create", async (req, res) => {
  try {
    const { name, password, memberName } = req.body;

    if (!name || !password || !memberName) {
      return res.status(400).json({ message: "All fields required" });
    }

    const existingTeam = await Team.findOne({ name });
    if (existingTeam) {
      return res.status(400).json({ message: "Team already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeam = new Team({
      name,
      password: hashedPassword,
      members: [{ name: memberName }]
    });

    await newTeam.save();

    res.status(201).json({ message: "Team created successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= JOIN TEAM ================= */

app.post("/api/team/join", async (req, res) => {
  try {
    const { name, password, memberName } = req.body;

    const team = await Team.findOne({ name });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    team.members.push({ name: memberName });
    await team.save();

    res.json({ message: "Joined successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ANSWER ================= */

app.post("/api/answer", async (req, res) => {
  try {
    const control = await Control.findOne();
    if (!control || !control.showChallenges) {
      return res.status(403).json({
        message: "Challenges are closed"
      });
    }

    const { teamName, questionId, answer } = req.body;

    const team = await Team.findOne({ name: teamName });
    const question = await Question.findById(questionId);

    if (!team || !question)
      return res.status(404).json({ message: "Not found" });

    if (team.solvedChallenges.includes(question._id))
      return res.status(400).json({ message: "Already solved" });

    if (question.correctAnswer === answer) {
      team.score += question.points;
      team.solvedChallenges.push(question._id);
      await team.save();

      return res.json({ correct: true, score: team.score });
    }

    res.json({ correct: false });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LEADERBOARD ================= */

app.get("/api/leaderboard", async (req, res) => {
  try {
    const control = await Control.findOne();

    if (!control || !control.showRanking) {
      return res.status(403).json({
        message: "Leaderboard is not available yet"
      });
    }

    const teams = await Team.find().sort({ score: -1 });
    res.json(teams);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= ADMIN CONTROL ================= */

app.post("/api/admin/toggle", async (req, res) => {
  const { showChallenges, showRanking } = req.body;

  await Control.updateOne(
    {},
    { showChallenges, showRanking },
    { upsert: true }
  );

  res.json({ message: "Control updated" });
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});