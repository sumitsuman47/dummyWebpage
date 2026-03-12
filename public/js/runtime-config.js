/**
 * Runtime config for static hosting (e.g., GitHub Pages).
 *
 * Set `window.LUMITYA_API_BASE` to your backend API root.
 * Example:
 *   window.LUMITYA_API_BASE = 'https://your-service.onrender.com/api';
 */

// Default: same-origin '/api' (works when Express serves the site)
// Public site should call the Render backend API.
window.LUMITYA_API_BASE = 'https://lumitya-web.onrender.com';
