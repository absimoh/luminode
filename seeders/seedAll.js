require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Question = require("../models/Question");

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

function getDifficulty(questionNumber) {
  if (questionNumber <= 40) return "easy";
  if (questionNumber <= 75) return "medium";
  return "hard";
}

function getPoints(difficulty) {
  if (difficulty === "easy") return 1;
  if (difficulty === "medium") return 2;
  return 3;
}

async function seedCategory(fileName, categoryName) {

  console.log(`Seeding ${categoryName}...`);

  await Question.deleteMany({ category: categoryName });

  const filePath = path.join(__dirname, `../data/${fileName}`);
  const text = fs.readFileSync(filePath, "utf-8");

  const questionBlocks = text.split(/Question \d+/).slice(1);

  const questions = [];

  questionBlocks.forEach((block, index) => {

    const questionNumber = index + 1;
    const difficulty = getDifficulty(questionNumber);

    const lines = block.trim().split("\n").map(l => l.trim());
    const questionText = lines[0];

    const options = [];
    let correctAnswer = "";

    lines.forEach(line => {
      if (/^[A-D]\)/.test(line)) {

        const clean = line.replace(/^[A-D]\)\s*/, "")
                          .replace("✓", "")
                          .trim();

        options.push(clean);

        if (line.includes("✓")) {
          correctAnswer = clean;
        }
      }
    });

    if (questionText && options.length === 4 && correctAnswer) {
      questions.push({
        category: categoryName,
        difficulty,
        question: questionText,
        options,
        correctAnswer,
        points: getPoints(difficulty)
      });
    }
  });

  await Question.insertMany(questions);

  console.log(`✅ ${categoryName} added (${questions.length} questions)`);
}

async function seedAll() {

  await seedCategory("ai.txt", "AI");
  await seedCategory("galaxies.txt", "Galaxies");
  await seedCategory("universe.txt", "Universe");
  await seedCategory("stars.txt", "Stars");
  await seedCategory("moons.txt", "Moons");
  await seedCategory("planets.txt", "Planets");

  console.log("🔥 All Categories Seeded Successfully");
}

seedAll();