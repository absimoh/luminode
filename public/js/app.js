let selectedTeam = "";

async function loadTeams() {
  const res = await fetch("/api/teams");
  const teams = await res.json();

  const grid = document.getElementById("teamsGrid");
  grid.innerHTML = "";

  teams.forEach(team => {
    grid.innerHTML += `
      <div class="team-card" onclick="openModal('${team.name}')">
        ${team.name}
      </div>
    `;
  });
}

function openModal(teamName) {
  selectedTeam = teamName;
  document.getElementById("selectedTeamName").innerText = teamName;
  document.getElementById("loginModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("loginModal").style.display = "none";
}

async function join() {
  const password = document.getElementById("password").value;
  const memberName = document.getElementById("memberName").value;

  const res = await fetch("/api/team/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: selectedTeam,
      password,
      memberName
    })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem("teamName", selectedTeam);
    window.location.href = "/dashboard.html";
  } else {
    alert(data.message);
  }
}
