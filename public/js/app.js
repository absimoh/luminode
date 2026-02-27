async function join() {
  const name = document.getElementById("teamName").value;
  const password = document.getElementById("password").value;
  const memberName = document.getElementById("memberName").value;

  const res = await fetch("/api/team/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, password, memberName })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("teamName", name);
    window.location.href = "/dashboard.html";
  } else {
    alert(data.message);
  }
}

async function loadDashboard() {
  const teamName = localStorage.getItem("teamName");
  if (!teamName) return window.location.href = "/";

  document.getElementById("team").innerText = teamName;

  const res = await fetch("/api/questions");
  const data = await res.json();

  if (!res.ok) {
    document.getElementById("questions").innerHTML =
      `<p>${data.message}</p>`;
    return;
  }

  const container = document.getElementById("questions");
  container.innerHTML = "";

  data.forEach(q => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <p><strong>${q.question}</strong></p>
      ${q.options.map(opt =>
        `<button onclick="answer('${q._id}','${opt}')">${opt}</button>`
      ).join("")}
    `;

    container.appendChild(div);
  });
}

async function answer(questionId, answer) {
  const teamName = localStorage.getItem("teamName");

  const res = await fetch("/api/answer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamName, questionId, answer })
  });

  const data = await res.json();

  if (data.correct) {
    alert("Correct! 🎉");
    loadDashboard();
  } else {
    alert("Wrong answer ❌");
  }
}

function goLeaderboard() {
  window.location.href = "/leaderboard.html";
}

function goBack() {
  window.location.href = "/dashboard.html";
}

async function loadLeaderboard() {
  const res = await fetch("/api/leaderboard");
  const data = await res.json();

  if (!res.ok) {
    document.getElementById("leaderboard").innerHTML =
      `<tr><td>${data.message}</td></tr>`;
    return;
  }

  const table = document.getElementById("leaderboard");
  table.innerHTML = "<tr><th>Rank</th><th>Team</th><th>Score</th></tr>";

  data.forEach((team, index) => {
    table.innerHTML += `
      <tr>
        <td>${index + 1}</td>
        <td>${team.name}</td>
        <td>${team.score}</td>
      </tr>
    `;
  });
}