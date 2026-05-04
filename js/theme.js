/* ============================================================
   GEOSOLUTION — theme.js
   Handles global Dark/Light Mode Theme Initialization and Toggles
   ============================================================ */

(function initTheme() {
  // Prevent flash of unstyled content by setting theme early
  const saved = localStorage.getItem('geosolution-theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
})();

document.addEventListener('DOMContentLoaded', () => {
  const themeToggles = document.querySelectorAll('.theme-toggle');
  
  // Set initial state for all toggle buttons based on saved theme
  const savedTheme = localStorage.getItem('geosolution-theme') || 'light';
  themeToggles.forEach(toggle => {
    toggle.setAttribute('data-theme', savedTheme);
  });
  
  // Toggle handler for all buttons
  themeToggles.forEach(themeToggle => {
    themeToggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      const newTheme = isDark ? 'light' : 'dark';
      
      // Update HTML attribute
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Update all toggle buttons on the page
      themeToggles.forEach(t => t.setAttribute('data-theme', newTheme));
      
      // Save preference
      localStorage.setItem('geosolution-theme', newTheme);
      
      // Smooth transition
      document.body.style.transition = 'background 0.3s ease, color 0.3s ease';
    });
  });
});
