require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");

const http = require("http");
const { Server } = require("socket.io");

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
  .catch(err => console.log("DB Error:", err));

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

/* ================= GET CATEGORIES ================= */
app.get("/api/categories", async (req, res) => {
  const categories = await Question.distinct("category");
  res.json(categories);
});

/* ================= GET QUESTIONS BY CATEGORY ================= */
app.get("/api/questions/:category", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.challengesOpen)
    return res.status(403).json({ message: "Challenges closed" });

  const questions = await Question.find({
    category: { $regex: new RegExp("^" + req.params.category + "$", "i") },
    isActive: true
  }).select("-correctAnswer");

  res.json(questions);
});

/* ================= SUBMIT ANSWER ================= */
app.post("/api/submit", async (req, res) => {

  const { teamName, questionId, answer } = req.body;

  const team = await Team.findOne({ name: teamName });
  // منع حل السؤال مرتين
  const alreadyAnswered = team.answers.find(
    a => a.questionId === questionId
  );

  if(alreadyAnswered){
    return res.json({
      message: "Already answered",
      correct: alreadyAnswered.correct
    });
  }
  const question = await Question.findById(questionId);

  if (!team || !question) {
    return res.status(400).json({ message: "Error" });
  }

  const correct = question.correctAnswer === answer;

  if (correct) {
    team.score += question.points;
  }

  team.answers.push({
    questionId,
    correct
  });

  await team.save();

  // 🔴 إرسال التحديث لكل أعضاء نفس التيم
  io.to(teamName).emit("questionAnswered", {
    questionId,
    correct,
    answer
  });

  // 🔴 تحديث السكور لجميع الفرق
  io.emit("scoreUpdate");

  res.json({ correct });

});

/* ================= LEADERBOARD ================= */
app.get("/api/leaderboard", async (req, res) => {
  const control = await Control.findOne();
  if (!control || !control.leaderboardOpen)
    return res.status(403).json({ message: "Leaderboard closed" });

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

/* ================= TICKET ================= */
app.post("/api/ticket", async (req, res) => {
  const { teamName, message } = req.body;

  await Ticket.create({
    teamName,
    message
  });

  res.json({ message: "Ticket sent" });
});

/* ================= GET TICKETS ================= */
app.get("/api/tickets", async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

/* ================= CLOSE TICKET ================= */
app.put("/api/tickets/:id", async (req, res) => {
  await Ticket.findByIdAndUpdate(req.params.id, {
    status: "closed"
  });
  res.json({ message: "Ticket closed" });
});

/* ================= GET TEAM DATA ================= */
app.get("/api/team/:name", async (req, res) => {

  const team = await Team.findOne({ 
    name: req.params.name 
  });

  if (!team) {
    return res.status(404).json({ message: "Team not found" });
  }

  res.json({
    score: team.score,
    answers: team.answers
  });

});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 10000;
const server = http.createServer(app);
const io = new Server(server);

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

io.on("connection", (socket) => {

  socket.on("joinTeam", (teamName) => {
    socket.join(teamName);
  });

  socket.on("answerUpdate", (data) => {
    io.to(data.teamName).emit("questionAnswered", data);
  });

});