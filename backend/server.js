const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

const Team = require("./models/Team");
const Question = require("./models/Question");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

/* ===== MONGODB ===== */
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.log("❌ Mongo Error:", err));

/* ===== SOCKET ===== */
io.on("connection", (socket) => {

  socket.on("joinTeam", ({ teamName }) => {
    socket.join(teamName);
  });

});

/* ===== ROUTES ===== */

// كل الفرق
app.get("/api/teams", async (req, res) => {
  const teams = await Team.find();
  res.json(teams);
});

// فريق واحد
app.get("/api/team/:name", async (req, res) => {
  const team = await Team.findOne({ name: req.params.name });
  res.json(team);
});

// أسئلة حسب التصنيف
app.get("/api/questions/:category", async (req, res) => {
  const questions = await Question.find({ category: req.params.category });
  res.json(questions);
});

/* ===== SUBMIT ANSWER ===== */
app.post("/api/submit", async (req, res) => {

  try {

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

    // 🔥 realtime للفريق
    io.to(teamName).emit("questionAnswered", {
      questionId,
      correct,
      answer
    });

    // 🔥 تحديث السكور
    io.emit("scoreUpdate");

    res.json({ correct });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error" });
  }

});

/* ===== TEST ROUTE ===== */
app.get("/", (req, res) => {
  res.send("Luminode server is running 🚀");
});

/* ===== PORT FIX (مهم جدًا) ===== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port " + PORT);
});
