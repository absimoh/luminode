const Team = require("./models/Team");
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

/* ================= ROOT ================= */

app.get("/", (req, res) => {
  res.send("🔥 Luminode is Live");
});

/* ================= CHECK ROUTE ================= */

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
      members: [memberName],
      points: 0
    });

    await newTeam.save();

    res.status(201).json({
      message: "Team created successfully",
      team: {
        name: newTeam.name,
        members: newTeam.members,
        points: newTeam.points
      }
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

    team.members.push(memberName);
    await team.save();

    res.json({
      message: "Joined successfully",
      team
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= LEADERBOARD ================= */

app.get("/api/leaderboard", async (req, res) => {
  const teams = await Team.find().sort({ points: -1 });
  res.json(teams);
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});