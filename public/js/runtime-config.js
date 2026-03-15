/**
 * Runtime config for static hosting (e.g., GitHub Pages).
 *
 * Set `window.LUMITYA_API_BASE` to your backend API root.
 * Example:
 *   window.LUMITYA_API_BASE = 'https://lumitya-web.onrender.com';
 *   // '/api' is appended automatically by feature-flags.js
 */

// On localhost use same-origin (Express serves the site on the same port).
// On any other host (Render, GitHub Pages, etc.) call the Render backend.
(function () {
  const h = window.location.hostname;
  const isLocal = h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0';
  window.LUMITYA_API_BASE = isLocal ? '' : 'https://lumitya-web.onrender.com';
})();
