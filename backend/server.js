const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Team = require("./models/Team");
const Question = require("./models/Question");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

/* ===== MongoDB ===== */
mongoose.connect(process.env.MONGO_URI)
.then(()=>console.log("MongoDB Connected"))
.catch(err=>console.log(err));

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

  socket.on("joinTeam", ({ teamName }) => {
    socket.join(teamName);
  });

});

/* ===== GET TEAMS ===== */
app.get("/api/teams", async (req,res)=>{
  const teams = await Team.find();
  res.json(teams);
});

/* ===== GET TEAM ===== */
app.get("/api/team/:name", async (req,res)=>{
  const team = await Team.findOne({ name: req.params.name });
  res.json(team);
});

/* ===== GET QUESTIONS ===== */
app.get("/api/questions/:category", async (req,res)=>{
  const questions = await Question.find({ category: req.params.category });
  res.json(questions);
});

/* ===== SUBMIT ANSWER ===== */
app.post("/api/submit", async (req, res) => {

  const { teamName, questionId, answer } = req.body;

  const team = await Team.findOne({ name: teamName });
  const question = await Question.findById(questionId);

  if (!team || !question) {
    return res.status(400).json({ message: "Error" });
  }

  // منع التكرار
  const alreadyAnswered = team.answers.find(
    a => a.questionId === questionId
  );

  if (alreadyAnswered) {
    return res.json({
      message: "Already answered",
      correct: alreadyAnswered.correct
    });
  }

  const correct = question.correctAnswer === answer;

  if (correct) {
    team.score += question.points;
  }

  // 🔥 حفظ الإجابة
  team.answers.push({
    questionId,
    correct,
    answer
  });

  await team.save();

  // 🔥 realtime
  io.to(teamName).emit("questionAnswered", {
    questionId,
    correct,
    answer
  });

  io.emit("scoreUpdate");

  res.json({ correct });

});

/* ===== START ===== */
server.listen(3000, ()=>{
  console.log("Server running on port 3000");
});