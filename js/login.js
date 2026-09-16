// login.js - GEO ACADEMY Login Logic

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("roleSelect");
  const identifierInput = document.getElementById("identifier");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("loginBtn");
  const loginForm = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");
  const rememberPasswordCheckbox = document.getElementById("rememberPassword");
  const errorMessage = document.getElementById("errorMessage");

  // If already logged in, redirect
  const current = GeoAuth.getCurrentUser();
  if (current) redirectByRole(current.role);

  // Load remembered credentials on page load
  loadRememberedCredentials();

  // Dynamic placeholder based on role
  const placeholders = {
    student: "e.g. GEO-2026-12345 or GEO/2024/001",
    teacher: "Enter your email address",
    admin: "Enter your admin code"
  };
  const labels = {
    student: "Reference / Reg Number",
    teacher: "Email Address",
    admin: "Admin Code"
  };
  const identifierLabel = document.querySelector('label[for="identifier"]');

  roleSelect.addEventListener("change", () => {
    identifierInput.placeholder = placeholders[roleSelect.value] || "Enter Identifier";
    if (identifierLabel) identifierLabel.textContent = labels[roleSelect.value] || "Identifier";
    identifierInput.inputMode = roleSelect.value === "teacher" ? "email" : "text";
    identifierInput.value = "";
    hideError();
  });

  // Toggle password visibility
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.setAttribute("aria-label", type === "password" ? "Show password" : "Hide password");
    togglePassword.setAttribute("aria-pressed", String(type === "text"));
    togglePassword.innerHTML = type === "password"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  });

  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleLogin();
  });

  function handleLogin() {
    const role = roleSelect.value;
    const identifier = identifierInput.value.trim();
    const password = passwordInput.value;
    const rememberMe = rememberPasswordCheckbox.checked;

    if (!identifier || !password) {
      showError(!identifier
        ? `Please enter your ${(labels[role] || "identifier").toLowerCase()}.`
        : "Please enter your password.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      const users = GeoAuth.getUsers();
      const user = users.find(u =>
        u.role === role &&
        u.identifier.toLowerCase() === identifier.toLowerCase() &&
        u.password === password
      );

      if (!user) {
        showError("We couldn't log you in. Check that you've chosen the right role and that your details and password are correct.");
        setLoading(false);
        return;
      }

      if (user.status === "pending") {
        showError("Your registration is still awaiting admin approval. You'll be able to log in once it's approved — contact us on WhatsApp if it's urgent.");
        setLoading(false);
        return;
      }

      if (user.status === "rejected") {
        showError("Your account has been rejected. Please contact administration.");
        setLoading(false);
        return;
      }

      // Save credentials if "Remember me" is checked
      if (rememberMe) {
        GeoAuth.saveRememberedCredentials(role, identifier, password);
      } else {
        GeoAuth.clearRememberedCredentials();
      }

      // Successful login
      GeoAuth.setCurrentUser(user);
      loginBtn.innerHTML = `<span class="btn-text">Welcome, ${user.fullName.split(" ")[0]}!</span>`;

      setTimeout(() => {
        redirectByRole(role);
      }, 800);
    }, 900);
  }

  function redirectByRole(role) {
    const paths = {
      student: "student-dashboard2.html",
      teacher: "teacher-dashboard2.html",
      admin: "admin-dashboard2.html"
    };
    window.location.href = paths[role] || "index2.html";
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.add("visible");
  }

  function hideError() {
    errorMessage.classList.remove("visible");
  }

  function setLoading(loading) {
    loginBtn.disabled = loading;
    loginBtn.innerHTML = loading
      ? `<span class="btn-loader"></span><span class="btn-text">Verifying...</span>`
      : `<span class="btn-text">Login to Portal</span>`;
  }

  function loadRememberedCredentials() {
    const remembered = GeoAuth.getRememberedCredentials();
    if (remembered) {
      roleSelect.value = remembered.role;
      identifierInput.value = remembered.identifier;
      passwordInput.value = remembered.password;
      rememberPasswordCheckbox.checked = true;
    }
  }

  identifierInput.addEventListener("focus", hideError);
  passwordInput.addEventListener("focus", hideError);
});
