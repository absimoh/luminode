require("dotenv").config();
let onlineUsers = new Set();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

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
app.use(express.static(path.join(__dirname, "../frontend")));

/* ================= DATABASE ================= */
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log("DB Error:", err));

/* ================= AUTH ================= */
function auth(req, res, next) {
  const token = req.headers.authorization;

  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, "secretkey");
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ message: "Invalid token" });
  }
}

/* ================= FRONTEND ROUTES ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/admin.html"));
});

app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/admin-login.html"));
});

app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/leaderboard.html"));
});

/* ================= ADMIN LOGIN ================= */
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === "admin" && password === "1234") {
    const token = jwt.sign({ role: "admin" }, "secretkey", { expiresIn: "3h" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

/* ================= TEAM LOGIN ================= */
app.post("/api/team/login", async (req, res) => {
  try {
    const { name, password } = req.body;

    const team = await Team.findOne({ name });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const match = await bcrypt.compare(password, team.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { teamName: team.name },
      "secretkey",
      { expiresIn: "2h" }
    );

    res.json({ token });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= TEAMS ================= */
app.get("/api/teams", async (req, res) => {
  const teams = await Team.find().select("name score");
  res.json(teams);
});

/* ================= JOIN TEAM ================= */
app.post("/api/team/join", async (req, res) => {
  try {
    const { name, password, memberName } = req.body;

    const team = await Team.findOne({ name });
    if (!team) return res.status(404).json({ message: "Team not found" });

    const match = await bcrypt.compare(password, team.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });
    
     // 🔥 إذا الشخص موجود يرجع طبيعي
    const exists = team.members.find(m => m.name === memberName);

    if (exists) {
      return res.json({
        message: "Welcome back",
        alreadyJoined: true
      });
    }

    // 🔥 LIMIT
    if (team.members.length >= 5) {
      return res.status(400).json({
        message: "Team is full (max 5 members)"
      });
    }

    team.members.push({ name: memberName });
    await team.save();

    res.json({ message: "Joined successfully" });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= CREATE TEAM ================= */
app.post("/api/admin/create-team", async (req, res) => {

  try {

    const { name, password } = req.body;

    if(!name || !password){
      return res.json({ message: "Missing data" });
    }

    const existing = await Team.findOne({ name });

    if(existing){
      return res.json({ message: "Team already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const team = new Team({
      name,
      password: hashedPassword,
      score: 0,
      members: [],
      answers: []
    });

    await team.save();

    res.json({ message: "Team created" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});

/* ================= GET TEAM DATA 🔥 FIX ================= */
app.get("/api/team/:name", async (req, res) => {
  try {
    const team = await Team.findOne({ name: req.params.name });

    if (!team) {
      return res.status(404).json({ message: "Team not found" });
    }

    res.json({
      score: team.score,
      answers: team.answers || []
    });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= QUESTIONS ================= */
app.get("/api/categories", async (req, res) => {
  const categories = await Question.distinct("category");
  res.json(categories);
});

app.get("/api/questions/:category", async (req, res) => {
  const control = await Control.findOne();

  if (!control || !control.challengesOpen)
    return res.status(403).json({ message: "Challenges closed" });

  const questions = await Question.find({
    category: new RegExp("^" + req.params.category + "$", "i"),
    isActive: true
  }).select("-correctAnswer");

  res.json(questions);
});

/* ================= SUBMIT ANSWER ================= */
app.post("/api/submit", auth, async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const teamName = req.user.teamName;

    const team = await Team.findOne({ name: teamName });
    const question = await Question.findById(questionId);

    if (!team || !question)
      return res.status(400).json({ message: "Error" });

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

    if (correct) team.score += question.points;

    team.answers.push({ 
      questionId, 
      correct,
      answer // 🔥 نحفظ الإجابة

    });
    await team.save();

    io.to(teamName).emit("questionAnswered", {
      questionId,
      correct,
      answer
    });

    io.emit("scoreUpdate");

    res.json({ correct });

  } catch {
    res.status(500).json({ message: "Server error" });
  }
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
app.post("/api/control", auth, async (req, res) => {
  let control = await Control.findOne();
  if (!control) control = await Control.create({});

  Object.assign(control, req.body);
  await control.save();

  res.json({ message: "Updated" });
});

/* ================= GET CONTROL ================= */
app.get("/api/control", async (req, res) => {
  let control = await Control.findOne();

  if (!control) {
    control = await Control.create({
      challengesOpen: true,
      leaderboardOpen: true
    });
  }

  res.json(control);
});

/* ================= TICKETS ================= */
app.post("/api/ticket", async (req, res) => {
  await Ticket.create(req.body);
  res.json({ message: "Ticket sent" });
});

app.get("/api/tickets", auth, async (req, res) => {
  const tickets = await Ticket.find().sort({ createdAt: -1 });
  res.json(tickets);
});

app.put("/api/tickets/:id", auth, async (req, res) => {
  await Ticket.findByIdAndUpdate(req.params.id, {
    status: "closed"
  });
  res.json({ message: "Ticket closed" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 10000;
const server = http.createServer(app);
const io = new Server(server);

server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

/* ================= SOCKET ================= */
io.on("connection", (socket) => {

  socket.on("joinTeam", (data) => {
    try {
      const decoded = jwt.verify(data.token, "secretkey");

      socket.join(decoded.teamName);

      onlineUsers.add(decoded.teamName);

      io.emit("onlineCount", onlineUsers.size);

    } catch {
      socket.disconnect();
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.clear(); // بسيط مؤقت
    io.emit("onlineCount", onlineUsers.size);
  });

});