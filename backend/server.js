const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const Team = require("./models/Team");
const Question = require("./models/Question");
const Ticket = require("./models/Ticket");
const Control = require("./models/Control");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

/* ===== DB ===== */
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("✅ MongoDB Connected"))
.catch(err=> console.log(err));

/* ===== SOCKET ===== */
io.on("connection",(socket)=>{

  socket.on("joinTeam", ({ teamName }) => {
    socket.join(teamName);
  });

});

/* ===== ADMIN LOGIN ===== */
app.post("/api/admin/login", (req,res)=>{

  const { username, password } = req.body;

  if(username === "admin" && password === "1234"){
    return res.json({ token: "admin-token" });
  }

  res.json({ message:"Invalid credentials" });

});

/* ===== CONTROL SYSTEM ===== */

// GET control
app.get("/api/control", async (req,res)=>{
  let control = await Control.findOne();

  if(!control){
    control = await Control.create({});
  }

  res.json(control);
});

// UPDATE control
app.post("/api/control", async (req,res)=>{

  let control = await Control.findOne();

  if(!control){
    control = await Control.create({});
  }

  if(req.body.challengesOpen !== undefined){
    control.challengesOpen = req.body.challengesOpen;
  }

  if(req.body.leaderboardOpen !== undefined){
    control.leaderboardOpen = req.body.leaderboardOpen;
  }

  await control.save();

  // 🔥 realtime update
  io.emit("controlUpdate", control);

  res.json(control);

});

/* ===== TEAM ===== */

// create team
app.post("/api/team/create", async (req,res)=>{
  const { name, password } = req.body;

  const exists = await Team.findOne({ name });
  if(exists) return res.json({ message:"Team exists" });

  await Team.create({ name, password });
  res.json({ message:"Team created" });
});

// login
app.post("/api/team/login", async (req,res)=>{
  const { name, password } = req.body;

  const team = await Team.findOne({ name });

  if(!team) return res.json({ message:"Team not found" });
  if(team.password !== password) return res.json({ message:"Wrong password" });

  res.json({ success:true });
});

// join team
app.post("/api/team/join", async (req,res)=>{
  const { name, memberName } = req.body;

  const team = await Team.findOne({ name });

  if(!team) return res.json({ message:"Error" });

  const exists = team.members.find(m=>m.name===memberName);

  if(!exists){
    team.members.push({ name: memberName });
    await team.save();
  }

  res.json({ success:true });
});

// teams
app.get("/api/teams", async (req,res)=>{
  res.json(await Team.find());
});

// team
app.get("/api/team/:name", async (req,res)=>{
  res.json(await Team.findOne({ name: req.params.name }));
});

/* ===== QUESTIONS ===== */

// categories
app.get("/api/categories", async (req,res)=>{
  const categories = await Question.distinct("category");
  res.json(categories);
});

// questions
app.get("/api/questions/:category", async (req,res)=>{
  res.json(await Question.find({ category: req.params.category }));
});

/* ===== SUBMIT ANSWER ===== */

app.post("/api/submit", async (req,res)=>{

  const { teamName, questionId, answer } = req.body;

  const team = await Team.findOne({ name: teamName });
  const question = await Question.findById(questionId);

  if(!team || !question) return res.json({});

  const already = team.answers.find(a=>a.questionId.toString()===questionId);

  if(already){
    return res.json({ correct: already.correct });
  }

  const correct = question.correctAnswer === answer;

  if(correct){
    team.score += question.points;
  }

  team.answers.push({ questionId, correct, answer });

  await team.save();

  // 🔥 realtime
  io.to(teamName).emit("questionAnswered",{ questionId, correct, answer });
  io.emit("scoreUpdate");

  res.json({ correct });

});

/* ===== LEADERBOARD ===== */

app.get("/api/leaderboard", async (req,res)=>{
  const teams = await Team.find().sort({ score:-1 });
  res.json(teams);
});

/* ===== TICKETS ===== */

// create ticket
app.post("/api/ticket", async (req,res)=>{
  await Ticket.create(req.body);
  io.emit("newTicket");
  res.json({ success:true });
});

// get tickets
app.get("/api/tickets", async (req,res)=>{
  const tickets = await Ticket.find({ status:"open" });
  res.json(tickets);
});

// close ticket
app.put("/api/tickets/:id", async (req,res)=>{
  await Ticket.findByIdAndUpdate(req.params.id, { status:"closed" });
  res.json({ success:true });
});

/* ===== PAGES ===== */

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"../frontend/pages/index.html"));
});

app.get("/dashboard",(req,res)=>{
  res.sendFile(path.join(__dirname,"../frontend/pages/dashboard.html"));
});

app.get("/leaderboard",(req,res)=>{
  res.sendFile(path.join(__dirname,"../frontend/pages/leaderboard.html"));
});

app.get("/admin", (req,res)=>{
  res.sendFile(path.join(__dirname,"../frontend/pages/admin.html"));
});

app.get("/admin-login", (req,res)=>{
  res.sendFile(path.join(__dirname,"../frontend/pages/admin-login.html"));
});

/* ===== START ===== */

const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=>{
  console.log("🔥 Running on " + PORT);
});