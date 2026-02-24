const Team = require("./models/Team");
const Question = require("./models/Question");
const bcrypt = require("bcrypt");

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/* ================= DATABASE ================= */

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("Connection Error:", err));

/* ================= AUTO SEED (PRODUCTION SAFE) ================= */

mongoose.connection.once("open", async () => {
  const count = await Question.countDocuments();

  if (count === 0) {
    console.log("Seeding initial questions...");

    await Question.insertMany([
      {
        category: "AI",
        difficulty: "easy",
        question: "What does AI stand for?",
        options: [
          "Automated Intelligence",
          "Artificial Intelligence",
          "Advanced Integration",
          "Algorithmic Information"
        ],
        correctAnswer: "Artificial Intelligence",
        points: 1
      },
      {
        category: "Planets",
        difficulty: "easy",
        question: "Which planet is closest to the Sun?",
        options: ["Venus", "Mercury", "Earth", "Mars"],
        correctAnswer: "Mercury",
        points: 1
      }
    ]);

    console.log("Questions seeded successfully.");
  } else {
    console.log("Questions already exist. Skipping seed.");
  }
});

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("🔥 Luminode is Live");
});

/* ================= CHECK ================= */

app.get("/api/check", (req, res) => {
  res.json({ status: "API working ✅" });
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
      members: [{ name: memberName }],
      score: 0,
      solvedChallenges: []
    });

    await newTeam.save();

    res.status(201).json({
      message: "Team created successfully",
      team: newTeam
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= JOIN TEAM ================= */

app.post("/api/team/join", async (req, res) => {
  try {
    const { name, password, memberName } = req.body;

    if (!name || !password || !memberName) {
      return res.status(400).json({ message: "All fields required" });
    }

    const team = await Team.findOne({ name });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const isMatch = await bcrypt.compare(password, team.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    if (team.members.length >= 4) {
      return res.status(400).json({ message: "Team is full" });
    }

    team.members.push({ name: memberName });
    await team.save();

    res.json({
      message: "Joined successfully",
      team
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET QUESTIONS ================= */

app.get("/api/questions", async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter).select("-correctAnswer");
    res.json(questions);

  } catch (error) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

/* ================= ANSWER QUESTION ================= */

app.post("/api/answer", async (req, res) => {
  try {
    const { teamName, questionId, answer } = req.body;

    const team = await Team.findOne({ name: teamName });
    const question = await Question.findById(questionId);

    if (!team || !question) {
      return res.status(404).json({ message: "Team or question not found" });
    }

    if (team.solvedChallenges.includes(question._id)) {
      return res.status(400).json({ message: "Already solved" });
    }

    if (question.correctAnswer === answer) {
      team.score += question.points;
      team.solvedChallenges.push(question._id);
      await team.save();

      return res.json({
        correct: true,
        newScore: team.score
      });
    } else {
      return res.json({
        correct: false,
        message: "Wrong answer"
      });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LEADERBOARD ================= */

app.get("/api/leaderboard", async (req, res) => {
  try {
    const teams = await Team.find().sort({ score: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});