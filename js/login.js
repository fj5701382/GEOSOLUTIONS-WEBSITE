
    // ============================================================
    // COMPLETE LOGIN + DESIGN - All in One
    // ============================================================

    document.addEventListener("DOMContentLoaded", function() {

        // ============================================================
        // AUTHENTICATION LOGIC
        // ============================================================

        const roleSelect = document.getElementById("roleSelect");
        const identifierInput = document.getElementById("identifier");
        const passwordInput = document.getElementById("password");
        const loginBtn = document.getElementById("loginBtn");
        const loginForm = document.getElementById("loginForm");
        const togglePassword = document.getElementById("togglePassword");
        const rememberPasswordCheckbox = document.getElementById("rememberPassword");
        const errorMessage = document.getElementById("errorMessage");

        // Check if already logged in
        if (typeof GeoAuth !== 'undefined') {
            const current = GeoAuth.getCurrentUser();
            if (current) redirectByRole(current.role);
            loadRememberedCredentials();
        }

        // Placeholders
        const placeholders = {
            student: "Enter REG NUMBER (e.g. GEO/2024/001)",
            teacher: "Enter Email Address",
            admin: "Enter Admin Code"
        };

        if (roleSelect) {
            roleSelect.addEventListener("change", function() {
                identifierInput.placeholder = placeholders[roleSelect.value] || "Enter Identifier";
                identifierInput.value = "";
                hideError();
            });
        }

        // Password toggle
        if (togglePassword) {
            togglePassword.addEventListener("click", function() {
                const type = passwordInput.type === "password" ? "text" : "password";
                passwordInput.type = type;
                togglePassword.innerHTML = type === "password"
                    ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
                    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
            });
        }

        // Form submit
        if (loginForm) {
            loginForm.addEventListener("submit", function(e) {
                e.preventDefault();
                handleLogin();
            });
        }

        function handleLogin() {
            if (typeof GeoAuth === 'undefined') {
                alert('Authentication system not loaded. Please check your connection.');
                return;
            }

            const role = roleSelect.value;
            const identifier = identifierInput.value.trim();
            const password = passwordInput.value;
            const rememberMe = rememberPasswordCheckbox.checked;

            if (!identifier || !password) {
                showError("Please fill in all fields.");
                return;
            }

            setLoading(true);

            setTimeout(function() {
                const users = GeoAuth.getUsers();
                const user = users.find(function(u) {
                    return u.role === role &&
                        u.identifier.toLowerCase() === identifier.toLowerCase() &&
                        u.password === password;
                });

                if (!user) {
                    showError("Invalid credentials. Please check your role, identifier, and password.");
                    setLoading(false);
                    return;
                }

                if (user.status === "pending") {
                    showError("Your account is awaiting admin approval. Please check back later.");
                    setLoading(false);
                    return;
                }

                if (user.status === "rejected") {
                    showError("Your account has been rejected. Please contact administration.");
                    setLoading(false);
                    return;
                }

                if (rememberMe) {
                    GeoAuth.saveRememberedCredentials(role, identifier, password);
                } else {
                    GeoAuth.clearRememberedCredentials();
                }

                GeoAuth.setCurrentUser(user);
                loginBtn.innerHTML = '<span class="btn-text">Welcome, ' + user.fullName.split(" ")[0] + '!</span>';

                setTimeout(function() {
                    redirectByRole(role);
                }, 800);
            }, 900);
        }

        function redirectByRole(role) {
            var paths = {
                student: "student-dashboard2.html",
                teacher: "teacher-dashboard2.html",
                admin: "admin-dashboard2.html"
            };
            window.location.href = paths[role] || "index2.html";
        }

        function showError(msg) {
            if (errorMessage) {
                errorMessage.textContent = msg;
                errorMessage.classList.add("visible");
            }
        }

        function hideError() {
            if (errorMessage) {
                errorMessage.classList.remove("visible");
            }
        }

        function setLoading(loading) {
            loginBtn.disabled = loading;
            loginBtn.innerHTML = loading
                ? '<span class="btn-loader"></span><span class="btn-text">Verifying...</span>'
                : '<span class="btn-text">Login to Portal</span>';
        }

        function loadRememberedCredentials() {
            if (typeof GeoAuth === 'undefined') return;
            var remembered = GeoAuth.getRememberedCredentials();
            if (remembered) {
                if (roleSelect) roleSelect.value = remembered.role;
                if (identifierInput) identifierInput.value = remembered.identifier;
                if (passwordInput) passwordInput.value = remembered.password;
                if (rememberPasswordCheckbox) rememberPasswordCheckbox.checked = true;
            }
        }

        if (identifierInput) identifierInput.addEventListener("focus", hideError);
        if (passwordInput) passwordInput.addEventListener("focus", hideError);

        // ============================================================
        // THEME TOGGLE - FIXED
        // ============================================================

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

        // ============================================================
        // HAMBURGER MENU - FIXED
        // ============================================================

        var menuBtn = document.getElementById('mobileMenuBtn');
        var dropdown = document.getElementById('mobileMenuDropdown');

        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                this.classList.toggle('open');
                dropdown.classList.toggle('open');
            });

            document.addEventListener('click', function(e) {
                if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
                    menuBtn.classList.remove('open');
                    dropdown.classList.remove('open');
                }
            });

            dropdown.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    menuBtn.classList.remove('open');
                    dropdown.classList.remove('open');
                });
            });
        }

        // ============================================================
        // INPUT EFFECTS
        // ============================================================

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
