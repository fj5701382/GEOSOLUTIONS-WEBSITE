// auth.js - Shared authentication utilities for GEO ACADEMY

const GeoAuth = {
  getUsers() {
    return JSON.parse(localStorage.getItem("geo_users") || "[]");
  },

  saveUsers(users) {
    localStorage.setItem("geo_users", JSON.stringify(users));
  },

  getCurrentUser() {
    const data = localStorage.getItem("geo_session");
    return data ? JSON.parse(data) : null;
  },

  setCurrentUser(user) {
    localStorage.setItem("geo_session", JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem("geo_session");
    // Also clear remembered credentials on logout
    this.clearRememberedCredentials();
    window.location.href = this.getRootPath() + "index2.html";
  },

  saveRememberedCredentials(role, identifier, password) {
    const credentials = {
      role,
      identifier,
      password,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem("geo_remembered", JSON.stringify(credentials));
  },

  getRememberedCredentials() {
    const data = localStorage.getItem("geo_remembered");
    return data ? JSON.parse(data) : null;
  },

  clearRememberedCredentials() {
    localStorage.removeItem("geo_remembered");
  },

  getRootPath() {
    return "";
  },

  requireAuth(expectedRole) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = this.getRootPath() + "index2.html";
      return null;
    }
    if (expectedRole && user.role !== expectedRole) {
      window.location.href = this.getRootPath() + "index2.html";
      return null;
    }
    return user;
  },

  generateId(role) {
    return role + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 5);
  },

  getInitials(name) {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substr(0, 2);
  },

  showNotification(message, type = "success") {
    const existing = document.querySelector(".geo-notification");
    if (existing) existing.remove();

    const notif = document.createElement("div");
    notif.className = `geo-notification geo-notif-${type}`;
    notif.innerHTML = `
      <div class="notif-icon">${type === "success" ? "✓" : type === "error" ? "✕" : "ℹ"}</div>
      <div class="notif-text">${message}</div>
      <button class="notif-close" onclick="this.parentElement.remove()">×</button>
    `;
    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.add("notif-show");
    }, 10);

    setTimeout(() => {
      notif.classList.remove("notif-show");
      setTimeout(() => notif.remove(), 400);
    }, 5000);
  }
};
