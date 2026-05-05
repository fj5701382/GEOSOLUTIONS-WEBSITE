/* ============================================================
   student-dashboard.js
   Profile edit functionality for student-dashboard2.html
   ============================================================ */

(function () {
  "use strict";

  /* ── Editable fields config ──
     Each entry: { id, field on user object, editable? }
  ── */
  const EDITABLE_FIELDS = [
    { id: "pf-name",  key: "fullName",     editable: true  },
    { id: "pf-email", key: "email",        editable: true  },
    { id: "pf-phone", key: "phoneNumber",  editable: true  },
    { id: "pf-dept",  key: "department",   editable: true  },
  ];

  const READ_ONLY_FIELDS = [
    { id: "pf-regnum",  key: "identifier"  },
    { id: "pf-regdate", key: "regDate"     },
    { id: "pf-role",    key: null, value: "Student" },
    { id: "pf-status",  key: null, value: "Approved" },
  ];

  /* ── Toast helper ── */
  function showToast(message, isError = false) {
    let toast = document.getElementById("profileToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "profileToast";
      toast.className = "profile-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.toggle("error", isError);
    toast.classList.add("show");
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove("show"), 3000);
  }

  /* ── Validation ── */
  function validate(data) {
    if (!data.fullName || data.fullName.trim().length < 2) {
      return "Full name must be at least 2 characters.";
    }
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return "Please enter a valid email address.";
    }
    if (data.phoneNumber && !/^[+\d\s\-()]{7,20}$/.test(data.phoneNumber)) {
      return "Please enter a valid phone number.";
    }
    return null;
  }

  /* ── Build editable profile HTML ── */
  function buildEditableProfile(user) {
    const initials = (user.avatar) || ((user.fullName || "S").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase());

    const avatarHtml = user.profileImage
      ? `<img src="${user.profileImage}" alt="${user.fullName}" class="profile-image">`
      : `<div class="profile-avatar-large">${initials}</div>`;

    const safeVal = (val) => val ? String(val).replace(/"/g, "&quot;") : "";
    const regDate = user.regDate || (user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB") : "—");
    const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "—";

    return `
      <!-- Action buttons -->
      <div class="profile-actions">
        <button class="btn-edit-profile" id="btnEditProfile" aria-label="Edit profile">
          ✏️ Edit Profile
        </button>
        <button class="btn-save-profile" id="btnSaveProfile" aria-label="Save profile changes">
          💾 Save
        </button>
        <button class="btn-cancel-profile" id="btnCancelProfile" aria-label="Cancel editing">
          ✕ Cancel
        </button>
      </div>

      <!-- Profile header -->
      <div class="profile-header">
        <div class="profile-image-wrapper">
          ${avatarHtml}
        </div>
        <div class="profile-header-info">
          <h3 class="profile-name" id="profileDisplayName">${user.fullName || "Student"}</h3>
          <p class="profile-identifier">${user.identifier || ""}</p>
          <span class="profile-status">Approved ✓</span>
        </div>
      </div>
      <div class="profile-divider"></div>

      <!-- Editable fields -->
      <div class="info-row">
        <div class="info-icon">👤</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Full Name</div>
          <input class="profile-field-input" id="pf-name" type="text" value="${safeVal(user.fullName)}" readonly aria-label="Full name">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">📧</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Email Address</div>
          <input class="profile-field-input" id="pf-email" type="email" value="${safeVal(user.email)}" readonly aria-label="Email address">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">📱</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Phone Number</div>
          <input class="profile-field-input" id="pf-phone" type="tel" value="${safeVal(user.phoneNumber) || ""}" placeholder="Not provided" readonly aria-label="Phone number">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">🏫</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Department / Programme</div>
          <input class="profile-field-input" id="pf-dept" type="text" value="${safeVal(user.department) || ""}" placeholder="Not specified" readonly aria-label="Department">
        </div>
      </div>

      <!-- Read-only fields -->
      <div class="info-row">
        <div class="info-icon">🆔</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Registration Number</div>
          <input class="profile-field-input" id="pf-regnum" type="text" value="${safeVal(user.identifier)}" readonly aria-label="Registration number">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">📅</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Registration Date</div>
          <input class="profile-field-input" id="pf-regdate" type="text" value="${regDate}" readonly aria-label="Registration date">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">🎓</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Role</div>
          <input class="profile-field-input" id="pf-role" type="text" value="Student" readonly aria-label="Role">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">✅</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Account Status</div>
          <input class="profile-field-input" id="pf-status" type="text" value="Approved" readonly aria-label="Account status">
        </div>
      </div>

      <div class="info-row">
        <div class="info-icon">⏰</div>
        <div class="profile-field-group">
          <div class="profile-field-label">Member Since</div>
          <input class="profile-field-input" id="pf-member" type="text" value="${memberSince}" readonly aria-label="Member since">
        </div>
      </div>
    `;
  }

  /* ── Edit mode controller ── */
  function initProfileEdit(user) {
    const card = document.getElementById("profileCard");
    if (!card) return;

    /* Render editable profile */
    card.innerHTML = buildEditableProfile(user);

    const btnEdit   = document.getElementById("btnEditProfile");
    const btnSave   = document.getElementById("btnSaveProfile");
    const btnCancel = document.getElementById("btnCancelProfile");

    /* Snapshot of original values for cancel */
    let snapshot = {};

    function saveSnapshot() {
      EDITABLE_FIELDS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) snapshot[id] = el.value;
      });
    }

    function enterEditMode() {
      saveSnapshot();
      card.classList.add("profile-editing");
      EDITABLE_FIELDS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.removeAttribute("readonly");
      });
      btnEdit.classList.add("hidden");
      btnSave.classList.add("visible");
      btnCancel.classList.add("visible");
      /* Focus first editable field */
      const first = document.getElementById(EDITABLE_FIELDS[0].id);
      if (first) first.focus();
    }

    function exitEditMode() {
      card.classList.remove("profile-editing");
      EDITABLE_FIELDS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.setAttribute("readonly", true);
      });
      btnEdit.classList.remove("hidden");
      btnSave.classList.remove("visible");
      btnCancel.classList.remove("visible");
    }

    function cancelEdit() {
      /* Restore snapshot values */
      EDITABLE_FIELDS.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el && snapshot[id] !== undefined) el.value = snapshot[id];
      });
      exitEditMode();
    }

    function saveEdit() {
      /* Collect new values */
      const updated = {};
      EDITABLE_FIELDS.forEach(({ id, key }) => {
        const el = document.getElementById(id);
        if (el) updated[key] = el.value.trim();
      });

      /* Validate */
      const error = validate(updated);
      if (error) {
        showToast(error, true);
        return;
      }

      /* Persist to localStorage (same store GeoAuth uses) */
      try {
        const stored = JSON.parse(localStorage.getItem("geoCurrentUser") || "{}");
        Object.assign(stored, updated);
        localStorage.setItem("geoCurrentUser", JSON.stringify(stored));
        /* Also update user object in memory */
        Object.assign(user, updated);
      } catch (e) {
        console.warn("Could not persist profile:", e);
      }

      /* Update visible name in profile header + sidebar */
      const nameDisplay = document.getElementById("profileDisplayName");
      if (nameDisplay) nameDisplay.textContent = updated.fullName || user.fullName;
      const sidebarName = document.getElementById("sidebarName");
      if (sidebarName) sidebarName.textContent = (updated.fullName || user.fullName).split(" ")[0];
      const topbarName = document.getElementById("topbarName");
      if (topbarName) topbarName.textContent = updated.fullName || user.fullName;
      const welcomeMsg = document.getElementById("welcomeMsg");
      if (welcomeMsg) welcomeMsg.textContent = `Welcome back, ${(updated.fullName || user.fullName).split(" ")[0]}! 🎓`;

      exitEditMode();
      showToast("✓ Profile updated successfully!");
    }

    /* ── Event listeners ── */
    btnEdit.addEventListener("click", enterEditMode);
    btnSave.addEventListener("click", saveEdit);
    btnCancel.addEventListener("click", cancelEdit);

    /* Allow Enter key to save, Escape to cancel while editing */
    card.addEventListener("keydown", (e) => {
      if (!card.classList.contains("profile-editing")) return;
      if (e.key === "Enter" && e.target.tagName === "INPUT") saveEdit();
      if (e.key === "Escape") cancelEdit();
    });
  }

  /* ── Expose to global scope so inline init script can call it ── */
  window.GeoStudentDashboard = { initProfileEdit };

})();
