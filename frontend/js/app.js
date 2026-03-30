async function init() {
  const container = document.getElementById("teamsContainer");
  container.innerHTML = "";

  // 👇 إذا المستخدم مسجل دخول
  const token = localStorage.getItem("token");

  if (token) {
    const dashboardBtn = document.createElement("button");
    dashboardBtn.innerText = "Go to Dashboard";
    dashboardBtn.onclick = () => {
      window.location.href = "/dashboard";
    };

    container.appendChild(dashboardBtn);
    return;
  }

  // 👇 إذا ما عنده حساب
  const loginBtn = document.createElement("button");
  loginBtn.innerText = "Login";

  loginBtn.onclick = () => {
    window.location.href = "/login";
  };

  const registerBtn = document.createElement("button");
  registerBtn.innerText = "Register";

  registerBtn.onclick = () => {
    window.location.href = "/register";
  };

  container.appendChild(loginBtn);
  container.appendChild(registerBtn);
}

init();