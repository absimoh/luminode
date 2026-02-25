let currentCategory = "AI";
let currentDifficulty = "easy";
let questions = [];

const team = JSON.parse(localStorage.getItem("team"));

if (!team) {
  window.location = "/";
}

document.getElementById("teamInfo").innerText = "Team: " + team.name;
document.getElementById("scoreInfo").innerText = "Score: " + team.score;

function loadCategory(category) {
  currentCategory = category;
  fetchQuestions();
}

function setDifficulty(level) {
  currentDifficulty = level;
  fetchQuestions();
}

function fetchQuestions() {
  fetch(`/api/questions?category=${currentCategory}&difficulty=${currentDifficulty}`)
    .then(res => res.json())
    .then(data => {
      questions = data;
      renderQuestions();
    });
}

function renderQuestions() {
  const grid = document.getElementById("questionsGrid");
  grid.innerHTML = "";

  questions.forEach((q, index) => {
    grid.innerHTML += `
      <div class="question-card" onclick="openQuestion(${index})">
        Q${index + 1}<br>${q.points} pts
      </div>
    `;
  });
}

function openQuestion(index) {
  const q = questions[index];

  let optionsHTML = q.options.map(opt =>
    `<button onclick="submitAnswer('${q._id}', '${opt}')">${opt}</button>`
  ).join("<br>");

  document.body.innerHTML += `
    <div class="modal">
      <div class="modal-content">
        <h3>${q.question}</h3>
        ${optionsHTML}
        <button onclick="closeModal()">Close</button>
      </div>
    </div>
  `;
}

function submitAnswer(questionId, answer) {
  fetch("/api/answer", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      teamName: team.name,
      questionId,
      answer
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.correct) {
      alert("Correct! +" + data.newScore);
      team.score = data.newScore;
      localStorage.setItem("team", JSON.stringify(team));
      document.getElementById("scoreInfo").innerText = "Score: " + team.score;
    } else {
      alert("Wrong answer");
    }
    closeModal();
  });
}

function closeModal() {
  document.querySelector(".modal").remove();
}

fetchQuestions();