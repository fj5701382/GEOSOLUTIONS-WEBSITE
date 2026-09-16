/* ============================================================
   GEOSOLUTION — site-config.js
   SINGLE SOURCE OF TRUTH for numbers, contact details and the
   course catalogue. Every page reads from this file.

   To change a statistic, fee or phone number, edit it HERE only.
   (The numbers written into the HTML are a no-JavaScript fallback;
   script.js overwrites them with the values below on page load.)
   ============================================================ */

/* ── Headline statistics ──
   ⚠ Confirm these with management before publishing changes. */
const GEOSOLUTION_STATS = {
  studentsTrainedCount: 6000,
  techGraduatesCount: 300,
  foundedYear: 2012,            // Operations began 22 October 2012
  examPassRate: 95,             // %
  techJobPlacementRate: 90,     // % — GeoTech Academy page
  monthsToJobReady: 6,          // GeoTech Academy page
  get yearsOfOperation() {
    return new Date().getFullYear() - this.foundedYear;
  },
  get coursesOffered() {
    return GEOSOLUTION_COURSES.length;
  },
  get techProgramsCount() {
    return GEOSOLUTION_COURSES.filter(c => c.category === 'tech').length;
  }
};

/* ── Contact details ── */
const GEOSOLUTION_CONTACT = {
  whatsapp: '2347014673935',
  phones: ['+2347014673935', '+2347061054873'],
  emails: ['Geoslutions360@gmail.com', 'Geotechacademy@gmail.com'],
  address: '12, Abayomi Street, Opposite Abeokuta Mosques, Irawo Ajegunle, Ikorodu Road, Lagos',
  whatsappLink(message) {
    const base = `https://wa.me/${this.whatsapp}`;
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  }
};

/* ── Payments ──
   defaultAmount is used when a course has no fee set below.
   It matches the ₦15,000 portal-access fee used in the student dashboard. */
const GEOSOLUTION_PAYMENT = {
  currency: 'NGN',
  defaultAmount: 15000,
  // Paystack PUBLIC key (pk_live_… / pk_test_…). Leave empty to keep payment.html in demo mode.
  paystackPublicKey: ''
};

/* ── Course catalogue ──
   category: 'academic' | 'tech' | 'consultancy'
   page:     course page path relative to /pages/ (null = no dedicated page yet)
   fee:      tuition in Naira, or null to show "Contact us for current fees"
   duration: null when not yet confirmed */
const GEOSOLUTION_COURSES = [
  // Academic
  { id: 'jamb',        name: 'JAMB / UTME Preparation',       category: 'academic',    page: 'courses/jamb-preparation.html',     fee: null, duration: null },
  { id: 'waec-neco',   name: 'WAEC / NECO / GCE Coaching',    category: 'academic',    page: 'courses/waec-neco.html',            fee: null, duration: null },
  { id: 'cbt',         name: 'CBT Training',                  category: 'academic',    page: 'courses/cbt-training.html',         fee: null, duration: null },
  { id: 'ielts',       name: 'IELTS / TOEFL Training',        category: 'academic',    page: 'courses/ielts-training.html',       fee: null, duration: null },
  { id: 'tutoring',    name: 'Online & Private Tutoring',     category: 'academic',    page: null,                                fee: null, duration: null },
  // Tech (GeoTech Academy)
  { id: 'computer-foundation', name: 'Computer Foundation Class',  category: 'tech', page: null,                                 fee: null, duration: null },
  { id: 'web-development',     name: 'Web Development',            category: 'tech', page: 'courses/web-development.html',      fee: null, duration: '6 Months' },
  { id: 'mobile-apps',         name: 'Mobile App Development',     category: 'tech', page: null,                                 fee: null, duration: '6 Months' },
  { id: 'graphics-design',     name: 'Graphics Design',            category: 'tech', page: 'courses/graphics-design.html',      fee: null, duration: null },
  { id: 'ui-ux-design',        name: 'UI/UX Design',               category: 'tech', page: 'courses/ui-ux-design.html',         fee: null, duration: '3 Months' },
  { id: 'data-analytics',      name: 'Data Analytics',             category: 'tech', page: 'courses/data-analytics.html',       fee: null, duration: '4 Months' },
  { id: 'cybersecurity',       name: 'Cybersecurity',              category: 'tech', page: 'courses/cybersecurity.html',        fee: null, duration: '4 Months' },
  { id: 'digital-marketing',   name: 'Digital Marketing',          category: 'tech', page: 'courses/digital-marketing.html',    fee: null, duration: '3 Months' },
  { id: 'networking',          name: 'Networking & IT Support',    category: 'tech', page: null,                                 fee: null, duration: '3 Months' },
  { id: 'video-production',    name: 'Video Production & Editing', category: 'tech', page: null,                                 fee: null, duration: '2 Months' },
  { id: 'crypto',              name: 'Cryptocurrency Trading',     category: 'tech', page: null,                                 fee: null, duration: null },
  // Consultancy
  { id: 'admission-processing', name: 'Admission Processing',      category: 'consultancy', page: 'courses/admission-processing.html', fee: null, duration: null },
  { id: 'consultancy',          name: 'Educational Consultancy',   category: 'consultancy', page: null,                                fee: null, duration: null }
];

const GEOSOLUTION_CATEGORIES = {
  academic: 'Academic Training',
  tech: 'Tech Training (GeoTech Academy)',
  consultancy: 'Educational Consultancy'
};

function geoFormatNaira(amount) {
  return '₦' + Number(amount).toLocaleString('en-NG');
}

function geoFindCourse(idOrName) {
  if (!idOrName) return null;
  const key = String(idOrName).toLowerCase();
  return GEOSOLUTION_COURSES.find(c => c.id === key || c.name.toLowerCase() === key) || null;
}
