// admin.js - Admin Dashboard Logic

document.addEventListener("DOMContentLoaded", () => {
  const user = GeoAuth.requireAuth("admin");
  if (!user) return;

  document.getElementById("adminName").textContent = user.fullName;
  document.getElementById("adminAvatar").textContent = user.avatar || GeoAuth.getInitials(user.fullName);

  loadStats();
  loadPendingAccounts();
  loadAllUsers();

  document.getElementById("logoutBtn").addEventListener("click", () => GeoAuth.logout());
  document.getElementById("logoutBtnMobile").addEventListener("click", () => GeoAuth.logout());

  // Sidebar navigation
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const target = item.dataset.target;
      document.querySelectorAll(".dash-section").forEach(s => s.classList.remove("active"));
      document.getElementById(target).classList.add("active");
    });
  });

  // Mobile menu toggle
  document.getElementById("menuToggle").addEventListener("click", () => {
    document.querySelector(".sidebar").classList.toggle("open");
  });
});

function loadStats() {
  const users = GeoAuth.getUsers();
  const students = users.filter(u => u.role === "student");
  const teachers = users.filter(u => u.role === "teacher");
  const pending = users.filter(u => u.status === "pending");

  document.getElementById("statStudents").textContent = students.filter(u => u.status === "approved").length;
  document.getElementById("statTeachers").textContent = teachers.filter(u => u.status === "approved").length;
  document.getElementById("statPending").textContent = pending.length;
  document.getElementById("statTotal").textContent = users.length;
}

function loadPendingAccounts() {
  const users = GeoAuth.getUsers();
  const pending = users.filter(u => u.status === "pending");
  const container = document.getElementById("pendingList");

  if (pending.length === 0) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">✓</div><p>No pending accounts</p></div>`;
    return;
  }

  container.innerHTML = pending.map(u => `
    <div class="account-card" id="card-${u.id}">
      <div class="account-avatar">${u.avatar || GeoAuth.getInitials(u.fullName)}</div>
      <div class="account-info">
        <h4>${u.fullName}</h4>
        <p class="account-meta">
          <span class="role-badge role-${u.role}">${u.role}</span>
          <span>${u.identifier}</span>
        </p>
        <p class="account-email">${u.email}</p>
        <p class="account-date">Registered: ${new Date(u.createdAt).toLocaleDateString("en-GB", {day:"numeric",month:"short",year:"numeric"})}</p>
      </div>
      <div class="account-actions">
        <button class="btn-approve" onclick="approveUser('${u.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          Approve
        </button>
        <button class="btn-reject" onclick="rejectUser('${u.id}')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          Reject
        </button>
      </div>
    </div>
  `).join("");
}

function loadAllUsers() {
  const users = GeoAuth.getUsers();
  const tbody = document.getElementById("usersTableBody");

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><div class="table-user"><span class="t-avatar">${u.avatar || GeoAuth.getInitials(u.fullName)}</span>${u.fullName}</div></td>
      <td><span class="role-badge role-${u.role}">${u.role}</span></td>
      <td>${u.identifier}</td>
      <td>${u.email}</td>
      <td><span class="status-badge status-${u.status}">${u.status}</span></td>
      <td>${new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
    </tr>
  `).join("");
}

function approveUser(userId) {
  const users = GeoAuth.getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;

  users[idx].status = "approved";
  GeoAuth.saveUsers(users);

  const card = document.getElementById(`card-${userId}`);
  card.classList.add("card-approved");
  card.querySelector(".account-actions").innerHTML = `<div class="approved-badge">✓ Approved</div>`;

  GeoAuth.showNotification(`${users[idx].fullName}'s account has been approved. They can now login to GEO ACADEMY.`, "success");

  setTimeout(() => {
    loadStats();
    loadPendingAccounts();
    loadAllUsers();
  }, 1500);
}

function rejectUser(userId) {
  const users = GeoAuth.getUsers();
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;

  users[idx].status = "rejected";
  GeoAuth.saveUsers(users);

  const card = document.getElementById(`card-${userId}`);
  card.classList.add("card-rejected");
  card.querySelector(".account-actions").innerHTML = `<div class="rejected-badge">✕ Rejected</div>`;

  GeoAuth.showNotification(`${users[idx].fullName}'s account has been rejected.`, "error");

  setTimeout(() => {
    loadStats();
    loadPendingAccounts();
    loadAllUsers();
  }, 1500);
}
