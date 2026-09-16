/* ============================================================
   GEOSOLUTION — script.js
   Shared UI for public pages: navigation, stats, reveal,
   gallery lightbox, contact form. Requires site-config.js.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Navbar shadow + scroll-to-top visibility ── */
  const navbar = document.querySelector('.navbar');
  const scrollTopBtn = document.getElementById('scroll-top');
  const onScroll = () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 30);
    scrollTopBtn?.classList.toggle('visible', window.scrollY > 500);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  scrollTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });

  /* ── Desktop dropdown (click + keyboard; hover handled in CSS) ── */
  document.querySelectorAll('.nav-dropdown').forEach(dropdown => {
    const toggle = dropdown.querySelector('.nav-dropdown-toggle');
    const setOpen = open => {
      dropdown.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', () => setOpen(!dropdown.classList.contains('open')));
    dropdown.addEventListener('keydown', e => {
      if (e.key === 'Escape' && dropdown.classList.contains('open')) {
        setOpen(false);
        toggle.focus();
      }
    });
    dropdown.addEventListener('focusout', e => {
      if (!dropdown.contains(e.relatedTarget)) setOpen(false);
    });
    document.addEventListener('click', e => {
      if (!dropdown.contains(e.target)) setOpen(false);
    });
  });

  /* ── Mobile navigation panel ── */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.getElementById('mobileNav');
  const backdrop = document.getElementById('navBackdrop');
  const closeBtn = document.getElementById('mobileNavClose');

  if (hamburger && mobileNav) {
    mobileNav.inert = true;

    const openMenu = () => {
      mobileNav.inert = false;
      mobileNav.classList.add('open');
      backdrop?.classList.add('open');
      document.body.classList.add('no-scroll');
      hamburger.setAttribute('aria-expanded', 'true');
      closeBtn?.focus();
    };
    const closeMenu = (returnFocus = true) => {
      if (!mobileNav.classList.contains('open')) return;
      mobileNav.classList.remove('open');
      backdrop?.classList.remove('open');
      document.body.classList.remove('no-scroll');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileNav.inert = true;
      if (returnFocus) hamburger.focus();
    };

    hamburger.addEventListener('click', openMenu);
    closeBtn?.addEventListener('click', () => closeMenu());
    backdrop?.addEventListener('click', () => closeMenu());
    mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => closeMenu(false)));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeMenu(false); });
  }

  /* ── Statistics: single source of truth (GEOSOLUTION_STATS) ──
     The HTML already contains the final number as a no-JS fallback, so a
     stat can never get stuck at "0+". We re-apply the config value, then
     animate the count-up only when the number scrolls into view. */
  const statEls = document.querySelectorAll('[data-stat]');
  const formatStat = (el, value) => `${Number(value).toLocaleString('en-NG')}${el.dataset.suffix || ''}`;

  if (typeof GEOSOLUTION_STATS !== 'undefined') {
    statEls.forEach(el => {
      const value = GEOSOLUTION_STATS[el.dataset.stat];
      if (typeof value === 'number') {
        el.dataset.target = value;
        el.textContent = formatStat(el, value);
      }
    });
  }

  const animateCount = el => {
    const target = Number(el.dataset.target);
    if (!target || el.dataset.animated) return;
    el.dataset.animated = 'true';
    const duration = 1400;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatStat(el, Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    // Safety net: whatever happens to rAF (background tab, slow device), land on the real value
    setTimeout(() => { el.textContent = formatStat(el, target); }, duration + 1600);
  };

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    statEls.forEach(el => countObserver.observe(el));
  }

  /* ── Course fees from config (falls back to the text already in the HTML) ── */
  if (typeof geoFindCourse === 'function') {
    document.querySelectorAll('[data-course-fee]').forEach(el => {
      const course = geoFindCourse(el.dataset.courseFee);
      if (course && course.fee) el.textContent = geoFormatNaira(course.fee);
    });
  }

  /* ── Current year ── */
  document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  /* ── Reveal on scroll ── */
  const reveals = document.querySelectorAll('.reveal');
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          entry.target.style.transitionDelay = `${(i % 6) * 70}ms`;
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => revealObserver.observe(el));
    // Never leave content hidden if the observer doesn't fire
    setTimeout(() => reveals.forEach(el => el.classList.add('visible')), 3000);
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  /* ── Gallery lightbox ── */
  const galleryItems = Array.from(document.querySelectorAll('.gallery-item[data-full]'));
  if (galleryItems.length) {
    let current = 0;
    let lastFocus = null;
    const lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.hidden = true;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Photo viewer');
    lightbox.innerHTML = `
      <button class="lightbox-btn lightbox-close" type="button" aria-label="Close photo viewer"><i class="fas fa-xmark"></i></button>
      <button class="lightbox-btn lightbox-prev" type="button" aria-label="Previous photo"><i class="fas fa-chevron-left"></i></button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lightbox-btn lightbox-next" type="button" aria-label="Next photo"><i class="fas fa-chevron-right"></i></button>`;
    document.body.appendChild(lightbox);
    const lbImg = lightbox.querySelector('img');
    const lbCaption = lightbox.querySelector('figcaption');

    const show = index => {
      current = (index + galleryItems.length) % galleryItems.length;
      const item = galleryItems[current];
      const thumb = item.querySelector('img');
      lbImg.src = item.dataset.full;
      lbImg.alt = thumb ? thumb.alt : '';
      lbCaption.textContent = item.dataset.caption || (thumb ? thumb.alt : '');
    };
    const open = index => {
      lastFocus = document.activeElement;
      show(index);
      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
      lightbox.querySelector('.lightbox-close').focus();
    };
    const close = () => {
      lightbox.hidden = true;
      document.body.classList.remove('no-scroll');
      lbImg.removeAttribute('src');
      lastFocus?.focus();
    };

    galleryItems.forEach((item, i) => item.addEventListener('click', () => open(i)));
    lightbox.querySelector('.lightbox-close').addEventListener('click', close);
    lightbox.querySelector('.lightbox-prev').addEventListener('click', () => show(current - 1));
    lightbox.querySelector('.lightbox-next').addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
      if (e.key === 'Tab') {
        const buttons = Array.from(lightbox.querySelectorAll('button'));
        const idx = buttons.indexOf(document.activeElement);
        e.preventDefault();
        buttons[(idx + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length].focus();
      }
    });
    let touchX = null;
    lightbox.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    lightbox.addEventListener('touchend', e => {
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 50) show(current + (dx < 0 ? 1 : -1));
      touchX = null;
    });
  }

  /* ── Contact form ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const rules = {
      firstName: { required: 'Please enter your first name.' },
      lastName: { required: 'Please enter your last name.' },
      email: {
        required: 'Please enter your email address so we can reply.',
        test: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
        message: 'That email address doesn’t look right — please check it (e.g. name@example.com).'
      },
      phone: {
        test: v => !v || v.replace(/\D/g, '').length >= 10,
        message: 'Please enter a full phone number, e.g. 0801 234 5678.'
      },
      message: {
        required: 'Please tell us how we can help.',
        test: v => v.length >= 10,
        message: 'Your message is a little short — please add a few more details.'
      }
    };

    const validateField = input => {
      const rule = rules[input.name];
      if (!rule) return true;
      const group = input.closest('.form-group');
      const errorEl = group.querySelector('.field-error span');
      const value = input.value.trim();
      let error = '';
      if (rule.required && !value) error = rule.required;
      else if (rule.test && !rule.test(value)) error = rule.message;
      group.classList.toggle('has-error', Boolean(error));
      input.setAttribute('aria-invalid', String(Boolean(error)));
      if (errorEl) errorEl.textContent = error;
      return !error;
    };

    contactForm.querySelectorAll('input, textarea').forEach(input => {
      input.addEventListener('blur', () => { if (input.value.trim()) validateField(input); });
      input.addEventListener('input', () => {
        if (input.closest('.form-group').classList.contains('has-error')) validateField(input);
      });
    });

    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const fields = Array.from(contactForm.querySelectorAll('input[name], textarea[name]'));
      const results = fields.map(validateField);
      if (results.includes(false)) {
        fields[results.indexOf(false)].focus();
        return;
      }

      const data = Object.fromEntries(new FormData(contactForm).entries());
      const summary = [
        `Hello Geosolution, my name is ${data.firstName} ${data.lastName}.`,
        data.service ? `I'm interested in: ${data.service}.` : '',
        data.message,
        `Email: ${data.email}${data.phone ? ` | Phone: ${data.phone}` : ''}`
      ].filter(Boolean).join('\n\n');

      /* No message-delivery backend exists yet, so the confirmation hands the
         prepared message to WhatsApp or email rather than pretending it was sent.
         When an API endpoint is available, POST `data` to it here. */
      const success = document.getElementById('contactSuccess');
      success.querySelector('[data-contact-name]').textContent = data.firstName;
      success.querySelector('[data-contact-whatsapp]').href = GEOSOLUTION_CONTACT.whatsappLink(summary);
      success.querySelector('[data-contact-email]').href =
        `mailto:${GEOSOLUTION_CONTACT.emails[0]}?subject=${encodeURIComponent('Enquiry from ' + data.firstName + ' ' + data.lastName)}&body=${encodeURIComponent(summary)}`;
      contactForm.hidden = true;
      success.hidden = false;
      success.focus();
    });

    document.getElementById('contactReset')?.addEventListener('click', () => {
      contactForm.reset();
      contactForm.hidden = false;
      document.getElementById('contactSuccess').hidden = true;
      contactForm.querySelector('input').focus();
    });
  }
});
