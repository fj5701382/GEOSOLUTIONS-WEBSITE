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

  // Initial render
  renderTeachers(mockTeachers);
});

