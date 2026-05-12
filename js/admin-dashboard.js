/**
 * Admin Dashboard UI Logic
 * Handles sidebar toggling, mobile responsiveness, and active menu states.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menuToggle');
  const closeSidebar = document.getElementById('closeSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const navItems = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');

  // 1. Mobile Sidebar Toggle
  function openSidebar() {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }

  function closeSidebarMenu() {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', openSidebar);
  }

  if (closeSidebar) {
    closeSidebar.addEventListener('click', closeSidebarMenu);
  }

  if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', closeSidebarMenu);
  }

  // 2. Active Menu Highlight & Section Switching
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      // Remove active class from all items
      navItems.forEach(nav => nav.classList.remove('active'));
      
      // Add active class to clicked item
      item.classList.add('active');

      // Get target section id
      const targetId = item.getAttribute('data-target');
      
      // Hide all sections
      sections.forEach(section => {
        section.classList.remove('active');
      });

      // Show target section
      const targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.classList.add('active');
      }

      // Close sidebar on mobile after selection
      if (window.innerWidth <= 1024) {
        closeSidebarMenu();
      }
    });
  });

  // 3. Search Bar Interaction (Optional enhancement)
  const searchInput = document.querySelector('.admin-search-bar input');
  if (searchInput) {
    searchInput.addEventListener('focus', () => {
      document.querySelector('.admin-search-bar').style.background = 'rgba(255, 255, 255, 0.1)';
    });
    searchInput.addEventListener('blur', () => {
      document.querySelector('.admin-search-bar').style.background = 'rgba(0, 0, 0, 0.2)';
    });
  }

  // 4. Counter Animation for Stat Cards
  const counters = document.querySelectorAll('.counter');
  const speed = 200; // The lower the slower

  const animateCounters = () => {
    counters.forEach(counter => {
      const updateCount = () => {
        const target = +counter.getAttribute('data-target');
        const count = +counter.innerText.replace(/,/g, '');

        // Lower inc to slow and higher to fast
        const inc = target / speed;

        // Check if target is reached
        if (count < target) {
          // Add inc to count and output in counter
          counter.innerText = Math.ceil(count + inc).toLocaleString();
          // Call function every ms
          setTimeout(updateCount, 15);
        } else {
          counter.innerText = target.toLocaleString();
        }
      };

      updateCount();
    });
  };

  // Run animation once on load
  setTimeout(animateCounters, 500);

  // 5. Student Management Table Logic
  const mockStudents = [
    { id: 'GEO-24-001', name: 'John Doe', email: 'john.doe@example.com', course: 'Frontend Development', payment: 'Paid', status: 'Active', regDate: 'Oct 12, 2024', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 'GEO-24-002', name: 'Jane Smith', email: 'jane.smith@example.com', course: 'UI/UX Design', payment: 'Pending', status: 'Pending', regDate: 'Oct 15, 2024', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 'GEO-24-003', name: 'Michael Johnson', email: 'michael.j@example.com', course: 'Backend Development', payment: 'Paid', status: 'Active', regDate: 'Oct 18, 2024', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 'GEO-24-004', name: 'Sarah Williams', email: 'sarah.w@example.com', course: 'Data Science', payment: 'Overdue', status: 'Suspended', regDate: 'Oct 20, 2024', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 'GEO-24-005', name: 'David Brown', email: 'david.b@example.com', course: 'Frontend Development', payment: 'Paid', status: 'Active', regDate: 'Oct 22, 2024', avatar: 'https://i.pravatar.cc/150?u=5' }
  ];

  const studentsTableBody = document.getElementById('studentsTableBody');
  const searchInputStudent = document.getElementById('studentSearch');
  const filterCourse = document.getElementById('filterCourse');
  const filterStatus = document.getElementById('filterStatus');
  const totalStudents = document.getElementById('totalStudents');

  function renderStudents(data) {
    if (!studentsTableBody) return;
    studentsTableBody.innerHTML = '';
    
    if (data.length === 0) {
      document.getElementById('tableEmptyState').classList.remove('hidden');
      document.getElementById('studentsTable').classList.add('hidden');
    } else {
      document.getElementById('tableEmptyState').classList.add('hidden');
      document.getElementById('studentsTable').classList.remove('hidden');
      
      data.forEach(student => {
        let paymentBadge = '';
        if (student.payment === 'Paid') paymentBadge = '<span class="admin-badge success">Paid</span>';
        else if (student.payment === 'Pending') paymentBadge = '<span class="admin-badge warning">Pending</span>';
        else paymentBadge = '<span class="admin-badge danger">Overdue</span>';

        let statusBadge = '';
        if (student.status === 'Active') statusBadge = '<span class="admin-badge success">Active</span>';
        else if (student.status === 'Pending') statusBadge = '<span class="admin-badge warning">Pending</span>';
        else statusBadge = '<span class="admin-badge danger">Suspended</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="admin-checkbox"></td>
          <td>
            <div class="student-profile-cell">
              <img src="${student.avatar}" alt="${student.name}" class="student-avatar" onerror="this.src='../images/avatar-placeholder.png'">
              <div class="student-name-col">
                <span class="student-name">${student.name}</span>
              </div>
            </div>
          </td>
          <td><span style="font-family: monospace; color: rgba(255,255,255,0.7);">${student.id}</span></td>
          <td>${student.email}</td>
          <td>${student.course}</td>
          <td>${paymentBadge}</td>
          <td>${statusBadge}</td>
          <td>${student.regDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action view" data-tooltip="View Details">👁️</button>
              <button class="btn-action edit" data-tooltip="Edit Student">✏️</button>
              <button class="btn-action approve" data-tooltip="Approve">✓</button>
              <button class="btn-action suspend" data-tooltip="Suspend">⏸️</button>
              <button class="btn-action delete" data-tooltip="Delete">🗑️</button>
            </div>
          </td>
        `;
        studentsTableBody.appendChild(row);
      });
    }
    
    if (totalStudents) totalStudents.innerText = data.length;
  }

  function filterTable() {
    if (!searchInputStudent || !filterCourse || !filterStatus) return;
    
    const searchTerm = searchInputStudent.value.toLowerCase();
    const course = filterCourse.value;
    const status = filterStatus.value;

    const filtered = mockStudents.filter(student => {
      const matchSearch = student.name.toLowerCase().includes(searchTerm) || 
                          student.email.toLowerCase().includes(searchTerm) || 
                          student.id.toLowerCase().includes(searchTerm);
      const matchCourse = course === '' || student.course === course;
      const matchStatus = status === '' || student.status === status;
      
      return matchSearch && matchCourse && matchStatus;
    });

    renderStudents(filtered);
  }

  if (searchInputStudent) searchInputStudent.addEventListener('input', filterTable);
  if (filterCourse) filterCourse.addEventListener('change', filterTable);
  if (filterStatus) filterStatus.addEventListener('change', filterTable);

  // Initial render
  renderStudents(mockStudents);

  // 6. Teacher Management Table Logic
  const mockTeachers = [
    { id: 'TCH-24-101', name: 'Dr. Alan Turing', email: 'alan.turing@geo.edu', phone: '+234 801 234 5678', course: 'Data Science', payment: 'Paid', status: 'Active', regDate: 'Jan 10, 2024', avatar: 'https://i.pravatar.cc/150?u=11', bankName: 'First Bank', acctName: 'Alan Turing', acctNo: '3029182390' },
    { id: 'TCH-24-102', name: 'Grace Hopper', email: 'grace.hopper@geo.edu', phone: '+234 802 345 6789', course: 'Backend Development', payment: 'Requested', status: 'Active', regDate: 'Feb 14, 2024', avatar: 'https://i.pravatar.cc/150?u=12', bankName: 'GTBank', acctName: 'Grace M. Hopper', acctNo: '0129384756' },
    { id: 'TCH-24-103', name: 'Ada Lovelace', email: 'ada.lovelace@geo.edu', phone: '+234 803 456 7890', course: 'Frontend Development', payment: 'Pending', status: 'Pending', regDate: 'Mar 05, 2024', avatar: 'https://i.pravatar.cc/150?u=13', bankName: 'Zenith Bank', acctName: 'Ada Lovelace', acctNo: '2093847561' },
    { id: 'TCH-24-104', name: 'Tim Berners-Lee', email: 'tim.bl@geo.edu', phone: '+234 804 567 8901', course: 'UI/UX Design', payment: 'Paid', status: 'Active', regDate: 'Apr 22, 2024', avatar: 'https://i.pravatar.cc/150?u=14', bankName: 'Access Bank', acctName: 'Tim Berners', acctNo: '0012345678' }
  ];

  const teachersTableBody = document.getElementById('teachersTableBody');
  const teacherSearch = document.getElementById('teacherSearch');
  const filterTeacherCourse = document.getElementById('filterTeacherCourse');
  const filterTeacherPayment = document.getElementById('filterTeacherPayment');
  const filterTeacherStatus = document.getElementById('filterTeacherStatus');
  const totalTeachers = document.getElementById('totalTeachers');

  function renderTeachers(data) {
    if (!teachersTableBody) return;
    teachersTableBody.innerHTML = '';
    
    if (data.length === 0) {
      document.getElementById('teacherTableEmptyState').classList.remove('hidden');
      document.getElementById('teachersTable').classList.add('hidden');
    } else {
      document.getElementById('teacherTableEmptyState').classList.add('hidden');
      document.getElementById('teachersTable').classList.remove('hidden');
      
      data.forEach(teacher => {
        let paymentBadge = '';
        if (teacher.payment === 'Paid') paymentBadge = '<span class="admin-badge success">Paid</span>';
        else if (teacher.payment === 'Pending') paymentBadge = '<span class="admin-badge warning">Pending</span>';
        else if (teacher.payment === 'Requested') paymentBadge = '<span class="admin-badge warning" style="background: rgba(168, 85, 247, 0.15); color: #c084fc; border-color: rgba(168, 85, 247, 0.3);">Requested</span>';
        else paymentBadge = '<span class="admin-badge danger">Overdue</span>';

        let statusBadge = '';
        if (teacher.status === 'Active') statusBadge = '<span class="admin-badge success">Active</span>';
        else if (teacher.status === 'Pending') statusBadge = '<span class="admin-badge warning">Pending</span>';
        else statusBadge = '<span class="admin-badge danger">Suspended</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="admin-checkbox"></td>
          <td>
            <div class="student-profile-cell">
              <img src="${teacher.avatar}" alt="${teacher.name}" class="student-avatar" onerror="this.src='../images/avatar-placeholder.png'">
              <div class="student-name-col">
                <span class="student-name">${teacher.name}</span>
                <span class="student-role-text">${teacher.id}</span>
              </div>
            </div>
          </td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <span style="color: white; font-size: 14px;">${teacher.email}</span>
              <span style="color: rgba(255,255,255,0.6); font-size: 12px;">${teacher.phone}</span>
            </div>
          </td>
          <td>${teacher.course}</td>
          <td>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                ${paymentBadge}
              </div>
              <span style="color: rgba(255,255,255,0.7); font-size: 12px; margin-top: 4px;">${teacher.bankName} - ${teacher.acctNo}</span>
            </div>
          </td>
          <td>${statusBadge}</td>
          <td>${teacher.regDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action view" data-tooltip="View Details">👁️</button>
              <button class="btn-action edit" data-tooltip="Edit Teacher">✏️</button>
              <button class="btn-action approve" data-tooltip="Approve/Pay">💳</button>
              <button class="btn-action suspend" data-tooltip="Suspend">⏸️</button>
              <button class="btn-action delete" data-tooltip="Delete">🗑️</button>
            </div>
          </td>
        `;
        teachersTableBody.appendChild(row);
      });
    }
    
    if (totalTeachers) totalTeachers.innerText = data.length;
  }

  function filterTeacherTable() {
    if (!teacherSearch || !filterTeacherCourse || !filterTeacherStatus || !filterTeacherPayment) return;
    
    const searchTerm = teacherSearch.value.toLowerCase();
    const course = filterTeacherCourse.value;
    const status = filterTeacherStatus.value;
    const payment = filterTeacherPayment.value;

    const filtered = mockTeachers.filter(teacher => {
      const matchSearch = teacher.name.toLowerCase().includes(searchTerm) || 
                          teacher.email.toLowerCase().includes(searchTerm) || 
                          teacher.id.toLowerCase().includes(searchTerm);
      const matchCourse = course === '' || teacher.course === course;
      const matchStatus = status === '' || teacher.status === status;
      const matchPayment = payment === '' || teacher.payment === payment;
      
      return matchSearch && matchCourse && matchStatus && matchPayment;
    });

    renderTeachers(filtered);
  }

  if (teacherSearch) teacherSearch.addEventListener('input', filterTeacherTable);
  if (filterTeacherCourse) filterTeacherCourse.addEventListener('change', filterTeacherTable);
  if (filterTeacherStatus) filterTeacherStatus.addEventListener('change', filterTeacherTable);
  if (filterTeacherPayment) filterTeacherPayment.addEventListener('change', filterTeacherTable);

  // 7. Pending Approvals Logic
  const mockPendingUsers = [
    { id: 'GEO-24-051', name: 'Alice Walker', email: 'alice.w@example.com', role: 'Student', status: 'Pending', regDate: '2024-11-01', avatar: 'https://i.pravatar.cc/150?u=51', phone: '+234 810 123 4567', docs: [{ name: 'Birth Certificate.pdf', size: '1.5 MB' }, { name: 'High School Result.pdf', size: '2.1 MB' }] },
    { id: 'GEO-24-052', name: 'Robert Fox', email: 'robert.fox@example.com', role: 'Teacher', status: 'Pending', regDate: '2024-11-02', avatar: 'https://i.pravatar.cc/150?u=52', phone: '+234 811 234 5678', docs: [{ name: 'CV_Fox.pdf', size: '0.8 MB' }, { name: 'Teaching License.pdf', size: '1.2 MB' }] },
    { id: 'GEO-24-053', name: 'Esther Howard', email: 'esther.h@example.com', role: 'Student', status: 'Pending', regDate: '2024-11-03', avatar: 'https://i.pravatar.cc/150?u=53', phone: '+234 812 345 6789', docs: [{ name: 'National ID.jpg', size: '3.4 MB' }] },
    { id: 'GEO-24-054', name: 'Cody Fisher', email: 'cody.f@example.com', role: 'Student', status: 'Rejected', regDate: '2024-10-28', avatar: 'https://i.pravatar.cc/150?u=54', phone: '+234 813 456 7890', docs: [{ name: 'Incomplete_ID.pdf', size: '0.5 MB' }] },
    { id: 'GEO-24-055', name: 'Dianne Russell', email: 'dianne.r@example.com', role: 'Teacher', status: 'Pending', regDate: '2024-11-05', avatar: 'https://i.pravatar.cc/150?u=55', phone: '+234 814 567 8901', docs: [{ name: 'Degree Certificate.pdf', size: '2.5 MB' }, { name: 'Portfolio.zip', size: '15.2 MB' }] }
  ];

  const pendingTableBody = document.getElementById('pendingTableBody');
  const pendingSearch = document.getElementById('pendingSearch');
  const filterPendingRole = document.getElementById('filterPendingRole');
  const filterPendingStatus = document.getElementById('filterPendingStatus');
  const filterPendingDate = document.getElementById('filterPendingDate');
  const totalPending = document.getElementById('totalPending');
  const selectAllPending = document.getElementById('selectAllPending');

  // Modal Elements
  const reviewModal = document.getElementById('reviewModalOverlay');
  const closeReviewBtn = document.getElementById('closeReviewBtn');
  const modalCancelBtn = document.getElementById('modalCancelBtn');
  
  function renderPending(data) {
    if (!pendingTableBody) return;
    pendingTableBody.innerHTML = '';
    
    if (data.length === 0) {
      document.getElementById('pendingTableEmptyState').classList.remove('hidden');
      document.getElementById('pendingTable').classList.add('hidden');
    } else {
      document.getElementById('pendingTableEmptyState').classList.add('hidden');
      document.getElementById('pendingTable').classList.remove('hidden');
      
      data.forEach(user => {
        let statusBadge = '';
        if (user.status === 'Pending') statusBadge = '<span class="admin-badge pending">Pending</span>';
        else if (user.status === 'Rejected') statusBadge = '<span class="admin-badge rejected">Rejected</span>';
        else statusBadge = '<span class="admin-badge approved">Approved</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
          <td><input type="checkbox" class="admin-checkbox pending-row-check"></td>
          <td>
            <div class="student-profile-cell">
              <img src="${user.avatar}" alt="${user.name}" class="student-avatar" onerror="this.src='../images/avatar-placeholder.png'">
              <div class="student-name-col">
                <span class="student-name">${user.name}</span>
              </div>
            </div>
          </td>
          <td><span style="font-family: monospace; color: rgba(255,255,255,0.7);">${user.id}</span></td>
          <td>${user.email}</td>
          <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
          <td>${user.regDate}</td>
          <td>${statusBadge}</td>
          <td>
            <div style="display: flex; gap: 4px;">
              <span class="btn-action view" style="padding: 4px 8px; font-size: 10px; border-radius: 4px;" title="View Documents">📄 ${user.docs.length}</span>
            </div>
          </td>
          <td>
            <div class="action-buttons">
              <button class="btn-action view review-btn" data-id="${user.id}" data-tooltip="Review Profile">👁️</button>
              <button class="btn-action approve" data-id="${user.id}" data-tooltip="Approve">✓</button>
              <button class="btn-action reject" data-id="${user.id}" data-tooltip="Reject">✕</button>
              <button class="btn-action suspend" data-id="${user.id}" data-tooltip="Suspend">⏸️</button>
              <button class="btn-action delete" data-id="${user.id}" data-tooltip="Delete">🗑️</button>
            </div>
          </td>
        `;
        pendingTableBody.appendChild(row);
      });
      
      // Add event listeners to review buttons
      document.querySelectorAll('.review-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const userId = btn.getAttribute('data-id');
          openReviewModal(userId);
        });
      });
    }
    
    if (totalPending) totalPending.innerText = data.length;
  }

  function filterPendingTable() {
    if (!pendingSearch || !filterPendingRole || !filterPendingStatus || !filterPendingDate) return;
    
    const searchTerm = pendingSearch.value.toLowerCase();
    const role = filterPendingRole.value;
    const status = filterPendingStatus.value;
    const date = filterPendingDate.value;

    const filtered = mockPendingUsers.filter(user => {
      const matchSearch = user.name.toLowerCase().includes(searchTerm) || 
                          user.email.toLowerCase().includes(searchTerm) || 
                          user.id.toLowerCase().includes(searchTerm);
      const matchRole = role === '' || user.role === role;
      const matchStatus = status === '' || user.status === status;
      const matchDate = date === '' || user.regDate === date;
      
      return matchSearch && matchRole && matchStatus && matchDate;
    });

    renderPending(filtered);
  }

  if (pendingSearch) pendingSearch.addEventListener('input', filterPendingTable);
  if (filterPendingRole) filterPendingRole.addEventListener('change', filterPendingTable);
  if (filterPendingStatus) filterPendingStatus.addEventListener('change', filterPendingTable);
  if (filterPendingDate) filterPendingDate.addEventListener('input', filterPendingTable);

  if (selectAllPending) {
    selectAllPending.addEventListener('change', () => {
      const checks = document.querySelectorAll('.pending-row-check');
      checks.forEach(check => check.checked = selectAllPending.checked);
    });
  }

  function openReviewModal(userId) {
    const user = mockPendingUsers.find(u => u.id === userId);
    if (!user) return;

    // Fill modal data
    document.getElementById('modalUserId').innerText = `ID: ${user.id}`;
    document.getElementById('modalProfileImg').src = user.avatar;
    document.getElementById('modalRoleIndicator').innerText = user.role;
    document.getElementById('modalFullName').innerText = user.name;
    document.getElementById('modalEmail').innerText = user.email;
    document.getElementById('modalRegDate').innerText = user.regDate;
    
    document.getElementById('detailFullName').innerText = user.name;
    document.getElementById('detailEmail').innerText = user.email;
    document.getElementById('detailPhone').innerText = user.phone;
    document.getElementById('detailRole').innerText = user.role;

    const docsList = document.getElementById('modalDocsList');
    docsList.innerHTML = '';
    user.docs.forEach(doc => {
      const docCard = document.createElement('div');
      docCard.className = 'doc-card';
      docCard.innerHTML = `
        <div class="doc-icon">📄</div>
        <div class="doc-info">
          <span class="doc-name">${doc.name}</span>
          <span class="doc-size">${doc.size}</span>
        </div>
        <button class="btn-view-doc">View</button>
      `;
      docsList.appendChild(docCard);
    });

    // Show modal
    reviewModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeReviewModal() {
    reviewModal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  if (closeReviewBtn) closeReviewBtn.addEventListener('click', closeReviewModal);
  if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeReviewModal);
  if (reviewModal) {
    reviewModal.addEventListener('click', (e) => {
      if (e.target === reviewModal) closeReviewModal();
    });
  }

  // 8. Analytics & Charts System
  const initAnalytics = () => {
    // Chart.js Global Defaults
    Chart.defaults.color = 'rgba(255, 255, 255, 0.7)';
    Chart.defaults.font.family = "'Plus Jakarta Sans', 'Inter', sans-serif";
    Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.1)';

    const chartColors = {
      blue: {
        solid: '#3b82f6',
        gradient: (ctx) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        }
      },
      emerald: {
        solid: '#10b981',
        gradient: (ctx) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.5)');
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0)');
          return gradient;
        }
      },
      purple: {
        solid: '#8b5cf6',
        gradient: (ctx) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.5)');
          gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
          return gradient;
        }
      },
      orange: {
        solid: '#f59e0b',
        gradient: (ctx) => {
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(245, 158, 11, 0.5)');
          gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
          return gradient;
        }
      }
    };

    // --- 1. Revenue Chart ---
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
      new Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [{
            label: 'Revenue (₦)',
            data: [1200000, 1500000, 1100000, 1800000, 2200000, 2100000, 2500000, 2900000, 3200000, 3800000, 4200000, 4500000],
            borderColor: chartColors.emerald.solid,
            backgroundColor: chartColors.emerald.gradient(revenueCtx.getContext('2d')),
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: chartColors.emerald.solid,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              padding: 12,
              titleFont: { size: 14, weight: 'bold' },
              bodyFont: { size: 13 },
              displayColors: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: {
                callback: value => '₦' + (value / 1000000).toFixed(1) + 'M'
              }
            },
            x: {
              grid: { display: false }
            }
          }
        }
      });
    }

    // --- 2. User Registrations Chart ---
    const regCtx = document.getElementById('registrationsChart');
    if (regCtx) {
      new Chart(regCtx, {
        type: 'bar',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
          datasets: [
            {
              label: 'Students',
              data: [120, 150, 180, 210],
              backgroundColor: chartColors.blue.solid,
              borderRadius: 6
            },
            {
              label: 'Teachers',
              data: [15, 25, 18, 32],
              backgroundColor: chartColors.purple.solid,
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { boxWidth: 12, padding: 20 } }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // --- 3. Course Distribution Chart ---
    const courseCtx = document.getElementById('courseActivityChart');
    if (courseCtx) {
      new Chart(courseCtx, {
        type: 'doughnut',
        data: {
          labels: ['Frontend', 'Backend', 'UI/UX', 'Data Science', 'Graphic Design'],
          datasets: [{
            data: [35, 25, 20, 15, 5],
            backgroundColor: [
              chartColors.blue.solid,
              chartColors.emerald.solid,
              chartColors.purple.solid,
              chartColors.orange.solid,
              '#ef4444'
            ],
            borderWidth: 0,
            hoverOffset: 15
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 8,
                padding: 15,
                usePointStyle: true
              }
            }
          }
        }
      });
    }

    // --- 4. Payment Trends Chart ---
    const paymentCtx = document.getElementById('paymentTrendsChart');
    if (paymentCtx) {
      new Chart(paymentCtx, {
        type: 'line',
        data: {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          datasets: [{
            label: 'Payments',
            data: [45, 62, 55, 78, 92, 45, 38],
            borderColor: chartColors.blue.solid,
            backgroundColor: chartColors.blue.gradient(paymentCtx.getContext('2d')),
            fill: true,
            tension: 0.4,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    }

    // --- 5. Growth Comparison Chart ---
    const growthCtx = document.getElementById('growthChart');
    if (growthCtx) {
      new Chart(growthCtx, {
        type: 'bar',
        data: {
          labels: ['Aug', 'Sep', 'Oct', 'Nov'],
          datasets: [{
            label: 'Monthly Growth',
            data: [65, 78, 82, 95],
            backgroundColor: (ctx) => {
              const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, '#3b82f6');
              gradient.addColorStop(1, '#8b5cf6');
              return gradient;
            },
            borderRadius: 20,
            barThickness: 30
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { callback: v => v + '%' }
            },
            x: { grid: { display: false } }
          }
        }
      });
    }
  };

  // Run analytics init when analytics section is visited
  const analyticsNavItem = document.querySelector('[data-target="analyticsSection"]');
  if (analyticsNavItem) {
    analyticsNavItem.addEventListener('click', () => {
      // Small delay to ensure section is visible for Chart.js to calculate dimensions
      setTimeout(initAnalytics, 100);
    }, { once: true }); // Only init once
  }

  // Handle period filter clicks
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // In a real app, this would trigger data fetch and chart update
      console.log('Filtering for:', btn.getAttribute('data-period'));
    });
  });

  // Initial render for pending
  renderPending(mockPendingUsers);
});

