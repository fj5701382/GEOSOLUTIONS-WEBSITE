/* ============================================================
   GEOSOLUTION — register-wizard.js
   Multi-step student registration (pages/register2.html).
   Requires: site-config.js, mockUsers.js, auth.js

   On submit the student account is saved through the existing
   GeoAuth user store (status "pending", awaiting admin approval),
   using the generated GEO-YYYY-XXXXX reference as the login ID.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registrationForm');
  if (!form) return;

  const TOTAL_STEPS = 6;
  const STEP_TITLES = ['Personal Information', 'Contact Information', 'Academic Information',
    'Program / Course Selection', 'Parent / Guardian Information', 'Review & Submit'];
  const DRAFT_KEY = 'geo_registration_draft';

  const steps = Array.from(form.querySelectorAll('.form-step'));
  const progress = document.querySelector('.step-progress');
  const progressItems = Array.from(progress.querySelectorAll('.step'));
  const stepStatus = document.getElementById('stepStatus');
  const formAlert = document.getElementById('formAlert');
  const card = document.getElementById('registerCard');
  const $ = id => document.getElementById(id);

  let currentStep = 1;
  let photoData = null;

  /* ── Helpers ── */
  const digitsOnly = v => (v || '').replace(/\D/g, '');

  // Accepts 08012345678, 8012345678, +2348012345678, 2348012345678
  const nationalNumber = value => {
    let d = digitsOnly(value);
    if (d.startsWith('234')) d = d.slice(3);
    if (d.startsWith('0')) d = d.slice(1);
    return d.slice(0, 10);
  };
  const formatPhone = value => {
    const d = nationalNumber(value);
    return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean).join(' ');
  };
  const isValidPhone = value => /^[789][01]\d{8}$/.test(nationalNumber(value));

  const ageFromDob = value => {
    if (!value) return null;
    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--;
    return age;
  };
  const isMinor = () => {
    const age = ageFromDob($('dob').value);
    return age !== null && age < 18;
  };

  const setError = (name, message) => {
    const input = form.elements[name];
    const el = input instanceof RadioNodeList ? input[0] : input;
    const group = el.closest('.form-group');
    group.classList.toggle('has-error', Boolean(message));
    group.querySelector('.field-error span').textContent = message || '';
    if (input instanceof RadioNodeList) {
      input.forEach(r => r.setAttribute('aria-invalid', String(Boolean(message))));
    } else {
      el.setAttribute('aria-invalid', String(Boolean(message)));
    }
    return !message;
  };

  /* ── Validation rules (human-readable messages) ── */
  const validators = {
    fullName: v => {
      if (!v.trim()) return 'Full name is required.';
      if (v.trim().split(/\s+/).length < 2) return 'Please enter both your first name and surname.';
      return '';
    },
    dob: v => {
      if (!v) return '';
      const age = ageFromDob(v);
      if (age === null || age < 5 || age > 100) return 'Please check the date of birth — it doesn’t look right.';
      return '';
    },
    phone: v => {
      if (!digitsOnly(v)) return 'Phone number is required.';
      if (!isValidPhone(v)) return 'Please enter a valid Nigerian mobile number, e.g. 0801 234 5678.';
      return '';
    },
    email: v => {
      if (!v.trim()) return 'Email address is required.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())) return 'Please enter a valid email address, e.g. name@example.com.';
      const exists = GeoAuth.getUsers().some(u => (u.email || '').toLowerCase() === v.trim().toLowerCase());
      if (exists) return 'An account with this email already exists. Try logging in to the Student Portal instead.';
      return '';
    },
    password: v => {
      if (!v) return 'Please create a password for the student portal.';
      if (v.length < 6) return 'Your password needs at least 6 characters.';
      return '';
    },
    confirmPassword: v => {
      if (!v) return 'Please type your password again to confirm it.';
      if (v !== $('password').value) return 'The passwords don’t match. Please re-type them.';
      return '';
    },
    programCategory: v => (v ? '' : 'Please choose a program category.'),
    course: v => (v ? '' : 'Please choose the course you want to register for.'),
    schedule: () => (form.elements.schedule.value ? '' : 'Please choose your preferred schedule.'),
    guardianName: v => (isMinor() && !v.trim() ? 'Parent or guardian name is required for students under 18.' : ''),
    guardianPhone: v => {
      if (!digitsOnly(v)) return isMinor() ? 'Parent or guardian phone number is required for students under 18.' : '';
      return isValidPhone(v) ? '' : 'Please enter a valid Nigerian mobile number for the parent or guardian.';
    },
    confirmInfo: () => ($('confirmInfo').checked ? '' : 'Please tick the box to confirm your information is correct.')
  };

  const validateField = name => {
    const validator = validators[name];
    if (!validator) return true;
    const input = form.elements[name];
    const value = input instanceof RadioNodeList ? input.value : input.value;
    return setError(name, validator(value));
  };

  const fieldsInStep = n => {
    const names = new Set();
    steps[n - 1].querySelectorAll('input[name], select[name], textarea[name]').forEach(el => names.add(el.name));
    return Array.from(names).filter(name => validators[name]);
  };

  const validateStep = n => {
    const names = fieldsInStep(n);
    const results = names.map(validateField);
    const firstInvalid = names[results.indexOf(false)];
    if (firstInvalid) {
      const el = form.elements[firstInvalid];
      (el instanceof RadioNodeList ? el[0] : el).focus();
      const count = results.filter(r => !r).length;
      showAlert(count === 1 ? 'Please fix the highlighted field before continuing.' : `Please fix the ${count} highlighted fields before continuing.`);
      return false;
    }
    hideAlert();
    return true;
  };

  function showAlert(message) {
    formAlert.querySelector('span').textContent = message;
    formAlert.hidden = false;
  }
  function hideAlert() { formAlert.hidden = true; }

  /* ── Step navigation ── */
  const goToStep = (n, { focus = true } = {}) => {
    currentStep = Math.min(Math.max(n, 1), TOTAL_STEPS);
    steps.forEach((step, i) => step.classList.toggle('active', i === currentStep - 1));
    progressItems.forEach((item, i) => {
      item.classList.toggle('active', i === currentStep - 1);
      item.classList.toggle('done', i < currentStep - 1);
      if (i === currentStep - 1) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
    });
    progress.style.setProperty('--progress', (currentStep - 1) / (TOTAL_STEPS - 1));
    stepStatus.textContent = `Step ${currentStep} of ${TOTAL_STEPS}: ${STEP_TITLES[currentStep - 1]}`;
    if (currentStep === 5) updateGuardianRequirement();
    if (currentStep === TOTAL_STEPS) renderReview();
    hideAlert();
    if (focus) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      steps[currentStep - 1].querySelector('legend').setAttribute('tabindex', '-1');
      steps[currentStep - 1].querySelector('legend').focus({ preventScroll: true });
    }
    saveDraft();
  };

  form.addEventListener('click', e => {
    if (e.target.closest('.btn-next')) {
      if (validateStep(currentStep)) goToStep(currentStep + 1);
    } else if (e.target.closest('.btn-back')) {
      goToStep(currentStep - 1);
    } else if (e.target.closest('[data-edit-step]')) {
      goToStep(Number(e.target.closest('[data-edit-step]').dataset.editStep));
    }
  });

  // Enter key moves to the next step instead of submitting the whole form early
  form.addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && currentStep < TOTAL_STEPS) {
      e.preventDefault();
      if (validateStep(currentStep)) goToStep(currentStep + 1);
    }
  });

  /* ── Live validation ── */
  form.addEventListener('focusout', e => {
    const name = e.target.name;
    if (name && validators[name] && e.target.value && name !== 'email') validateField(name);
    if (name === 'email' && e.target.value) validateField('email');
  });
  form.addEventListener('input', e => {
    const name = e.target.name;
    const group = e.target.closest('.form-group');
    if (name && group && group.classList.contains('has-error')) validateField(name);
  });
  form.addEventListener('change', e => {
    if (e.target.name === 'schedule' || e.target.name === 'confirmInfo') validateField(e.target.name);
    saveDraft();
  });

  /* ── Phone auto-format ── */
  ['phone', 'guardianPhone'].forEach(id => {
    const input = $(id);
    input.addEventListener('input', () => {
      const atEnd = input.selectionStart === input.value.length;
      input.value = formatPhone(input.value);
      if (atEnd) input.setSelectionRange(input.value.length, input.value.length);
    });
    input.addEventListener('paste', () => setTimeout(() => { input.value = formatPhone(input.value); }, 0));
  });

  /* ── Show / hide password ── */
  form.querySelectorAll('.password-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = $(btn.dataset.toggle);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      btn.querySelector('i').className = `fas ${show ? 'fa-eye-slash' : 'fa-eye'}`;
    });
  });

  /* ── Program category → course list ── */
  const categorySelect = $('programCategory');
  const courseSelect = $('course');
  Object.entries(GEOSOLUTION_CATEGORIES).forEach(([value, label]) => {
    categorySelect.add(new Option(label, value));
  });
  const populateCourses = (category, selected) => {
    courseSelect.innerHTML = '';
    if (!category) {
      courseSelect.add(new Option('Choose a category first…', ''));
      courseSelect.disabled = true;
      return;
    }
    courseSelect.add(new Option('Select a course…', ''));
    GEOSOLUTION_COURSES.filter(c => c.category === category)
      .forEach(c => courseSelect.add(new Option(c.name, c.id, false, c.id === selected)));
    courseSelect.disabled = false;
  };
  categorySelect.addEventListener('change', () => {
    populateCourses(categorySelect.value);
    if (categorySelect.closest('.form-group').classList.contains('has-error')) validateField('programCategory');
  });

  /* ── Guardian requirement depends on age ── */
  function updateGuardianRequirement() {
    const minor = isMinor();
    $('guardianDesc').textContent = minor
      ? 'The student is under 18, so a parent or guardian’s name and phone number are required.'
      : 'Optional for students aged 18 and above, but helpful in case we need to reach someone.';
    document.querySelectorAll('[data-guardian-optional]').forEach(el => { el.hidden = minor; });
    document.querySelectorAll('[data-guardian-required]').forEach(el => { el.hidden = !minor; });
    const nameLabel = document.querySelector('label[for="guardianName"]');
    nameLabel.querySelector('.optional').hidden = minor;
    let star = nameLabel.querySelector('.req');
    if (minor && !star) {
      star = document.createElement('span');
      star.className = 'req';
      star.setAttribute('aria-hidden', 'true');
      star.textContent = '*';
      nameLabel.appendChild(star);
    } else if (!minor && star) {
      star.remove();
    }
    $('guardianName').required = minor;
    $('guardianPhone').required = minor;
  }

  /* ── Passport photo (resized in the browser to keep storage small) ── */
  const photoInput = $('passportPhoto');
  const photoPreview = $('photoPreview');
  const removePhotoBtn = $('removePhoto');
  photoInput.addEventListener('change', () => {
    const file = photoInput.files[0];
    setError('passportPhoto', '');
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      photoInput.value = '';
      return setError('passportPhoto', 'Please choose a JPG or PNG image.');
    }
    if (file.size > 5 * 1024 * 1024) {
      photoInput.value = '';
      return setError('passportPhoto', 'That photo is larger than 5MB. Please choose a smaller image.');
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 400 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.82);
        photoPreview.innerHTML = '';
        const preview = new Image();
        preview.src = photoData;
        preview.alt = 'Passport photo preview';
        photoPreview.appendChild(preview);
        $('photoBtnText').textContent = 'Change photo';
        removePhotoBtn.hidden = false;
      };
      img.onerror = () => setError('passportPhoto', 'We couldn’t read that image. Please try a different photo.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
  removePhotoBtn.addEventListener('click', () => {
    photoData = null;
    photoInput.value = '';
    photoPreview.innerHTML = '<i class="fas fa-user"></i>';
    $('photoBtnText').textContent = 'Upload photo';
    removePhotoBtn.hidden = true;
  });

  /* ── Review summary ── */
  const text = value => (value && String(value).trim()) || '—';
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

  function collectData() {
    const f = form.elements;
    const course = geoFindCourse(f.course.value);
    return {
      fullName: f.fullName.value.trim().replace(/\s+/g, ' '),
      dob: f.dob.value,
      gender: f.gender.value,
      phone: digitsOnly(f.phone.value) ? '+234' + nationalNumber(f.phone.value) : '',
      email: f.email.value.trim(),
      address: f.address.value.trim(),
      stateOfOrigin: f.stateOfOrigin.value,
      lga: f.lga.value.trim(),
      school: f.school.value.trim(),
      classLevel: f.classLevel.value,
      examYear: f.examYear.value,
      programCategory: f.programCategory.value,
      courseId: f.course.value,
      courseName: course ? course.name : '',
      schedule: f.schedule.value,
      heardAbout: f.heardAbout.value,
      guardianName: f.guardianName.value.trim(),
      guardianPhone: digitsOnly(f.guardianPhone.value) ? '+234' + nationalNumber(f.guardianPhone.value) : '',
      relationship: f.relationship.value
    };
  }

  function renderReview() {
    const d = collectData();
    const dobText = d.dob ? new Date(d.dob).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    const sections = [
      [1, 'Personal Information', [['Full Name', d.fullName], ['Date of Birth', dobText], ['Gender', d.gender], ['Passport Photo', photoData ? 'Uploaded' : 'Not provided']]],
      [2, 'Contact Information', [['Phone', d.phone], ['Email', d.email], ['Address', d.address], ['State of Origin', d.stateOfOrigin], ['LGA', d.lga]]],
      [3, 'Academic Information', [['School', d.school], ['Class / Level', d.classLevel], ['Exam Year', d.examYear]]],
      [4, 'Program', [['Category', GEOSOLUTION_CATEGORIES[d.programCategory]], ['Course', d.courseName], ['Schedule', d.schedule], ['Heard About Us', d.heardAbout]]],
      [5, 'Parent / Guardian', [['Name', d.guardianName], ['Phone', d.guardianPhone], ['Relationship', d.relationship]]]
    ];
    $('reviewSummary').innerHTML = sections.map(([step, title, rows]) => `
      <section class="review-section" aria-label="${title}">
        <div class="review-section-head">
          <h3>${title}</h3>
          <button type="button" class="review-edit" data-edit-step="${step}" aria-label="Edit ${title}"><i class="fas fa-pen" aria-hidden="true"></i> Edit</button>
        </div>
        <dl class="review-list">
          ${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(text(value))}</dd></div>`).join('')}
        </dl>
      </section>`).join('');
  }

  /* ── Draft (so a dropped connection doesn't lose progress). Passwords & photos are never saved. ── */
  function saveDraft() {
    try {
      const draft = collectData();
      draft.step = currentStep;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (_) { /* storage unavailable */ }
  }
  function restoreDraft() {
    let draft = null;
    try { draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null'); } catch (_) { draft = null; }
    const params = new URLSearchParams(window.location.search);
    const preselect = geoFindCourse(params.get('course'));

    if (draft) {
      const f = form.elements;
      ['fullName', 'dob', 'gender', 'email', 'address', 'stateOfOrigin', 'lga', 'school', 'classLevel',
        'examYear', 'heardAbout', 'guardianName', 'relationship'].forEach(key => {
        if (draft[key]) f[key].value = draft[key];
      });
      if (draft.phone) f.phone.value = formatPhone(draft.phone);
      if (draft.guardianPhone) f.guardianPhone.value = formatPhone(draft.guardianPhone);
      if (draft.schedule) f.schedule.value = draft.schedule;
      if (draft.programCategory) {
        f.programCategory.value = draft.programCategory;
        populateCourses(draft.programCategory, draft.courseId);
      }
    }
    if (preselect) {
      categorySelect.value = preselect.category;
      populateCourses(preselect.category, preselect.id);
    }
  }

  /* ── Submit ── */
  const generateReference = () => {
    const year = new Date().getFullYear();
    const taken = new Set(GeoAuth.getUsers().map(u => u.identifier));
    let ref;
    do {
      ref = `GEO-${year}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;
    } while (taken.has(ref));
    return ref;
  };

  form.addEventListener('submit', e => {
    e.preventDefault();
    // Re-check every step in case something changed after it was completed
    for (let n = 1; n <= TOTAL_STEPS; n++) {
      if (!validateStep(n)) {
        if (n !== currentStep) goToStep(n);
        validateStep(n);
        return;
      }
    }

    const submitBtn = form.querySelector('.btn-submit');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Submitting…';

    const data = collectData();
    const reference = generateReference();
    const newUser = {
      id: GeoAuth.generateId('student'),
      role: 'student',
      fullName: data.fullName,
      identifier: reference,
      email: data.email,
      password: $('password').value,
      status: 'pending',
      createdAt: new Date().toISOString(),
      avatar: GeoAuth.getInitials(data.fullName),
      phoneNumber: data.phone,
      department: data.courseName,
      program: data.courseId,
      registration: data,
      ...(photoData && { profileImage: photoData })
    };

    try {
      const users = GeoAuth.getUsers();
      users.push(newUser);
      GeoAuth.saveUsers(users);
    } catch (err) {
      // Most likely storage is full because of the photo — retry without it
      try {
        delete newUser.profileImage;
        const users = GeoAuth.getUsers();
        users.push(newUser);
        GeoAuth.saveUsers(users);
      } catch (_) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Submit Registration';
        showAlert('Sorry, we couldn’t save your registration on this device. Please try again, or contact us on WhatsApp.');
        return;
      }
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
      localStorage.setItem('geo_last_registration', JSON.stringify({ reference, fullName: data.fullName, courseId: data.courseId }));
    } catch (_) { /* non-critical */ }

    const success = $('registerSuccess');
    success.querySelector('[data-success-name]').textContent = data.fullName.split(' ')[0];
    $('referenceNumber').textContent = reference;
    $('proceedToPayment').href = `payment.html?ref=${encodeURIComponent(reference)}`;
    card.hidden = true;
    success.hidden = false;
    success.scrollIntoView({ behavior: 'smooth', block: 'start' });
    success.focus({ preventScroll: true });
  });

  $('copyReference').addEventListener('click', async () => {
    const btn = $('copyReference');
    const ref = $('referenceNumber').textContent;
    try {
      await navigator.clipboard.writeText(ref);
      btn.innerHTML = '<i class="fas fa-check" aria-hidden="true"></i> Copied!';
    } catch (_) {
      btn.innerHTML = `<i class="fas fa-copy" aria-hidden="true"></i> ${ref}`;
    }
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy" aria-hidden="true"></i> Copy Reference'; }, 2500);
  });

  restoreDraft();
  goToStep(1, { focus: false });
});
