require("dotenv").config();
const mongoose = require("mongoose");
const Question = require("./models/Question");

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected for Seeding"))
.catch(err => console.log(err));

const questions = [
  {
    category: "AI",
    difficulty: "easy",
    question: "What does AI stand for?",
    options: [
      "Automated Intelligence",
      "Artificial Intelligence",
      "Advanced Integration",
      "Algorithmic Information"
    ],
    correctAnswer: "Artificial Intelligence",
    points: 1
  },
  {
    category: "Planets",
    difficulty: "easy",
    question: "Which planet is closest to the Sun?",
    options: [
      "Venus",
      "Mercury",
      "Earth",
      "Mars"
    ],
    correctAnswer: "Mercury",
    points: 1
  }
];

async function seedDB() {
  await Question.deleteMany();
  await Question.insertMany(questions);
  console.log("Questions Inserted");
  process.exit();
}

seedDB();