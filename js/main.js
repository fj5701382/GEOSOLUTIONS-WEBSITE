// =====================================================
//  GEOSOLUTION — Main JavaScript
//  Handles: Navbar, Theme Toggle, Scroll Animations,
//           Active Nav, Toast Notifications, Mobile Nav
// =====================================================

/* ---- Theme ---- */
(function initTheme() {
  const saved = localStorage.getItem('geo-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('geo-theme', theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  setTheme(current === 'dark' ? 'light' : 'dark');
}

/* ---- Navbar Scroll Effect ---- */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/* ---- Active Nav Link ---- */
function setActiveNavLink() {
  const path = window.location.pathname;
  const filename = path.split('/').pop().replace('.html', '') || 'index';
  
  const linkMap = {
    'index':    '/',
    '':         '/',
    'about':    '/about',
    'services': '/services',
    'programs': '/programs',
    'contact':  '/contact',
    'register': '/register',
    'login':    '/login',
    'admin':    '/admin',
  };

  document.querySelectorAll('.nav-link, .mobile-nav .nav-link').forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (!href) return;
    const hrefBase = href.replace('.html', '');
    if (
      hrefBase === filename ||
      (filename === '' && (hrefBase === 'index' || hrefBase === '/')) ||
      (filename === 'index' && (hrefBase === 'index' || hrefBase === '/'))
    ) {
      link.classList.add('active');
    }
  });
}

/* ---- Mobile Nav Toggle ---- */
function initMobileNav() {
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!hamburger || !mobileNav) return;

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', isOpen);
  });

  // Close when nav link is clicked
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

/* ---- Scroll Animations (Intersection Observer) ---- */
function initScrollAnimations() {
  // Use both .animate-on-scroll and .reveal classes for flexibility
  const targets = document.querySelectorAll('.animate-on-scroll, .reveal');
  if (!targets.length) return;

  let revealIndex = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, idx) => {
      if (entry.isIntersecting) {
        // Add staggered delay for reveal elements
        if (entry.target.classList.contains('reveal')) {
          // Stagger every 6 elements max per viewport
          const staggerDelay = (idx % 6) * 80; // 80ms between each
          entry.target.style.transitionDelay = `${staggerDelay}ms`;
        }
        
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { 
    threshold: 0.12, 
    rootMargin: '0px 0px -40px 0px' 
  });

  targets.forEach(el => observer.observe(el));
}

