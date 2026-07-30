// register.js - GEO ACADEMY Registration Logic

document.addEventListener("DOMContentLoaded", () => {
  const roleSelect = document.getElementById("roleSelect");
  const registerForm = document.getElementById("registerForm");
  const errorMessage = document.getElementById("errorMessage");
  const successOverlay = document.getElementById("successOverlay");
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  const profileImageInput = document.getElementById("profileImage");
  const imageUploadLabel = document.querySelector(".image-upload-label");
  const imagePreview = document.getElementById("imagePreview");
  const removeImageBtn = document.getElementById("removeImage");

  // Dynamic fields containers
  const studentFields = document.getElementById("studentFields");
  const teacherFields = document.getElementById("teacherFields");
  const adminFields = document.getElementById("adminFields");
  const computerFields = document.getElementById("computerFields");

  // Store for image data
  let uploadedImageData = null;

  roleSelect.addEventListener("change", updateFields);
  updateFields();

  togglePassword.addEventListener("click", () => {
    const type = passwordInput.type === "password" ? "text" : "password";
    passwordInput.type = type;
    togglePassword.innerHTML = type === "password"
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
  });

  // Image upload handler
  profileImageInput.addEventListener("change", handleImageUpload);
  removeImageBtn.addEventListener("click", removeImage);

  // Drag and drop
  imageUploadLabel.addEventListener("dragover", (e) => {
    e.preventDefault();
    imageUploadLabel.style.borderColor = "var(--blue-mid)";
    imageUploadLabel.style.background = "rgba(37, 99, 235, 0.08)";
  });

  imageUploadLabel.addEventListener("dragleave", () => {
    imageUploadLabel.style.borderColor = "var(--gray-300)";
    imageUploadLabel.style.background = "var(--white)";
  });

  imageUploadLabel.addEventListener("drop", (e) => {
    e.preventDefault();
    imageUploadLabel.style.borderColor = "var(--gray-300)";
    imageUploadLabel.style.background = "var(--white)";
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      profileImageInput.files = files;
      handleImageUpload({ target: profileImageInput });
    }
  });

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showError("Please select a valid image file.");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      showError("Image size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      uploadedImageData = event.target.result;
      const previewImg = document.getElementById("previewImg");
      previewImg.src = uploadedImageData;
      imagePreview.style.display = "block";
      imageUploadLabel.style.display = "none";
    };
    reader.readAsDataURL(file);
  }

  function removeImage() {
    uploadedImageData = null;
    profileImageInput.value = "";
    imagePreview.style.display = "none";
    imageUploadLabel.style.display = "flex";
  }

  function updateFields() {
    const role = roleSelect.value;
    studentFields.style.display = role === "student" ? "block" : "none";
    teacherFields.style.display = role === "teacher" ? "block" : "none";
    adminFields.style.display = role === "admin" ? "block" : "none";
    computerFields.style.display = role === "computer" ? "block" : "none";

    // Show/hide Date of Registration
    const regDate = document.getElementById("regDate");
    if (role === "student" || role === "computer") {
      regDate.parentElement.style.display = "block";
      regDate.required = true;
    } else {
      regDate.parentElement.style.display = "none";
      regDate.required = false;
    }

    // Show/hide Subject
    const subject = document.getElementById("subject");
    if (subject) subject.required = role === "teacher";

    // Show/hide REG NUMBER
    const regNumber = document.getElementById("regNumber");
    if (regNumber) regNumber.required = role === "student";

    // Show/hide Admin Code
    const adminCode = document.getElementById("adminCode");
    if (adminCode) adminCode.required = role === "admin";

    // Show/hide Program
    const program = document.getElementById("program");
    if (program) program.required = role === "computer";
  }

  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleRegister();
  });

  function handleRegister() {
    const role = roleSelect.value;
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    if (!fullName || !email || !password) {
      showError("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      showError("Password must be at least 6 characters long.");
      return;
    }

    const users = GeoAuth.getUsers();

    // Check duplicate email
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      showError("An account with this email already exists.");
      return;
    }

    let identifier, extraField;

    if (role === "student") {
      identifier = document.getElementById("regNumber").value.trim();
      if (!identifier) { showError("Please enter your REG NUMBER."); return; }
      if (users.find(u => u.role === "student" && u.identifier.toLowerCase() === identifier.toLowerCase())) {
        showError("This REG NUMBER is already registered.");
        return;
      }
    } else if (role === "teacher") {
      identifier = email;
      extraField = document.getElementById("subject").value.trim();
      if (!extraField) { showError("Please enter your subject."); return; }
    } else if (role === "admin") {
      identifier = document.getElementById("adminCode").value.trim();
      if (!identifier) { showError("Please enter your Admin Code."); return; }
      if (users.find(u => u.role === "admin" && u.identifier === identifier)) {
        showError("This Admin Code is already registered.");
        return;
      }
    }

    const newUser = {
      id: GeoAuth.generateId(role),
      role,
      fullName,
      identifier,
      email,
      password,
      status: "pending",
      createdAt: new Date().toISOString(),
      avatar: GeoAuth.getInitials(fullName),
      ...(uploadedImageData && { profileImage: uploadedImageData }),
      ...(role === "teacher" && { subject: extraField })
    };

    users.push(newUser);
    GeoAuth.saveUsers(users);

    showSuccess(fullName);
  }

  function showSuccess(name) {
    successOverlay.querySelector(".success-name").textContent = name.split(" ")[0];
    successOverlay.classList.add("visible");
    registerForm.reset();
    removeImage();
  }

  function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.classList.add("visible");
    setTimeout(() => errorMessage.classList.remove("visible"), 5000);
  }
});


    // ============================================================
    // REGISTER PAGE DESIGN JAVASCRIPT
    // ============================================================

    document.addEventListener('DOMContentLoaded', function() {

        // ---- Theme Toggle ----
        var themeBtn = document.getElementById('themeToggle');
        var themeIcon = document.getElementById('themeIcon');
        var html = document.documentElement;

        if (themeBtn) {
            var savedTheme = localStorage.getItem('geosolution-theme') || 'light';
            if (savedTheme === 'dark') {
                html.classList.remove('light');
                html.classList.add('dark');
                if (themeIcon) themeIcon.textContent = 'dark_mode';
                themeBtn.classList.add('dark');
            } else {
                html.classList.remove('dark');
                html.classList.add('light');
                if (themeIcon) themeIcon.textContent = 'wb_sunny';
                themeBtn.classList.remove('dark');
            }

            themeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                var isDark = html.classList.contains('dark');

                if (isDark) {
                    html.classList.remove('dark');
                    html.classList.add('light');
                    if (themeIcon) themeIcon.textContent = 'wb_sunny';
                    this.classList.remove('dark');
                    localStorage.setItem('geosolution-theme', 'light');
                } else {
                    html.classList.remove('light');
                    html.classList.add('dark');
                    if (themeIcon) themeIcon.textContent = 'dark_mode';
                    this.classList.add('dark');
                    localStorage.setItem('geosolution-theme', 'dark');
                }
            });
        }

        // ---- Input Focus Effects ----
        document.querySelectorAll('.form-control').forEach(function(input) {
            input.addEventListener('focus', function() {
                var parent = this.closest('.form-group');
                if (parent) {
                    parent.style.transform = 'scale(1.01)';
                    parent.style.transition = 'transform 0.2s';
                }
            });
            input.addEventListener('blur', function() {
                var parent = this.closest('.form-group');
                if (parent) {
                    parent.style.transform = 'scale(1)';
                }
            });
        });

        // ---- Dropdown Feedback ----
        document.querySelectorAll('select.form-control').forEach(function(select) {
            select.addEventListener('change', function() {
                var group = this.closest('.form-group');
                if (group) {
                    group.style.transform = 'scale(0.98)';
                    setTimeout(function() {
                        group.style.transform = 'scale(1)';
                    }, 150);
                }
            });
        });
    });


