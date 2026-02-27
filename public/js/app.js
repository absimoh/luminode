async function loadTeams() {
  const res = await fetch("/api/teams");
  const teams = await res.json();

  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerText = team.name;

    card.onclick = () => {
      const password = prompt("Enter team password:");
      const memberName = prompt("Enter your name:");

      fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: team.name,
          password,
          memberName
        })
      }).then(res => res.json())
        .then(data => {
          if (data.message === "Joined successfully") {
            window.location.href = "/dashboard.html";
          } else {
            alert(data.message);
          }
        });
    };

    container.appendChild(card);
  });
}

loadTeams();