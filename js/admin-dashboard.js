/**
 * GEOSOLUTION — Admin Dashboard (pages/admin-dashboard2.html)
 *
 * All tables, counters and charts are built from the real data the site
 * stores: accounts in the GeoAuth user store (auth.js) and payments in
 * `geoPaymentHistory` (written by payment.html). Approving a registration
 * here is what lets a new student log in to the Student Portal.
 *
 * Requires: site-config.js, mockUsers.js, auth.js, Chart.js (optional)
 */

document.addEventListener('DOMContentLoaded', () => {
  const admin = GeoAuth.requireAuth('admin');
  if (!admin) return;

  const $ = id => document.getElementById(id);
  const PAGE_SIZE = 10;
  const READ_NOTIFS_KEY = 'geo_admin_read_notifications';

  /* ───────────────────────── Helpers ───────────────────────── */
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const naira = n => '₦' + Number(n || 0).toLocaleString('en-NG');
  const fmtDate = iso => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? esc(iso) : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const isoDay = iso => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
  const initials = name => GeoAuth.getInitials(name || '?');
  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; }
  };

  const STATUS_LABEL = { approved: 'Active', pending: 'Pending', rejected: 'Rejected', suspended: 'Suspended' };
  const STATUS_BADGE = { approved: 'success', pending: 'warning', rejected: 'danger', suspended: 'danger' };
  const roleLabel = role => ({ student: 'Student', teacher: 'Teacher', admin: 'Admin', computer: 'Computer' }[role] || role);

  const getUsers = () => GeoAuth.getUsers();
  const getPayments = () => readJSON('geoPaymentHistory', []);

  const courseName = user => {
    const course = typeof geoFindCourse === 'function' ? geoFindCourse(user.program || user.department) : null;
    return course ? course.name : (user.department || user.subject || '—');
  };

  const avatarHtml = user => (user.profileImage
    ? `<img src="${esc(user.profileImage)}" alt="" class="student-avatar">`
    : `<span class="student-avatar avatar-initials" aria-hidden="true">${esc(user.avatar || initials(user.fullName))}</span>`);

  const badge = (text, tone) => `<span class="admin-badge ${tone}">${esc(text)}</span>`;
  const statusBadge = status => badge(STATUS_LABEL[status] || status || 'Unknown', STATUS_BADGE[status] || 'warning');

  const paymentsFor = user => getPayments().filter(p =>
    (p.studentRef && p.studentRef === user.identifier) || (!p.studentRef && user.email && p.email === user.email));

  const paymentExpiry = p => {
    const d = new Date(p.date);
    d.setDate(d.getDate() + 30);
    return d;
  };
  const paymentState = p => {
    if (!p) return 'Unpaid';
    if (p.status === 'pending') return 'Pending';
    if (p.status === 'failed') return 'Failed';
    return paymentExpiry(p) > new Date() ? 'Paid' : 'Expired';
  };
  const paymentBadge = state => badge(state, { Paid: 'success', Pending: 'warning', Unpaid: 'warning', Expired: 'danger', Failed: 'danger' }[state] || 'warning');

  function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `profile-toast admin-toast show${isError ? ' error' : ''}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function updateUser(userId, changes) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    Object.assign(user, changes);
    GeoAuth.saveUsers(users);
    return user;
  }
  function deleteUser(userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    if (user.id === admin.id) {
      showToast('You can’t delete the account you are logged in with.', true);
      return null;
    }
    GeoAuth.saveUsers(users.filter(u => u.id !== userId));
    return user;
  }

  /* Counters: animate from the current value to the real one */
  function setCounter(el, value) {
    if (!el) return;
    el.dataset.target = value;
    const start = Number(String(el.textContent).replace(/[^\d.-]/g, '')) || 0;
    const t0 = performance.now();
    const duration = 900;
    const tick = now => {
      const k = Math.min((now - t0) / duration, 1);
      el.textContent = Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))).toLocaleString('en-NG');
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    setTimeout(() => { el.textContent = Number(value).toLocaleString('en-NG'); }, duration + 400);
  }

  /* Adds data-label attributes so tables can collapse into cards on mobile */
  function injectTableLabels() {
    document.querySelectorAll('.admin-modern-table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.innerText.trim());
      table.querySelectorAll('tbody tr').forEach(row => {
        row.querySelectorAll('td').forEach((cell, i) => {
          if (headers[i]) cell.setAttribute('data-label', headers[i]);
        });
      });
    });
  }

  /* Generic paginator for the table footers */
  function paginate(list, state, ids, rerender) {
    const pages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
    state.page = Math.min(Math.max(state.page, 1), pages);
    const startIdx = (state.page - 1) * PAGE_SIZE;
    const slice = list.slice(startIdx, startIdx + PAGE_SIZE);
    if ($(ids.start)) $(ids.start).textContent = list.length ? startIdx + 1 : 0;
    if ($(ids.end)) $(ids.end).textContent = startIdx + slice.length;
    if ($(ids.total)) $(ids.total).textContent = list.length;
    const prev = $(ids.prev);
    const next = $(ids.next);
    if (prev) {
      prev.classList.toggle('disabled', state.page <= 1);
      prev.disabled = state.page <= 1;
      prev.onclick = () => { state.page--; rerender(); };
    }
    if (next) {
      next.classList.toggle('disabled', state.page >= pages);
      next.disabled = state.page >= pages;
      next.onclick = () => { state.page++; rerender(); };
    }
    const numbers = prev ? prev.parentElement.querySelector('.page-numbers') : null;
    if (numbers) {
      numbers.innerHTML = Array.from({ length: pages }, (_, i) =>
        `<button type="button" class="page-num${i + 1 === state.page ? ' active' : ''}" data-page="${i + 1}">${i + 1}</button>`).join('');
      numbers.querySelectorAll('button').forEach(b => { b.onclick = () => { state.page = Number(b.dataset.page); rerender(); }; });
    }
    return slice;
  }

  function toggleEmpty(tableId, emptyId, isEmpty) {
    if ($(emptyId)) $(emptyId).classList.toggle('hidden', !isEmpty);
    if ($(tableId)) $(tableId).classList.toggle('hidden', isEmpty);
  }

  /* ───────────────────────── Identity ───────────────────────── */
  $('adminName').textContent = admin.fullName || 'Administrator';
  $('adminAvatarInitials').textContent = admin.avatar || initials(admin.fullName);
  $('welcomeAdminName').textContent = admin.fullName || 'Administrator';
  if ($('adminFullName')) $('adminFullName').value = admin.fullName || '';
  if ($('adminEmail')) $('adminEmail').value = admin.email || '';

  /* ───────────────────────── Sidebar & sections ───────────────────────── */
  const sidebar = $('sidebar');
  const sidebarOverlay = $('sidebarOverlay');
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  const openSidebar = () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };
  const closeSidebarMenu = () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  };
  $('menuToggle')?.addEventListener('click', openSidebar);
  $('closeSidebar')?.addEventListener('click', closeSidebarMenu);
  sidebarOverlay?.addEventListener('click', closeSidebarMenu);

  function showSection(targetId) {
    navItems.forEach(nav => nav.classList.toggle('active', nav.dataset.target === targetId));
    sections.forEach(section => section.classList.toggle('active', section.id === targetId));
    if (window.innerWidth <= 1024) closeSidebarMenu();
    if (targetId === 'analyticsSection') setTimeout(renderCharts, 60);
    injectTableLabels();
  }
  navItems.forEach(item => {
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.addEventListener('click', () => showSection(item.dataset.target));
    item.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); showSection(item.dataset.target); }
    });
  });
  document.querySelector('.view-all-notifs')?.removeAttribute('onclick');
  document.querySelector('.view-all-notifs')?.addEventListener('click', () => {
    $('notifDropdown').classList.add('hidden');
    showSection('notificationsSection');
  });

  /* ───────────────────────── Filters (options from real data) ───────────────────────── */
  function fillCourseFilter() {
    const select = $('filterCourse');
    if (!select || typeof GEOSOLUTION_COURSES === 'undefined') return;
    const current = select.value;
    select.innerHTML = '<option value="">All Courses</option>' +
      GEOSOLUTION_COURSES.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('');
    select.value = current;
  }
  function fillTeacherSubjectFilter() {
    const select = $('filterTeacherCourse');
    if (!select) return;
    const current = select.value;
    const subjects = [...new Set(getUsers().filter(u => u.role === 'teacher' && u.subject).map(u => u.subject))].sort();
    select.innerHTML = '<option value="">All Subjects</option>' + subjects.map(s => `<option>${esc(s)}</option>`).join('');
    select.value = current;
  }
  const payMethodFilter = $('filterPaymentMethod');
  if (payMethodFilter) {
    payMethodFilter.innerHTML = '<option value="">All Methods</option><option value="card">Card</option><option value="transfer">Bank Transfer</option>';
  }
  const teacherPaymentFilter = $('filterTeacherPayment');
  if (teacherPaymentFilter) teacherPaymentFilter.closest('select').remove();
  const studentStatusFilter = $('filterStatus');
  if (studentStatusFilter) {
    studentStatusFilter.innerHTML = '<option value="">All Statuses</option><option value="approved">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>';
  }
  const teacherStatusFilter = $('filterTeacherStatus');
  if (teacherStatusFilter) {
    teacherStatusFilter.innerHTML = '<option value="">All Statuses</option><option value="approved">Active</option><option value="pending">Pending</option><option value="suspended">Suspended</option><option value="rejected">Rejected</option>';
  }
  const pendingStatusFilter = $('filterPendingStatus');
  if (pendingStatusFilter) pendingStatusFilter.innerHTML = '<option value="">Pending &amp; Rejected</option><option value="pending">Pending</option><option value="rejected">Rejected</option>';
  const pendingRoleFilter = $('filterPendingRole');
  if (pendingRoleFilter) pendingRoleFilter.innerHTML = '<option value="">All Roles</option><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option>';

  const matches = (user, term) => !term || [user.fullName, user.email, user.identifier, user.phoneNumber]
    .some(v => String(v || '').toLowerCase().includes(term));

  /* Shared row actions (event delegation) */
  function handleUserAction(action, userId) {
    const users = getUsers();
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const name = user.fullName;
    switch (action) {
      case 'review':
        openReviewModal(userId);
        return;
      case 'approve':
        updateUser(userId, { status: 'approved', approvedAt: new Date().toISOString() });
        showToast(`${name}'s account is approved. They can now log in.`);
        break;
      case 'reject':
        updateUser(userId, { status: 'rejected' });
        showToast(`${name}'s registration was rejected.`, true);
        break;
      case 'suspend':
        updateUser(userId, { status: 'suspended' });
        showToast(`${name}'s account is suspended.`, true);
        break;
      case 'reactivate':
        updateUser(userId, { status: 'approved' });
        showToast(`${name}'s account is active again.`);
        break;
      case 'delete':
        if (!confirm(`Delete ${name}'s account permanently? This cannot be undone.`)) return;
        if (deleteUser(userId)) showToast(`${name}'s account was deleted.`, true);
        break;
      default:
        return;
    }
    refreshAll();
  }

  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-user-action]');
    if (btn) handleUserAction(btn.dataset.userAction, btn.dataset.id);
  });

  const actionButtons = (user, { review = true } = {}) => {
    const btns = [];
    const b = (action, icon, label, cls) =>
      `<button type="button" class="btn-action ${cls}" data-user-action="${action}" data-id="${esc(user.id)}" data-tooltip="${label}" aria-label="${label}: ${esc(user.fullName)}">${icon}</button>`;
    if (review) btns.push(b('review', '👁️', 'Review profile', 'view'));
    if (user.status !== 'approved') btns.push(b('approve', '✓', 'Approve', 'approve'));
    if (user.status === 'pending') btns.push(b('reject', '✕', 'Reject', 'reject'));
    if (user.status === 'approved' && user.id !== admin.id) btns.push(b('suspend', '⏸️', 'Suspend', 'suspend'));
    if (user.status === 'suspended') btns.push(b('reactivate', '▶️', 'Reactivate', 'approve'));
    if (user.id !== admin.id) btns.push(b('delete', '🗑️', 'Delete', 'delete'));
    return `<div class="action-buttons">${btns.join('')}</div>`;
  };

  /* ───────────────────────── Pending approvals ───────────────────────── */
  const pendingState = { page: 1 };
  function renderPending() {
    const tbody = $('pendingTableBody');
    if (!tbody) return;
    const term = ($('pendingSearch')?.value || '').toLowerCase();
    const role = $('filterPendingRole')?.value || '';
    const status = $('filterPendingStatus')?.value || '';
    const date = $('filterPendingDate')?.value || '';
    const list = getUsers()
      .filter(u => (status ? u.status === status : ['pending', 'rejected'].includes(u.status)))
      .filter(u => (!role || u.role === role) && (!date || isoDay(u.createdAt) === date) && matches(u, term))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const rows = paginate(list, pendingState, { start: 'pendingPageStart', end: 'pendingPageEnd', total: 'totalPending', prev: 'prevPendingPage', next: 'nextPendingPage' }, renderPending);
    toggleEmpty('pendingTable', 'pendingTableEmptyState', !list.length);
    tbody.innerHTML = rows.map(u => `
      <tr>
        <td><input type="checkbox" class="admin-checkbox pending-row-check" value="${esc(u.id)}" aria-label="Select ${esc(u.fullName)}"></td>
        <td><div class="student-profile-cell">${avatarHtml(u)}<div class="student-name-col"><span class="student-name">${esc(u.fullName)}</span><span class="student-role-text">${esc(courseName(u))}</span></div></div></td>
        <td><span class="mono">${esc(u.identifier)}</span></td>
        <td>${esc(u.email)}</td>
        <td><span class="role-badge role-${esc(u.role)}">${esc(roleLabel(u.role))}</span></td>
        <td>${fmtDate(u.createdAt)}</td>
        <td>${statusBadge(u.status)}</td>
        <td><button type="button" class="btn-doc-link" data-user-action="review" data-id="${esc(u.id)}">📄 ${u.registration ? 'Form' : 'Profile'}${u.profileImage ? ' + photo' : ''}</button></td>
        <td class="text-right">${actionButtons(u)}</td>
      </tr>`).join('');
    if ($('selectAllPending')) $('selectAllPending').checked = false;
    injectTableLabels();
  }
  ['pendingSearch', 'filterPendingRole', 'filterPendingStatus', 'filterPendingDate'].forEach(id => {
    $(id)?.addEventListener('input', () => { pendingState.page = 1; renderPending(); });
    $(id)?.addEventListener('change', () => { pendingState.page = 1; renderPending(); });
  });
  $('selectAllPending')?.addEventListener('change', e => {
    document.querySelectorAll('.pending-row-check').forEach(c => { c.checked = e.target.checked; });
  });
  $('bulkApproveBtn')?.addEventListener('click', () => {
    let ids = Array.from(document.querySelectorAll('.pending-row-check:checked')).map(c => c.value);
    if (!ids.length) {
      ids = getUsers().filter(u => u.status === 'pending').map(u => u.id);
      if (!ids.length) return showToast('There are no pending accounts to approve.');
      if (!confirm(`No rows selected. Approve all ${ids.length} pending account(s)?`)) return;
    }
    const users = getUsers();
    users.forEach(u => { if (ids.includes(u.id)) { u.status = 'approved'; u.approvedAt = new Date().toISOString(); } });
    GeoAuth.saveUsers(users);
    showToast(`${ids.length} account(s) approved.`);
    refreshAll();
  });
  $('exportPendingBtn')?.addEventListener('click', () => {
    const list = getUsers().filter(u => ['pending', 'rejected'].includes(u.status));
    downloadCSV('pending-approvals.csv', [['Name', 'Reference / ID', 'Email', 'Phone', 'Role', 'Course', 'Status', 'Registered'],
      ...list.map(u => [u.fullName, u.identifier, u.email, u.phoneNumber, roleLabel(u.role), courseName(u), STATUS_LABEL[u.status], isoDay(u.createdAt)])]);
  });

  /* ───────────────────────── Students ───────────────────────── */
  const studentsState = { page: 1 };
  function renderStudents() {
    const tbody = $('studentsTableBody');
    if (!tbody) return;
    const term = ($('studentSearch')?.value || '').toLowerCase();
    const course = $('filterCourse')?.value || '';
    const status = $('filterStatus')?.value || '';
    const list = getUsers()
      .filter(u => u.role === 'student' && matches(u, term) && (!course || courseName(u) === course) && (!status || u.status === status))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const rows = paginate(list, studentsState, { start: 'pageStart', end: 'pageEnd', total: 'totalStudents', prev: 'prevPage', next: 'nextPage' }, renderStudents);
    toggleEmpty('studentsTable', 'tableEmptyState', !list.length);
    tbody.innerHTML = rows.map(u => {
      const latest = paymentsFor(u)[0];
      return `
      <tr>
        <td><input type="checkbox" class="admin-checkbox" aria-label="Select ${esc(u.fullName)}"></td>
        <td><div class="student-profile-cell">${avatarHtml(u)}<div class="student-name-col"><span class="student-name">${esc(u.fullName)}</span><span class="student-role-text">${esc(u.phoneNumber || '')}</span></div></div></td>
        <td><span class="mono">${esc(u.identifier)}</span></td>
        <td>${esc(u.email)}</td>
        <td>${esc(courseName(u))}</td>
        <td>${paymentBadge(paymentState(latest))}</td>
        <td>${statusBadge(u.status)}</td>
        <td>${fmtDate(u.createdAt)}</td>
        <td class="text-right">${actionButtons(u)}</td>
      </tr>`;
    }).join('');
    injectTableLabels();
  }
  ['studentSearch', 'filterCourse', 'filterStatus'].forEach(id => {
    $(id)?.addEventListener('input', () => { studentsState.page = 1; renderStudents(); });
    $(id)?.addEventListener('change', () => { studentsState.page = 1; renderStudents(); });
  });
  $('selectAllStudents')?.addEventListener('change', e => {
    $('studentsTableBody').querySelectorAll('.admin-checkbox').forEach(c => { c.checked = e.target.checked; });
  });
  $('exportStudentsBtn')?.addEventListener('click', () => {
    const list = getUsers().filter(u => u.role === 'student');
    downloadCSV('students.csv', [['Name', 'Reference / Reg No', 'Email', 'Phone', 'Course', 'Schedule', 'Status', 'Payment', 'Registered', 'Guardian', 'Guardian Phone'],
      ...list.map(u => {
        const r = u.registration || {};
        return [u.fullName, u.identifier, u.email, u.phoneNumber, courseName(u), r.schedule, STATUS_LABEL[u.status], paymentState(paymentsFor(u)[0]), isoDay(u.createdAt), r.guardianName, r.guardianPhone];
      })]);
  });

  /* ───────────────────────── Teachers ───────────────────────── */
  const teachersState = { page: 1 };
  function renderTeachers() {
    const tbody = $('teachersTableBody');
    if (!tbody) return;
    const term = ($('teacherSearch')?.value || '').toLowerCase();
    const subject = $('filterTeacherCourse')?.value || '';
    const status = $('filterTeacherStatus')?.value || '';
    const list = getUsers()
      .filter(u => u.role === 'teacher' && matches(u, term) && (!subject || u.subject === subject) && (!status || u.status === status));
    const rows = paginate(list, teachersState, { start: 'teacherPageStart', end: 'teacherPageEnd', total: 'totalTeachers', prev: 'prevTeacherPage', next: 'nextTeacherPage' }, renderTeachers);
    toggleEmpty('teachersTable', 'teacherTableEmptyState', !list.length);
    tbody.innerHTML = rows.map(u => `
      <tr>
        <td><input type="checkbox" class="admin-checkbox" aria-label="Select ${esc(u.fullName)}"></td>
        <td><div class="student-profile-cell">${avatarHtml(u)}<div class="student-name-col"><span class="student-name">${esc(u.fullName)}</span><span class="student-role-text">${esc(u.identifier)}</span></div></div></td>
        <td><div class="cell-stack"><span>${esc(u.email)}</span><span class="cell-muted">${esc(u.phoneNumber || '—')}</span></div></td>
        <td>${esc(u.subject || '—')}</td>
        <td><span class="cell-muted">Not recorded</span></td>
        <td>${statusBadge(u.status)}</td>
        <td>${fmtDate(u.createdAt)}</td>
        <td class="text-right">${actionButtons(u)}</td>
      </tr>`).join('');
    injectTableLabels();
  }
  ['teacherSearch', 'filterTeacherCourse', 'filterTeacherStatus'].forEach(id => {
    $(id)?.addEventListener('input', () => { teachersState.page = 1; renderTeachers(); });
    $(id)?.addEventListener('change', () => { teachersState.page = 1; renderTeachers(); });
  });
  $('exportTeachersBtn')?.addEventListener('click', () => {
    const list = getUsers().filter(u => u.role === 'teacher');
    downloadCSV('teachers.csv', [['Name', 'Email', 'Phone', 'Subject', 'Status', 'Registered'],
      ...list.map(u => [u.fullName, u.email, u.phoneNumber, u.subject, STATUS_LABEL[u.status], isoDay(u.createdAt)])]);
  });

  /* ───────────────────────── Payments ───────────────────────── */
  const paymentsState = { page: 1 };
  const studentForPayment = p => getUsers().find(u => (p.studentRef && u.identifier === p.studentRef) || (!p.studentRef && p.email && u.email === p.email));

  function renderPayments() {
    const tbody = $('paymentsTableBody');
    if (!tbody) return;
    const term = ($('paymentSearch')?.value || '').toLowerCase();
    const method = $('filterPaymentMethod')?.value || '';
    const status = $('filterPaymentStatus')?.value || '';
    const list = getPayments()
      .map((p, index) => ({ ...p, index, student: studentForPayment(p), state: paymentState(p) }))
      .filter(p => (!method || (p.method || 'card') === method) && (!status || p.state === status))
      .filter(p => !term || [p.reference, p.studentRef, p.email, p.student?.fullName].some(v => String(v || '').toLowerCase().includes(term)));
    const rows = paginate(list, paymentsState, { start: 'paymentPageStart', end: 'paymentPageEnd', total: 'totalPayments', prev: 'prevPaymentPage', next: 'nextPaymentPage' }, renderPayments);
    toggleEmpty('paymentsTable', 'paymentTableEmptyState', !list.length);
    tbody.innerHTML = rows.map(p => `
      <tr>
        <td><input type="checkbox" class="admin-checkbox" aria-label="Select payment ${esc(p.reference)}"></td>
        <td><div class="student-name-col"><span class="student-name">${esc(p.student?.fullName || p.email || 'Unknown')}</span><span class="student-role-text">${esc(p.studentRef || p.email || '')}</span></div></td>
        <td><span class="mono">${esc(p.reference)}</span></td>
        <td>${p.method === 'transfer' ? 'Bank Transfer' : 'Card'}</td>
        <td>${naira(p.amount)}</td>
        <td>${paymentBadge(p.state)}</td>
        <td>${fmtDate(p.date)}</td>
        <td>${p.status === 'success' ? fmtDate(paymentExpiry(p).toISOString()) : '—'}</td>
        <td class="text-right"><div class="action-buttons">
          <button type="button" class="btn-action view" data-pay-action="receipt" data-index="${p.index}" data-tooltip="View receipt" aria-label="View receipt ${esc(p.reference)}">📄</button>
          ${p.status === 'pending' ? `<button type="button" class="btn-action approve" data-pay-action="verify" data-index="${p.index}" data-tooltip="Confirm transfer" aria-label="Confirm transfer ${esc(p.reference)}">✓</button>
          <button type="button" class="btn-action reject" data-pay-action="fail" data-index="${p.index}" data-tooltip="Mark as failed" aria-label="Mark ${esc(p.reference)} as failed">✕</button>` : ''}
        </div></td>
      </tr>`).join('');
    injectTableLabels();
  }
  ['paymentSearch', 'filterPaymentMethod', 'filterPaymentStatus'].forEach(id => {
    $(id)?.addEventListener('input', () => { paymentsState.page = 1; renderPayments(); });
    $(id)?.addEventListener('change', () => { paymentsState.page = 1; renderPayments(); });
  });
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-pay-action]');
    if (!btn) return;
    const history = getPayments();
    const p = history[Number(btn.dataset.index)];
    if (!p) return;
    if (btn.dataset.payAction === 'receipt') return openReceipt(p);
    p.status = btn.dataset.payAction === 'verify' ? 'success' : 'failed';
    if (p.status === 'success') p.confirmedAt = new Date().toISOString();
    localStorage.setItem('geoPaymentHistory', JSON.stringify(history));
    showToast(p.status === 'success' ? `Payment ${p.reference} confirmed.` : `Payment ${p.reference} marked as failed.`, p.status !== 'success');
    refreshAll();
  });
  $('exportPaymentsBtn')?.addEventListener('click', () => {
    downloadCSV('payments.csv', [['Reference', 'Student', 'Student Ref', 'Email', 'Program', 'Method', 'Amount', 'Status', 'Date'],
      ...getPayments().map(p => [p.reference, studentForPayment(p)?.fullName, p.studentRef, p.email, p.program, p.method === 'transfer' ? 'Bank Transfer' : 'Card', p.amount, paymentState(p), isoDay(p.date)])]);
  });

  const receiptModal = $('receiptModalOverlay');
  function openReceipt(p) {
    const student = studentForPayment(p);
    $('modalRef').textContent = p.reference;
    $('modalStudentName').textContent = student?.fullName || p.email || '—';
    $('modalStudentId').textContent = `Ref: ${p.studentRef || '—'}`;
    $('modalDate').textContent = fmtDate(p.date);
    $('modalMethod').textContent = p.method === 'transfer' ? 'Bank Transfer' : 'Card';
    const state = paymentState(p);
    $('modalStatus').textContent = state;
    $('modalStatus').className = `receipt-status status-${state.toLowerCase()}`;
    $('modalStatus').removeAttribute('style');
    $('modalAmount').textContent = Number(p.amount || 0).toLocaleString('en-NG');
    $('modalTotal').textContent = Number(p.amount || 0).toLocaleString('en-NG');
    const desc = receiptModal.querySelector('.receipt-items-table tbody td');
    if (desc) desc.textContent = p.program ? `${p.program} — fees` : 'Course fees';
    receiptModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  const closeReceipt = () => { receiptModal.classList.add('hidden'); document.body.style.overflow = ''; };
  $('closeReceiptBtn')?.addEventListener('click', closeReceipt);
  receiptModal?.addEventListener('click', e => { if (e.target === receiptModal) closeReceipt(); });
  $('printReceiptBtn')?.addEventListener('click', () => window.print());
  $('downloadReceiptBtn')?.addEventListener('click', () => window.print());

  /* ───────────────────────── All users & global search ───────────────────────── */
  function renderUsers() {
    const tbody = $('usersTableBody');
    if (!tbody) return;
    const term = ($('globalSearch')?.value || '').toLowerCase();
    const list = getUsers().filter(u => matches(u, term));
    tbody.innerHTML = list.length ? list.map(u => `
      <tr>
        <td><div class="student-profile-cell">${avatarHtml(u)}<span class="student-name">${esc(u.fullName)}</span></div></td>
        <td><span class="role-badge role-${esc(u.role)}">${esc(roleLabel(u.role))}</span></td>
        <td><span class="mono">${esc(u.identifier)}</span></td>
        <td>${esc(u.email)}</td>
        <td>${statusBadge(u.status)}</td>
        <td>${fmtDate(u.createdAt)}</td>
      </tr>`).join('') : `<tr><td colspan="6" class="table-empty-cell">No users match “${esc(term)}”.</td></tr>`;
    injectTableLabels();
  }
  const globalSearch = $('globalSearch');
  globalSearch?.addEventListener('input', () => {
    renderUsers();
    if (globalSearch.value.trim()) showSection('usersSection');
  });

  /* ───────────────────────── Courses ───────────────────────── */
  function renderCourses() {
    const tbody = $('coursesTableBody');
    if (!tbody || typeof GEOSOLUTION_COURSES === 'undefined') return;
    const users = getUsers();
    tbody.innerHTML = GEOSOLUTION_COURSES.map(c => {
      const count = users.filter(u => u.program === c.id || u.department === c.name).length;
      return `
      <tr>
        <td><span class="student-name">${esc(c.name)}</span></td>
        <td>${esc(GEOSOLUTION_CATEGORIES[c.category] || c.category)}</td>
        <td>${esc(c.duration || '—')}</td>
        <td>${c.fee ? naira(c.fee) : '<span class="cell-muted">Not set</span>'}</td>
        <td>${count}</td>
        <td class="text-right">${c.page ? `<a class="btn-doc-link" href="${esc(c.page)}" target="_blank" rel="noopener">Open ↗</a>` : '<span class="cell-muted">—</span>'}</td>
      </tr>`;
    }).join('');
    injectTableLabels();
  }

  /* ───────────────────────── Overview numbers ───────────────────────── */
  function renderStats() {
    const users = getUsers();
    const payments = getPayments();
    const students = users.filter(u => u.role === 'student');
    const teachers = users.filter(u => u.role === 'teacher');
    const pending = users.filter(u => u.status === 'pending');
    const confirmed = payments.filter(p => p.status === 'success');
    const revenue = confirmed.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const active = confirmed.filter(p => paymentState(p) === 'Paid').length;
    const expired = confirmed.filter(p => paymentState(p) === 'Expired').length;

    setCounter($('statStudents'), students.length);
    setCounter($('statTeachers'), teachers.length);
    setCounter($('statPending'), pending.length);
    setCounter($('statActivePayments'), active);
    setCounter($('statExpiredPayments'), expired);
    setCounter($('statRevenue'), revenue);
    setCounter($('statCourses'), typeof GEOSOLUTION_COURSES !== 'undefined' ? GEOSOLUTION_COURSES.length : 0);
    setCounter($('statMessages'), 0);

    setCounter($('statPendingTotal'), pending.length);
    setCounter($('statPendingStudents'), pending.filter(u => u.role === 'student').length);
    setCounter($('statPendingTeachers'), pending.filter(u => u.role === 'teacher').length);

    setCounter($('payStatRevenue'), revenue);
    setCounter($('payStatActive'), active);
    setCounter($('payStatPending'), payments.filter(p => p.status === 'pending').length);
    setCounter($('payStatFailed'), payments.filter(p => p.status === 'failed').length);

    setCounter($('anRevenue'), revenue);
    setCounter($('anPending'), pending.length);
    setCounter($('anStudents'), students.filter(u => u.status === 'approved').length);
    setCounter($('anTeachers'), teachers.filter(u => u.status === 'approved').length);
    setCounter($('anPaySuccess'), payments.length ? Math.round((confirmed.length / payments.length) * 100) : 0);

    $('welcomePendingNote').textContent = pending.length
      ? `${pending.length} account${pending.length === 1 ? ' is' : 's are'} waiting for your approval.`
      : 'There are no accounts waiting for approval.';

    const pendingNav = document.querySelector('[data-target="pendingSection"] .admin-nav-text');
    if (pendingNav) pendingNav.innerHTML = `Pending Approvals${pending.length ? ` <span class="nav-count">${pending.length}</span>` : ''}`;
  }

  /* ───────────────────────── Notifications (derived from real events) ───────────────────────── */
  const readNotifs = new Set(readJSON(READ_NOTIFS_KEY, []));
  const saveRead = () => localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify([...readNotifs]));
  const timeAgo = iso => {
    const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
    const hours = Math.round(mins / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    const days = Math.round(hours / 24);
    return days === 1 ? 'Yesterday' : `${days} days ago`;
  };

  function buildNotifications() {
    const items = [];
    getUsers().forEach(u => {
      if (u.status === 'pending') {
        items.push({ id: `reg-${u.id}`, type: 'Approval', icon: '⏳', priority: 'urgent', title: 'Registration awaiting approval',
          msg: `${u.fullName} (${roleLabel(u.role)}${u.department ? `, ${u.department}` : ''}) registered and needs approval.`, date: u.createdAt, target: 'pendingSection' });
      } else if (u.role !== 'admin' && u.createdAt) {
        items.push({ id: `new-${u.id}`, type: 'Registration', icon: '👨‍🎓', priority: 'info', title: 'New account',
          msg: `${u.fullName} joined as ${roleLabel(u.role).toLowerCase()}.`, date: u.createdAt, target: 'usersSection' });
      }
    });
    getPayments().forEach(p => {
      const who = studentForPayment(p)?.fullName || p.email || p.studentRef;
      items.push(p.status === 'pending'
        ? { id: `pay-${p.reference}`, type: 'Payment', icon: '🏦', priority: 'urgent', title: 'Bank transfer to confirm', msg: `${who} reported a transfer of ${naira(p.amount)} (${p.reference}).`, date: p.date, target: 'paymentsSection' }
        : { id: `pay-${p.reference}`, type: 'Payment', icon: '💳', priority: p.status === 'failed' ? 'warning' : 'new', title: p.status === 'failed' ? 'Payment failed' : 'Payment received', msg: `${naira(p.amount)} from ${who} (${p.reference}).`, date: p.date, target: 'paymentsSection' });
    });
    return items
      .map(n => ({ ...n, status: readNotifs.has(n.id) ? 'read' : 'unread' }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  function renderNotifications() {
    const all = buildNotifications();
    const unread = all.filter(n => n.status === 'unread');
    const badgeEl = $('topbarNotifBadge');
    if (badgeEl) {
      badgeEl.textContent = unread.length;
      badgeEl.style.display = unread.length ? 'flex' : 'none';
    }

    const quick = $('dropdownNotifList');
    if (quick) {
      quick.innerHTML = unread.length ? unread.slice(0, 5).map(n => `
        <button type="button" class="notif-item-quick unread" data-notif-open="${esc(n.id)}" data-target-section="${n.target}">
          <span class="notif-icon-small" aria-hidden="true">${n.icon}</span>
          <span class="notif-content-small">
            <span class="notif-title-small">${esc(n.title)}</span>
            <span class="notif-msg-small">${esc(n.msg)}</span>
            <span class="notif-time-small">${timeAgo(n.date)}</span>
          </span>
        </button>`).join('') : '<p class="notif-empty">You’re all caught up.</p>';
    }

    const full = $('notificationsFullList');
    if (full) {
      const term = ($('notifSearch')?.value || '').toLowerCase();
      const type = $('filterNotifType')?.value || '';
      const status = ($('filterNotifStatus')?.value || '').toLowerCase();
      const list = all.filter(n => (!type || n.type === type) && (!status || n.status === status) &&
        (!term || `${n.title} ${n.msg}`.toLowerCase().includes(term)));
      full.innerHTML = list.length ? list.map(n => `
        <div class="notif-card-full ${n.status}">
          <div class="notif-icon-full" aria-hidden="true">${n.icon}</div>
          <div class="notif-info-full">
            <div class="notif-header-full"><span class="notif-title-full">${esc(n.title)}</span><span class="notif-time-full">${timeAgo(n.date)}</span></div>
            <div class="notif-msg-full">${esc(n.msg)}</div>
            <div class="notif-meta-row"><span class="notif-badge ${n.status === 'read' ? 'read' : n.priority}">${n.status === 'read' ? 'read' : n.priority}</span><span class="cell-muted">${n.type}</span></div>
          </div>
          <div class="notif-actions-full">
            <button type="button" class="btn-action view" data-notif-open="${esc(n.id)}" data-target-section="${n.target}" aria-label="Open">➜</button>
            ${n.status === 'unread' ? `<button type="button" class="btn-action approve" data-notif-read="${esc(n.id)}" aria-label="Mark as read">✓</button>` : ''}
          </div>
        </div>`).join('') : '<p class="notif-empty">No notifications match your filters.</p>';
    }
  }

  document.addEventListener('click', e => {
    const open = e.target.closest('[data-notif-open]');
    const read = e.target.closest('[data-notif-read]');
    if (open) {
      readNotifs.add(open.dataset.notifOpen);
      saveRead();
      $('notifDropdown').classList.add('hidden');
      showSection(open.dataset.targetSection);
      renderNotifications();
    } else if (read) {
      readNotifs.add(read.dataset.notifRead);
      saveRead();
      renderNotifications();
    }
  });
  $('notifDropdownBtn')?.addEventListener('click', e => {
    e.stopPropagation();
    $('notifDropdown').classList.toggle('hidden');
  });
  document.addEventListener('click', e => {
    const dd = $('notifDropdown');
    if (dd && !dd.contains(e.target) && !e.target.closest('#notifDropdownBtn')) dd.classList.add('hidden');
  });
  $('markAllReadBtn')?.addEventListener('click', () => {
    buildNotifications().forEach(n => readNotifs.add(n.id));
    saveRead();
    renderNotifications();
  });
  ['notifSearch', 'filterNotifType', 'filterNotifStatus'].forEach(id => {
    $(id)?.addEventListener('input', renderNotifications);
    $(id)?.addEventListener('change', renderNotifications);
  });

  /* ───────────────────────── Messages ───────────────────────── */
  const inbox = $('messageInboxList');
  if (inbox) {
    inbox.innerHTML = '<p class="notif-empty">No messages yet. Website enquiries currently arrive on WhatsApp and email.</p>';
  }
  const noMsg = $('noMessageSelected');
  if (noMsg) {
    noMsg.querySelector('h3').textContent = 'Inbox not connected yet';
    noMsg.querySelector('p').textContent = 'The contact form hands messages to WhatsApp or email. A messaging backend is needed before they can appear here.';
  }
  const composeModal = $('messageModalOverlay');
  const closeCompose = () => { composeModal.classList.add('hidden'); document.body.style.overflow = ''; };
  $('composeMessageBtn')?.addEventListener('click', () => { composeModal.classList.remove('hidden'); document.body.style.overflow = 'hidden'; });
  $('closeMessageBtn')?.addEventListener('click', closeCompose);
  $('cancelComposeBtn')?.addEventListener('click', closeCompose);
  composeModal?.addEventListener('click', e => { if (e.target === composeModal) closeCompose(); });
  $('sendComposeBtn')?.addEventListener('click', () => {
    closeCompose();
    showToast('Messaging isn’t connected yet — please send this by WhatsApp or email for now.', true);
  });

  /* ───────────────────────── Review modal ───────────────────────── */
  const reviewModal = $('reviewModalOverlay');
  let reviewingId = null;
  function openReviewModal(userId) {
    const u = getUsers().find(x => x.id === userId);
    if (!u) return;
    reviewingId = userId;
    const r = u.registration || {};
    $('modalUserId').textContent = `ID: ${u.identifier}`;
    $('modalProfileImg').src = u.profileImage || '../images/default-avatar.svg';
    $('modalProfileImg').alt = u.profileImage ? `Passport photo of ${u.fullName}` : 'No photo uploaded';
    $('modalRoleIndicator').textContent = roleLabel(u.role);
    $('modalFullName').textContent = u.fullName;
    $('modalEmail').textContent = u.email || '—';
    $('modalRegDate').textContent = fmtDate(u.createdAt);
    $('detailFullName').textContent = u.fullName;
    $('detailEmail').textContent = u.email || '—';
    $('detailPhone').textContent = u.phoneNumber || '—';
    $('detailRole').textContent = `${roleLabel(u.role)} · ${STATUS_LABEL[u.status] || u.status}`;

    const rows = u.role === 'student' ? [
      ['Course', courseName(u)], ['Schedule', r.schedule], ['Date of Birth', r.dob ? fmtDate(r.dob) : ''], ['Gender', r.gender],
      ['Address', r.address], ['State / LGA', [r.stateOfOrigin, r.lga].filter(Boolean).join(' / ')], ['School', r.school],
      ['Class / Level', r.classLevel], ['Exam Year', r.examYear], ['Guardian', [r.guardianName, r.relationship].filter(Boolean).join(' — ')],
      ['Guardian Phone', r.guardianPhone], ['Heard About Us', r.heardAbout]
    ] : [['Subject', u.subject], ['Identifier', u.identifier]];
    $('modalDocsList').innerHTML = `<dl class="review-detail-list">${rows.map(([k, v]) =>
      `<div><dt>${k}</dt><dd>${esc(v || '—')}</dd></div>`).join('')}</dl>`;

    $('modalApproveBtn').hidden = u.status === 'approved';
    $('modalRejectBtn').hidden = u.status !== 'pending';
    reviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
  const closeReview = () => { reviewModal.classList.add('hidden'); document.body.style.overflow = ''; reviewingId = null; };
  $('closeReviewBtn')?.addEventListener('click', closeReview);
  $('modalCancelBtn')?.addEventListener('click', closeReview);
  reviewModal?.addEventListener('click', e => { if (e.target === reviewModal) closeReview(); });
  $('modalApproveBtn')?.addEventListener('click', () => { const id = reviewingId; closeReview(); handleUserAction('approve', id); });
  $('modalRejectBtn')?.addEventListener('click', () => { const id = reviewingId; closeReview(); handleUserAction('reject', id); });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    [reviewModal, receiptModal, composeModal, $('logoutModalOverlay')].forEach(m => m && m.classList.add('hidden'));
    document.body.style.overflow = '';
  });

  /* ───────────────────────── Analytics (Chart.js, real data) ───────────────────────── */
  const charts = {};
  const BLUE = '#58b0f8';
  const BLUE_STRONG = '#1668c4';
  const RED = '#f83838';
  const PALETTE = [BLUE_STRONG, RED, '#10b981', '#f59e0b', '#8b5cf6', '#58b0f8', '#ec4899', '#64748b'];

  function renderCharts() {
    if (typeof Chart === 'undefined') {
      document.querySelectorAll('.chart-wrapper').forEach(w => {
        if (!w.querySelector('.chart-fallback')) w.insertAdjacentHTML('beforeend', '<p class="chart-fallback">Charts couldn’t load (check your internet connection).</p>');
      });
      return;
    }
    const dark = document.documentElement.getAttribute('data-theme') !== 'light';
    const tick = dark ? 'rgba(255,255,255,0.65)' : '#475569';
    const grid = dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
    const users = getUsers().filter(u => u.role !== 'admin');
    const payments = getPayments().filter(p => p.status === 'success');
    const now = new Date();

    const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1));
    const monthLabel = d => d.toLocaleDateString('en-GB', { month: 'short' });
    const sameMonth = (iso, d) => { const x = new Date(iso); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth(); };
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(now); d.setDate(d.getDate() - 6 + i); return d; });

    const common = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: tick } },
        y: { beginAtZero: true, grid: { color: grid }, ticks: { color: tick, precision: 0 } }
      }
    };
    const draw = (id, config) => {
      const canvas = $(id);
      if (!canvas) return;
      charts[id]?.destroy();
      charts[id] = new Chart(canvas, config);
    };

    draw('revenueChart', {
      type: 'line',
      data: { labels: months.map(monthLabel), datasets: [{ label: 'Revenue (₦)', data: months.map(m => payments.filter(p => sameMonth(p.date, m)).reduce((s, p) => s + Number(p.amount || 0), 0)),
        borderColor: BLUE_STRONG, backgroundColor: 'rgba(88,176,248,0.25)', fill: true, tension: 0.35, borderWidth: 3, pointRadius: 4, pointBackgroundColor: BLUE_STRONG }] },
      options: common
    });
    draw('registrationChart', {
      type: 'line',
      data: { labels: days.map(d => d.toLocaleDateString('en-GB', { weekday: 'short' })), datasets: [
        { label: 'Students', data: days.map(d => users.filter(u => u.role === 'student' && isoDay(u.createdAt) === isoDay(d.toISOString())).length), borderColor: BLUE_STRONG, tension: 0.35, borderWidth: 2 },
        { label: 'Teachers', data: days.map(d => users.filter(u => u.role === 'teacher' && isoDay(u.createdAt) === isoDay(d.toISOString())).length), borderColor: RED, tension: 0.35, borderWidth: 2 }
      ] },
      options: { ...common, plugins: { legend: { display: true, position: 'top', align: 'end', labels: { color: tick, boxWidth: 12, usePointStyle: true } } } }
    });
    const byCourse = {};
    users.filter(u => u.role === 'student').forEach(u => { const name = courseName(u); byCourse[name] = (byCourse[name] || 0) + 1; });
    const courseEntries = Object.entries(byCourse).sort((a, b) => b[1] - a[1]).slice(0, 7);
    draw('courseActivityChart', {
      type: 'doughnut',
      data: { labels: courseEntries.length ? courseEntries.map(e => e[0]) : ['No registrations yet'],
        datasets: [{ data: courseEntries.length ? courseEntries.map(e => e[1]) : [1], backgroundColor: courseEntries.length ? PALETTE : [grid], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { display: true, position: 'bottom', labels: { color: tick, boxWidth: 12 } } } }
    });
    draw('growthChart', {
      type: 'bar',
      data: { labels: months.map(monthLabel), datasets: [{ label: 'New accounts', data: months.map(m => users.filter(u => u.createdAt && sameMonth(u.createdAt, m)).length), backgroundColor: BLUE, borderRadius: 8, maxBarThickness: 36 }] },
      options: common
    });
  }
  $('refreshChartsBtn')?.addEventListener('click', renderCharts);
  $('exportReportBtn')?.addEventListener('click', () => {
    const users = getUsers();
    const payments = getPayments();
    downloadCSV('geosolution-report.csv', [
      ['Metric', 'Value'],
      ['Students', users.filter(u => u.role === 'student').length],
      ['Teachers', users.filter(u => u.role === 'teacher').length],
      ['Pending approvals', users.filter(u => u.status === 'pending').length],
      ['Confirmed payments', payments.filter(p => p.status === 'success').length],
      ['Revenue (NGN)', payments.filter(p => p.status === 'success').reduce((s, p) => s + Number(p.amount || 0), 0)],
      ['Report generated', new Date().toLocaleString('en-GB')]
    ]);
  });

  /* ───────────────────────── Settings ───────────────────────── */
  const settingsTabBtns = document.querySelectorAll('.settings-tab-btn');
  const settingsPanes = document.querySelectorAll('.settings-pane');
  settingsTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      settingsTabBtns.forEach(b => b.classList.toggle('active', b === btn));
      settingsPanes.forEach(pane => pane.classList.toggle('active', pane.id === `pane-${btn.dataset.pane}`));
    });
  });

  function setupFileUpload(inputId, areaId, previewId, progressId) {
    const input = $(inputId);
    const area = $(areaId);
    const preview = $(previewId);
    const progress = $(progressId);
    if (!input || !area) return;
    const handle = file => {
      if (!file || !file.type.startsWith('image/')) return showToast('Please choose an image file.', true);
      const bar = progress.querySelector('.progress-bar');
      progress.style.display = 'block';
      bar.style.width = '30%';
      const reader = new FileReader();
      reader.onload = e => {
        bar.style.width = '100%';
        const img = preview.querySelector('img');
        if (img) img.src = e.target.result;
        setTimeout(() => { progress.style.display = 'none'; }, 400);
      };
      reader.readAsDataURL(file);
    };
    area.addEventListener('click', () => input.click());
    area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => { e.preventDefault(); area.classList.remove('dragover'); handle(e.dataTransfer.files[0]); });
    input.addEventListener('change', () => handle(input.files[0]));
  }
  setupFileUpload('schoolLogoInput', 'schoolLogoUploadArea', 'schoolLogoPreview', 'schoolLogoProgress');
  setupFileUpload('adminAvatarInput', 'adminAvatarUploadArea', 'adminAvatarPreview', 'adminAvatarProgress');

  const darkToggle = $('settingsDarkModeToggle');
  const syncDarkToggle = () => { if (darkToggle) darkToggle.checked = document.documentElement.getAttribute('data-theme') === 'dark'; };
  syncDarkToggle();
  darkToggle?.addEventListener('change', () => {
    const wantDark = darkToggle.checked;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (wantDark !== isDark) $('themeToggle')?.click();
  });
  $('themeToggle')?.addEventListener('click', () => setTimeout(() => {
    syncDarkToggle();
    if (document.getElementById('analyticsSection').classList.contains('active')) renderCharts();
  }, 50));

  document.querySelectorAll('.color-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.color-option').forEach(o => o.classList.toggle('active', o === option));
      document.documentElement.style.setProperty('--accent-color', option.style.background);
      showToast(`Accent colour updated to ${option.dataset.color}.`);
    });
  });

  $('settingsSearch')?.addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll('.settings-pane .form-group, .settings-pane .settings-toggle-group').forEach(group => {
      group.style.display = group.innerText.toLowerCase().includes(term) ? '' : 'none';
    });
  });

  document.querySelectorAll('.btn-save').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', () => {
      const section = btn.dataset.section || 'Settings';
      if (section === 'Admin Profile') {
        const name = $('adminFullName').value.trim();
        const email = $('adminEmail').value.trim();
        const pass = $('newPassword').value;
        const confirmPass = $('confirmPassword').value;
        if (name.length < 2) return showToast('Please enter your full name.', true);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return showToast('Please enter a valid email address.', true);
        if (pass && pass.length < 6) return showToast('The new password needs at least 6 characters.', true);
        if (pass !== confirmPass) return showToast('The new passwords don’t match.', true);
        const changes = { fullName: name, email, avatar: initials(name) };
        if (pass) changes.password = pass;
        const updated = updateUser(admin.id, changes);
        if (updated) {
          GeoAuth.setCurrentUser(updated);
          $('adminName').textContent = updated.fullName;
          $('adminAvatarInitials').textContent = updated.avatar;
          $('newPassword').value = '';
          $('confirmPassword').value = '';
        }
        return showToast('Your profile has been updated.');
      }
      btn.disabled = true;
      btn.textContent = 'Saving…';
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = label;
        showToast(`${section} saved on this device.`);
      }, 700);
    });
  });
  document.querySelectorAll('.btn-reset').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Reset these settings to their defaults?')) showToast('Settings reset to default.');
    });
  });

  /* ───────────────────────── Logout ───────────────────────── */
  const logoutModal = $('logoutModalOverlay');
  $('logoutBtn')?.addEventListener('click', e => {
    e.preventDefault();
    const modalName = logoutModal.querySelector('.logout-admin-name');
    if (modalName) modalName.textContent = $('adminName').textContent;
    logoutModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  });
  const closeLogout = () => { logoutModal.classList.add('hidden'); document.body.style.overflow = ''; };
  $('cancelLogoutBtn')?.addEventListener('click', closeLogout);
  logoutModal?.addEventListener('click', e => { if (e.target === logoutModal) closeLogout(); });
  $('confirmLogoutBtn')?.addEventListener('click', () => {
    $('logoutLoading')?.classList.add('active');
    localStorage.removeItem('geo_session');
    sessionStorage.clear();
    setTimeout(() => { window.location.replace('login2.html'); }, 900);
  });

  /* ───────────────────────── Keep in sync ───────────────────────── */
  function refreshAll() {
    fillCourseFilter();
    fillTeacherSubjectFilter();
    renderStats();
    renderPending();
    renderStudents();
    renderTeachers();
    renderPayments();
    renderUsers();
    renderCourses();
    renderNotifications();
    if ($('analyticsSection').classList.contains('active')) renderCharts();
  }
  // Another tab (e.g. a student registering or paying) changed the data
  window.addEventListener('storage', e => {
    if (['geo_users', 'geoPaymentHistory'].includes(e.key)) refreshAll();
  });

  refreshAll();
});
