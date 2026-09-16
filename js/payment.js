/* ============================================================
   GEOSOLUTION — payment.js
   Payment page UI (pages/payment.html).
   Requires: site-config.js, mockUsers.js, auth.js

   ⚠ No payment gateway is connected yet. Until
   GEOSOLUTION_PAYMENT.paystackPublicKey is set, the page runs in
   clearly-labelled DEMO MODE and simulates the result.
   Server-side verification lives in php/api/verify_payment.php.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const $ = id => document.getElementById(id);
  const HISTORY_KEY = 'geoPaymentHistory';     // shared with the student dashboard
  const NEXT_DATE_KEY = 'geoNextPaymentDate';  // shared with the student dashboard

  const lookupForm = $('paymentLookup');
  const body = $('paymentBody');
  const payBtn = $('payNowBtn');
  const transferInfo = $('transferInfo');
  const gatewayReady = Boolean(GEOSOLUTION_PAYMENT.paystackPublicKey);

  let student = null;

  $('demoNotice').hidden = gatewayReady;

  const readJSON = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch (_) { return fallback; }
  };

  const findStudent = ref => {
    if (!ref) return null;
    const user = GeoAuth.getUsers().find(u => u.role === 'student' && (u.identifier || '').toLowerCase() === ref.trim().toLowerCase());
    return user || null;
  };

  const amountFor = user => {
    const course = geoFindCourse(user.program || user.department);
    return {
      course,
      amount: (course && course.fee) || GEOSOLUTION_PAYMENT.defaultAmount
    };
  };

  const statusFor = user => {
    const history = readJSON(HISTORY_KEY, []).filter(p => p.studentRef === user.identifier);
    const latest = history[0];
    if (latest && latest.status === 'pending') return { label: 'Pending Confirmation', cls: 'status-pending' };
    if (latest && latest.status === 'success') {
      const next = Number(localStorage.getItem(NEXT_DATE_KEY));
      if (next && next < Date.now()) return { label: 'Overdue', cls: 'status-overdue' };
      return { label: 'Paid', cls: 'status-paid' };
    }
    return { label: 'Unpaid', cls: 'status-unpaid' };
  };

  const setStatusBadge = (el, status) => {
    el.className = `status-badge ${status.cls}`;
    el.textContent = status.label;
  };

  const showStudent = user => {
    student = user;
    const { course, amount } = amountFor(user);
    $('payStudentName').textContent = user.fullName;
    $('payRefNumber').textContent = user.identifier;
    $('payProgram').textContent = course ? course.name : (user.department || 'Portal access');
    $('payAmount').textContent = geoFormatNaira(amount);
    document.querySelectorAll('[data-ref-copy]').forEach(el => { el.textContent = user.identifier; });
    setStatusBadge($('payStatus'), statusFor(user));
    lookupForm.hidden = true;
    body.hidden = false;
    updateButton();
  };

  const updateButton = () => {
    if (!student) return;
    const method = document.querySelector('input[name="payMethod"]:checked').value;
    const amount = geoFormatNaira(amountFor(student).amount);
    transferInfo.hidden = method !== 'transfer';
    payBtn.innerHTML = method === 'transfer'
      ? '<i class="fas fa-paper-plane" aria-hidden="true"></i> I’ve Made the Transfer'
      : `<i class="fas fa-lock" aria-hidden="true"></i> Pay ${amount} Now`;
  };
  document.querySelectorAll('input[name="payMethod"]').forEach(r => r.addEventListener('change', updateButton));

  /* ── Work out who is paying: ?ref=, logged-in student, or last registration on this device ── */
  const params = new URLSearchParams(window.location.search);
  const session = GeoAuth.getCurrentUser();
  const last = readJSON('geo_last_registration', null);
  const initial = findStudent(params.get('ref'))
    || (session && session.role === 'student' ? findStudent(session.identifier) || session : null)
    || (last ? findStudent(last.reference) : null);
  if (initial) showStudent(initial);
  else if (params.get('ref')) $('lookupRef').value = params.get('ref');

  lookupForm.addEventListener('submit', e => {
    e.preventDefault();
    const input = $('lookupRef');
    const group = input.closest('.form-group');
    const errorText = group.querySelector('.field-error span');
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'Please enter your reference number.';
    else if (!findStudent(value)) message = 'We couldn’t find that reference number. Check it matches the one you got when you registered (e.g. GEO-2026-12345).';
    group.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', String(Boolean(message)));
    errorText.textContent = message;
    if (message) return input.focus();
    showStudent(findStudent(value));
  });

  $('changeStudent').addEventListener('click', () => {
    student = null;
    body.hidden = true;
    lookupForm.hidden = false;
    $('lookupRef').value = '';
    $('lookupRef').focus();
  });

  /* ── Pay ── */
  const txnRef = () => `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

  const recordPayment = (reference, method, status) => {
    const { course, amount } = amountFor(student);
    const entry = {
      reference,
      studentRef: student.identifier,
      email: student.email,
      amount,
      program: course ? course.name : (student.department || ''),
      method,
      date: new Date().toISOString(),
      status
    };
    try {
      const history = readJSON(HISTORY_KEY, []);
      history.unshift(entry);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      if (status === 'success') {
        const next = new Date();
        next.setDate(next.getDate() + 30);
        localStorage.setItem(NEXT_DATE_KEY, String(next.getTime()));
      }
    } catch (_) { /* storage unavailable — receipt still shows */ }
    return entry;
  };

  const showReceipt = entry => {
    const pending = entry.status === 'pending';
    $('successIcon').innerHTML = `<i class="fas ${pending ? 'fa-hourglass-half' : 'fa-check'}"></i>`;
    $('successIcon').style.color = '';
    $('successTitle').textContent = pending ? 'Transfer Submitted' : 'Payment Successful!';
    $('successText').textContent = pending
      ? 'Thank you. Our accounts team will confirm your transfer and update your status. Keep this receipt for your records.'
      : 'Your payment has been received. Keep this receipt for your records.';
    $('rcptTxn').textContent = entry.reference;
    $('rcptAmount').textContent = geoFormatNaira(entry.amount);
    $('rcptProgram').textContent = entry.program || '—';
    $('rcptStudent').textContent = student.fullName;
    $('rcptRef').textContent = student.identifier;
    $('rcptMethod').textContent = entry.method === 'transfer' ? 'Bank Transfer' : 'Card';
    $('rcptDate').textContent = new Date(entry.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    setStatusBadge($('rcptStatus'), pending ? { label: 'Pending Confirmation', cls: 'status-pending' } : { label: 'Paid', cls: 'status-paid' });
    $('paymentCard').hidden = true;
    const success = $('paymentSuccess');
    success.hidden = false;
    success.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setLoading = loading => {
    payBtn.disabled = loading;
    if (loading) payBtn.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Processing…';
    else updateButton();
  };

  payBtn.addEventListener('click', () => {
    if (!student) return;
    const method = document.querySelector('input[name="payMethod"]:checked').value;

    if (method === 'transfer') {
      setLoading(true);
      setTimeout(() => showReceipt(recordPayment(txnRef(), 'transfer', 'pending')), 600);
      return;
    }

    if (gatewayReady && window.PaystackPop) {
      const { amount } = amountFor(student);
      const reference = txnRef();
      setLoading(true);
      PaystackPop.setup({
        key: GEOSOLUTION_PAYMENT.paystackPublicKey,
        email: student.email,
        amount: amount * 100,
        currency: GEOSOLUTION_PAYMENT.currency,
        ref: reference,
        callback: () => {
          // TODO (backend): confirm with php/api/verify_payment.php?reference=... before marking as paid
          showReceipt(recordPayment(reference, 'card', 'success'));
        },
        onClose: () => setLoading(false)
      }).openIframe();
      return;
    }

    // Demo mode: simulate a successful card payment
    setLoading(true);
    setTimeout(() => showReceipt(recordPayment(txnRef(), 'card', 'success')), 1200);
  });

  if (gatewayReady) {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    document.head.appendChild(script);
  }

  $('downloadReceipt').addEventListener('click', () => window.print());
});
