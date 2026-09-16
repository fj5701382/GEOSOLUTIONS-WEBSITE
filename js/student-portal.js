/* ============================================================
   GEOSOLUTION — student-portal.js
   Page controller for pages/student-dashboard2.html:
   auth guard, personalised overview cards, section navigation
   (sidebar + mobile bottom tabs). Profile editing lives in
   student-dashboard.js; the payment countdown in dashboard.js.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const user = GeoAuth.requireAuth('student');
  if (!user) return;

  const $ = id => document.getElementById(id);
  const firstName = (user.fullName || 'Student').split(' ')[0];
  const initials = user.avatar || GeoAuth.getInitials(user.fullName || 'Student');
  const registration = user.registration || {};

  /* ── Identity ── */
  $('sidebarAvatar').textContent = initials;
  $('sidebarName').textContent = user.fullName || 'Student';
  $('topbarAvatar').textContent = initials;
  $('topbarName').textContent = firstName;
  $('studentName').textContent = firstName;
  $('welcomeSub').textContent = `Reference: ${user.identifier} · Here's your learning overview.`;

  /* ── Profile (built by student-dashboard.js) ── */
  GeoStudentDashboard.initProfileEdit(user);

  /* ── Overview cards ── */
  const setBadge = (el, label, cls) => {
    el.className = `status-badge ${cls}`;
    el.textContent = label;
  };

  // My Courses
  const course = typeof geoFindCourse === 'function' ? geoFindCourse(user.program || user.department) : null;
  if (course || user.department) {
    $('cardCourses').textContent = course ? course.name : user.department;
    if (course && course.page) {
      $('cardCoursesLink').href = course.page;
      $('cardCoursesLink').innerHTML = 'View course details <i class="fas fa-arrow-right" aria-hidden="true"></i>';
    }
  } else {
    $('cardCourses').textContent = 'No course on record yet';
  }

  // Registration status
  const regStates = {
    approved: ['Active', 'status-active'],
    pending: ['Pending approval', 'status-pending'],
    rejected: ['Not approved', 'status-overdue']
  };
  const [regLabel, regCls] = regStates[user.status] || ['Active', 'status-active'];
  setBadge($('cardRegStatus'), regLabel, regCls);
  $('cardRegRef').textContent = `Ref: ${user.identifier}`;

  // Payment status (shared localStorage keys with payment.html and dashboard.js)
  let paymentHistory = [];
  try { paymentHistory = JSON.parse(localStorage.getItem('geoPaymentHistory') || '[]'); } catch (_) { paymentHistory = []; }
  const mine = paymentHistory.filter(p => p.studentRef ? p.studentRef === user.identifier : p.email === user.email);
  const latest = mine[0];
  const nextDue = Number(localStorage.getItem('geoNextPaymentDate'));
  const amountDue = (course && course.fee) || (typeof GEOSOLUTION_PAYMENT !== 'undefined' ? GEOSOLUTION_PAYMENT.defaultAmount : 15000);
  const naira = n => (typeof geoFormatNaira === 'function' ? geoFormatNaira(n) : `₦${Number(n).toLocaleString()}`);

  if (latest && latest.status === 'pending') {
    setBadge($('cardPayStatus'), 'Pending confirmation', 'status-pending');
    $('cardPayMeta').textContent = 'We are confirming your bank transfer.';
  } else if (latest && nextDue && nextDue > Date.now()) {
    const days = Math.ceil((nextDue - Date.now()) / 86400000);
    setBadge($('cardPayStatus'), 'Paid', 'status-paid');
    $('cardPayMeta').textContent = `Next payment due in ${days} day${days === 1 ? '' : 's'}.`;
  } else if (latest) {
    setBadge($('cardPayStatus'), 'Overdue', 'status-overdue');
    $('cardPayMeta').textContent = `${naira(amountDue)} is now due.`;
  } else {
    setBadge($('cardPayStatus'), `${naira(amountDue)} outstanding`, 'status-pending');
    $('cardPayMeta').textContent = 'Pay online by card or bank transfer.';
  }

  // Schedule
  if (registration.schedule) $('cardSchedule').textContent = `${registration.schedule} classes`;

  // Results
  const scores = Array.from(document.querySelectorAll('#resultsGrid [data-score]')).map(el => Number(el.dataset.score));
  if (scores.length) {
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    $('cardResults').textContent = `${scores.length} results · ${avg}% average`;
  } else {
    $('cardResults').textContent = 'No results yet';
  }

  /* ── Section navigation ── */
  const sidebar = $('sidebar');
  const overlay = $('sidebarOverlay');
  const menuToggle = $('menuToggle');
  const moreTab = $('moreTab');
  const HASHES = { overviewSection: 'overview', resultsSection: 'results', profileSection: 'profile', eduNeedsSection: 'materials' };
  const TITLES = { overviewSection: 'Overview', resultsSection: 'My Results', profileSection: 'My Profile', eduNeedsSection: 'Learning Materials' };

  const openSidebar = () => {
    sidebar.classList.add('open');
    overlay.classList.add('active');
    menuToggle.setAttribute('aria-expanded', 'true');
    moreTab.setAttribute('aria-expanded', 'true');
    $('closeSidebar').focus();
  };
  const closeSidebar = () => {
    if (!sidebar.classList.contains('open')) return;
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    moreTab.setAttribute('aria-expanded', 'false');
  };

  const showSection = (target, { updateHash = true } = {}) => {
    if (!$(target)) return;
    document.querySelectorAll('.sd-section').forEach(s => s.classList.toggle('active', s.id === target));
    document.querySelectorAll('[data-target]').forEach(btn => {
      const active = btn.dataset.target === target;
      btn.classList.toggle('active', active);
      if (active) btn.setAttribute('aria-current', 'page');
      else btn.removeAttribute('aria-current');
    });
    $('topbarTitle').textContent = TITLES[target] || 'Overview';
    if (updateHash) history.replaceState(null, '', `#${HASHES[target]}`);
    closeSidebar();
    window.scrollTo({ top: 0 });
  };

  document.querySelectorAll('[data-target]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.target)));
  document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.goto)));
  menuToggle.addEventListener('click', openSidebar);
  moreTab.addEventListener('click', openSidebar);
  $('closeSidebar').addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSidebar(); });

  const fromHash = Object.keys(HASHES).find(key => `#${HASHES[key]}` === window.location.hash);
  if (fromHash) showSection(fromHash, { updateHash: false });

  /* ── Logout ── */
  $('logoutBtn').addEventListener('click', () => GeoAuth.logout());
  $('logoutBtnMobile').addEventListener('click', () => GeoAuth.logout());
});
