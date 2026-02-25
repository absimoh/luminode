function showCreate() {
  document.getElementById("formArea").innerHTML = `
    <h2>Create Team</h2>
    <input id="teamName" placeholder="Team Name"><br>
    <input id="password" type="password" placeholder="Password"><br>
    <input id="memberName" placeholder="Your Name"><br>
    <button onclick="createTeam()">Create & Enter</button>
  `;
}

function showJoin() {
  fetch("/api/leaderboard")
    .then(res => res.json())
    .then(data => {

      if (data.length === 0) {
        document.getElementById("formArea").innerHTML =
          "<p>No teams available yet.</p>";
        return;
      }

      let teamsHTML = data.map(team => `
        <div class="team-card" onclick="selectTeam('${team.name}')">
          <h3>${team.name}</h3>
          <p>Score: ${team.score}</p>
        </div>
      `).join("");

      document.getElementById("formArea").innerHTML = `
        <h2>Select Team</h2>
        <div class="teams-grid">
          ${teamsHTML}
        </div>
        <div id="joinForm"></div>
      `;
    });
}

function selectTeam(teamName) {
  document.getElementById("joinForm").innerHTML = `
    <h3>Joining: ${teamName}</h3>
    <input id="joinPassword" type="password" placeholder="Password"><br>
    <input id="joinMemberName" placeholder="Your Name"><br>
    <button onclick="joinTeam('${teamName}')">Join</button>
  `;
}

function createTeam() {
  fetch("/api/team/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("teamName").value,
      password: document.getElementById("password").value,
      memberName: document.getElementById("memberName").value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.team) {
      localStorage.setItem("team", JSON.stringify(data.team));
      window.location = "dashboard.html";
    } else {
      alert(data.message);
    }
  });
}

function joinTeam(teamName) {
  fetch("/api/team/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: teamName,
      password: document.getElementById("joinPassword").value,
      memberName: document.getElementById("joinMemberName").value
    })
  })
  .then(res => res.json())
  .then(data => {
    if (data.team) {
      localStorage.setItem("team", JSON.stringify(data.team));
      window.location = "dashboard.html";
    } else {
      alert(data.message);
    }
  });
}