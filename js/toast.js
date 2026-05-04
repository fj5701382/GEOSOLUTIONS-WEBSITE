/* ══════════════════════════════════════════════════════
   GEO ACADEMY — Toast Notification System
   Usage: GeoToast.success('Message'), .error(), .info()
   ══════════════════════════════════════════════════════ */

const GeoToast = (() => {
  let container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'geo-toast-container';
      container.id = 'geoToastContainer';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4000) {
    const c = getContainer();

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = `geo-toast geo-toast-${type}`;
    toast.innerHTML = `
      <div class="geo-toast-icon">${icons[type] || icons.info}</div>
      <div class="geo-toast-msg">${message}</div>
      <button class="geo-toast-close" aria-label="Close">×</button>
      <div class="geo-toast-progress"><div class="geo-toast-progress-bar"></div></div>
    `;

    c.appendChild(toast);

    // Trigger enter animation
    requestAnimationFrame(() => {
      toast.classList.add('geo-toast-show');
    });

    // Progress bar animation
    const bar = toast.querySelector('.geo-toast-progress-bar');
    bar.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        bar.style.width = '0%';
      });
    });

    // Close button
    toast.querySelector('.geo-toast-close').addEventListener('click', () => dismiss(toast));

    // Auto dismiss
    const timer = setTimeout(() => dismiss(toast), duration);
    toast._timer = timer;

    // Pause on hover
    toast.addEventListener('mouseenter', () => {
      clearTimeout(toast._timer);
      bar.style.transition = 'none';
    });
    toast.addEventListener('mouseleave', () => {
      const remaining = parseFloat(getComputedStyle(bar).width) / parseFloat(getComputedStyle(bar.parentElement).width) * duration;
      bar.style.transition = `width ${remaining}ms linear`;
      requestAnimationFrame(() => { bar.style.width = '0%'; });
      toast._timer = setTimeout(() => dismiss(toast), remaining);
    });
  }

  function dismiss(toast) {
    clearTimeout(toast._timer);
    toast.classList.remove('geo-toast-show');
    toast.classList.add('geo-toast-hide');
    setTimeout(() => toast.remove(), 400);
  }

  return {
    success: (msg, dur) => show(msg, 'success', dur),
    error: (msg, dur) => show(msg, 'error', dur),
    info: (msg, dur) => show(msg, 'info', dur)
  };
})();
