const socket = io();

const teamName = localStorage.getItem("teamName");

socket.emit("joinTeam", { teamName });

let currentQuestions = [];
let currentIndex = 0;
let answeredStatus = {};

/* ===== SOCKET ===== */
socket.on("questionAnswered", (data) => {

  answeredStatus[data.questionId] = data.correct;
  answeredStatus[data.questionId + "_selected"] = data.answer;

  renderNumbers();
  renderQuestion();
  loadScore();
});

/* ===== LOAD QUESTIONS ===== */
async function loadQuestions(category){

  const res = await fetch(`/api/questions/${category}`);
  const data = await res.json();

  const teamRes = await fetch(`/api/team/${teamName}`);
  const teamData = await teamRes.json();

  answeredStatus = {};

  teamData.answers.forEach(a => {
    answeredStatus[a.questionId] = a.correct;
    answeredStatus[a.questionId + "_selected"] = a.answer;
  });

  currentQuestions = data;
  currentIndex = 0;

  renderQuestion();
  renderNumbers();
}

/* ===== RENDER QUESTION ===== */
function renderQuestion(){

  const container = document.getElementById("questionsContainer");
  container.innerHTML = "";

  const q = currentQuestions[currentIndex];
  const answered = answeredStatus[q._id];

  let optionsHTML = "";

  q.options.forEach(opt => {

    let disabled = answered !== undefined ? "disabled" : "";
    let color = "";

    if (answered !== undefined){

      if(opt === q.correctAnswer){
        color = "background:#22c55e";
      }

      if(!answered && opt === answeredStatus[q._id+"_selected"]){
        color = "background:#ef4444";
      }

    }

    optionsHTML += `
      <button class="option-btn"
        ${disabled}
        style="${color}"
        onclick="submitAnswer('${q._id}','${opt}',this)">
        ${opt}
      </button>
    `;
  });

  container.innerHTML = `
    <div class="question-card">
      <h3>Question ${currentIndex + 1}</h3>
      <p>${q.question}</p>

      <div class="options-grid">
        ${optionsHTML}
      </div>

      <div class="pagination">
        <button onclick="prevQuestion()">⬅ Prev</button>
        <button onclick="nextQuestion()">Next ➡</button>
      </div>
    </div>
  `;
}

/* ===== SUBMIT ===== */
async function submitAnswer(questionId, answer){

  const res = await fetch("/api/submit",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      teamName,
      questionId,
      answer
    })
  });

  const data = await res.json();

  answeredStatus[questionId] = data.correct;
  answeredStatus[questionId + "_selected"] = answer;

  renderNumbers();
  renderQuestion();
}

/* ===== NAV ===== */
function nextQuestion(){
  if(currentIndex < currentQuestions.length - 1){
    currentIndex++;
    renderQuestion();
    renderNumbers();
  }
}

function prevQuestion(){
  if(currentIndex > 0){
    currentIndex--;
    renderQuestion();
    renderNumbers();
  }
}

/* ===== NUMBERS ===== */
function renderNumbers(){

  const container = document.getElementById("questionNumbers");
  container.innerHTML = "";

  currentQuestions.forEach((q,i)=>{

    const btn = document.createElement("button");
    btn.innerText = i+1;

    if(answeredStatus[q._id] === true)
      btn.style.background="#22c55e";

    if(answeredStatus[q._id] === false)
      btn.style.background="#ef4444";

    btn.onclick=()=>{
      currentIndex=i;
      renderQuestion();
      renderNumbers();
    };

    container.appendChild(btn);

  });
}