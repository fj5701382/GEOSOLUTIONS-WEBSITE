/* ══════════════════════════════════════════════════════
   GEO ACADEMY — Page Loader Script
   Injects loader HTML and hides it when page is ready.
   ══════════════════════════════════════════════════════ */

(function () {
  // Create loader HTML
  const loader = document.createElement('div');
  loader.className = 'geo-page-loader';
  loader.id = 'geoPageLoader';
  loader.innerHTML = `
    <div class="loader-logo">G</div>
    <div class="loader-text">Geo Academy</div>
    <div class="loader-bar"><div class="loader-bar-fill"></div></div>
  `;

  // Insert as first child of body (or document if body not ready)
  if (document.body) {
    document.body.prepend(loader);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      document.body.prepend(loader);
    });
  }

  // Hide loader when page is fully ready
  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('loaded');
      // Remove from DOM after transition
      setTimeout(() => loader.remove(), 600);
    }, 400);
  });
})();
