/* ============================================================
   GEOSOLUTION — script.js
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  /* ── Navbar scroll effect ── */
  const navbar = document.querySelector('.navbar');
  window.addEventListener('scroll', () => {
    navbar?.classList.toggle('scrolled', window.scrollY > 30);
    scrollTopBtn?.classList.toggle('visible', window.scrollY > 400);
  });

  /* ── Mobile menu toggle ── Enhanced with overlay, no-scroll, ESC close */
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const body = document.body;

  const backdrop = document.getElementById('navBackdrop');
  const closeBtn = document.getElementById('mobileNavClose');

  const openMenu = () => {
    hamburger.classList.add('open');
    mobileNav?.classList.add('open');
    backdrop?.classList.add('open');
    body.classList.add('no-scroll');
    hamburger.setAttribute('aria-expanded', 'true');
  };

  const closeMenu = () => {
    hamburger.classList.remove('open');
    mobileNav?.classList.remove('open');
    backdrop?.classList.remove('open');
    body.classList.remove('no-scroll');
    hamburger.setAttribute('aria-expanded', 'false');
  };

  const toggleMenu = () => {
    hamburger.classList.contains('open') ? closeMenu() : openMenu();
  };

  hamburger?.addEventListener('click', toggleMenu);
  closeBtn?.addEventListener('click', closeMenu);
  backdrop?.addEventListener('click', closeMenu);

  // Close on link click
  mobileNav?.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Close on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── Active nav link ── */
  const navLinks  = document.querySelectorAll('.nav-menu a');
  const current   = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });

  /* ── Scroll-to-top ── */
  const scrollTopBtn = document.getElementById('scroll-top');
  scrollTopBtn?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ── Reveal on scroll (IntersectionObserver) ── 
     Note: Main reveal animation is handled by main.js initScrollAnimations()
     This is a fallback for any elements not caught by main.js ── */
  const reveals = document.querySelectorAll('.reveal:not(.visible)');
  if (reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e, i) => {
        if (e.isIntersecting) {
          e.target.style.transitionDelay = `${(i % 6) * 80}ms`;
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  }

  /* ── Count-up animation for stat numbers ── */
  function animateCount(el, target, suffix = '') {
    let current = 0;
    const increment = target / 60;
    const update = () => {
      current += increment;
      if (current < target) {
        el.textContent = Math.floor(current) + suffix;
        requestAnimationFrame(update);
      } else {
        el.textContent = target + suffix;
      }
    };
    requestAnimationFrame(update);
  }

  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el     = e.target;
          const target = parseInt(el.dataset.count);
          const suffix = el.dataset.suffix || '';
          animateCount(el, target, suffix);
          countIO.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(c => countIO.observe(c));
  }

  /* ── Contact form submit handler ── */
  const contactForm = document.getElementById('contactForm');
  contactForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn  = contactForm.querySelector('button[type="submit"]');
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending…';
    btn.disabled  = true;

    setTimeout(() => {
      btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
      btn.style.background = '#22c55e';
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.style.background = '';
        btn.disabled  = false;
        contactForm.reset();
      }, 3000);
    }, 1500);
  });

  /* ── Smooth hover tilt on service cards ── */
  document.querySelectorAll('.service-card, .testi-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-8px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  /* ── Search bar focus effect ── */
  const searchInput = document.querySelector('.hero-search input');
  const searchWrap  = document.querySelector('.hero-search');
  searchInput?.addEventListener('focus', () => {
    searchWrap?.style.setProperty('box-shadow', '0 0 0 3px rgba(46,196,182,.25), 0 20px 60px rgba(26,35,50,.12)');
  });
  searchInput?.addEventListener('blur', () => {
    searchWrap?.style.removeProperty('box-shadow');
  });



});
