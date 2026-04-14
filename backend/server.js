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
  cors: { origin: "*" }
});

/* ===== MIDDLEWARE ===== */
app.use(cors());
app.use(express.json());
app.use(express.static("frontend"));

/* ===== MONGO ===== */
mongoose.connect(process.env.MONGO_URI)
.then(()=> console.log("✅ MongoDB Connected"))
.catch(err=> console.log(err));

/* ===== SOCKET ===== */
io.on("connection",(socket)=>{
  console.log("user connected");
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
    answers:[]
  });

  await team.save();

  res.json({ message:"Team created successfully" });

});

// 🟢 GET TEAMS
app.get("/api/teams", async (req,res)=>{
  const teams = await Team.find();
  res.json(teams);
});

// 🟢 QUESTIONS
app.get("/api/questions/:category", async (req,res)=>{
  const q = await Question.find({ category: req.params.category });
  res.json(q);
});

/* ===== PAGE ROUTES ===== */

app.get("/", (req,res)=>{
  res.sendFile(__dirname + "/../frontend/pages/index.html");
});

app.get("/admin", (req,res)=>{
  res.sendFile(__dirname + "/../frontend/pages/admin.html");
});

app.get("/dashboard", (req,res)=>{
  res.sendFile(__dirname + "/../frontend/pages/dashboard.html");
});

app.get("/leaderboard", (req,res)=>{
  res.sendFile(__dirname + "/../frontend/pages/leaderboard.html");
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, ()=>{
  console.log("🔥 Server running on port " + PORT);
});