/* ---- Toast Notifications ---- */
function showToast({ title, description, type = 'success', duration = 5000 }) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = {
    success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`,
    error:   `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.success}</div>
    <div class="toast-body">
      <div class="toast-title">${title}</div>
      ${description ? `<div class="toast-desc">${description}</div>` : ''}
    </div>
    <button class="toast-close" aria-label="Close">✕</button>
  `;

  toast.querySelector('.toast-close').addEventListener('click', () => dismissToast(toast));
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => dismissToast(toast), duration);
  }
  return toast;
}

function dismissToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateX(100%)';
  toast.style.transition = 'all 0.3s ease';
  setTimeout(() => toast.remove(), 300);
}

/* ---- Form Validation Helper ---- */
function validateField(input, rules) {
  const value = input.value.trim();
  const errorEl = input.parentElement.querySelector('.form-error');
  let error = '';

  if (rules.required && !value) {
    error = rules.requiredMsg || 'This field is required.';
  } else if (rules.minLength && value.length < rules.minLength) {
    error = `Must be at least ${rules.minLength} characters.`;
  } else if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = 'Please enter a valid email address.';
  } else if (rules.phone && value.replace(/\D/g,'').length < 10) {
    error = 'Please enter a valid phone number.';
  }

  if (errorEl) {
    errorEl.textContent = error;
    errorEl.style.display = error ? 'block' : 'none';
  }
  input.style.borderColor = error ? 'var(--accent)' : '';
  return !error;
}

/* ---- Contact Form ---- */
function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const nameInput  = form.querySelector('[name="name"]');
    const emailInput = form.querySelector('[name="email"]');
    const msgInput   = form.querySelector('[name="message"]');

    const v1 = validateField(nameInput,  { required: true, minLength: 2 });
    const v2 = validateField(emailInput, { required: true, email: true });
    const v3 = validateField(msgInput,   { required: true, minLength: 10 });

    if (!(v1 && v2 && v3)) return;

    const btn = form.querySelector('[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Sending...';
    btn.disabled = true;

    // Simulate API call — replace with real fetch
    // [API] POST /api/contacts { name, email, message }
    setTimeout(() => {
      showToast({
        title: 'Message Sent Successfully!',
        description: 'Thank you for reaching out. We will get back to you shortly.',
        type: 'success'
      });
      form.reset();
      btn.textContent = originalText;
      btn.disabled = false;
    }, 1200);
  });
}

/* ---- Register Form ---- */
function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const fullName = form.querySelector('[name="fullName"]');
    const phone    = form.querySelector('[name="phone"]');
    const email    = form.querySelector('[name="email"]');
    const service  = form.querySelector('[name="service"]');

    const v1 = validateField(fullName, { required: true, minLength: 2 });
    const v2 = validateField(phone,    { required: true, phone: true });
    const v3 = validateField(email,    { required: true, email: true });
    const v4 = validateField(service,  { required: true, requiredMsg: 'Please select a service.' });

    if (!(v1 && v2 && v3 && v4)) return;

    const btn = form.querySelector('[type="submit"]');
    btn.textContent = 'Registering...';
    btn.disabled = true;

    // [API] POST /api/registrations { fullName, email, phone, service, message }
    setTimeout(() => {
      showToast({
        title: 'Registration Successful!',
        description: 'Your application has been received. We will contact you shortly.',
        type: 'success'
      });
      form.reset();
      btn.textContent = 'Submit Registration';
      btn.disabled = false;
    }, 1400);
  });
}

/* ---- Login Form ---- */
function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const email = form.querySelector('[name="email"]');
    const pass  = form.querySelector('[name="password"]');

    const v1 = validateField(email, { required: true, email: true });
    const v2 = validateField(pass,  { required: true, requiredMsg: 'Password is required.' });
    if (!(v1 && v2)) return;

    const btn = form.querySelector('[type="submit"]');
    const errEl = document.getElementById('loginError');
    btn.textContent = 'Logging in...';
    btn.disabled = true;
    if (errEl) errEl.style.display = 'none';

    // [API] POST /api/admin/login { email, password }
    setTimeout(() => {
      // Demo credentials check
      if (email.value === 'admin@geosolution.com' && pass.value === 'admin123') {
        localStorage.setItem('geo_admin_token', 'demo_token_' + Date.now());
        window.location.href = 'admin.html';
      } else {
        btn.textContent = 'Login';
        btn.disabled = false;
        if (errEl) { errEl.textContent = 'Invalid credentials.'; errEl.style.display = 'block'; }
      }
    }, 1000);
  });
}

/* ---- Admin Auth Guard ---- */
function checkAdminAuth() {
  const isAdminPage = document.body.classList.contains('admin-page');
  if (!isAdminPage) return;

  const token = localStorage.getItem('geo_admin_token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  loadAdminData(token);
}

/* ---- Admin Data ---- */
function loadAdminData(token) {
  // [API] GET /api/registrations  Authorization: Bearer {token}
  // [API] GET /api/contacts        Authorization: Bearer {token}
  // Demo: populate with mock data
  const demoRegistrations = [
    { id: 1, createdAt: '2024-01-15', name: 'Oluwaseun Adebayo', email: 'olu@example.com', phone: '08012345678', service: 'JAMB / WAEC / NECO Classes', paymentStatus: 'paid' },
    { id: 2, createdAt: '2024-01-18', name: 'Chidinma Okafor',   email: 'chi@example.com', phone: '08023456789', service: 'Web Development',           paymentStatus: 'pending' },
    { id: 3, createdAt: '2024-01-20', name: 'Ibrahim Musa',      email: 'ibr@example.com', phone: '08034567890', service: 'Scrabble & Chess (NSCC)',    paymentStatus: 'paid' },
    { id: 4, createdAt: '2024-01-22', name: 'Amaka Nwosu',       email: 'ama@example.com', phone: '08045678901', service: 'UI/UX Design',               paymentStatus: 'pending' },
    { id: 5, createdAt: '2024-02-01', name: 'Emeka Eze',         email: 'eme@example.com', phone: '08056789012', service: 'JAMB Orientation (JOT)',     paymentStatus: 'paid' },
  ];
  const demoMessages = [
    { id: 1, createdAt: '2024-01-14', name: 'Adaeze Obi',    email: 'ada@example.com', message: 'Hello, I would like to know more about your admission processing services.' },
    { id: 2, createdAt: '2024-01-16', name: 'Tunde Akintola', email: 'tun@example.com', message: 'What are the requirements for the web development course?' },
    { id: 3, createdAt: '2024-01-19', name: 'Ngozi Enyinnaya', email: 'ngo@example.com', message: 'Do you offer evening classes for working adults?' },
  ];

  window._adminData = { registrations: demoRegistrations, messages: demoMessages };
  renderAdminRegistrations(demoRegistrations);
  renderAdminMessages(demoMessages);
  updateAdminCounts(demoRegistrations, demoMessages);
}

function updateAdminCounts(regs, msgs) {
  const regBadge = document.getElementById('regCount');
  const msgBadge = document.getElementById('msgCount');
  if (regBadge) regBadge.textContent = regs.length;
  if (msgBadge) msgBadge.textContent = msgs.length;
}

function renderAdminRegistrations(data) {
  const tbody = document.getElementById('regTableBody');
  const empty = document.getElementById('regEmpty');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!data.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  data.forEach(r => {
    const tr = document.createElement('tr');
    const badgeClass = r.paymentStatus === 'paid' ? 'badge-green' : 'badge-orange';
    tr.innerHTML = `
      <td class="whitespace-nowrap">${new Date(r.createdAt).toLocaleDateString()}</td>
      <td style="font-weight:600">${r.name}</td>
      <td>${r.email}</td>
      <td>${r.phone}</td>
      <td>${r.service}</td>
      <td><span class="badge ${badgeClass}">${r.paymentStatus}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminMessages(data) {
  const tbody = document.getElementById('msgTableBody');
  const empty = document.getElementById('msgEmpty');
  if (!tbody) return;
  tbody.innerHTML = '';
  if (!data.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  data.forEach(m => {
    const tr = document.createElement('tr');
    const shortMsg = m.message.length > 60 ? m.message.substring(0, 60) + '...' : m.message;
    tr.innerHTML = `
      <td class="whitespace-nowrap">${new Date(m.createdAt).toLocaleDateString()}</td>
      <td style="font-weight:600">${m.name}</td>
      <td>${m.email}</td>
      <td style="max-width:300px" title="${m.message}">${shortMsg}</td>
    `;
    tbody.appendChild(tr);
  });
}

function initAdminSearch() {
  const regSearch = document.getElementById('regSearch');
  const msgSearch = document.getElementById('msgSearch');
  if (regSearch) {
    regSearch.addEventListener('input', function() {
      if (!window._adminData) return;
      const q = this.value.toLowerCase();
      const filtered = window._adminData.registrations.filter(r =>
        r.name.toLowerCase().includes(q) || r.service.toLowerCase().includes(q)
      );
      renderAdminRegistrations(filtered);
    });
  }
  if (msgSearch) {
    msgSearch.addEventListener('input', function() {
      if (!window._adminData) return;
      const q = this.value.toLowerCase();
      const filtered = window._adminData.messages.filter(m =>
        m.name.toLowerCase().includes(q)
      );
      renderAdminMessages(filtered);
    });
  }
}

function initAdminTabs() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.toggle('active', b === btn));
      tabPanels.forEach(p => p.classList.toggle('active', p.id === target));
    });
  });
}

