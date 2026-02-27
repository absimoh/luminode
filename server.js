require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const Team = require("./models/Team");
const Question = require("./models/Question");
const Control = require("./models/Control");
const Ticket = require("./models/Ticket");

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

/* ================= ROOT ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

/* ================= GET ALL TEAMS ================= */
app.get("/api/teams", async (req, res) => {
  try {
    const teams = await Team.find().select("name score");
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: "Error fetching teams" });
  }
});

/* ================= JOIN TEAM ================= */
app.post("/api/team/join", async (req, res) => {
  try {
    const { name, password, memberName } = req.body;

    const team = await Team.findOne({ name });
    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    const match = await bcrypt.compare(password, team.password);
    if (!match) {
      return res.status(400).json({ message: "Wrong password" });
    }

    team.members.push({ name: memberName });
    await team.save();

    res.json({ message: "Joined successfully" });

  } catch (err) {
    res.status(500).json({ message: "Error joining team" });
  }
});

/* ================= CREATE TICKET ================= */
app.post("/api/ticket", async (req, res) => {
  try {
    const { teamName, message } = req.body;

    await Ticket.create({
      teamName,
      message
    });

    res.json({ message: "Ticket sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= GET CATEGORIES ================= */
app.get("/api/categories", async (req, res) => {
  try {
    const categories = await Question.distinct("category");
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Error fetching categories" });
  }
});

/* ================= GET QUESTIONS BY CATEGORY ================= */
app.get("/api/questions/:category", async (req, res) => {
  try {
    const control = await Control.findOne();

    if (!control || !control.challengesOpen) {
      return res.status(403).json({ message: "Challenges closed" });
    }

    const questions = await Question.find({
      category: { $regex: new RegExp("^" + req.params.category + "$", "i") },
      isActive: true
    }).select("-correctAnswer");

    res.json(questions);

  } catch (err) {
    res.status(500).json({ message: "Error fetching questions" });
  }
});

/* ================= LEADERBOARD ================= */
app.get("/api/leaderboard", async (req, res) => {
  try {
    const control = await Control.findOne();

    if (!control || !control.leaderboardOpen) {
      return res.status(403).json({ message: "Leaderboard closed" });
    }

    const teams = await Team.find().sort({ score: -1 });
    res.json(teams);

  } catch (err) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
});

/* ================= CONTROL STATUS ================= */
app.get("/api/control", async (req, res) => {
  try {
    let control = await Control.findOne();
    if (!control) {
      control = await Control.create({});
    }
    res.json(control);
  } catch (err) {
    res.status(500).json({ message: "Error fetching control" });
  }
});

/* ================= UPDATE CONTROL ================= */
app.post("/api/control", async (req, res) => {
  try {
    const { challengesOpen, leaderboardOpen } = req.body;

    let control = await Control.findOne();
    if (!control) {
      control = await Control.create({});
    }

    control.challengesOpen = challengesOpen;
    control.leaderboardOpen = leaderboardOpen;

    await control.save();

    res.json({ message: "Control updated" });

  } catch (err) {
    res.status(500).json({ message: "Error updating control" });
  }
});

/* ================= SUBMIT ANSWER ================= */
app.post("/api/submit", async (req, res) => {
  try {
    const { teamName, questionId, answer } = req.body;

    const team = await Team.findOne({ name: teamName });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: "Question not found" });

    // منع إعادة حل السؤال
    if (team.answeredQuestions && team.answeredQuestions.includes(questionId)) {
      return res.json({ correct: false, message: "Already answered" });
    }

    const correct = question.correctAnswer === answer;

    if (correct) {
      team.score += question.points || 1;
    }

    if (!team.answeredQuestions) team.answeredQuestions = [];
    team.answeredQuestions.push(questionId);

    await team.save();

    res.json({ correct });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
});
/* ================= START SERVER ================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});