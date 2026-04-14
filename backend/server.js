const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const Team = require("./models/Team");
const Question = require("./models/Question");
const Ticket = require("./models/Ticket");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/pages", express.static(path.join(__dirname, "../frontend/pages")));

/* ===== MONGO ===== */
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("✅ MongoDB Connected"))
.catch(err=> console.log("❌ Mongo Error:", err));

/* ===== SOCKET ===== */
io.on("connection",(socket)=>{

  console.log("user connected");

  // 🔥 دخول الفريق
  socket.on("joinTeam", ({ teamName }) => {
    socket.join(teamName);
    console.log("joined team:", teamName);
  });

});

/* ===== ROUTES ===== */

// 🟢 CREATE TEAM
app.post("/api/team/create", async (req,res)=>{

  const { name, password } = req.body;

  const exists = await Team.findOne({ name });

  if(exists){
    return res.json({ message:"Team already exists" });
  }

  const team = new Team({
    name,
    password,
    score:0,
    answers:[],
    members:[]
  });

  await team.save();

  res.json({ message:"Team created successfully" });

});

// 🟢 GET TEAMS
app.get("/api/teams", async (req,res)=>{
  const teams = await Team.find();
  res.json(teams);
});

// 🟢 GET TEAM
app.get("/api/team/:name", async (req,res)=>{
  const team = await Team.findOne({ name: req.params.name });
  res.json(team);
});

// 🟢 GET CATEGORIES 🔥 (مهم جدًا)
app.get("/api/categories", async (req, res) => {
  const categories = await Question.distinct("category");
  res.json(categories);
});

// 🟢 QUESTIONS
app.get("/api/questions/:category", async (req,res)=>{
  const q = await Question.find({ category: req.params.category });
  res.json(q);
});

/* ===== LOGIN TEAM ===== */
app.post("/api/team/login", async (req, res) => {

  const { name, password } = req.body;

  const team = await Team.findOne({ name });

  if (!team) {
    return res.json({ message: "Team not found" });
  }

  if (team.password !== password) {
    return res.json({ message: "Wrong password" });
  }

  res.json({ success: true });

});

/* ===== JOIN TEAM (إضافة عضو) ===== */
app.post("/api/team/join", async (req, res) => {

  const { name, memberName } = req.body;

  const team = await Team.findOne({ name });

  if (!team) {
    return res.json({ message: "Team not found" });
  }

  // منع التكرار
  const exists = team.members.find(m => m.name === memberName);

  if (!exists) {
    team.members.push({ name: memberName });
    await team.save();
  }

  res.json({ success: true });

});

/* ===== 🔥 SUBMIT ANSWER ===== */
app.post("/api/submit", async (req,res)=>{

  try{

    const { teamName, questionId, answer } = req.body;

    const team = await Team.findOne({ name: teamName });
    const question = await Question.findById(questionId);

    if(!team || !question){
      return res.status(400).json({ message:"Error" });
    }

    // منع التكرار
    const already = team.answers.find(
      a => a.questionId.toString() === questionId
    );

    if(already){
      return res.json({
        correct: already.correct
      });
    }

    const correct = question.correctAnswer === answer;

    if(correct){
      team.score += question.points;
    }

    team.answers.push({
      questionId,
      correct,
      answer
    });

    await team.save();

    /* 🔥 realtime للفريق */
    io.to(teamName).emit("questionAnswered",{
      questionId,
      correct,
      answer
    });

    /* 🔥 تحديث السكور */
    io.emit("scoreUpdate");

    res.json({ correct });

  }catch(err){
    console.log(err);
    res.status(500).json({ message:"Server Error" });
  }

});

/* ===== HELP TICKET ===== */
app.post("/api/ticket", async (req,res)=>{

  const { teamName, message } = req.body;

  const ticket = new Ticket({
    teamName,
    message
  });

  await ticket.save();

  io.emit("newTicket");

  res.json({ success:true });

});

/* ===== PAGES ===== */

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname, "../frontend/pages/index.html"));
});

app.get("/admin", (req,res)=>{
  res.sendFile(path.join(__dirname, "../frontend/pages/admin.html"));
});

app.get("/dashboard", (req,res)=>{
  res.sendFile(path.join(__dirname, "../frontend/pages/dashboard.html"));
});

app.get("/leaderboard", (req,res)=>{
  res.sendFile(path.join(__dirname, "../frontend/pages/leaderboard.html"));
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=>{
  console.log("🔥 Server running on port " + PORT);
});