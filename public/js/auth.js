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
      let options = data.map(t => 
        `<option value="${t.name}">${t.name}</option>`
      ).join("");

      document.getElementById("formArea").innerHTML = `
        <h2>Join Team</h2>
        <select id="teamSelect">${options}</select><br>
        <input id="joinPassword" type="password" placeholder="Password"><br>
        <input id="joinMemberName" placeholder="Your Name"><br>
        <button onclick="joinTeam()">Join</button>
      `;
    });
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

function joinTeam() {
  fetch("/api/team/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: document.getElementById("teamSelect").value,
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