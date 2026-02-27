async function loadTeams() {
  const res = await fetch("/api/teams");
  const teams = await res.json();

  const select = document.getElementById("teamSelect");
  select.innerHTML = "<option>Select Team</option>";

  teams.forEach(team => {
    select.innerHTML += `<option value="${team.name}">${team.name}</option>`;
  });
}

async function join() {
  const name = document.getElementById("teamSelect").value;
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