async function loadTeams() {
  const res = await fetch("/api/teams");
  const teams = await res.json();

  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  teams.forEach(team => {
    const card = document.createElement("div");
    card.className = "team-card";
    card.innerText = team.name;

    card.onclick = async () => {
      const password = prompt("Enter team password:");
      if (!password) return;

      try {
        // 🔐 تسجيل دخول
        const loginRes = await fetch("/api/team/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: team.name,
            password
          })
        });

        const loginData = await loginRes.json();

        if (!loginData.token) {
          alert(loginData.message || "Login failed");
          return;
        }

        // 💾 حفظ التوكن
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("teamName", team.name);

        // 👤 إدخال اسم العضو (اختياري)
        const memberName = prompt("Enter your name:");
        if (memberName) {
          await fetch("/api/team/join", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: team.name,
              password,
              memberName
            })
          });
        }

        // 🚀 انتقال للداشبورد
        window.location.href = "/dashboard.html";

      } catch (err) {
        alert("Error connecting to server");
      }
    };

    container.appendChild(card);
  });
}

loadTeams();