function adminLogout() {
  localStorage.removeItem('geo_admin_token');
  window.location.href = 'login.html';
}

/* ---- Hero Search ---- */
function initHeroSearch() {
  const searchInput = document.querySelector('.hero-search input');
  const searchBtn = document.querySelector('.hero-search button');
  if (!searchInput || !searchBtn) return;

  function performSearch() {
    const query = searchInput.value.toLowerCase().trim();
    const serviceCards = document.querySelectorAll('.service-card');
    let visibleCount = 0;

    serviceCards.forEach(card => {
      const title = card.querySelector('h3').textContent.toLowerCase();
      const description = card.querySelector('p').textContent.toLowerCase();
      const matches = title.includes(query) || description.includes(query);
      
      if (query === '' || matches) {
        card.style.display = 'block';
        card.style.animation = 'fadeIn 0.3s ease-in';
        visibleCount++;
      } else {
        card.style.display = 'none';
      }
    });

    // Show a message if no results
    if (query && visibleCount === 0) {
      showToast({
        title: 'No Results',
        description: `No courses or programs found matching "${query}".`,
        type: 'success',
        duration: 3000
      });
    }
  }

  // Search on button click
  searchBtn.addEventListener('click', performSearch);

  // Search on Enter key
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // Live search as user types
  searchInput.addEventListener('input', performSearch);
}

/* ---- Init All ---- */
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  setActiveNavLink();
  initMobileNav();
  initScrollAnimations();
  initContactForm();
  initRegisterForm();
  initLoginForm();
  checkAdminAuth();
  initAdminTabs();
  initAdminSearch();
  initHeroSearch();
});
