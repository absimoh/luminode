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

const User = require("./models/User");
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

/* ================= LOGIN + REGISTER PAGES ================= */
app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/pages/login.html"));
});

/* ================= ADMIN LOGIN ================= */
app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (username === "Absi" && password === "Absi1234") {
    const token = jwt.sign({ role: "admin" }, "secretkey", { expiresIn: "3h" });
    return res.json({ token });
  }

  res.status(401).json({ message: "Invalid credentials" });
});

/* ================= USER REGISTER ================= */
app.post("/api/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const exist = await User.findOne({ email });
    if (exist) return res.status(400).json({ message: "Email exists" });

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username,
      email,
      password: hashed,
      score: 0,
      answers: []
    });

    res.json({ message: "User created successfully" });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= USER LOGIN ================= */
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Wrong password" });

    const token = jwt.sign(
      { userId: user._id },
      "secretkey",
      { expiresIn: "2h" }
    );

    res.json({ token });

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

    const user = await User.findById(req.user.userId);
    const question = await Question.findById(questionId);

    if (!user || !question)
      return res.status(400).json({ message: "Error" });

    const alreadyAnswered = user.answers.find(
      a => a.questionId == questionId // 👈 FIX مهم
    );

    if (alreadyAnswered) {
      return res.json({
        message: "Already answered",
        correct: alreadyAnswered.correct
      });
    }

    const correct = question.correctAnswer === answer;

    if (correct) user.score += question.points;

    user.answers.push({
      questionId,
      correct,
      answer
    });

    await user.save();

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

  const users = await User.find().sort({ score: -1 });
  res.json(users);
});

/* ================= CONTROL ================= */
app.post("/api/control", auth, async (req, res) => {
  let control = await Control.findOne();
  if (!control) control = await Control.create({});

  Object.assign(control, req.body);
  await control.save();

  res.json({ message: "Updated" });
});

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

  socket.on("joinUser", (data) => {
    try {
      const decoded = jwt.verify(data.token, "secretkey");

      socket.join(decoded.userId.toString());

      onlineUsers.add(decoded.userId);

      io.emit("onlineCount", onlineUsers.size);

    } catch {
      socket.disconnect();
    }
  });

  socket.on("disconnect", () => {
    onlineUsers.clear();
    io.emit("onlineCount", onlineUsers.size);
  });

});